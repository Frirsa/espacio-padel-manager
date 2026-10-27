begin;
-- Un concepto es una etiqueta, independiente del origen del cobro.
-- nombre_grupo_libre se conserva para las clases puntuales históricas.
alter table public.clases add column concepto_clase text;
alter table public.clases add column ingreso_extra_concepto text;
create or replace function public.validar_datos_clase_unificada(p_datos jsonb,p_participantes jsonb)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v public.clases;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_participantes is null or jsonb_typeof(p_participantes) <> 'array' then raise exception 'Participantes inválidos'; end if;
  select * into v from jsonb_populate_record(null::public.clases,p_datos);
  if v.estado = 'realizada' and (v.fecha + v.hora_inicio) > (current_timestamp at time zone 'Europe/Madrid') then raise exception 'La fecha y hora de esta clase todavía no han llegado'; end if;
  if coalesce(v.ingreso_extra,0) < 0 then raise exception 'Revisa el ingreso extra'; end if;
  if jsonb_array_length(p_participantes)=0 then
    if coalesce(nullif(trim(v.concepto_clase),''),nullif(trim(v.nombre_grupo_libre),'')) is null then
      raise exception 'Indica un concepto o selecciona alumnos';
    end if;
    if coalesce(v.numero_participantes,0)<1 then raise exception 'Indica el número de participantes'; end if;
    if v.nombre_grupo_libre is null and v.tipo <> 'club' and (v.modo_cobro is distinct from 'total' or v.importe_total is null or v.importe_total<0) then
      raise exception 'Indica un precio total válido';
    end if;
  end if;
