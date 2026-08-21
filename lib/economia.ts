export type ParticipanteEconomico = {
  importe?: number | string | null;
  usa_bono?: boolean | null;
};

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
  return Number(clase.coste_pista || 0);
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
      gasto: 0,
      resultado: 0,
      clubGenerado: 0,
      clubCobrado: 0,
      pistasPagadasClub: 0,
    };
  }

  const ingresoBase = ingresoBaseClase(clase);
  const ingresoExtra = ingresoExtraClase(clase);
  const gasto = gastoPistaClase(clase);
  const esClub = clase.tipo === "club";
  const clubGenerado = esClub ? ingresoBase : 0;
  const clubCobrado = esClub && clase.cobrada === true ? ingresoBase : 0;
  const pistasPagadasClub =
    esClaseClubReferencia(clase) && !esClub ? gasto : 0;

  return {
    cuentaEconomicamente: true,
    ingresoBase,
    ingresoExtra,
    ingresos: ingresoBase + ingresoExtra,
    gasto,
    resultado: ingresoBase + ingresoExtra - gasto,
    clubGenerado,
    clubCobrado,
    pistasPagadasClub,
  };
}
