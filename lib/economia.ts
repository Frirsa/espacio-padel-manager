export type ParticipanteEconomico = {
  alumno_id?: string | null;
  bono_id?: string | null;
  importe?: number | string | null;
  usa_bono?: boolean | null;
};

export type BonoEconomico = {
  id: string;
  importe_pagado?: number | string | null;
  numero_clases?: number | string | null;
};

// El ingreso de una sesión con bono procede de su precio, no de una tarifa
// que pudiera haber quedado guardada al programar una serie.
export function recalcularImportesBonos<
  T extends { tipo?: string | null; clase_alumnos?: ParticipanteEconomico[] | null }
>(clase: T, bonos: readonly BonoEconomico[]): T {
  const participantes = clase.clase_alumnos;
  if (clase.tipo === "club" || !participantes?.length) return clase;

  const bonosPorId = new Map(bonos.map((bono) => [bono.id, bono]));
  const grupos = new Map<string, number[]>();
  participantes.forEach((participante, indice) => {
    if (!participante.usa_bono || !participante.bono_id) return;
    const indices = grupos.get(participante.bono_id) || [];
    indices.push(indice);
    grupos.set(participante.bono_id, indices);
  });

  const importes = new Map<number, number>();
  for (const [bonoId, indices] of grupos) {
    const bono = bonosPorId.get(bonoId);
    if (bono?.importe_pagado == null || bono.numero_clases == null) continue;
    const precio = Number(bono.importe_pagado);
    const numeroClases = Number(bono.numero_clases);
    if (!Number.isFinite(precio) || precio < 0 ||
        !Number.isInteger(numeroClases) || numeroClases <= 0) continue;

    const centimos = Math.round((precio / numeroClases) * 100);
    const base = Math.floor(centimos / indices.length);
    const resto = centimos % indices.length;
    indices.sort((a, b) =>
      String(participantes[a].alumno_id || "").localeCompare(
        String(participantes[b].alumno_id || "")
      ) || a - b
    );
    indices.forEach((indice, orden) => {
      importes.set(indice, (base + (orden < resto ? 1 : 0)) / 100);
    });
  }

  if (importes.size === 0) return clase;
  return {
    ...clase,
    clase_alumnos: participantes.map((participante, indice) =>
      importes.has(indice)
        ? { ...participante, importe: importes.get(indice)! }
        : participante
    ),
  };
}

export type UbicacionEconomica = {
  es_club_referencia?: boolean | null;
};

type RelacionUnoOMuchos<T> = T | T[] | null;

export type ClaseEconomica = {
  tipo?: string | null;
  estado?: string | null;
  facturable?: boolean | null;
  cobrada?: boolean | null;
  importe_club?: number | string | null;
  coste_pista?: number | string | null;
  coste_monitor?: number | string | null;
  ingreso_extra?: number | string | null;
  modo_cobro?: string | null;
  importe_total?: number | string | null;
  ubicaciones?: RelacionUnoOMuchos<UbicacionEconomica>;
  clase_alumnos?: ParticipanteEconomico[] | null;
};

function obtenerUbicacionEconomica(
  relacion: RelacionUnoOMuchos<UbicacionEconomica> | undefined
): UbicacionEconomica | null {
  if (!relacion) {
    return null;
  }

  if (Array.isArray(relacion)) {
    return relacion[0] || null;
  }

  return relacion;
}

export function esClaseRealizada(clase: ClaseEconomica) {
  return clase.estado === "realizada";
}

export function esClaseEconomica(clase: ClaseEconomica) {
  return (
    clase.estado === "realizada" ||
    (clase.estado === "cancelada" && clase.facturable === true)
  );
}

export function esClaseClubReferencia(clase: ClaseEconomica) {
  const ubicacion = obtenerUbicacionEconomica(clase.ubicaciones);
  return ubicacion?.es_club_referencia === true;
}

export function ingresoClaseNoClub(clase: ClaseEconomica) {
  if (clase.modo_cobro === "total") {
    return Number(clase.importe_total || 0);
  }

  return (clase.clase_alumnos || []).reduce(
    (total, participante) => total + Number(participante.importe || 0),
    0
  );
}

export function ingresoBaseClase(clase: ClaseEconomica) {
  return clase.tipo === "club"
    ? Number(clase.importe_club || 0)
    : ingresoClaseNoClub(clase);
}

export function ingresoExtraClase(clase: ClaseEconomica) {
  return Number(clase.ingreso_extra || 0);
}

export function gastoPistaClase(clase: ClaseEconomica) {
  if (clase.estado === "cancelada") {
    return 0;
  }

  return Number(clase.coste_pista || 0);
}

export function gastoMonitorClase(clase: ClaseEconomica) {
  return clase.estado === "cancelada" ? 0 : Number(clase.coste_monitor || 0);
}

export function ingresoTotalClase(clase: ClaseEconomica) {
  return ingresoBaseClase(clase) + ingresoExtraClase(clase);
}

export function calcularEconomiaClase(clase: ClaseEconomica) {
  const cuentaEconomicamente = esClaseEconomica(clase);

  if (!cuentaEconomicamente) {
    return {
      cuentaEconomicamente: false,
      ingresoBase: 0,
      ingresoExtra: 0,
      ingresos: 0,
      gastoPista: 0,
      gastoMonitor: 0,
      gasto: 0,
      resultado: 0,
      clubGenerado: 0,
      clubCobrado: 0,
      pistasPagadasClub: 0,
    };
  }

  const ingresoBase = ingresoBaseClase(clase);
  const ingresoExtra = ingresoExtraClase(clase);
  const gastoPista = gastoPistaClase(clase);
  const gastoMonitor = gastoMonitorClase(clase);
  const gasto = gastoPista + gastoMonitor;
  const esClub = clase.tipo === "club";
  const clubGenerado = esClub ? ingresoBase : 0;
  const clubCobrado = esClub && clase.cobrada === true ? ingresoBase : 0;
  const pistasPagadasClub =
    esClaseClubReferencia(clase) && !esClub ? gastoPista : 0;

  return {
    cuentaEconomicamente: true,
    ingresoBase,
    ingresoExtra,
    ingresos: ingresoBase + ingresoExtra,
    gastoPista,
    gastoMonitor,
    gasto,
    resultado: ingresoBase + ingresoExtra - gasto,
    clubGenerado,
    clubCobrado,
    pistasPagadasClub,
  };
}
