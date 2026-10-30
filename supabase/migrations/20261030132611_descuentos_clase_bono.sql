begin;
-- importe_pagado sigue siendo el precio final. Los ajustes recuperan el precio
-- original para que la rebaja afecte únicamente a la sesión indicada.
alter table public.bonos add column ajustes_clase jsonb not null default '{}'::jsonb
  check (jsonb_typeof(ajustes_clase) = 'object');

-- Mantener el detalle guardado coherente con los informes y el historial.
create or replace function public.recalcular_importes_sesion_bono(p_clase_id uuid,p_bono_id uuid)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_bono public.bonos; v_original numeric; v_centimos bigint;
begin
  select * into v_bono from public.bonos where id=p_bono_id;
  if not found then return; end if;
  select v_bono.importe_pagado+coalesce(sum((value->>'descuento')::numeric),0)
    into v_original from jsonb_each(v_bono.ajustes_clase);
  v_centimos := round(v_original/nullif(v_bono.numero_clases,0),2)*100
    - coalesce((v_bono.ajustes_clase->p_clase_id::text->>'descuento')::numeric,0)*100;
  with reparto as (
    select id, row_number() over(order by alumno_id,id)-1 orden,count(*) over() n
      from public.clase_alumnos where clase_id=p_clase_id and bono_id=p_bono_id and usa_bono
  ), importes as (
    select id,(v_centimos/n+case when orden < v_centimos % n then 1 else 0 end)::numeric/100 importe
    from reparto
  ) update public.clase_alumnos ca set importe=i.importe from importes i
    where ca.id=i.id and ca.importe is distinct from i.importe;
end; $$;
revoke all on function public.recalcular_importes_sesion_bono(uuid,uuid) from public,anon;
grant execute on function public.recalcular_importes_sesion_bono(uuid,uuid) to authenticated;

create or replace function public.guardar_descuento_clase_bono(
  p_clase_id uuid, p_bono_id uuid, p_descuento numeric, p_motivo text,
  p_cobro_id uuid default null, p_descuento_anterior numeric default 0
) returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_clase public.clases; v_bono public.bonos; v_anterior jsonb;
  v_descuento_anterior numeric; v_suma numeric; v_original numeric;
  v_cobro public.bono_cobros; v_cobrado numeric; v_num_cobros integer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_descuento is null or p_descuento::text in ('NaN','Infinity','-Infinity')
    or p_descuento < 0 or p_descuento <> round(p_descuento,2) then
    raise exception 'Indica un descuento válido con un máximo de dos decimales';
  end if;
  if p_descuento > 0 and nullif(trim(p_motivo),'') is null then
    raise exception 'Indica el motivo del descuento';
  end if;
  select * into v_clase from public.clases where id=p_clase_id for update;
  if not found then raise exception 'No se encuentra la clase'; end if;
  select * into v_bono from public.bonos where id=p_bono_id for update;
  if not found then raise exception 'No se encuentra el bono'; end if;
  v_anterior := v_bono.ajustes_clase->p_clase_id::text;
  v_descuento_anterior := coalesce((v_anterior->>'descuento')::numeric,0);
  if v_descuento_anterior is distinct from p_descuento_anterior then
    raise exception 'El descuento ha cambiado. Vuelve a abrir la clase';
  end if;
  if p_descuento > 0 then
    if v_clase.estado <> 'realizada' or v_clase.tipo = 'club' or v_clase.modo_cobro = 'total' then
      raise exception 'El descuento se aplica a una clase realizada con cobro por alumno y bono';
    end if;
    if not exists (select 1 from public.clase_alumnos where clase_id=p_clase_id and bono_id=p_bono_id and usa_bono) then
      raise exception 'Esta clase no utiliza el bono seleccionado';
    end if;
  end if;
  select coalesce(sum((value->>'descuento')::numeric),0) into v_suma
    from jsonb_each(v_bono.ajustes_clase);
  v_original := v_bono.importe_pagado + v_suma;
  if p_descuento > round(v_original / nullif(v_bono.numero_clases,0),2)
    or v_bono.numero_clases <= 0 or v_bono.importe_pagado+v_descuento_anterior-p_descuento < 0 then
    raise exception 'El descuento no puede superar el precio habitual de esta sesión';
  end if;
  -- Se conserva el dinero registrado salvo que se indique expresamente que
  -- el descuento ya se aplicó en un cobro concreto. No simula devoluciones.
  if nullif(v_anterior->>'cobro_id','') is not null then
    update public.bono_cobros set importe=importe+v_descuento_anterior
      where id=(v_anterior->>'cobro_id')::uuid and bono_id=p_bono_id;
    if not found then raise exception 'Falta el cobro vinculado al descuento anterior'; end if;
  end if;
  if p_cobro_id is not null and p_descuento > 0 then
    select * into v_cobro from public.bono_cobros where id=p_cobro_id and bono_id=p_bono_id for update;
    if not found or v_cobro.importe < p_descuento then
      raise exception 'El cobro seleccionado no permite aplicar ese descuento';
    end if;
    update public.bono_cobros set importe=importe-p_descuento where id=p_cobro_id;
  end if;
  update public.bonos set
    importe_pagado=importe_pagado+v_descuento_anterior-p_descuento,
    ajustes_clase=case when p_descuento=0 then ajustes_clase-p_clase_id::text else
      jsonb_set(ajustes_clase,array[p_clase_id::text],jsonb_build_object(
        'descuento',p_descuento,'motivo',trim(p_motivo),'fecha_clase',v_clase.fecha,
        'cobro_id',p_cobro_id,'actualizado_en',current_timestamp,'usuario_id',auth.uid())) end
    where id=p_bono_id;
  perform public.recalcular_importes_sesion_bono(p_clase_id,p_bono_id);
  select count(*),coalesce(sum(importe) filter(where estado='pagado'),0)
    into v_num_cobros,v_cobrado from public.bono_cobros where bono_id=p_bono_id;
  if v_num_cobros>0 then
    update public.bonos set estado_cobro=case
      when v_cobrado >= importe_pagado then 'pagado' else 'pendiente' end where id=p_bono_id;
  end if;
