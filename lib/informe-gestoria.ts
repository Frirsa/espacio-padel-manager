import { esClaseEconomica, gastoPistaClase } from "./economia";

export type ParticipanteGestoria = {
  alumno_id: string;
  importe: number;
  pagado: boolean;
  usa_bono: boolean;
  bono_id: string | null;
  alumnos: { nombre: string; apellidos: string | null } | null;
};

export type ClaseGestoria = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  importe_club: number;
  coste_pista: number;
  ingreso_extra: number;
  modo_cobro: string | null;
  importe_total: number | null;
  metodo_cobro_club: string | null;
  ubicaciones: { nombre: string; es_club_referencia?: boolean | null } | null;
  clase_alumnos: ParticipanteGestoria[];
};

export type PagoGestoria = {
  id: string;
  clase_id: string;
  alumno_id: string | null;
  importe: number;
  estado: string;
  metodo: string | null;
  fecha_pago: string | null;
};

export type BonoGestoria = {
  id: string;
  estado_cobro: string | null;
  metodo_cobro: string | null;
};

export type CobroBonoGestoria = {
  bono_id: string;
  estado: string;
  metodo_cobro: string | null;
};

export type LineaIngresoGestoria = {
  id: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  concepto: string;
  importe: number;
  ingresoExtra: number;
  estado: "Cobrado" | "Pendiente";
  metodo: string;
  esClub: boolean;
};

export type LineaGastoGestoria = {
  id: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  importe: number;
};

type EstadoCobroClase = {
  cobrado: boolean;
  metodos: string[];
};

function redondear(valor: number) {
  return Math.round(valor * 100) / 100;
}

function nombreParticipante(participante: ParticipanteGestoria) {
  if (!participante.alumnos) return "";
  return `${participante.alumnos.nombre} ${participante.alumnos.apellidos || ""}`.trim();
}

function horaCompleta(horaInicio: string, duracionMinutos: number) {
  const [horas, minutos] = horaInicio.slice(0, 5).split(":").map(Number);
  const inicio = horas * 60 + minutos;
  const fin = (inicio + Number(duracionMinutos || 0)) % (24 * 60);
  const formatear = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

  return `${formatear(inicio)}–${formatear(fin)}`;
}

function metodosUnicos(metodos: Array<string | null | undefined>) {
  return [
    ...new Set(
      metodos
        .map((metodo) => metodo?.trim())
        .filter((metodo): metodo is string => Boolean(metodo))
    ),
  ];
}

function estadoBono(
  bonoId: string,
  bonosPorId: Map<string, BonoGestoria>,
  cobrosPorBono: Map<string, CobroBonoGestoria[]>
): EstadoCobroClase {
  const bono = bonosPorId.get(bonoId);
  const cobros = cobrosPorBono.get(bonoId) || [];
  const cobrado = cobros.length > 0
    ? cobros.every((cobro) => cobro.estado === "pagado")
    : bono?.estado_cobro !== "pendiente";
  const metodos = metodosUnicos([
    ...cobros
      .filter((cobro) => cobro.estado === "pagado")
      .map((cobro) => cobro.metodo_cobro),
    bono?.metodo_cobro,
  ]).map((metodo) => `Bono · ${metodo}`);

  return { cobrado, metodos: metodos.length ? metodos : ["Bono"] };
}

function estadoClasePropia(
  clase: ClaseGestoria,
  pagosClase: PagoGestoria[],
  bonosPorId: Map<string, BonoGestoria>,
  cobrosPorBono: Map<string, CobroBonoGestoria[]>
): EstadoCobroClase {
  if (clase.modo_cobro === "total") {
    const pago = pagosClase.find((item) => item.alumno_id === null);
    return {
      cobrado: pago?.estado === "pagado",
      metodos: metodosUnicos([pago?.metodo]),
    };
  }

  const estados: boolean[] = [];
  const metodos: string[] = [];
  const bonosProcesados = new Set<string>();

  for (const participante of clase.clase_alumnos || []) {
    if (participante.usa_bono && participante.bono_id) {
      if (bonosProcesados.has(participante.bono_id)) continue;
      bonosProcesados.add(participante.bono_id);
      const bono = estadoBono(participante.bono_id, bonosPorId, cobrosPorBono);
      estados.push(bono.cobrado);
      metodos.push(...bono.metodos);
      continue;
    }

    const pagosAlumno = pagosClase.filter((pago) => pago.alumno_id === participante.alumno_id);
    if (pagosAlumno.length) {
      estados.push(pagosAlumno.every((pago) => pago.estado === "pagado"));
      metodos.push(
        ...pagosAlumno
          .filter((pago) => pago.estado === "pagado")
          .map((pago) => pago.metodo || "")
      );
    } else {
      estados.push(participante.pagado === true);
      if (participante.pagado) metodos.push("No registrado");
    }
  }

  return {
    cobrado: estados.length > 0 && estados.every(Boolean),
    metodos: metodosUnicos(metodos),
  };
}