end; $$;
revoke all on function public.validar_datos_clase_unificada(jsonb,jsonb) from public,anon;
grant execute on function public.validar_datos_clase_unificada(jsonb,jsonb) to authenticated;
CREATE OR REPLACE FUNCTION public.guardar_clase_con_monitor(p_clase_id uuid, p_datos_clase jsonb, p_participantes jsonb, p_uso_anterior jsonb, p_uso_nuevo jsonb, p_metodos_pago jsonb, p_metodo_pago_total text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid; v_datos public.clases; v_legacy boolean; v_part jsonb;
begin
  perform public.validar_datos_clase_unificada(p_datos_clase, p_participantes);
  perform public.preparar_monitores();
  perform public.validar_monitor_clase(p_clase_id, p_datos_clase);
  select * into v_datos from jsonb_populate_record(null::public.clases, p_datos_clase);
  select nombre_grupo_libre is not null into v_legacy from public.clases where id = p_clase_id;
  if coalesce(v_legacy, false) is distinct from (v_datos.nombre_grupo_libre is not null) and p_clase_id is not null then
    raise exception 'Conserva la modalidad de cobro de la clase existente';
  end if;
  if v_datos.nombre_grupo_libre is not null then
    if exists (select 1 from jsonb_array_elements(p_participantes) p where coalesce((p->>'usa_bono')::boolean,false)) then
      raise exception 'Esta clase tiene cobro puntual; crea las nuevas clases con bono desde alumnos registrados';
    end if;
    v_id := public.guardar_clase_puntual(p_clase_id, p_datos_clase);
    -- Historial de alumnos y clase se guardan juntos, sin duplicar cobros.
    delete from public.clase_alumnos ca where ca.clase_id = v_id
      and not exists (select 1 from jsonb_array_elements(p_participantes) p where (p->>'alumno_id')::uuid = ca.alumno_id);
    for v_part in select distinct value from jsonb_array_elements(p_participantes) loop
      if not exists (select 1 from public.clase_alumnos where clase_id = v_id and alumno_id = (v_part->>'alumno_id')::uuid) then
        insert into public.clase_alumnos(clase_id, alumno_id, importe, pagado, usa_bono, bono_id, asistio)
          values (v_id, (v_part->>'alumno_id')::uuid, 0, v_datos.cobrada, false, null, true);
      end if;
    end loop;
    update public.clase_alumnos set pagado = coalesce(v_datos.cobrada, false)
      and (v_datos.estado <> 'cancelada' or coalesce(v_datos.facturable, false)) where clase_id = v_id;
  else
    v_id := public.guardar_clase_atomica(p_clase_id, p_datos_clase, p_participantes,
      p_uso_anterior, p_uso_nuevo, p_metodos_pago, p_metodo_pago_total);
  end if;
  if v_id is null then raise exception 'No se pudo guardar la clase'; end if;
  update public.clases set monitor_nombre = trim(v_datos.monitor_nombre), coste_monitor = v_datos.coste_monitor,
    monitor_pagado = coalesce(v_datos.monitor_pagado, false),
    fecha_pago_monitor = case when v_datos.monitor_pagado then v_datos.fecha_pago_monitor end,
    metodo_pago_monitor = case when v_datos.monitor_pagado then v_datos.metodo_pago_monitor end,
    pista_nombre = nullif(trim(v_datos.pista_nombre),''),
    concepto_clase = case when p_datos_clase ? 'concepto_clase' then nullif(trim(v_datos.concepto_clase),'') else concepto_clase end,
    numero_participantes = coalesce(v_datos.numero_participantes, numero_participantes),
    ingreso_extra = case when p_datos_clase ? 'ingreso_extra' then coalesce(v_datos.ingreso_extra,0) else ingreso_extra end,
    ingreso_extra_concepto = case when p_datos_clase ? 'ingreso_extra_concepto' then nullif(trim(v_datos.ingreso_extra_concepto),'') else ingreso_extra_concepto end
    where id = v_id;
  -- La RPC habitual obtiene el estado del cobro de los alumnos. Sin alumnos,
  -- el estado se toma del formulario, manteniendo un solo pago por clase.
  if v_datos.nombre_grupo_libre is null and jsonb_array_length(p_participantes) = 0 and v_datos.tipo <> 'club' then
    update public.clases set cobrada = coalesce(v_datos.cobrada,false) where id=v_id;
    if v_datos.estado = 'realizada' or (v_datos.estado='cancelada' and v_datos.facturable) or
      (v_datos.estado='programada' and v_datos.cobrada) then
      if not exists (select 1 from public.pagos where clase_id=v_id and alumno_id is null) then
        insert into public.pagos(clase_id,alumno_id,importe,metodo,estado,fecha_pago)
          values(v_id,null,v_datos.importe_total,coalesce(p_metodo_pago_total,'efectivo'),
            case when v_datos.cobrada then 'pagado' else 'pendiente' end,
            coalesce(nullif(p_datos_clase->>'fecha_cobro','')::date,v_datos.fecha));
      else
        update public.pagos set estado=case when v_datos.cobrada then 'pagado' else 'pendiente' end,
          fecha_pago=coalesce(nullif(p_datos_clase->>'fecha_cobro','')::date,v_datos.fecha)
          where clase_id=v_id and alumno_id is null;
      end if;
    end if;
  end if;
  return v_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.crear_serie_con_monitor(p_datos_serie jsonb, p_clases jsonb, p_participantes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_resultado jsonb; v_clase jsonb; v_registro jsonb; v_datos public.clases;
begin
  perform public.preparar_monitores();
  for v_clase in select value from jsonb_array_elements(p_clases) order by value->>'fecha' loop
    perform public.validar_datos_clase_unificada(v_clase, p_participantes);
    perform public.validar_monitor_clase(null, v_clase);
  end loop;
  v_resultado := public.crear_serie_atomica(p_datos_serie, p_clases, p_participantes);
  if jsonb_array_length(v_resultado->'clases') is distinct from jsonb_array_length(p_clases) then
    raise exception 'La serie no devolvió todas las clases';
  end if;
  for v_registro in select value from jsonb_array_elements(v_resultado->'clases') loop
    select value into strict v_clase from jsonb_array_elements(p_clases) where value->>'fecha' = v_registro->>'fecha';
    select * into v_datos from jsonb_populate_record(null::public.clases, v_clase);
    update public.clases set monitor_nombre = trim(v_datos.monitor_nombre), coste_monitor = v_datos.coste_monitor,
      monitor_pagado = coalesce(v_datos.monitor_pagado, false),
      fecha_pago_monitor = case when v_datos.monitor_pagado then v_datos.fecha_pago_monitor end,
      metodo_pago_monitor = case when v_datos.monitor_pagado then v_datos.metodo_pago_monitor end,
      pista_nombre = nullif(trim(v_datos.pista_nombre),''),
      concepto_clase = nullif(trim(v_datos.concepto_clase),''),
      numero_participantes = v_datos.numero_participantes,
      ingreso_extra_concepto = nullif(trim(v_datos.ingreso_extra_concepto),''),
      cobrada = case when jsonb_array_length(p_participantes)=0 then coalesce(v_datos.cobrada,false) else cobrada end
      where id = (v_registro->>'id')::uuid;
    if jsonb_array_length(p_participantes)=0 and v_datos.tipo <> 'club' and coalesce(v_datos.cobrada,false) then
      insert into public.pagos(clase_id,alumno_id,importe,metodo,estado,fecha_pago)
        values((v_registro->>'id')::uuid,null,v_datos.importe_total,
          coalesce(nullif(v_clase->>'metodo_cobro',''),'efectivo'),'pagado',
          coalesce(nullif(v_clase->>'fecha_cobro','')::date,current_date));
    end if;
  end loop;
  return v_resultado;
end; $function$;

create or replace function public.sincronizar_cobro_clase_puntual()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_clase uuid;
begin
  v_clase := case when TG_OP = 'DELETE' then OLD.clase_id else NEW.clase_id end;
  update public.clases c set cobrada = exists (
    select 1 from public.pagos p where p.clase_id = c.id and p.alumno_id is null and p.estado = 'pagado'
  ) where c.id = v_clase and (c.nombre_grupo_libre is not null or (c.concepto_clase is not null and not exists (select 1 from public.clase_alumnos ca where ca.clase_id=c.id)));
  if TG_OP = 'UPDATE' and OLD.clase_id is distinct from NEW.clase_id then
    update public.clases c set cobrada = exists (
      select 1 from public.pagos p where p.clase_id = c.id and p.alumno_id is null and p.estado = 'pagado'
    ) where c.id = OLD.clase_id and (c.nombre_grupo_libre is not null or (c.concepto_clase is not null and not exists (select 1 from public.clase_alumnos ca where ca.clase_id=c.id)));
  end if;
  return null;
end; $$;

notify pgrst, 'reload schema';
commit;