end; $$;
revoke all on function public.guardar_descuento_clase_bono(uuid,uuid,numeric,text,uuid,numeric) from public,anon;
grant execute on function public.guardar_descuento_clase_bono(uuid,uuid,numeric,text,uuid,numeric) to authenticated;

-- La edición reemplaza participantes dentro de una transacción: validar al final
-- permite ese reemplazo, pero impide dejar una rebaja sin su sesión con bono.
create or replace function public.validar_clase_con_descuento_bono()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_id uuid; v_bono uuid; v_clase public.clases;
begin
  if TG_TABLE_NAME='clases' then
    v_id:=case when TG_OP='INSERT' then NEW.id else OLD.id end;
  else v_id:=case when TG_OP='INSERT' then NEW.clase_id else OLD.clase_id end; end if;
  for v_bono in select b.id from public.bonos b where b.ajustes_clase ? v_id::text
    or (b.ajustes_clase <> '{}'::jsonb and exists(select 1 from public.clase_alumnos ca where ca.clase_id=v_id and ca.bono_id=b.id and ca.usa_bono)) loop
    select * into v_clase from public.clases where id=v_id;
    if exists(select 1 from public.bonos where id=v_bono and ajustes_clase ? v_id::text) and
      (v_clase.id is null or v_clase.estado <> 'realizada' or v_clase.tipo='club' or v_clase.modo_cobro='total'
      or not exists(select 1 from public.clase_alumnos where clase_id=v_id and bono_id=v_bono and usa_bono)) then
      raise exception 'Retira primero el descuento de esta clase antes de cambiar su bono, cancelarla o borrarla';
    end if;
    update public.bonos set ajustes_clase=jsonb_set(ajustes_clase,array[v_id::text,'fecha_clase'],to_jsonb(v_clase.fecha))
      where id=v_bono and ajustes_clase ? v_id::text and ajustes_clase->v_id::text->>'fecha_clase' is distinct from v_clase.fecha::text;
    perform public.recalcular_importes_sesion_bono(v_id,v_bono);
  end loop;
  return null;
end; $$;
revoke all on function public.validar_clase_con_descuento_bono() from public,anon;
grant execute on function public.validar_clase_con_descuento_bono() to authenticated;
create constraint trigger validar_descuento_al_editar_clase
  after update or delete on public.clases deferrable initially deferred
  for each row execute function public.validar_clase_con_descuento_bono();
create constraint trigger validar_descuento_al_editar_participantes
  after insert or update on public.clase_alumnos deferrable initially deferred
  for each row execute function public.validar_clase_con_descuento_bono();
notify pgrst, 'reload schema';
commit;
