begin;

-- Los alquileres de cancelaciones antiguas quedan sin importe registrado.
alter table public.clases
  add column coste_pista_cancelacion numeric,
  add constraint clases_coste_pista_cancelacion_valido check (
    coste_pista_cancelacion is null or (
      estado = 'cancelada' and coste_pista_cancelacion >= 0
      and coste_pista_cancelacion < 'Infinity'::numeric
      and coste_pista_cancelacion = round(coste_pista_cancelacion, 2)
    )
  );

create function public.limpiar_coste_pista_cancelacion()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if new.estado is distinct from 'cancelada' then
    new.coste_pista_cancelacion := null;
  end if;
  return new;
end;
$$;

revoke all on function public.limpiar_coste_pista_cancelacion() from public, anon;

create trigger limpiar_coste_pista_cancelacion
before update of estado on public.clases
for each row execute function public.limpiar_coste_pista_cancelacion();

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
    coste_pista_cancelacion = case
      when v_datos.estado <> 'cancelada' then null
      when p_datos_clase ? 'coste_pista_cancelacion' then v_datos.coste_pista_cancelacion
      else coste_pista_cancelacion
    end,
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

-- La cancelación rápida conserva la misma transacción de pagos y bonos.
create function public.agenda_cancelar_clase_con_pista(
  p_clase_id uuid, p_estado text, p_facturable boolean, p_cobrada boolean,
  p_observaciones text, p_motivo_cancelacion text, p_participantes jsonb,
  p_metodos_pago jsonb, p_metodo_pago_total text, p_coste_pista_cancelacion numeric
)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if p_estado is distinct from 'cancelada' or p_coste_pista_cancelacion is null then
    raise exception 'Indica el coste de pista de la cancelación';
  end if;

  perform public.agenda_actualizar_clase_atomica(
    p_clase_id, p_estado, p_facturable, p_cobrada, p_observaciones,
    p_motivo_cancelacion, p_participantes, p_metodos_pago, p_metodo_pago_total
  );

  update public.clases set coste_pista_cancelacion = p_coste_pista_cancelacion
  where id = p_clase_id and estado = 'cancelada';

  if not found then
    raise exception 'No se pudo guardar el coste de pista de la cancelación';
  end if;
end;
$$;

revoke all on function public.agenda_cancelar_clase_con_pista(uuid,text,boolean,boolean,text,text,jsonb,jsonb,text,numeric) from public, anon;
grant execute on function public.agenda_cancelar_clase_con_pista(uuid,text,boolean,boolean,text,text,jsonb,jsonb,text,numeric) to authenticated;

notify pgrst, 'reload schema';
commit;
