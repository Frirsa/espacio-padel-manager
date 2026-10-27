CREATE OR REPLACE FUNCTION public.crear_serie_atomica(p_datos_serie jsonb, p_clases jsonb, p_participantes jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_serie_id uuid;
  v_clase_id uuid;
  v_clase jsonb;
  v_participante jsonb;
  v_fecha date;
  v_dias_semana integer[];
  v_clases_creadas jsonb := '[]'::jsonb;
begin
  if p_datos_serie is null or jsonb_typeof(p_datos_serie) <> 'object' then
    raise exception 'Los datos de la serie no son validos.';
  end if;

  if p_clases is null or jsonb_typeof(p_clases) <> 'array' then
    raise exception 'Las clases de la serie no son validas.';
  end if;

  if jsonb_array_length(p_clases) = 0 then
    raise exception 'La serie debe contener al menos una clase.';
  end if;

  if p_participantes is null or jsonb_typeof(p_participantes) <> 'array' then
    raise exception 'Los participantes de la serie no son validos.';
  end if;

  if jsonb_typeof(p_datos_serie->'dias_semana') <> 'array' then
    raise exception 'Los dias de la serie no son validos.';
  end if;

  select coalesce(array_agg(valor::integer order by posicion), array[]::integer[])
  into v_dias_semana
  from jsonb_array_elements_text(p_datos_serie->'dias_semana')
       with ordinality as dias(valor, posicion);

  if coalesce(array_length(v_dias_semana, 1), 0) = 0 then
    raise exception 'La serie debe tener al menos un dia de la semana.';
  end if;

  insert into public.series_clases (
    fecha_inicio,
    fecha_fin,
    dias_semana,
    hora_inicio,
    duracion_minutos,
    ubicacion_id,
    grupo_id,
    tipo,
    observaciones
  ) values (
    (p_datos_serie->>'fecha_inicio')::date,
    (p_datos_serie->>'fecha_fin')::date,
    v_dias_semana,
    (p_datos_serie->>'hora_inicio')::time,
    (p_datos_serie->>'duracion_minutos')::integer,
    nullif(p_datos_serie->>'ubicacion_id', '')::uuid,
    nullif(p_datos_serie->>'grupo_id', '')::uuid,
    p_datos_serie->>'tipo',
    nullif(p_datos_serie->>'observaciones', '')
  )
  returning id into v_serie_id;

  for v_clase in
    select value
    from jsonb_array_elements(p_clases)
  loop
    v_fecha := (v_clase->>'fecha')::date;

    insert into public.clases (
      serie_id,
      fecha,
      hora_inicio,
      duracion_minutos,
      ubicacion_id,
      grupo_id,
      tipo,
      importe_club,
      coste_pista,
      ingreso_extra,
      modo_cobro,
      importe_total,
      estado,
      observaciones
    ) values (
      v_serie_id,
      v_fecha,
      (v_clase->>'hora_inicio')::time,
      (v_clase->>'duracion_minutos')::integer,
      nullif(v_clase->>'ubicacion_id', '')::uuid,
      nullif(v_clase->>'grupo_id', '')::uuid,
      v_clase->>'tipo',
      coalesce((v_clase->>'importe_club')::numeric, 0),
      coalesce((v_clase->>'coste_pista')::numeric, 0),
      coalesce((v_clase->>'ingreso_extra')::numeric, 0),
      coalesce(v_clase->>'modo_cobro', 'por_alumno'),
      nullif(v_clase->>'importe_total', '')::numeric,
      'programada',
      nullif(v_clase->>'observaciones', '')
    )
    returning id into v_clase_id;

    for v_participante in
      select value
      from jsonb_array_elements(p_participantes)
    loop
      insert into public.clase_alumnos (
        clase_id,
        alumno_id,
        importe,
        pagado,
        usa_bono,
        bono_id,
        asistio
      ) values (
        v_clase_id,
        (v_participante->>'alumno_id')::uuid,
        coalesce((v_participante->>'importe')::numeric, 0),
        coalesce((v_participante->>'pagado')::boolean, false),
        coalesce((v_participante->>'usa_bono')::boolean, false),
        nullif(v_participante->>'bono_id', '')::uuid,
        coalesce((v_participante->>'asistio')::boolean, true)
      );
    end loop;

    v_clases_creadas := v_clases_creadas || jsonb_build_array(
      jsonb_build_object(
        'id', v_clase_id,
        'fecha', v_fecha
      )
    );
  end loop;

  return jsonb_build_object(
    'serie_id', v_serie_id,
    'clases', v_clases_creadas
  );
end;
$function$
;
CREATE OR REPLACE FUNCTION public.guardar_clase_atomica(p_clase_id uuid, p_datos_clase jsonb, p_participantes jsonb, p_uso_anterior jsonb DEFAULT '{}'::jsonb, p_uso_nuevo jsonb DEFAULT '{}'::jsonb, p_metodos_pago jsonb DEFAULT '{}'::jsonb, p_metodo_pago_total text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_clase_id uuid;
  v_estado text;
  v_tipo text;
  v_facturable boolean;
  v_modo_cobro text;
  v_importe_total numeric;
  v_fecha date;
  v_genera_cobro boolean;

  v_metodos_anteriores jsonb := '{}'::jsonb;
  v_metodo_total_anterior text;
  v_num_normales integer := 0;
  v_todos_pagados boolean := false;

  v_bono_key text;
  v_anterior integer;
  v_nuevo integer;
  v_diferencia integer;
  v_numero_clases integer;
  v_restantes integer;
  v_restantes_nuevas integer;

  v_item jsonb;
begin
  if p_datos_clase is null then
    raise exception 'Faltan los datos de la clase.';
  end if;

  if p_participantes is null or jsonb_typeof(p_participantes) <> 'array' then
    raise exception 'Los participantes de la clase no son validos.';
  end if;

  v_estado := p_datos_clase->>'estado';
  v_tipo := p_datos_clase->>'tipo';
  v_facturable := coalesce((p_datos_clase->>'facturable')::boolean, true);
  v_modo_cobro := coalesce(p_datos_clase->>'modo_cobro', 'por_alumno');
  v_importe_total := nullif(p_datos_clase->>'importe_total', '')::numeric;
  v_fecha := (p_datos_clase->>'fecha')::date;

  if p_clase_id is null then
    insert into public.clases (
      fecha,
      hora_inicio,
      duracion_minutos,
      ubicacion_id,
      grupo_id,
      tipo,
      importe_club,
      coste_pista,
      ingreso_extra,
      modo_cobro,
      importe_total,
      estado,
      facturable,
      cobrada,
      motivo_cancelacion,
      observaciones
    ) values (
      v_fecha,
      (p_datos_clase->>'hora_inicio')::time,
      (p_datos_clase->>'duracion_minutos')::integer,
      nullif(p_datos_clase->>'ubicacion_id', '')::uuid,
      nullif(p_datos_clase->>'grupo_id', '')::uuid,
      v_tipo,
      coalesce((p_datos_clase->>'importe_club')::numeric, 0),
      coalesce((p_datos_clase->>'coste_pista')::numeric, 0),
      coalesce((p_datos_clase->>'ingreso_extra')::numeric, 0),
      v_modo_cobro,
      v_importe_total,
      v_estado,
      v_facturable,
      coalesce((p_datos_clase->>'cobrada')::boolean, false),
      nullif(p_datos_clase->>'motivo_cancelacion', ''),
      nullif(p_datos_clase->>'observaciones', '')
    )
    returning id into v_clase_id;
  else
    perform 1
    from public.clases
    where id = p_clase_id
    for update;

    if not found then
      raise exception 'La clase que intentas actualizar ya no existe.';
    end if;

    update public.clases
    set
      fecha = v_fecha,
      hora_inicio = (p_datos_clase->>'hora_inicio')::time,
      duracion_minutos = (p_datos_clase->>'duracion_minutos')::integer,
      ubicacion_id = nullif(p_datos_clase->>'ubicacion_id', '')::uuid,
      grupo_id = nullif(p_datos_clase->>'grupo_id', '')::uuid,
      tipo = v_tipo,
      importe_club = coalesce((p_datos_clase->>'importe_club')::numeric, 0),
      coste_pista = coalesce((p_datos_clase->>'coste_pista')::numeric, 0),
      ingreso_extra = coalesce((p_datos_clase->>'ingreso_extra')::numeric, 0),
      modo_cobro = v_modo_cobro,
      importe_total = v_importe_total,
      estado = v_estado,
      facturable = v_facturable,
      cobrada = coalesce((p_datos_clase->>'cobrada')::boolean, false),
      motivo_cancelacion = nullif(p_datos_clase->>'motivo_cancelacion', ''),
      observaciones = nullif(p_datos_clase->>'observaciones', '')
    where id = p_clase_id;

    v_clase_id := p_clase_id;
  end if;

  -- Conservamos metodos existentes antes de reconstruir los pagos.
  select
    coalesce(
      jsonb_object_agg(alumno_id::text, metodo)
        filter (where alumno_id is not null),
      '{}'::jsonb
    ),
    max(metodo) filter (where alumno_id is null)
  into
    v_metodos_anteriores,
    v_metodo_total_anterior
  from public.pagos
  where clase_id = v_clase_id;

  -- Participantes: reemplazo completo dentro de la misma transaccion.
  delete from public.clase_alumnos
  where clase_id = v_clase_id;

  for v_item in
    select value
    from jsonb_array_elements(p_participantes)
  loop
    insert into public.clase_alumnos (
      clase_id,
      alumno_id,
      importe,
      pagado,
      usa_bono,
      bono_id,
      asistio
    ) values (
      v_clase_id,
      (v_item->>'alumno_id')::uuid,
      coalesce((v_item->>'importe')::numeric, 0),
      coalesce((v_item->>'pagado')::boolean, false),
      coalesce((v_item->>'usa_bono')::boolean, false),
      nullif(v_item->>'bono_id', '')::uuid,
      coalesce((v_item->>'asistio')::boolean, true)
    );
  end loop;

  -- Bonos: aplicamos solo la diferencia de consumo anterior/nuevo.
  for v_bono_key in
    select key
    from (
      select jsonb_object_keys(coalesce(p_uso_anterior, '{}'::jsonb)) as key
      union
      select jsonb_object_keys(coalesce(p_uso_nuevo, '{}'::jsonb)) as key
    ) claves
  loop
    v_anterior := coalesce((p_uso_anterior->>v_bono_key)::integer, 0);
    v_nuevo := coalesce((p_uso_nuevo->>v_bono_key)::integer, 0);
    v_diferencia := v_nuevo - v_anterior;

    if v_diferencia = 0 then
      continue;
    end if;

    select numero_clases, clases_restantes
    into v_numero_clases, v_restantes
    from public.bonos
    where id = v_bono_key::uuid
    for update;

    if not found then
      raise exception 'No se pudo localizar uno de los bonos.';
    end if;

    v_restantes_nuevas := v_restantes - v_diferencia;

    if v_restantes_nuevas < 0 then
      raise exception 'Uno de los bonos no tiene clases suficientes.';
    end if;

    v_restantes_nuevas := least(v_restantes_nuevas, v_numero_clases);

    update public.bonos
    set
      clases_restantes = v_restantes_nuevas,
      activo = v_restantes_nuevas > 0
    where id = v_bono_key::uuid;
  end loop;

  -- Pagos: se reconstruyen desde el estado final de la clase y sus participantes.
  delete from public.pagos
  where clase_id = v_clase_id;

  v_genera_cobro :=
    v_estado = 'realizada'
    or (v_estado = 'cancelada' and v_facturable = true);

  if v_genera_cobro and v_tipo <> 'club' then
    if v_modo_cobro = 'total' then
      select
        count(*),
        coalesce(bool_and(coalesce((value->>'pagado')::boolean, false)), false)
      into v_num_normales, v_todos_pagados
      from jsonb_array_elements(p_participantes)
      where coalesce((value->>'usa_bono')::boolean, false) = false;

      insert into public.pagos (
        alumno_id,
        clase_id,
        importe,
        metodo,
        estado,
        fecha_pago,
        notas
      ) values (
        null,
        v_clase_id,
        coalesce(v_importe_total, 0),
        coalesce(nullif(p_metodo_pago_total, ''), v_metodo_total_anterior, 'efectivo'),
        case
          when v_num_normales > 0 and v_todos_pagados then 'pagado'
          else 'pendiente'
        end,
        v_fecha,
        case
          when v_estado = 'cancelada' then 'Clase completa cancelada facturable · generado desde Clases'
          else 'Clase completa · generado automaticamente desde Clases'
        end
      );
    else
      for v_item in
        select value
        from jsonb_array_elements(p_participantes)
        where coalesce((value->>'usa_bono')::boolean, false) = false
      loop
        insert into public.pagos (
          alumno_id,
          clase_id,
          importe,
          metodo,
          estado,
          fecha_pago,
          notas
        ) values (
          (v_item->>'alumno_id')::uuid,
          v_clase_id,
          coalesce((v_item->>'importe')::numeric, 0),
          coalesce(
            nullif(p_metodos_pago->>(v_item->>'alumno_id'), ''),
            nullif(v_metodos_anteriores->>(v_item->>'alumno_id'), ''),
            'efectivo'
          ),
          case
            when coalesce((v_item->>'pagado')::boolean, false) then 'pagado'
            else 'pendiente'
          end,
          v_fecha,
          case
            when v_estado = 'cancelada' then 'Clase cancelada facturable · generado desde Clases'
            else 'Generado automaticamente desde Clases'
          end
        );
      end loop;
    end if;
  end if;

  return v_clase_id;
end;
$function$
;

