begin;

alter table public.clases
  add column if not exists nombre_grupo_libre text,
  add column if not exists numero_participantes integer,
  add column if not exists pista_nombre text,
  add column if not exists monitor_nombre text,
  add column if not exists coste_monitor numeric(12,2) not null default 0,
  add column if not exists monitor_pagado boolean not null default false,
  add column if not exists fecha_pago_monitor date,
  add column if not exists metodo_pago_monitor text;

alter table public.clases
  add constraint clases_participantes_puntuales_positivos
    check (numero_participantes is null or numero_participantes > 0),
  add constraint clases_coste_monitor_positivo check (coste_monitor >= 0),
  add constraint clases_puntuales_sin_grupo
    check (nombre_grupo_libre is null or
      (length(trim(nombre_grupo_libre)) > 0 and grupo_id is null and serie_id is null
        and tipo in ('propia', 'privada') and modo_cobro = 'total'
        and importe_total is not null and importe_total >= 0
        and numero_participantes is not null and monitor_nombre is not null
        and length(trim(monitor_nombre)) > 0)),
  add constraint clases_pago_monitor_fecha
    check (not monitor_pagado or (fecha_pago_monitor is not null and metodo_pago_monitor is not null));

-- La función usa los permisos y las políticas RLS del usuario conectado.
-- Clase y cobro se guardan en una sola transacción, sin alumnos ficticios.
create or replace function public.guardar_clase_puntual(p_clase_id uuid, p_datos jsonb)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_datos public.clases;
  v_pago_id uuid;
  v_cobrada boolean := coalesce((p_datos->>'cobrada')::boolean, false);
  v_metodo text := coalesce(nullif(p_datos->>'metodo_cobro', ''), 'efectivo');
  v_fecha_pago date := coalesce(nullif(p_datos->>'fecha_cobro', '')::date, current_date);
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v_datos from jsonb_populate_record(null::public.clases, p_datos);
  if coalesce(trim(v_datos.nombre_grupo_libre), '') = '' or
     coalesce(trim(v_datos.monitor_nombre), '') = '' or
     coalesce(v_datos.numero_participantes, 0) < 1 or
     v_datos.tipo not in ('propia', 'privada') or v_datos.tipo is null or
     v_datos.fecha is null or v_datos.hora_inicio is null or
     coalesce(v_datos.duracion_minutos, 0) <= 0 or
     v_datos.importe_total is null or v_datos.importe_total < 0 or
     coalesce(v_datos.coste_pista, 0) < 0 or coalesce(v_datos.coste_monitor, 0) < 0 or
     v_datos.estado not in ('programada', 'realizada', 'cancelada') or v_datos.estado is null then
    raise exception 'Revisa el nombre, monitor, participantes, horario e importes';
  end if;
  if v_datos.hora_inicio + make_interval(mins => v_datos.duracion_minutos) <= v_datos.hora_inicio
    or v_datos.duracion_minutos >= 1440 then raise exception 'La clase debe terminar en el mismo día'; end if;
  if v_datos.estado = 'realizada' and
    (v_datos.fecha + v_datos.hora_inicio) > (current_timestamp at time zone 'Europe/Madrid') then
    raise exception 'La fecha y hora de esta clase todavía no han llegado';
  end if;
  if v_datos.estado = 'cancelada' and coalesce(trim(v_datos.motivo_cancelacion), '') = '' then
    raise exception 'Indica el motivo de cancelación';
  end if;
  if v_metodo not in ('efectivo', 'bizum', 'transferencia', 'tarjeta') then
    raise exception 'Método de cobro inválido';
  end if;
  if coalesce(v_datos.monitor_pagado, false) and
    (v_datos.fecha_pago_monitor is null or v_datos.metodo_pago_monitor not in
      ('efectivo', 'bizum', 'transferencia', 'tarjeta') or v_datos.metodo_pago_monitor is null) then
    raise exception 'Indica la fecha y el método del pago al monitor';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_datos.fecha::text, 0));
  -- Las clases impartidas por otro monitor pueden coincidir con las propias.
  if exists (select 1 from public.clases c where c.id is distinct from p_clase_id
    and c.fecha = v_datos.fecha and c.estado <> 'cancelada'
    and (lower(coalesce(nullif(trim(c.monitor_nombre), ''), 'Fran')) = lower(trim(v_datos.monitor_nombre))
      or (c.ubicacion_id = v_datos.ubicacion_id and coalesce(trim(v_datos.pista_nombre), '') <> ''
        and lower(trim(c.pista_nombre)) = lower(trim(v_datos.pista_nombre))))
    and c.hora_inicio < v_datos.hora_inicio + make_interval(mins => v_datos.duracion_minutos)
    and v_datos.hora_inicio < c.hora_inicio + make_interval(mins => c.duracion_minutos)
    and v_datos.estado <> 'cancelada') then
    raise exception 'El monitor o la pista ya tienen una clase en ese horario';
  end if;
  if lower(trim(v_datos.monitor_nombre)) = 'fran' and exists (
    select 1 from public.no_disponibilidades n
    where (v_datos.fecha + v_datos.hora_inicio) < (n.fecha_fin + coalesce(n.hora_fin, time '23:59:59'))
      and (n.fecha_inicio + coalesce(n.hora_inicio, time '00:00')) <
        (v_datos.fecha + v_datos.hora_inicio + make_interval(mins => v_datos.duracion_minutos))
      and v_datos.estado <> 'cancelada'
  ) then raise exception 'Este horario está marcado como no disponible'; end if;

  if p_clase_id is not null then
    select id into v_id from public.clases where id = p_clase_id
      and nombre_grupo_libre is not null and serie_id is null for update;
    if v_id is null then raise exception 'No se puede editar esta clase puntual'; end if;
  end if;
  if v_datos.estado = 'cancelada' and v_datos.facturable = false then
    if exists (select 1 from public.pagos where clase_id = p_clase_id and estado = 'pagado') then
      raise exception 'Esta clase ya está cobrada. Revisa el cobro antes de cancelar sin cobrar';
    end if;
    v_cobrada := false;
  end if;

  if v_id is null then
    insert into public.clases (fecha, hora_inicio, duracion_minutos, ubicacion_id, tipo,
      estado, facturable, cobrada, importe_club, coste_pista, ingreso_extra, modo_cobro,
      importe_total, motivo_cancelacion, observaciones, nombre_grupo_libre, numero_participantes,
      pista_nombre, monitor_nombre, coste_monitor, monitor_pagado, fecha_pago_monitor, metodo_pago_monitor)
    values (v_datos.fecha, v_datos.hora_inicio, v_datos.duracion_minutos, v_datos.ubicacion_id,
      v_datos.tipo, v_datos.estado, case when v_datos.estado = 'cancelada' then coalesce(v_datos.facturable, false) else true end,
      v_cobrada, 0, coalesce(v_datos.coste_pista, 0), 0, 'total', v_datos.importe_total,
      case when v_datos.estado = 'cancelada' then v_datos.motivo_cancelacion else null end,
      v_datos.observaciones, trim(v_datos.nombre_grupo_libre), v_datos.numero_participantes,
      nullif(trim(v_datos.pista_nombre), ''), trim(v_datos.monitor_nombre), coalesce(v_datos.coste_monitor, 0),
      coalesce(v_datos.monitor_pagado, false), case when v_datos.monitor_pagado then v_datos.fecha_pago_monitor end,
      case when v_datos.monitor_pagado then v_datos.metodo_pago_monitor end) returning id into v_id;
  else
    update public.clases set fecha = v_datos.fecha, hora_inicio = v_datos.hora_inicio,
      duracion_minutos = v_datos.duracion_minutos, ubicacion_id = v_datos.ubicacion_id,
      tipo = v_datos.tipo, estado = v_datos.estado,
      facturable = case when v_datos.estado = 'cancelada' then coalesce(v_datos.facturable, false) else true end,
      cobrada = v_cobrada, importe_total = v_datos.importe_total,
      coste_pista = coalesce(v_datos.coste_pista, 0),
      motivo_cancelacion = case when v_datos.estado = 'cancelada' then v_datos.motivo_cancelacion else null end,
      observaciones = v_datos.observaciones, nombre_grupo_libre = trim(v_datos.nombre_grupo_libre),
      numero_participantes = v_datos.numero_participantes, pista_nombre = nullif(trim(v_datos.pista_nombre), ''),
      monitor_nombre = trim(v_datos.monitor_nombre), coste_monitor = coalesce(v_datos.coste_monitor, 0),
      monitor_pagado = coalesce(v_datos.monitor_pagado, false),
      fecha_pago_monitor = case when v_datos.monitor_pagado then v_datos.fecha_pago_monitor end,
      metodo_pago_monitor = case when v_datos.monitor_pagado then v_datos.metodo_pago_monitor end
    where id = v_id;
  end if;
  if v_datos.estado = 'cancelada' and not coalesce(v_datos.facturable, false) then
    delete from public.pagos where clase_id = v_id and alumno_id is null and estado = 'pendiente';
  else
    select id into v_pago_id from public.pagos where clase_id = v_id and alumno_id is null limit 1;
    if v_pago_id is null then
      insert into public.pagos (clase_id, alumno_id, importe, metodo, estado, fecha_pago)
      values (v_id, null, v_datos.importe_total, v_metodo,
        case when v_cobrada then 'pagado' else 'pendiente' end, v_fecha_pago);
    else
      update public.pagos set importe = v_datos.importe_total, metodo = v_metodo,
        estado = case when v_cobrada then 'pagado' else 'pendiente' end,
        fecha_pago = v_fecha_pago where id = v_pago_id;
    end if;
  end if;
  return v_id;
end; $$;
revoke all on function public.guardar_clase_puntual(uuid, jsonb) from public, anon;
grant execute on function public.guardar_clase_puntual(uuid, jsonb) to authenticated;

-- Mantener el estado de cobro visible en agenda al editar un pago desde Cobros.
create or replace function public.sincronizar_cobro_clase_puntual()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_clase uuid;
begin
  v_clase := case when TG_OP = 'DELETE' then OLD.clase_id else NEW.clase_id end;
  update public.clases c set cobrada = exists (
    select 1 from public.pagos p where p.clase_id = c.id and p.alumno_id is null and p.estado = 'pagado'
  ) where c.id = v_clase and c.nombre_grupo_libre is not null;
  if TG_OP = 'UPDATE' and OLD.clase_id is distinct from NEW.clase_id then
    update public.clases c set cobrada = exists (
      select 1 from public.pagos p where p.clase_id = c.id and p.alumno_id is null and p.estado = 'pagado'
    ) where c.id = OLD.clase_id and c.nombre_grupo_libre is not null;
  end if;
  return null;
end; $$;
create trigger pagos_cobro_clase_puntual after insert or update or delete on public.pagos
  for each row execute function public.sincronizar_cobro_clase_puntual();

commit;
