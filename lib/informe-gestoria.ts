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
  fecha_cobro_club: string | null;
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
  estado: "Cobrado" | "Bono imputado" | "Pendiente" | "Por revisar";
  metodo: string;
  fechaCobro: string | null;
};

export type LineaGastoGestoria = {
  id: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  importe: number;
};

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

    const ubicacion = clase.ubicaciones?.nombre || "Sin ubicación";
    const comun = { fecha: clase.fecha, hora: clase.hora_inicio, ubicacion };
    const avisoCancelada = clase.estado === "cancelada" ? "Cancelada facturable · " : "";
    const alumnos = (clase.clase_alumnos || [])
      .map((p) => p.alumnos && `${p.alumnos.nombre} ${p.alumnos.apellidos || ""}`.trim())
      .filter(Boolean).join(" + ") || "Sin alumno";

    if (clase.tipo === "club") {
      ingresos.push({
        id: `${clase.id}-club`, ...comun, concepto: `${avisoCancelada}Club · ${alumnos}`,
        importe: Number(clase.importe_club || 0),
        estado: clase.cobrada ? "Cobrado" : "Pendiente",
        metodo: clase.cobrada ? clase.metodo_cobro_club || "No registrado" : "Pendiente de cobro",
        fechaCobro: clase.cobrada ? clase.fecha_cobro_club : null,
      });
    } else {
      const pagosClase = pagosPorClase.get(clase.id) || [];
      if (clase.modo_cobro === "total") {
        const pago = pagosClase.find((p) => p.alumno_id === null);
        ingresos.push({
          id: `${clase.id}-total`, ...comun, concepto: `${avisoCancelada}Clase completa · ${alumnos}`,
          importe: Number(pago?.importe ?? clase.importe_total ?? 0),
          estado: pago ? (pago.estado === "pagado" ? "Cobrado" : "Pendiente") : "Por revisar",
          metodo: pago?.estado === "pagado" ? pago.metodo || "No registrado" : pago ? "Pendiente de cobro" : "Sin registro de pago",
          fechaCobro: pago?.estado === "pagado" ? pago.fecha_pago : null,
        });
      } else {
        const gruposBono = new Map<string, ParticipanteGestoria[]>();
        for (const participante of clase.clase_alumnos || []) {
          if (participante.usa_bono && participante.bono_id) {
            gruposBono.set(participante.bono_id, [...(gruposBono.get(participante.bono_id) || []), participante]);
            continue;
          }
          const pagosAlumno = pagosClase.filter((p) => p.alumno_id === participante.alumno_id);
          const nombre = participante.alumnos
            ? `${participante.alumnos.nombre} ${participante.alumnos.apellidos || ""}`.trim()
            : "Sin alumno";
          if (pagosAlumno.length) {
            for (const pago of pagosAlumno) {
              const cobrado = pago.estado === "pagado";
              ingresos.push({
                id: pago.id, ...comun, concepto: `${avisoCancelada}${nombre}`, importe: Number(pago.importe || 0),
                estado: cobrado ? "Cobrado" : "Pendiente",
                metodo: cobrado ? pago.metodo || "No registrado" : "Pendiente de cobro",
                fechaCobro: cobrado ? pago.fecha_pago : null,
              });
            }
          } else {
            ingresos.push({
              id: `${clase.id}-${participante.alumno_id}`, ...comun, concepto: `${avisoCancelada}${nombre}`,
              importe: Number(participante.importe || 0),
              estado: participante.pagado ? "Por revisar" : "Pendiente",
              metodo: participante.pagado ? "Cobro sin método registrado" : "Pendiente de cobro",
              fechaCobro: null,
            });
          }
        }
        for (const [bonoId, participantes] of gruposBono) {
          const bono = bonosPorId.get(bonoId);
          const cobros = cobrosPorBono.get(bonoId) || [];
          const abonados = cobros.filter((c) => c.estado === "pagado");
          const pendiente = cobros.length
            ? cobros.some((c) => c.estado !== "pagado")
            : bono?.estado_cobro === "pendiente";
          const requiereRevision = !bono || (pendiente && abonados.length > 0);
          const metodos = [...new Set(cobros.filter((c) => c.estado === "pagado")
            .map((c) => c.metodo_cobro).filter(Boolean))];
          ingresos.push({
            id: `${clase.id}-bono-${bonoId}`, ...comun,
            concepto: `${avisoCancelada}Bono imputado · ${participantes.map((p) => p.alumnos
              ? `${p.alumnos.nombre} ${p.alumnos.apellidos || ""}`.trim() : "Sin alumno").join(" + ")}`,
            importe: participantes.reduce((sum, p) => sum + Number(p.importe || 0), 0),
            estado: requiereRevision ? "Por revisar" : pendiente ? "Pendiente" : "Bono imputado",
            metodo: requiereRevision ? "Revisar cobro parcial del bono" : pendiente ? "Bono pendiente" : `Bono · ${metodos.join(" + ") || bono?.metodo_cobro || "método no registrado"}`,
            fechaCobro: null,
          });
        }
      }
    }

    const extra = Number(clase.ingreso_extra || 0);
    if (extra) ingresos.push({
      id: `${clase.id}-extra`, ...comun, concepto: "Ingreso extra · revisar cobro",
      importe: extra, estado: "Por revisar", metodo: "Sin registro de cobro", fechaCobro: null,
    });

    const coste = gastoPistaClase(clase);
    if (coste) gastos.push({ id: clase.id, ...comun, importe: coste });
  }

  const sumar = (lineas: LineaIngresoGestoria[]) =>
    Math.round(lineas.reduce((total, linea) => total + linea.importe, 0) * 100) / 100;
  const cobrado = sumar(ingresos.filter((l) => l.estado === "Cobrado"));
  const bonoImputado = sumar(ingresos.filter((l) => l.estado === "Bono imputado"));
  const pendiente = sumar(ingresos.filter((l) => l.estado === "Pendiente"));
  const porRevisar = sumar(ingresos.filter((l) => l.estado === "Por revisar"));
  const totalIngresos = sumar(ingresos);
  const totalGastos = Math.round(gastos.reduce((total, gasto) => total + gasto.importe, 0) * 100) / 100;
  const resultado = Math.round((totalIngresos - totalGastos) * 100) / 100;
  const gastosPorUbicacion = [...gastos.reduce((grupos, gasto) => {
    grupos.set(gasto.ubicacion, (grupos.get(gasto.ubicacion) || 0) + gasto.importe);
    return grupos;
  }, new Map<string, number>())].map(([ubicacion, total]) => ({
    ubicacion, total: Math.round(total * 100) / 100,
  })).sort((a, b) => a.ubicacion.localeCompare(b.ubicacion, "es"));
  return { ingresos, gastos, gastosPorUbicacion, cobrado, bonoImputado, pendiente, porRevisar, totalIngresos, totalGastos, resultado };
}
