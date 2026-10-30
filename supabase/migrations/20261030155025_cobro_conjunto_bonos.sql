begin;
alter table public.bono_cobros add column origen_cobros jsonb not null default '[]'::jsonb
  check(jsonb_typeof(origen_cobros)='array');

-- Agrupa únicamente registros que el usuario identifica como un mismo pago.
-- Conserva los registros anteriores en origen_cobros y remapea los descuentos.
create or replace function public.unificar_cobros_bono(p_bono_id uuid,p_cobro_ids uuid[],p_total_esperado numeric)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_bono public.bonos; v_primero public.bono_cobros; v_id uuid;
  v_n integer; v_total numeric; v_originales jsonb;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_cobro_ids is null or cardinality(p_cobro_ids)<2
    or cardinality(p_cobro_ids)<>(select count(distinct id) from unnest(p_cobro_ids) id)
    or p_total_esperado is null then raise exception 'Selecciona los cobros del pago conjunto'; end if;
  select * into v_bono from public.bonos where id=p_bono_id for update;
  if not found then raise exception 'No se encuentra el bono'; end if;
  perform 1 from public.bono_cobros where bono_id=p_bono_id and id=any(p_cobro_ids) order by id for update;
  select count(*),sum(importe),jsonb_agg(to_jsonb(c) order by c.id)
    into v_n,v_total,v_originales from public.bono_cobros c where bono_id=p_bono_id and id=any(p_cobro_ids);
  if v_n<>cardinality(p_cobro_ids) or v_total is distinct from p_total_esperado then
    raise exception 'Los cobros han cambiado. Actualiza el bono antes de continuar'; end if;
  select * into v_primero from public.bono_cobros c where c.bono_id=p_bono_id and c.id=any(p_cobro_ids)
    order by exists(select 1 from jsonb_each(v_bono.ajustes_clase) a where a.value->>'cobro_id'=c.id::text) desc,c.id limit 1;
  if exists(select 1 from public.bono_cobros c where c.id=any(p_cobro_ids) and
    (c.estado is distinct from v_primero.estado or c.metodo_cobro is distinct from v_primero.metodo_cobro
      or c.fecha_cobro is distinct from v_primero.fecha_cobro)) then
    raise exception 'Solo se unifican cobros con el mismo estado, método y fecha'; end if;
  v_id:=v_primero.id;
  update public.bono_cobros set importe=v_total,alumno_id=null,origen_cobros=v_originales where id=v_id;
  update public.bonos set ajustes_clase=(select coalesce(jsonb_object_agg(key,
    case when value->>'cobro_id' in (select id::text from unnest(p_cobro_ids) id)
      then jsonb_set(value,'{cobro_id}',to_jsonb(v_id::text)) else value end),'{}'::jsonb)
      from jsonb_each(ajustes_clase)) where id=p_bono_id;
  delete from public.bono_cobros where bono_id=p_bono_id and id=any(p_cobro_ids) and id<>v_id;
  return v_id;
end; $$;
revoke all on function public.unificar_cobros_bono(uuid,uuid[],numeric) from public,anon;
grant execute on function public.unificar_cobros_bono(uuid,uuid[],numeric) to authenticated;
notify pgrst,'reload schema';
commit;