export function construirInformeGestoria(
  clases: ClaseGestoria[],
  pagos: PagoGestoria[],
  bonos: BonoGestoria[],
  cobrosBonos: CobroBonoGestoria[]
) {
  const ingresos: LineaIngresoGestoria[] = [];
  const gastos: LineaGastoGestoria[] = [];
  const pagosPorClase = new Map<string, PagoGestoria[]>();
  const bonosPorId = new Map(bonos.map((bono) => [bono.id, bono]));
  const cobrosPorBono = new Map<string, CobroBonoGestoria[]>();

  for (const pago of pagos) {
    pagosPorClase.set(pago.clase_id, [...(pagosPorClase.get(pago.clase_id) || []), pago]);
  }
  for (const cobro of cobrosBonos) {
    cobrosPorBono.set(cobro.bono_id, [...(cobrosPorBono.get(cobro.bono_id) || []), cobro]);
  }

  for (const clase of clases) {
    if (!esClaseEconomica(clase)) continue;

    const participantes = clase.clase_alumnos || [];
    const alumnos = participantes.map(nombreParticipante).filter(Boolean).join(" + ");
    const ingresoExtra = Number(clase.ingreso_extra || 0);
    const pagosClase = pagosPorClase.get(clase.id) || [];
    const esClub = clase.tipo === "club";
    const estadoCobro = esClub
      ? {
          cobrado: clase.cobrada === true,
          metodos: metodosUnicos([clase.metodo_cobro_club]),
        }
      : estadoClasePropia(clase, pagosClase, bonosPorId, cobrosPorBono);
    const importe = esClub
      ? Number(clase.importe_club || 0)
      : clase.modo_cobro === "total"
        ? Number(
            clase.importe_total ??
              pagosClase.find((pago) => pago.alumno_id === null)?.importe ??
              0
          )
        : participantes.reduce(
            (total, participante) => total + Number(participante.importe || 0),
            0
          );

    ingresos.push({
      id: clase.id,
      fecha: clase.fecha,
      hora: horaCompleta(clase.hora_inicio, clase.duracion_minutos),
      ubicacion: clase.ubicaciones?.nombre || "Sin ubicación",
      concepto: alumnos || (ingresoExtra ? "Ingreso extra" : "Sin alumno"),
      importe: redondear(importe),
      ingresoExtra: redondear(ingresoExtra),
      estado: estadoCobro.cobrado ? "Cobrado" : "Pendiente",
      metodo: estadoCobro.metodos.join(" + ") || "—",
      esClub,
    });

    const coste = gastoPistaClase(clase);
    if (coste) {
      gastos.push({
        id: clase.id,
        fecha: clase.fecha,
        hora: horaCompleta(clase.hora_inicio, clase.duracion_minutos),
        ubicacion: clase.ubicaciones?.nombre || "Sin ubicación",
        importe: coste,
      });
    }
  }

  const sumarIngresos = (lineas: LineaIngresoGestoria[]) =>
    redondear(
      lineas.reduce(
        (total, linea) => total + linea.importe + linea.ingresoExtra,
        0
      )
    );
  const cobrado = sumarIngresos(
    ingresos.filter((linea) => linea.estado === "Cobrado")
  );
  const pendiente = sumarIngresos(
    ingresos.filter((linea) => linea.estado === "Pendiente")
  );
  const totalIngresos = sumarIngresos(ingresos);
  const totalGastos = redondear(
    gastos.reduce((total, gasto) => total + gasto.importe, 0)
  );
  const resultado = redondear(totalIngresos - totalGastos);
  const gastosPorUbicacion = [
    ...gastos.reduce((grupos, gasto) => {
      grupos.set(
        gasto.ubicacion,
        (grupos.get(gasto.ubicacion) || 0) + gasto.importe
      );
      return grupos;
    }, new Map<string, number>()),
  ]
    .map(([ubicacion, total]) => ({
      ubicacion,
      total: redondear(total),
    }))
    .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion, "es"));

  return {
    ingresos,
    gastos,
    gastosPorUbicacion,
    cobrado,
    pendiente,
    totalIngresos,
    totalGastos,
    resultado,
  };
}
