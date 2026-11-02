-- La renovación se gestiona aparte de activo, que sigue controlando el consumo.
alter table public.bonos
  add column resolucion_renovacion text check (resolucion_renovacion in ('cerrado','renovado')),
  add column renovado_desde_id uuid unique references public.bonos(id) deferrable initially deferred;

create or replace function public.renovar_bono(
  p_bono_id uuid, p_datos jsonb, p_autorizados uuid[], p_cobros jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_anterior public.bonos; v_nuevo public.bonos; v_id uuid;
  v_cobro jsonb; v_total numeric := 0;
begin
  if auth.uid() is null then raise exception 'Se requiere una sesión autenticada'; end if;
  select * into v_anterior from public.bonos where id=p_bono_id for update;
  if not found then raise exception 'Bono no encontrado'; end if;
  if v_anterior.clases_restantes > 0 or v_anterior.resolucion_renovacion is not null then
    raise exception 'El bono ya está resuelto o todavía tiene clases disponibles';
  end if;
  v_nuevo := jsonb_populate_record(null::public.bonos, p_datos);
  if v_nuevo.numero_clases is null or v_nuevo.numero_clases < 1
    or v_nuevo.clases_restantes is distinct from v_nuevo.numero_clases
    or v_nuevo.importe_pagado is null or v_nuevo.importe_pagado < 0
    or v_nuevo.activo is distinct from true
    or v_nuevo.alumno_id is null or v_nuevo.fecha_compra is null
    or v_nuevo.estado_cobro is null or v_nuevo.estado_cobro not in ('pagado','pendiente')
    or (v_nuevo.estado_cobro='pagado' and (v_nuevo.fecha_cobro is null or v_nuevo.metodo_cobro is null))
    then raise exception 'Datos de renovación no válidos'; end if;
  if v_nuevo.alumno_id is distinct from v_anterior.alumno_id
    or v_nuevo.grupo_id is distinct from v_anterior.grupo_id then
    raise exception 'La renovación debe conservar el titular y el grupo del bono anterior';
  end if;
  if jsonb_typeof(p_cobros) is distinct from 'array' then raise exception 'Cobros no válidos'; end if;
  for v_cobro in select value from jsonb_array_elements(p_cobros) loop
    if (v_cobro->>'importe')::numeric is null or (v_cobro->>'importe')::numeric < 0
      or v_cobro->>'estado' is distinct from v_nuevo.estado_cobro
      or (v_nuevo.estado_cobro='pagado' and
        (v_cobro->>'fecha_cobro' is distinct from v_nuevo.fecha_cobro::text
         or v_cobro->>'metodo_cobro' is distinct from v_nuevo.metodo_cobro))
      then raise exception 'Cobro inicial no válido'; end if;
    v_total := v_total + (v_cobro->>'importe')::numeric;
  end loop;
  if abs(v_total-v_nuevo.importe_pagado)>0.004 then raise exception 'El cobro inicial no coincide con el importe del bono'; end if;
  insert into public.bonos(alumno_id,grupo_id,numero_clases,clases_restantes,importe_pagado,
    fecha_compra,activo,estado_cobro,metodo_cobro,fecha_cobro,renovado_desde_id)
    values(v_nuevo.alumno_id,v_nuevo.grupo_id,v_nuevo.numero_clases,v_nuevo.numero_clases,
      v_nuevo.importe_pagado,v_nuevo.fecha_compra,true,v_nuevo.estado_cobro,
      case when v_nuevo.estado_cobro='pagado' then v_nuevo.metodo_cobro end,
      case when v_nuevo.estado_cobro='pagado' then v_nuevo.fecha_cobro end,p_bono_id)
    returning id into v_id;
  insert into public.bono_alumnos(bono_id,alumno_id)
    select v_id, alumno from (select distinct unnest(array_append(coalesce(p_autorizados,'{}'::uuid[]),v_nuevo.alumno_id)) alumno) a
    where alumno is not null;
  insert into public.bono_cobros(bono_id,alumno_id,importe,estado,metodo_cobro,fecha_cobro)
    select v_id,(c->>'alumno_id')::uuid,(c->>'importe')::numeric,c->>'estado',
      case when c->>'estado'='pagado' then c->>'metodo_cobro' end,
      case when c->>'estado'='pagado' then (c->>'fecha_cobro')::date end
    from jsonb_array_elements(p_cobros) c;
  update public.bonos set resolucion_renovacion='renovado', activo=false where id=p_bono_id;
  return v_id;
end;
$$;
revoke all on function public.renovar_bono(uuid,jsonb,uuid[],jsonb) from public, anon;
grant execute on function public.renovar_bono(uuid,jsonb,uuid[],jsonb) to authenticated;
