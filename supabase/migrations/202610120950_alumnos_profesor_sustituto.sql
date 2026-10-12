begin;

-- El guardado previo mantiene las reglas de cobros, monitor y vacaciones.
-- Esta función añade participantes registrados en la misma transacción.
create or replace function public.guardar_clase_puntual_con_alumnos(
  p_clase_id uuid, p_datos jsonb, p_alumnos uuid[]
) returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_alumnos uuid[] := coalesce(p_alumnos, array[]::uuid[]);
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if exists (select 1 from unnest(v_alumnos) a(id) where id is null) or
     cardinality(v_alumnos) <> (select count(distinct id) from unnest(v_alumnos) a(id)) then
    raise exception 'La selección de alumnos contiene duplicados o valores inválidos';
  end if;
  if cardinality(v_alumnos) > coalesce((p_datos->>'numero_participantes')::integer, 0) then
    raise exception 'El número de participantes es menor que los alumnos seleccionados';
  end if;
  if (select count(*) from public.alumnos where id = any(v_alumnos)) <> cardinality(v_alumnos) then
    raise exception 'Algún alumno no existe o no está disponible para tu usuario';
  end if;

  v_id := public.guardar_clase_puntual(p_clase_id, p_datos);
  -- Evitar transformar relaciones con bonos o cobros individuales por error.
  if exists (select 1 from public.clase_alumnos where clase_id = v_id
    and (coalesce(usa_bono, false) or bono_id is not null or coalesce(importe, 0) <> 0)) or
     exists (select 1 from public.pagos where clase_id = v_id and alumno_id is not null) then
    raise exception 'Esta clase tiene bonos o cobros individuales; revisa su gestión antes de modificarla';
  end if;
  delete from public.clase_alumnos where clase_id = v_id and not (alumno_id = any(v_alumnos));
  -- Las relaciones identifican participantes. El cobro sigue siendo único por clase.
  -- Las filas conservadas mantienen la asistencia existente.
  insert into public.clase_alumnos (clase_id, alumno_id, importe, pagado, usa_bono, bono_id, asistio)
    select v_id, id, 0, false, false, null, true from unnest(v_alumnos) a(id)
    where not exists (select 1 from public.clase_alumnos ca where ca.clase_id = v_id and ca.alumno_id = a.id);
  return v_id;
end; $$;
revoke all on function public.guardar_clase_puntual_con_alumnos(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.guardar_clase_puntual_con_alumnos(uuid, jsonb, uuid[]) to authenticated;

commit;
