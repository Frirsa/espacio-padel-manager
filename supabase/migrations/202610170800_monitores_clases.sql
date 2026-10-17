begin;

-- Las RPC anteriores no se reemplazan: deben existir con su contrato vigente.
do $$ begin
  if to_regprocedure('public.guardar_clase_atomica(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,text)') is null
    or to_regprocedure('public.crear_serie_atomica(jsonb,jsonb,jsonb)') is null then
    raise exception 'No se encuentran las funciones vigentes de clases y series. Revisa sus firmas antes de aplicar esta actualización';
  end if;
end; $$;

-- Los nombres en clases son una fotografía histórica, también cuando se desactiva un monitor.
create table public.monitores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid(),
  nombre text not null check (length(trim(nombre)) between 1 and 200),
  activo boolean not null default true,
  predeterminado boolean not null default false,
  check (not predeterminado or (nombre = 'Fran' and activo))
);
create unique index monitores_nombre_usuario on public.monitores (usuario_id, lower(trim(nombre)));
create unique index monitores_predeterminado_usuario on public.monitores (usuario_id) where predeterminado;
alter table public.monitores enable row level security;
create policy monitores_usuario on public.monitores for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
grant select, insert, update, delete on public.monitores to authenticated;

create function public.preparar_monitores() returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 17));
  -- Importar una sola vez; desactivar un monitor no lo vuelve a dar de alta.
  if not exists (select 1 from public.monitores where usuario_id = auth.uid()) then
    insert into public.monitores(nombre, predeterminado) values ('Fran', true);
    insert into public.monitores(nombre)
      select min(trim(regexp_replace(monitor_nombre, '\s+', ' ', 'g')))
      from public.clases where nullif(trim(monitor_nombre), '') is not null
        and lower(trim(monitor_nombre)) <> 'fran'
      group by lower(trim(regexp_replace(monitor_nombre, '\s+', ' ', 'g')))
      on conflict do nothing;
  end if;
end; $$;

-- Comprobación común a bonos, clases sueltas y series. El bloqueo por fecha
-- impide que dos guardados simultáneos asignen el mismo monitor o pista.
create function public.validar_monitor_clase(p_clase_id uuid, p_datos jsonb) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
declare v public.clases; v_anterior public.clases; v_mismo_horario boolean;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v from jsonb_populate_record(null::public.clases, p_datos);
  if p_clase_id is not null then
    select * into strict v_anterior from public.clases where id = p_clase_id for update;
  end if;
  if nullif(trim(v.monitor_nombre), '') is null or coalesce(v.coste_monitor, -1) < 0 then
    raise exception 'Revisa el monitor y su coste';
  end if;
  if not exists (select 1 from public.monitores m where m.usuario_id = auth.uid()
      and m.activo and lower(trim(m.nombre)) = lower(trim(v.monitor_nombre)))
    and lower(trim(v.monitor_nombre)) is distinct from lower(coalesce(nullif(trim(v_anterior.monitor_nombre), ''), 'Fran')) then
    raise exception 'Da de alta o activa el monitor antes de asignarlo';
  end if;
  if coalesce(v.monitor_pagado, false) and (v.fecha_pago_monitor is null or
    v.metodo_pago_monitor is null or v.metodo_pago_monitor not in ('efectivo','bizum','transferencia','tarjeta')) then
    raise exception 'Indica fecha y método del pago al monitor';
  end if;
  if v.fecha is null or v.hora_inicio is null or coalesce(v.duracion_minutos, 0) <= 0
    or v.duracion_minutos >= 1440 or v.hora_inicio + make_interval(mins => v.duracion_minutos) <= v.hora_inicio then
    raise exception 'Revisa la fecha, la hora y la duración';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v.fecha::text, 0));
  if v.estado = 'cancelada' then return; end if;
  -- Una edición económica de una clase histórica conserva sus circunstancias originales.
  v_mismo_horario := p_clase_id is not null and v_anterior.estado <> 'cancelada'
    and (v.fecha, v.hora_inicio, v.duracion_minutos, v.ubicacion_id, coalesce(v.pista_nombre,''), lower(v.monitor_nombre))
      is not distinct from
      (v_anterior.fecha, v_anterior.hora_inicio, v_anterior.duracion_minutos, v_anterior.ubicacion_id,
       coalesce(v_anterior.pista_nombre,''), lower(coalesce(nullif(trim(v_anterior.monitor_nombre),''),'Fran')));
  if v_mismo_horario then return; end if;
  if exists (select 1 from public.clases c where c.id is distinct from p_clase_id
    and c.fecha = v.fecha and c.estado <> 'cancelada'
    and (lower(coalesce(nullif(trim(c.monitor_nombre),''),'Fran')) = lower(trim(v.monitor_nombre))
      or (v.ubicacion_id is not null and c.ubicacion_id = v.ubicacion_id
        and nullif(trim(v.pista_nombre),'') is not null and lower(trim(c.pista_nombre)) = lower(trim(v.pista_nombre))))
    and c.hora_inicio < v.hora_inicio + make_interval(mins => v.duracion_minutos)
    and v.hora_inicio < c.hora_inicio + make_interval(mins => c.duracion_minutos)) then
    raise exception 'El monitor o la pista ya tienen una clase en ese horario';
  end if;
  if lower(trim(v.monitor_nombre)) = 'fran' and exists (select 1 from public.no_disponibilidades n
    where (v.fecha + v.hora_inicio) < (n.fecha_fin + coalesce(n.hora_fin, time '23:59:59'))
      and (n.fecha_inicio + coalesce(n.hora_inicio, time '00:00')) <
        (v.fecha + v.hora_inicio + make_interval(mins => v.duracion_minutos))) then
    raise exception 'Este horario está marcado como no disponible para Fran. Asigna otro monitor';
  end if;
end; $$;

-- Envolver el guardado atómico vigente conserva sus reglas de bonos y cobros.
-- Si falla cualquier paso, se revierte la transacción completa.
create function public.guardar_clase_con_monitor(
  p_clase_id uuid, p_datos_clase jsonb, p_participantes jsonb,
  p_uso_anterior jsonb, p_uso_nuevo jsonb, p_metodos_pago jsonb, p_metodo_pago_total text
) returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_id uuid; v_datos public.clases; v_legacy boolean; v_part jsonb;
begin
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
    pista_nombre = nullif(trim(v_datos.pista_nombre),'') where id = v_id;
  return v_id;
end; $$;

create function public.crear_serie_con_monitor(p_datos_serie jsonb, p_clases jsonb, p_participantes jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_resultado jsonb; v_clase jsonb; v_registro jsonb; v_datos public.clases;
begin
  perform public.preparar_monitores();
  for v_clase in select value from jsonb_array_elements(p_clases) order by value->>'fecha' loop
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
      pista_nombre = nullif(trim(v_datos.pista_nombre),'') where id = (v_registro->>'id')::uuid;
  end loop;
  return v_resultado;
end; $$;

revoke all on function public.preparar_monitores(), public.validar_monitor_clase(uuid,jsonb),
  public.guardar_clase_con_monitor(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,text), public.crear_serie_con_monitor(jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.preparar_monitores(), public.validar_monitor_clase(uuid,jsonb),
  public.guardar_clase_con_monitor(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,text), public.crear_serie_con_monitor(jsonb,jsonb,jsonb) to authenticated;

commit;
