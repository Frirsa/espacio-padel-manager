"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  borrarClaseDeGoogleCalendar,
  sincronizarClaseConGoogleCalendar,
} from "../../lib/googleCalendarClient";
import AccionesRapidasClase from "./AccionesRapidasClase";

type Clase = {
  id: string;
  google_calendar_event_id: string | null;
  google_calendar_synced_at: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  observaciones: string | null;
  ubicaciones: { nombre: string; tipo: string } | null;
  clase_alumnos: {
    id: string;
    alumno_id: string;
    importe: number;
    pagado: boolean;
    usa_bono: boolean;
    bono_id: string | null;
    asistio: boolean;
    alumnos: {
      id: string;
      nombre: string;
      apellidos: string | null;
      apodo: string | null;
    } | null;
  }[];
};

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
};

type Props = {
  clases: Clase[];
  fechaSeleccionada: string;
  noDisponibilidades: NoDisponibilidad[];
  onClaseActualizada: () => Promise<void>;
  onFechaSeleccionadaChange?: (
    fecha: string
  ) => void;
};


function nombresAlumnosAgenda(
  alumnosEntrada: Array<
    | {
        nombre: string;
        apellidos: string | null;
        apodo: string | null;
      }
    | null
    | undefined
  >
) {
  const alumnosValidos =
    alumnosEntrada.filter(
      Boolean
    ) as {
      nombre: string;
      apellidos: string | null;
      apodo: string | null;
    }[];

  const nombresCompletos =
    alumnosValidos.map(
      (alumno) => {
        const apodo =
          (
            alumno.apodo ||
            ""
          ).trim();

        if (apodo) {
          return apodo;
        }

        return `${alumno.nombre || ""} ${
          alumno.apellidos || ""
        }`.trim();
      }
    );

  const textoCompleto =
    nombresCompletos.join(
      " · "
    );

  const LIMITE_TEXTO =
    34;

  if (
    textoCompleto.length <=
    LIMITE_TEXTO
  ) {
    return nombresCompletos;
  }

  return alumnosValidos.map(
    (alumno) => {
      const apodo =
        (
          alumno.apodo ||
          ""
        ).trim();

      if (apodo) {
        return apodo;
      }

      return (
        alumno.nombre || ""
      ).trim();
    }
  );
}

function fechaLocalISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function crearFecha(fecha: string) {
  const [y,m,d] = fecha.split("-").map(Number);
  return new Date(y,m-1,d);
}

function inicioSemana(fecha: string) {
  const d = crearFecha(fecha);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function calcularHoraFin(
  horaInicio: string,
  duracionMinutos: number
) {
  const [hora, minuto] =
    horaInicio
      .slice(0, 5)
      .split(":")
      .map(Number);

  const fecha =
    new Date();

  fecha.setHours(
    hora,
    minuto,
    0,
    0
  );

  fecha.setMinutes(
    fecha.getMinutes() +
      duracionMinutos
  );

  return `${String(
    fecha.getHours()
  ).padStart(2, "0")}:${String(
    fecha.getMinutes()
  ).padStart(2, "0")}`;
}

function datosGoogleClase(
  clase: Clase,
  cambios?: Partial<
    Pick<Clase, "fecha" | "hora_inicio" | "estado" | "observaciones">
  >
) {
  return {
    id: clase.id,
    google_calendar_event_id:
      clase.google_calendar_event_id,
    fecha: cambios?.fecha || clase.fecha,
    hora_inicio:
      cambios?.hora_inicio || clase.hora_inicio,
    duracion_minutos: clase.duracion_minutos,
    tipo: clase.tipo,
    estado: cambios?.estado || clase.estado,
    observaciones:
      cambios?.observaciones !== undefined
        ? cambios.observaciones
        : clase.observaciones,
    ubicacion: clase.ubicaciones?.nombre || null,
    tipo_ubicacion: clase.ubicaciones?.tipo || null,
    alumnos: clase.clase_alumnos
      .map((participante) => {
        const alumno = participante.alumnos;

        if (!alumno) {
          return "";
        }

        return `${alumno.nombre} ${alumno.apellidos || ""}`.trim();
      })
      .filter(Boolean),
  };
}

// SolapamientoHorarioAgendaV2
function intervaloClaseAgenda(clase: Clase) {
  const [hora, minuto] = clase.hora_inicio
    .slice(0, 5)
    .split(":")
    .map(Number);

  const inicio = hora * 60 + minuto;

  return {
    inicio,
    fin: inicio + clase.duracion_minutos,
  };
}

function clasesAgendaSeSolapan(primera: Clase, segunda: Clase) {
  const intervaloPrimera = intervaloClaseAgenda(primera);
  const intervaloSegunda = intervaloClaseAgenda(segunda);

  return (
    intervaloPrimera.inicio < intervaloSegunda.fin &&
    intervaloPrimera.fin > intervaloSegunda.inicio
  );
}

function esCanceladaSolapadaAgenda(
  clase: Clase,
  clasesDia: Clase[]
) {
  return (
    clase.estado === "cancelada" &&
    clasesDia.some(
      (otraClase) =>
        otraClase.id !== clase.id &&
        otraClase.estado !== "cancelada" &&
        clasesAgendaSeSolapan(clase, otraClase)
    )
  );
}

function calcularDisposicionClasesAgenda(clasesDia: Clase[]) {
  const resultado = new Map<
    string,
    { columna: number; totalColumnas: number }
  >();

  function procesarLista(lista: Clase[]) {
    const ordenadas = [...lista].sort((a, b) => {
      const intervaloA = intervaloClaseAgenda(a);
      const intervaloB = intervaloClaseAgenda(b);

      if (intervaloA.inicio !== intervaloB.inicio) {
        return intervaloA.inicio - intervaloB.inicio;
      }

      return a.id.localeCompare(b.id);
    });

    let grupo: Clase[] = [];
    let finGrupo = -1;

    function procesarGrupo() {
      if (grupo.length === 0) {
        return;
      }

      const finalesColumnas: number[] = [];
      const asignaciones: Array<{ id: string; columna: number }> = [];

      for (const clase of grupo) {
        const { inicio, fin } = intervaloClaseAgenda(clase);
        let columna = finalesColumnas.findIndex(
          (finAnterior) => finAnterior <= inicio
        );

        if (columna === -1) {
          columna = finalesColumnas.length;
          finalesColumnas.push(fin);
        } else {
          finalesColumnas[columna] = fin;
        }

        asignaciones.push({
          id: clase.id,
          columna,
        });
      }

      const totalColumnas = Math.max(1, finalesColumnas.length);

      for (const asignacion of asignaciones) {
        resultado.set(asignacion.id, {
          columna: asignacion.columna,
          totalColumnas,
        });
      }
    }

    for (const clase of ordenadas) {
      const { inicio, fin } = intervaloClaseAgenda(clase);

      if (grupo.length === 0 || inicio < finGrupo) {
        grupo.push(clase);
        finGrupo = Math.max(finGrupo, fin);
        continue;
      }

      procesarGrupo();
      grupo = [clase];
      finGrupo = fin;
    }

    procesarGrupo();
  }

  // Las clases canceladas se distribuyen aparte. Así una cancelada
  // nunca reduce el ancho disponible de una clase válida.
  procesarLista(
    clasesDia.filter((clase) => clase.estado !== "cancelada")
  );
  procesarLista(
    clasesDia.filter((clase) => clase.estado === "cancelada")
  );

  return resultado;
}

function colorClase(clase: Clase) {
  if (clase.tipo === "club") {
    return "border-amber-300 bg-amber-50/90 text-amber-950";
  }

  if (clase.tipo === "privada") {
    return "border-violet-500 bg-violet-100 text-violet-950";
  }

  if (
    clase.tipo === "propia" &&
    clase.ubicaciones?.tipo === "pago"
  ) {
    return "border-sky-500 bg-sky-100 text-sky-950";
  }

  return "border-[#00A79C]/40 bg-[#00A79C]/10 text-[#0B6F69]";
}

function estadoEconomicoClase(clase: Clase) {
  if (!clase.facturable) {
    return "no_facturable" as const;
  }

  if (clase.tipo === "club") {
    return clase.cobrada ? "cobrada" as const : "pendiente" as const;
  }

  if (clase.clase_alumnos.length === 0) {
    return "pendiente" as const;
  }

  const pagosNormales = clase.clase_alumnos.filter(
    (participante) => !participante.usa_bono
  );

  if (pagosNormales.length === 0) {
    return "cobrada" as const;
  }

  return pagosNormales.every((participante) => participante.pagado)
    ? "cobrada" as const
    : "pendiente" as const;
}

function IconoEstadoClase({ estado }: { estado: string }) {
  if (estado === "realizada") {
    return (
      <svg viewBox="0 0 20 20" className="h-[11px] w-[11px]" fill="none" aria-hidden="true">
        <path d="M4.5 10.2 8.1 13.8 15.6 6.3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (estado === "cancelada") {
    return (
      <svg viewBox="0 0 20 20" className="h-[11px] w-[11px]" fill="none" aria-hidden="true">
        <path d="M5.2 5.2 14.8 14.8M14.8 5.2 5.2 14.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="h-[11px] w-[11px]" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 6.4v4l2.7 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoNota() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.75h8.5L19 8.25V20.25H6Z" />
      <path d="M14.5 3.75v4.5H19" />
      <path d="M9 12h6M9 15.5h4.5" />
    </svg>
  );
}

function IndicadoresClase({ clase }: { clase: Clase }) {
  const economico = estadoEconomicoClase(clase);

  const estadoVisual =
    clase.estado === "realizada"
      ? { titulo: "Clase realizada", clase: "border-green-500 bg-green-500 text-white" }
      : clase.estado === "cancelada"
        ? { titulo: "Clase cancelada", clase: "border-red-600 bg-red-600 text-white" }
        : { titulo: "Clase programada", clase: "border-slate-300 bg-slate-100 text-slate-600" };

  const economicoVisual =
    economico === "cobrada"
      ? { titulo: "Cobrada", clase: "border-green-500 bg-green-500 text-white", tachado: false }
      : economico === "no_facturable"
        ? { titulo: "No facturable", clase: "border-slate-400 bg-slate-100 text-slate-500", tachado: true }
        : { titulo: "Pendiente de cobro", clase: "border-red-600 bg-red-600 text-white", tachado: false };

  return (
    <span className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-1">
      <span
        title={estadoVisual.titulo}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${estadoVisual.clase}`}
      >
        <IconoEstadoClase estado={clase.estado} />
      </span>
      <span
        title={economicoVisual.titulo}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold leading-none shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${economicoVisual.clase} ${economicoVisual.tachado ? "line-through" : ""}`}
      >
        €
      </span>

      {clase.observaciones?.trim() && (
        <span
          title="Esta clase tiene una anotación"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-500 bg-amber-500 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
        >
          <IconoNota />
        </span>
      )}
    </span>
  );
}


function IconoCerrar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7Z" />
      <path d="M12 7v10" strokeDasharray="2 2" />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export default function VistaHorarioAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
  onClaseActualizada,
  onFechaSeleccionadaChange,
}: Props) {
  const [
    claseSeleccionada,
    setClaseSeleccionada,
  ] = useState<Clase | null>(null);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    mensajeAccion,
    setMensajeAccion,
  ] = useState("");

  const [
    participanteCobroId,
    setParticipanteCobroId,
  ] = useState<string | null>(null);

  const [
    cancelacionFacturablePendiente,
    setCancelacionFacturablePendiente,
  ] = useState<boolean | null>(null);

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] = useState("");

  const [
    claseArrastrandoId,
    setClaseArrastrandoId,
  ] = useState<string | null>(null);

  const [
    mensajeMovimiento,
    setMensajeMovimiento,
  ] = useState("");

  const [
    desplazamientoArrastreY,
    setDesplazamientoArrastreY,
  ] = useState(0);

  const [
    fechaMovil,
    setFechaMovil,
  ] = useState(
    fechaSeleccionada
  );

  const [
    creacionPendiente,
    setCreacionPendiente,
  ] = useState<{
    fecha: string;
    hora: number;
    minuto: number;
  } | null>(null);

  const hoy = fechaLocalISO(new Date());

  const inicio = inicioSemana(fechaSeleccionada);
  const dias = Array.from({length:7},(_,i)=>{
    const d=new Date(inicio);
    d.setDate(inicio.getDate()+i);
    return d;
  });

  const horaInicio = 7;
  const horaFin = 23;
  const altoHora = 72;
  const altoTotal = (horaFin-horaInicio)*altoHora;

  useEffect(() => {
    setFechaMovil(
      fechaSeleccionada
    );
  }, [fechaSeleccionada]);

  const fechaMovilDate =
    crearFecha(fechaMovil);

  const clasesDiaMovil =
    clases.filter(
      (clase) =>
        clase.fecha ===
        fechaMovil
    );

  const disposicionClasesDiaMovil =
    calcularDisposicionClasesAgenda(
      clasesDiaMovil
    );

  function bloqueosDelDia(
    fecha: string
  ) {
    return noDisponibilidades.filter(
      (bloqueo) =>
        fecha >=
          bloqueo.fecha_inicio &&
        fecha <=
          bloqueo.fecha_fin
    );
  }

  function noDisponibleTodoElDia(
    fecha: string
  ) {
    return bloqueosDelDia(
      fecha
    ).find(
      (bloqueo) =>
        !bloqueo.hora_inicio ||
        !bloqueo.hora_fin
    );
  }

  function noDisponible(
    fecha: string,
    hora?: number,
    minuto = 0,
    duracionMinutos = 30
  ) {
    const bloqueos =
      bloqueosDelDia(
        fecha
      );

    if (hora === undefined) {
      return (
        bloqueos.find(
          (bloqueo) =>
            !bloqueo.hora_inicio ||
            !bloqueo.hora_fin
        ) ||
        bloqueos[0]
      );
    }

    const inicioClase =
      hora * 60 +
      minuto;

    const finClase =
      inicioClase +
      duracionMinutos;

    return bloqueos.find(
      (bloqueo) => {
        if (
          !bloqueo.hora_inicio ||
          !bloqueo.hora_fin
        ) {
          return true;
        }

        const [
          horaInicioBloqueo,
          minutoInicioBloqueo,
        ] =
          bloqueo.hora_inicio
            .slice(0, 5)
            .split(":")
            .map(Number);

        const [
          horaFinBloqueo,
          minutoFinBloqueo,
        ] =
          bloqueo.hora_fin
            .slice(0, 5)
            .split(":")
            .map(Number);

        const inicioBloqueo =
          horaInicioBloqueo *
            60 +
          minutoInicioBloqueo;

        const finBloqueo =
          horaFinBloqueo *
            60 +
          minutoFinBloqueo;

        return (
          inicioClase <
            finBloqueo &&
          finClase >
            inicioBloqueo
        );
      }
    );
  }

  function textoNoDisponibilidad(
    bloqueo: NoDisponibilidad
  ) {
    if (
      !bloqueo.hora_inicio ||
      !bloqueo.hora_fin
    ) {
      return "Todo el día";
    }

    return `${bloqueo.hora_inicio.slice(
      0,
      5
    )}–${bloqueo.hora_fin.slice(
      0,
      5
    )}`;
  }

  function bloqueosParciales(
    fecha: string
  ) {
    return bloqueosDelDia(
      fecha
    ).filter(
      (bloqueo) =>
        Boolean(
          bloqueo.hora_inicio &&
            bloqueo.hora_fin
        )
    );
  }

  function posicionBloqueoHorario(
    bloqueo: NoDisponibilidad
  ) {
    if (
      !bloqueo.hora_inicio ||
      !bloqueo.hora_fin
    ) {
      return null;
    }

    const inicio =
      minutosDesdeMedianoche(
        bloqueo.hora_inicio
      );

    const fin =
      minutosDesdeMedianoche(
        bloqueo.hora_fin
      );

    const inicioVisible =
      horaInicio * 60;

    const finVisible =
      horaFin * 60;

    const inicioAjustado =
      Math.max(
        inicio,
        inicioVisible
      );

    const finAjustado =
      Math.min(
        fin,
        finVisible
      );

    if (
      finAjustado <=
      inicioAjustado
    ) {
      return null;
    }

    return {
      top:
        ((inicioAjustado -
          inicioVisible) /
          60) *
        altoHora,
      height:
        ((finAjustado -
          inicioAjustado) /
          60) *
        altoHora,
    };
  }

  function editarClase(
    id: string
  ) {
    const volver =
      `/agenda?vista=horario&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?editar=${id}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  async function borrarClaseSeleccionada() {
    if (
      !claseSeleccionada ||
      actualizando
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar esta clase?"
      );

    if (!confirmar) {
      return;
    }

    const clase =
      claseSeleccionada;

    setActualizando(true);
    setMensajeAccion("");

    try {
      let avisoGoogle = "";

      try {
        await borrarClaseDeGoogleCalendar({
          id: clase.id,
          google_calendar_event_id:
            clase.google_calendar_event_id,
        });
      } catch {
        avisoGoogle =
          "Clase borrada en Manager, pero no se pudo borrar su evento de Google Calendar.";
      }

      const {
        error: errorPagos,
      } =
        await supabase
          .from("pagos")
          .delete()
          .eq(
            "clase_id",
            clase.id
          );

      if (errorPagos) {
        throw new Error(
          "No se pudieron eliminar los pagos asociados."
        );
      }

      const {
        error: errorClase,
      } =
        await supabase
          .from("clases")
          .delete()
          .eq(
            "id",
            clase.id
          );

      if (errorClase) {
        throw new Error(
          "No se pudo borrar la clase."
        );
      }

      let avisoBono = "";

      if (
        clase.estado ===
        "realizada"
      ) {
        try {
          for (
            const participante of
            clase.clase_alumnos
          ) {
            if (
              participante.usa_bono &&
              participante.bono_id
            ) {
              await ajustarBono(
                participante.bono_id,
                1
              );
            }
          }
        } catch {
          avisoBono =
            "Clase borrada, pero hubo un problema al devolver el bono.";
        }
      }

      setClaseSeleccionada(
        null
      );

      await onClaseActualizada();

      const avisos = [
        avisoBono,
        avisoGoogle,
      ]
        .filter(Boolean)
        .join("\n");

      if (avisos) {
        window.alert(avisos);
      }
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
              ? error.message
              : "No se pudo borrar la clase."
          )
      );
    } finally {
      setActualizando(false);
    }
  }

  async function ajustarBono(
    bonoId: string,
    diferencia: number
  ) {
    const {
      data: bono,
      error,
    } = await supabase
      .from("bonos")
      .select(
        "id,numero_clases,clases_restantes"
      )
      .eq(
        "id",
        bonoId
      )
      .single();

    if (
      error ||
      !bono
    ) {
      throw new Error(
        "No se pudo actualizar el bono."
      );
    }

    const nuevas =
      Number(
        bono.clases_restantes
      ) + diferencia;

    const restantes =
      Math.max(
        0,
        Math.min(
          Number(
            bono.numero_clases
          ),
          nuevas
        )
      );

    const {
      error:
        errorActualizar,
    } =
      await supabase
        .from("bonos")
        .update({
          clases_restantes:
            restantes,
          activo:
            restantes > 0,
        })
        .eq(
          "id",
          bonoId
        );

    if (
      errorActualizar
    ) {
      throw new Error(
        "No se pudo actualizar el bono."
      );
    }
  }

  async function sincronizarPagosRapidos(
    clase: Clase,
    estadoNuevo: string,
    facturableNueva: boolean,
    metodoCobro?: string
  ) {
    const generaCobro =
      estadoNuevo === "realizada" ||
      (estadoNuevo === "cancelada" && facturableNueva);

    if (!generaCobro || clase.tipo === "club") {
      await supabase
        .from("pagos")
        .delete()
        .eq("clase_id", clase.id);

      return;
    }

    const { data: pagosExistentes, error: errorPagos } =
      await supabase
        .from("pagos")
        .select("id,alumno_id,metodo")
        .eq("clase_id", clase.id);

    if (errorPagos) {
      throw new Error("No se pudieron sincronizar los pagos.");
    }

    for (const participante of clase.clase_alumnos) {
      if (participante.usa_bono) {
        await supabase
          .from("pagos")
          .delete()
          .eq("clase_id", clase.id)
          .eq("alumno_id", participante.alumno_id);

        continue;
      }

      const existente = (pagosExistentes || []).find(
        (pago) => pago.alumno_id === participante.alumno_id
      );

      const datosPago = {
        alumno_id: participante.alumno_id,
        clase_id: clase.id,
        importe: Number(participante.importe || 0),
        metodo: metodoCobro || existente?.metodo || "efectivo",
        estado: participante.pagado ? "pagado" : "pendiente",
        fecha_pago: clase.fecha,
        notas:
          estadoNuevo === "cancelada"
            ? "Clase cancelada facturable · actualizado desde Agenda"
            : "Actualizado desde Agenda",
      };

      if (existente) {
        const { error: errorActualizar } = await supabase
          .from("pagos")
          .update(datosPago)
          .eq("id", existente.id);

        if (errorActualizar) {
          throw new Error("No se pudo actualizar un pago.");
        }
      } else {
        const { error: errorInsertar } = await supabase
          .from("pagos")
          .insert(datosPago);

        if (errorInsertar) {
          throw new Error("No se pudo crear un pago.");
        }
      }
    }
  }

  async function cambiarEstadoClase(
    estado: "programada" | "realizada" | "cancelada",
    opciones?: {
      facturable?: boolean;
      cobrar?: boolean;
      metodoCobro?: string;
      observaciones?: string | null;
    }
  ) {
    if (!claseSeleccionada) {
      return;
    }

    const clase = claseSeleccionada;
    const facturableNueva =
      opciones?.facturable ?? (estado === "programada" ? true : clase.facturable);
    const cobrarAhora = opciones?.cobrar === true;

    setActualizando(true);
    setMensajeAccion("");

    try {
      const consumiaBonoAntes =
        clase.estado === "realizada" ||
        (clase.estado === "cancelada" && clase.facturable);

      const consumiraBonoAhora =
        estado === "realizada" ||
        (estado === "cancelada" && facturableNueva);

      if (consumiaBonoAntes !== consumiraBonoAhora) {
        for (const participante of clase.clase_alumnos) {
          if (participante.usa_bono && participante.bono_id) {
            await ajustarBono(
              participante.bono_id,
              consumiraBonoAhora ? -1 : 1
            );
          }
        }
      }

      let participantesActualizados = clase.clase_alumnos;

      if (cobrarAhora && clase.tipo !== "club") {
        const idsPagoNormal = clase.clase_alumnos
          .filter((participante) => !participante.usa_bono)
          .map((participante) => participante.id);

        if (idsPagoNormal.length > 0) {
          const { error: errorCobro } = await supabase
            .from("clase_alumnos")
            .update({ pagado: true })
            .in("id", idsPagoNormal);

          if (errorCobro) {
            throw new Error("No se pudo marcar la clase como cobrada.");
          }
        }

        participantesActualizados = clase.clase_alumnos.map((participante) =>
          participante.usa_bono
            ? participante
            : { ...participante, pagado: true }
        );
      }

      if (
        (estado === "programada" || !facturableNueva) &&
        clase.tipo !== "club"
      ) {
        const idsPagoNormal = clase.clase_alumnos
          .filter((participante) => !participante.usa_bono)
          .map((participante) => participante.id);

        if (idsPagoNormal.length > 0) {
          const { error: errorPendiente } = await supabase
            .from("clase_alumnos")
            .update({ pagado: false })
            .in("id", idsPagoNormal);

          if (errorPendiente) {
            throw new Error("No se pudo actualizar el estado económico.");
          }
        }

        participantesActualizados = participantesActualizados.map((participante) =>
          participante.usa_bono
            ? participante
            : { ...participante, pagado: false }
        );
      }

      let cobradaNueva = clase.cobrada;

      if (clase.tipo === "club") {
        if (cobrarAhora) {
          cobradaNueva = true;
        } else if (estado === "programada" || !facturableNueva) {
          cobradaNueva = false;
        }
      }

      const observacionesNuevas =
        opciones?.observaciones !== undefined
          ? opciones.observaciones
          : clase.observaciones;

      const { error: errorClase } = await supabase
        .from("clases")
        .update({
          estado,
          facturable: facturableNueva,
          cobrada: cobradaNueva,
          observaciones: observacionesNuevas,
        })
        .eq("id", clase.id);

      if (errorClase) {
        throw new Error("No se pudo actualizar la clase.");
      }

      const claseActualizada: Clase = {
        ...clase,
        estado,
        facturable: facturableNueva,
        cobrada: cobradaNueva,
        observaciones: observacionesNuevas,
        clase_alumnos: participantesActualizados,
      };

      await sincronizarPagosRapidos(
        claseActualizada,
        estado,
        facturableNueva,
        opciones?.metodoCobro
      );

      let falloGoogle = false;

      try {
        await sincronizarClaseConGoogleCalendar(
          datosGoogleClase(clase, {
            estado,
            observaciones: observacionesNuevas,
          })
        );
      } catch {
        falloGoogle = true;
      }

      setClaseSeleccionada(null);
      await onClaseActualizada();

      if (falloGoogle) {
        window.alert(
          "La clase se actualizó en Manager, pero no se pudo sincronizar el cambio con Google Calendar."
        );
      }
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (error instanceof Error
            ? error.message
            : "No se pudo actualizar la clase.")
      );
    } finally {
      setActualizando(false);
    }
  }

  async function cambiarCobroClub(cobrada: boolean) {
    if (!claseSeleccionada || claseSeleccionada.tipo !== "club") {
      return;
    }

    setActualizando(true);
    setMensajeAccion("");

    try {
      const { error } = await supabase
        .from("clases")
        .update({ cobrada })
        .eq("id", claseSeleccionada.id);

      if (error) {
        throw new Error("No se pudo actualizar el cobro de la clase.");
      }

      setClaseSeleccionada({ ...claseSeleccionada, cobrada });
      await onClaseActualizada();
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (error instanceof Error
            ? error.message
            : "No se pudo actualizar el cobro de la clase.")
      );
    } finally {
      setActualizando(false);
    }
  }

  async function cambiarCobro(
    participante:
      Clase["clase_alumnos"][number],
    pagado: boolean,
    metodoCobro?: string
  ) {
    if (
      !claseSeleccionada ||
      participante.usa_bono
    ) {
      return;
    }

    setActualizando(true);
    setMensajeAccion("");

    try {
      let claseTrabajo = claseSeleccionada;
      let cambioARealizada = false;

      if (
        pagado &&
        claseTrabajo.estado === "programada"
      ) {
        for (const item of claseTrabajo.clase_alumnos) {
          if (item.usa_bono && item.bono_id) {
            await ajustarBono(item.bono_id, -1);
          }
        }

        const { error: errorClase } = await supabase
          .from("clases")
          .update({
            estado: "realizada",
            facturable: true,
          })
          .eq("id", claseTrabajo.id);

        if (errorClase) {
          throw new Error(
            "No se pudo marcar la clase como realizada."
          );
        }

        claseTrabajo = {
          ...claseTrabajo,
          estado: "realizada",
          facturable: true,
        };
        cambioARealizada = true;
      }

      const { error: errorParticipante } = await supabase
        .from("clase_alumnos")
        .update({ pagado })
        .eq("id", participante.id);

      if (errorParticipante) {
        throw new Error("No se pudo actualizar el cobro.");
      }

      const participantesActualizados =
        claseTrabajo.clase_alumnos.map((item) =>
          item.id === participante.id
            ? { ...item, pagado }
            : item
        );

      claseTrabajo = {
        ...claseTrabajo,
        clase_alumnos: participantesActualizados,
      };

      await sincronizarPagosRapidos(
        claseTrabajo,
        claseTrabajo.estado,
        claseTrabajo.facturable
      );

      if (metodoCobro) {
        const { error: errorMetodo } = await supabase
          .from("pagos")
          .update({
            metodo: metodoCobro,
            estado: pagado ? "pagado" : "pendiente",
          })
          .eq("clase_id", claseTrabajo.id)
          .eq("alumno_id", participante.alumno_id);

        if (errorMetodo) {
          throw new Error(
            "El cobro se guardó, pero no se pudo guardar la forma de pago."
          );
        }
      }

      let falloGoogle = false;

      if (cambioARealizada) {
        try {
          await sincronizarClaseConGoogleCalendar(
            datosGoogleClase(claseTrabajo, {
              estado: "realizada",
            })
          );
        } catch {
          falloGoogle = true;
        }
      }

      setClaseSeleccionada(claseTrabajo);
      setParticipanteCobroId(null);
      await onClaseActualizada();

      if (falloGoogle) {
        window.alert(
          "La clase se actualizó en Manager, pero no se pudo sincronizar el cambio con Google Calendar."
        );
      }
    } catch (error) {
      setMensajeAccion(
        "❌ " +
          (error instanceof Error
            ? error.message
            : "No se pudo actualizar el cobro.")
      );
    } finally {
      setActualizando(false);
    }
  }

  async function cambiarAsistencia(
    participante:
      Clase["clase_alumnos"][number],
    asistio: boolean
  ) {
    if (
      !claseSeleccionada
    ) {
      return;
    }

    setActualizando(
      true
    );

    setMensajeAccion(
      ""
    );

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .update({
            asistio,
          })
          .eq(
            "id",
            participante.id
          );

      if (error) {
        throw new Error(
          "No se pudo actualizar la asistencia."
        );
      }

      setClaseSeleccionada({
        ...claseSeleccionada,

        clase_alumnos:
          claseSeleccionada
            .clase_alumnos
            .map(
              (item) =>
                item.id ===
                participante.id
                  ? {
                      ...item,
                      asistio,
                    }
                  : item
            ),
      });

      await onClaseActualizada();
    } catch (
      error
    ) {
      setMensajeAccion(
        "❌ " +
          (
            error instanceof Error
              ? error.message
              : "No se pudo actualizar la asistencia."
          )
      );
    } finally {
      setActualizando(
        false
      );
    }
  }

  function minutosDesdeMedianoche(
    horaTexto: string
  ) {
    const [
      hora,
      minuto,
    ] =
      horaTexto
        .slice(
          0,
          5
        )
        .split(":")
        .map(Number);

    return (
      hora * 60 +
      minuto
    );
  }

  function haySolapamiento(
    claseId: string,
    fechaNueva: string,
    horaNueva: string,
    duracion: number
  ) {
    const inicioNuevo =
      minutosDesdeMedianoche(
        horaNueva
      );

    const finNuevo =
      inicioNuevo +
      duracion;

    return clases.some(
      (otraClase) => {
        if (
          otraClase.id ===
            claseId ||
          otraClase.fecha !==
            fechaNueva ||
          otraClase.estado ===
            "cancelada"
        ) {
          return false;
        }

        const inicioOtra =
          minutosDesdeMedianoche(
            otraClase.hora_inicio
          );

        const finOtra =
          inicioOtra +
          otraClase.duracion_minutos;

        return (
          inicioNuevo <
            finOtra &&
          finNuevo >
            inicioOtra
        );
      }
    );
  }

  async function moverClase(
    claseId: string,
    fechaNueva: string,
    hora: number,
    minuto = 0
  ) {
    const clase =
      clases.find(
        (item) =>
          item.id ===
          claseId
      );

    if (!clase) {
      return;
    }

    if (
      noDisponible(
        fechaNueva,
        hora,
        minuto,
        clase.duracion_minutos
      )
    ) {
      setMensajeMovimiento(
        "❌ No puedes mover la clase a ese horario porque coincide con una no disponibilidad."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    const horaNueva =
      `${String(
        hora
      ).padStart(
        2,
        "0"
      )}:${String(
        minuto
      ).padStart(
        2,
        "0"
      )}`;

    const inicioMinutos =
      hora * 60 +
      minuto;

    const finMinutos =
      inicioMinutos +
      clase.duracion_minutos;

    if (
      finMinutos >
      horaFin * 60
    ) {
      setMensajeMovimiento(
        "❌ La clase terminaría fuera del horario visible."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    if (
      haySolapamiento(
        clase.id,
        fechaNueva,
        horaNueva,
        clase.duracion_minutos
      )
    ) {
      setMensajeMovimiento(
        "❌ Ese horario se solapa con otra clase."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    setActualizando(
      true
    );

    const {
      error,
    } =
      await supabase
        .from("clases")
        .update({
          fecha:
            fechaNueva,
          hora_inicio:
            horaNueva,
        })
        .eq(
          "id",
          clase.id
        );

    if (error) {
      setActualizando(
        false
      );

      setMensajeMovimiento(
        "❌ No se pudo mover la clase."
      );

      setTimeout(
        () =>
          setMensajeMovimiento(
            ""
          ),
        3500
      );

      return;
    }

    let falloGoogle = false;

    try {
      await sincronizarClaseConGoogleCalendar(
        datosGoogleClase(clase, {
          fecha: fechaNueva,
          hora_inicio: horaNueva,
        })
      );
    } catch {
      falloGoogle = true;
    }

    setActualizando(
      false
    );

    setMensajeMovimiento(
      `✅ Clase movida al ${fechaNueva
        .split("-")
        .reverse()
        .join("/")} a las ${horaNueva}${
        falloGoogle
          ? " · ⚠️ Sin sincronizar con Google Calendar"
          : ""
      }`
    );

    setTimeout(
      () =>
        setMensajeMovimiento(
          ""
        ),
      3500
    );

    await onClaseActualizada();
  }

  function soltarClaseEnDia(
    evento:
      React.DragEvent<HTMLDivElement>,
    fecha: string
  ) {
    evento.preventDefault();

    if (
      noDisponibleTodoElDia(
        fecha
      )
    ) {
      return;
    }

    const claseId =
      evento.dataTransfer.getData(
        "text/plain"
      ) ||
      claseArrastrandoId;

    if (!claseId) {
      return;
    }

    const rect =
      evento.currentTarget.getBoundingClientRect();

    const posicionSuperiorTarjeta =
      evento.clientY -
      rect.top -
      desplazamientoArrastreY;

    const altoMediaHora =
      altoHora / 2;

    let indiceMediaHora =
      Math.floor(
        posicionSuperiorTarjeta /
          altoMediaHora
      );

    const totalHuecos =
      (horaFin -
        horaInicio) *
      2;

    indiceMediaHora =
      Math.max(
        0,
        Math.min(
          totalHuecos - 1,
          indiceMediaHora
        )
      );

    const minutosTotales =
      horaInicio * 60 +
      indiceMediaHora *
        30;

    const horaNueva =
      Math.floor(
        minutosTotales / 60
      );

    const minutoNuevo =
      minutosTotales % 60;

    moverClase(
      claseId,
      fecha,
      horaNueva,
      minutoNuevo
    );

    setClaseArrastrandoId(
      null
    );
  }


  function crearClase(
    fecha: string,
    hora: number,
    minuto = 0
  ) {
    if (
      noDisponible(
        fecha,
        hora,
        minuto,
        30
      )
    ) {
      return;
    }

    setCreacionPendiente({
      fecha,
      hora,
      minuto,
    });
  }

  function continuarCreacionDesdeAgenda(
    modo: "individual" | "serie"
  ) {
    if (!creacionPendiente) {
      return;
    }

    const {
      fecha,
      hora,
      minuto,
    } = creacionPendiente;

    const horaTexto =
      `${String(
        hora
      ).padStart(
        2,
        "0"
      )}:${String(
        minuto
      ).padStart(
        2,
        "0"
      )}`;

    const volver =
      `/agenda?vista=horario&fecha=${fechaSeleccionada}`;

    const parametroModo =
      modo === "serie"
        ? "&modo=serie"
        : "";

    window.location.href =
      `/clases?fecha=${fecha}&hora=${encodeURIComponent(
        horaTexto
      )}${parametroModo}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:px-4 md:py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-[#17324D] md:text-base">
            <span className="md:hidden">
              Horario del día
            </span>
            <span className="hidden md:inline">
              Horario semanal
            </span>
          </h2>

          <p className="mt-1 text-sm text-slate-500 md:mt-0.5 md:text-xs">
            <span className="md:hidden">
              Clases organizadas por hora
            </span>
            <span className="hidden md:inline">
              Pulsa un hueco para crear · arrastra una clase programada para moverla
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-400 md:hidden">
            Toca un hueco para crear · toca una clase para abrir acciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00A79C]/10 px-2.5 py-1.5 text-[#0B6F69]">
            <span className="h-2 w-2 rounded-full bg-[#00A79C]" />
            Propia en club
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1.5 text-sky-900">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Pista de pago
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Club
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1.5 text-violet-900">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Privada
          </span>
        </div>

        {mensajeMovimiento && (
          <p className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {mensajeMovimiento}
          </p>
        )}
      </div>

      {/* MÓVIL: un solo día, sin desplazamiento horizontal ni drag & drop. */}
      <div className="md:hidden">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia) => {
              const iso =
                fechaLocalISO(dia);

              const activo =
                iso === fechaMovil;

              const bloqueado =
                Boolean(
                  noDisponible(iso)
                );

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setFechaMovil(
                      iso
                    );

                    onFechaSeleccionadaChange?.(
                      iso
                    );
                  }}
                  className={
                    activo
                      ? "flex min-w-0 flex-col items-center rounded-xl bg-[#00A79C] px-1 py-2 text-white shadow-sm"
                      : bloqueado
                      ? "flex min-w-0 flex-col items-center rounded-xl bg-red-50 px-1 py-2 text-red-700"
                      : "flex min-w-0 flex-col items-center rounded-xl px-1 py-2 text-slate-500 transition active:bg-slate-100"
                  }
                  aria-pressed={
                    activo
                  }
                >
                  <span className="text-[9px] font-extrabold uppercase tracking-wide">
                    {dia
                      .toLocaleDateString(
                        "es-ES",
                        {
                          weekday:
                            "short",
                        }
                      )
                      .replace(
                        ".",
                        ""
                      )}
                  </span>

                  <span className="mt-0.5 text-sm font-extrabold">
                    {dia.getDate()}
                  </span>

                  {iso === hoy && (
                    <span
                      className={
                        activo
                          ? "mt-0.5 h-1 w-1 rounded-full bg-white"
                          : "mt-0.5 h-1 w-1 rounded-full bg-[#00A79C]"
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold capitalize text-[#17324D]">
                {fechaMovilDate.toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }
                )}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {clasesDiaMovil.length}{" "}
                {clasesDiaMovil.length ===
                1
                  ? "clase"
                  : "clases"}{" "}
                · toca un hueco para crear
              </p>
            </div>

          </div>

          {noDisponible(
            fechaMovil
          ) && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {noDisponibleTodoElDia(
                fechaMovil
              )
                ? "Día no disponible"
                : `No disponible ${textoNoDisponibilidad(
                    noDisponible(
                      fechaMovil
                    )!
                  )}`}
              {noDisponible(
                fechaMovil
              )?.motivo
                ? ` · ${
                    noDisponible(
                      fechaMovil
                    )?.motivo
                  }`
                : ""}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[52px_minmax(0,1fr)]">
          <div
            className="relative border-r border-slate-200 bg-slate-50/80"
            style={{
              height: altoTotal,
            }}
          >
            {Array.from(
              {
                length:
                  horaFin -
                  horaInicio +
                  1,
              },
              (_, i) =>
                horaInicio + i
            ).map((hora) => (
              <div
                key={hora}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-semibold text-slate-400"
                style={{
                  top:
                    (hora -
                      horaInicio) *
                    altoHora,
                }}
              >
                {String(
                  hora
                ).padStart(
                  2,
                  "0"
                )}
                :00
              </div>
            ))}
          </div>

          <div
            className={
              noDisponibleTodoElDia(
                fechaMovil
              )
                ? "relative bg-red-50/35"
                : fechaMovil ===
                  hoy
                ? "relative bg-[#00A79C]/[0.018]"
                : "relative bg-white"
            }
            style={{
              height: altoTotal,
            }}
          >
            {Array.from(
              {
                length:
                  horaFin -
                  horaInicio,
              },
              (_, i) =>
                horaInicio + i
            ).map((hora) => (
              <div key={hora}>
                <button
                  type="button"
                  disabled={Boolean(
                    noDisponible(
                      fechaMovil,
                      hora,
                      0,
                      30
                    )
                  )}
                  onClick={() =>
                    crearClase(
                      fechaMovil,
                      hora
                    )
                  }
                  className="absolute left-0 right-0 border-t border-slate-200 transition active:bg-[#00A79C]/[0.08] disabled:cursor-not-allowed"
                  style={{
                    top:
                      (hora -
                        horaInicio) *
                      altoHora,
                    height:
                      altoHora / 2,
                  }}
                  aria-label={`Crear clase a las ${String(
                    hora
                  ).padStart(
                    2,
                    "0"
                  )}:00`}
                />

                <button
                  type="button"
                  disabled={Boolean(
                    noDisponible(
                      fechaMovil,
                      hora,
                      30,
                      30
                    )
                  )}
                  onClick={() =>
                    crearClase(
                      fechaMovil,
                      hora,
                      30
                    )
                  }
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100 transition active:bg-[#00A79C]/[0.08] disabled:cursor-not-allowed"
                  style={{
                    top:
                      (hora -
                        horaInicio) *
                        altoHora +
                      altoHora / 2,
                    height:
                      altoHora / 2,
                  }}
                  aria-label={`Crear clase a las ${String(
                    hora
                  ).padStart(
                    2,
                    "0"
                  )}:30`}
                />
              </div>
            ))}

            {bloqueosParciales(
              fechaMovil
            ).map(
              (bloqueo) => {
                const posicion =
                  posicionBloqueoHorario(
                    bloqueo
                  );

                if (!posicion) {
                  return null;
                }

                return (
                  <div
                    key={
                      bloqueo.id
                    }
                    className="pointer-events-none absolute left-0 right-0 z-[1] overflow-hidden border-y border-red-200 bg-red-100/75 px-2 py-1 text-[10px] font-bold text-red-700"
                    style={{
                      top:
                        posicion.top,
                      height:
                        posicion.height,
                    }}
                  >
                    No disponible ·{" "}
                    {textoNoDisponibilidad(
                      bloqueo
                    )}
                    {bloqueo.motivo
                      ? ` · ${bloqueo.motivo}`
                      : ""}
                  </div>
                );
              }
            )}

            {clasesDiaMovil.map(
              (clase) => {
                const [h, m] =
                  clase.hora_inicio
                    .split(":")
                    .map(Number);

                const top =
                  (h -
                    horaInicio +
                    m / 60) *
                  altoHora;

                const height =
                  Math.max(
                    34,
                    (clase.duracion_minutos /
                      60) *
                      altoHora
                  );

                const horaFinVisual =
                  calcularHoraFin(
                    clase.hora_inicio,
                    clase.duracion_minutos
                  );

                const alumnosDatos =
                  clase.clase_alumnos
                    .map(
                      (item) =>
                        item.alumnos
                    )
                    .filter(Boolean);

                const alumnos =
                  nombresAlumnosAgenda(
                    alumnosDatos
                  )
                    .filter(Boolean)
                    .join(" · ");

                const posicion =
                  disposicionClasesDiaMovil.get(
                    clase.id
                  ) || {
                    columna: 0,
                    totalColumnas: 1,
                  };

                const canceladaSolapada =
                  esCanceladaSolapadaAgenda(
                    clase,
                    clasesDiaMovil
                  );

                return (
                  <button
                    key={
                      clase.id
                    }
                    type="button"
                    onClick={() => {
                      setMensajeAccion(
                        ""
                      );

                      setClaseSeleccionada(
                        clase
                      );
                    }}
                    className={`absolute overflow-hidden rounded-xl border text-left text-[10px] leading-tight active:scale-[0.995] ${
                      canceladaSolapada
                        ? "z-30 border-red-500 bg-red-50 px-2 py-0 text-red-800 shadow-[0_3px_10px_rgba(239,68,68,0.16)]"
                        : `z-10 border-l-[4px] px-2.5 py-2 shadow-[0_3px_10px_rgba(15,23,42,0.08)] ${colorClase(
                            clase
                          )}`
                    }`}
                    style={{
                      top: canceladaSolapada
                        ? top + Math.max(0, height - 24)
                        : top,
                      height: canceladaSolapada
                        ? Math.min(24, height)
                        : height,
                      left: canceladaSolapada
                        ? "6px"
                        : `calc(${
                            posicion.columna *
                            (100 / posicion.totalColumnas)
                          }% + ${
                            posicion.totalColumnas > 1 ? 3 : 6
                          }px)`,
                      width: canceladaSolapada
                        ? "calc(100% - 12px)"
                        : `calc(${
                            100 / posicion.totalColumnas
                          }% - ${
                            posicion.totalColumnas > 1 ? 6 : 12
                          }px)`,
                    }}
                    title={
                      canceladaSolapada
                        ? `CANCELADA · ${alumnos || "Sin alumnos"} · ${clase.hora_inicio.slice(0, 5)}–${horaFinVisual}`
                        : "Abrir acciones rápidas"
                    }
                  >
                    {canceladaSolapada ? (
                      <div className="flex h-full min-w-0 items-center gap-1 overflow-hidden text-[9px] font-extrabold leading-none">
                        <span className="shrink-0 uppercase">
                          Cancelada
                        </span>
                        <span className="shrink-0 opacity-50">·</span>
                        <span className="min-w-0 truncate">
                          {alumnos || "Sin alumnos"}
                        </span>
                        <span className="shrink-0 opacity-50">·</span>
                        <span className="shrink-0">
                          {clase.hora_inicio.slice(0, 5)}–{horaFinVisual}
                        </span>
                      </div>
                    ) : (
                      <>
                        {clase.estado === "cancelada" && (
                          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-500" />
                        )}

                        <IndicadoresClase
                          clase={clase}
                        />

                        <div className="pr-14 font-extrabold tracking-tight">
                          {clase.hora_inicio.slice(
                            0,
                            5
                          )}{" "}
                          –{" "}
                          {
                            horaFinVisual
                          }
                          <span className="font-medium opacity-60">
                            {" "}
                            ·{" "}
                            {
                              clase.duracion_minutos
                            }{" "}
                            min
                          </span>
                        </div>

                        <div
                          className="mt-1 line-clamp-2 pr-1 text-xs font-extrabold leading-[1.15]"
                          title={
                            alumnos ||
                            "Sin alumnos"
                          }
                        >
                          {alumnos ||
                            "Sin alumnos"}
                        </div>

                        {clase.duracion_minutos >=
                          60 &&
                          clase
                            .ubicaciones
                            ?.nombre && (
                            <div
                              className="mt-1 truncate text-[10px] font-semibold opacity-65"
                              title={
                                clase
                                  .ubicaciones
                                  .nombre
                              }
                            >
                              {
                                clase
                                  .ubicaciones
                                  .nombre
                              }
                            </div>
                          )}
                      </>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* ESCRITORIO/TABLET: conserva el horario semanal completo. */}
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[70px_repeat(7,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50">
            <div />
            {dias.map(d=>{
              const iso=fechaLocalISO(d);
              const nd=noDisponible(iso);
              return (
                <div
                  key={iso}
                  className={
                    iso === hoy
                      ? "border-l border-slate-200 bg-[#E8F7F5] px-2 py-2.5 text-center"
                      : "border-l border-slate-200 px-2 py-2.5 text-center"
                  }
                >
                  <div
                    className={
                      iso === hoy
                        ? "text-[10px] font-bold uppercase tracking-wide text-[#008C83]"
                        : "text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    }
                  >
                    {d.toLocaleDateString("es-ES",{weekday:"short"})}
                  </div>

                  <div
                    className={
                      iso === hoy
                        ? "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#00A79C] text-sm font-bold text-white"
                        : "mx-auto mt-1 flex h-8 w-8 items-center justify-center text-sm font-bold text-[#17324D]"
                    }
                  >
                    {d.getDate()}
                  </div>

                  {nd && (
                    <div className="mt-1 rounded-md bg-red-100 px-1 py-1 text-[9px] font-bold text-red-700">
                      NO DISPONIBLE
                      {nd.hora_inicio && nd.hora_fin
                        ? ` ${textoNoDisponibilidad(nd)}`
                        : ""}
                      {nd.motivo ? ` · ${nd.motivo}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[70px_repeat(7,minmax(140px,1fr))]">
            <div className="relative border-r border-slate-200 bg-slate-50" style={{height:altoTotal}}>
              {Array.from({length:horaFin-horaInicio+1},(_,i)=>horaInicio+i).map(h=>(
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-slate-500"
                  style={{top:(h-horaInicio)*altoHora}}
                >
                  {String(h).padStart(2,"0")}:00
                </div>
              ))}
            </div>

            {dias.map(d=>{
              const fecha=fechaLocalISO(d);
              const nd=noDisponible(fecha);
              const ndTodoDia=noDisponibleTodoElDia(fecha);
              const clasesDia=clases.filter(c=>c.fecha===fecha);
              const disposicionClasesDia=
                calcularDisposicionClasesAgenda(clasesDia);
              return (
                <div
                  key={fecha}
                  onDragOver={(evento) => {
                    if (!ndTodoDia) {
                      evento.preventDefault();
                      evento.dataTransfer.dropEffect =
                        "move";
                    }
                  }}
                  onDrop={(evento) =>
                    soltarClaseEnDia(
                      evento,
                      fecha
                    )
                  }
                  className={
                    ndTodoDia
                      ? "relative border-r border-slate-200 bg-red-50/40"
                      : fecha === hoy
                      ? "relative border-r border-slate-200 bg-[#00A79C]/[0.025]"
                      : "relative border-r border-slate-200 bg-white"
                  }
                  style={{height:altoTotal}}
                >
                  {Array.from({length:horaFin-horaInicio},(_,i)=>horaInicio+i).map(h=>(
                    <div key={h}>
                      <button
                        type="button"
                        disabled={Boolean(noDisponible(fecha,h,0,30))}
                        onClick={()=>crearClase(fecha,h)}
                        className="absolute left-0 right-0 border-t border-slate-200 transition hover:bg-[#00A79C]/[0.06] disabled:cursor-not-allowed"
                        style={{top:(h-horaInicio)*altoHora,height:altoHora/2}}
                        title={noDisponible(fecha,h,0,30) ? "Horario no disponible" : `Crear o mover clase a las ${String(h).padStart(2,"0")}:00`}
                      />
                      <button
                        type="button"
                        disabled={Boolean(noDisponible(fecha,h,30,30))}
                        onClick={()=>crearClase(fecha,h,30)}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-100 transition hover:bg-[#00A79C]/[0.06] disabled:cursor-not-allowed"
                        style={{top:(h-horaInicio)*altoHora+altoHora/2,height:altoHora/2}}
                        title={noDisponible(fecha,h,30,30) ? "Horario no disponible" : `Crear o mover clase a las ${String(h).padStart(2,"0")}:30`}
                      />
                    </div>
                  ))}

                  {bloqueosParciales(
                    fecha
                  ).map((bloqueo) => {
                    const posicion =
                      posicionBloqueoHorario(
                        bloqueo
                      );

                    if (!posicion) {
                      return null;
                    }

                    return (
                      <div
                        key={bloqueo.id}
                        className="pointer-events-none absolute left-0 right-0 z-[1] overflow-hidden border-y border-red-200 bg-red-100/75 px-1.5 py-1 text-[9px] font-bold leading-tight text-red-700"
                        style={{
                          top: posicion.top,
                          height: posicion.height,
                        }}
                      >
                        No disponible · {textoNoDisponibilidad(bloqueo)}
                        {bloqueo.motivo ? ` · ${bloqueo.motivo}` : ""}
                      </div>
                    );
                  })}

                  {clasesDia.map(clase=>{
                    const [h,m]=clase.hora_inicio.split(":").map(Number);
                    const top=((h-horaInicio)+(m/60))*altoHora;
                    const height=Math.max(30,(clase.duracion_minutos/60)*altoHora);
                    const horaFinVisual=calcularHoraFin(
                      clase.hora_inicio,
                      clase.duracion_minutos
                    );
                    const alumnosDatos=clase.clase_alumnos
                      .map(x=>x.alumnos)
                      .filter(Boolean);

                    const alumnos=
                      nombresAlumnosAgenda(
                        alumnosDatos
                      )
                        .filter(Boolean)
                        .join(" · ");
                    const posicion=
                      disposicionClasesDia.get(clase.id) || {
                        columna: 0,
                        totalColumnas: 1,
                      };
                    const canceladaSolapada=
                      esCanceladaSolapadaAgenda(
                        clase,
                        clasesDia
                      );
                    return (
                      <button
                        key={clase.id}
                        type="button"
                        draggable={
                          clase.estado ===
                          "programada"
                        }
                        onDragStart={(evento) => {
                          if (
                            clase.estado !==
                            "programada"
                          ) {
                            evento.preventDefault();
                            return;
                          }

                          const rect =
                            evento.currentTarget.getBoundingClientRect();

                          setDesplazamientoArrastreY(
                            evento.clientY -
                              rect.top
                          );

                          setClaseArrastrandoId(
                            clase.id
                          );

                          evento.dataTransfer.setData(
                            "text/plain",
                            clase.id
                          );

                          evento.dataTransfer.effectAllowed =
                            "move";
                        }}
                        onDragEnd={() =>
                          setClaseArrastrandoId(
                            null
                          )
                        }
                        onClick={() => {
                          if (
                            claseArrastrandoId
                          ) {
                            return;
                          }

                          setMensajeAccion("");
                          setClaseSeleccionada(
                            clase
                          );
                        }}
                        className={`absolute overflow-hidden rounded-xl border text-left text-[10px] leading-tight transition ${
                          canceladaSolapada
                            ? "z-30 cursor-pointer border-red-500 bg-red-50 px-2 py-0 text-red-800 shadow-[0_2px_7px_rgba(239,68,68,0.16)] hover:z-40 hover:shadow-md"
                            : `z-10 border-l-[3px] px-2 py-1.5 shadow-[0_2px_6px_rgba(15,23,42,0.06)] hover:z-20 hover:-translate-y-[1px] hover:shadow-md ${
                                clase.estado === "programada"
                                  ? "cursor-grab active:cursor-grabbing"
                                  : "cursor-pointer"
                              } ${colorClase(clase)}`
                        }`}
                        style={{
                          top: canceladaSolapada
                            ? top + Math.max(0, height - 22)
                            : top,
                          height: canceladaSolapada
                            ? Math.min(22, height)
                            : height,
                          left: canceladaSolapada
                            ? "4px"
                            : `calc(${
                                posicion.columna *
                                (100 / posicion.totalColumnas)
                              }% + ${
                                posicion.totalColumnas > 1 ? 2 : 4
                              }px)`,
                          width: canceladaSolapada
                            ? "calc(100% - 8px)"
                            : `calc(${
                                100 / posicion.totalColumnas
                              }% - ${
                                posicion.totalColumnas > 1 ? 4 : 8
                              }px)`,
                          opacity:
                            claseArrastrandoId ===
                            clase.id
                              ? 0.55
                              : 1,
                        }}
                        title={
                          canceladaSolapada
                            ? `CANCELADA · ${alumnos || "Sin alumnos"} · ${clase.hora_inicio.slice(0, 5)}–${horaFinVisual}`
                            : clase.estado === "programada"
                            ? "Pulsa para acciones rápidas o arrastra para mover"
                            : "Abrir acciones rápidas"
                        }
                      >
                        {canceladaSolapada ? (
                          <div className="flex h-full min-w-0 items-center gap-1 overflow-hidden text-[8px] font-extrabold leading-none">
                            <span className="shrink-0 uppercase">
                              Cancelada
                            </span>
                            <span className="shrink-0 opacity-50">·</span>
                            <span className="min-w-0 truncate">
                              {alumnos || "Sin alumnos"}
                            </span>
                            <span className="shrink-0 opacity-50">·</span>
                            <span className="shrink-0">
                              {clase.hora_inicio.slice(0,5)}–{horaFinVisual}
                            </span>
                          </div>
                        ) : (
                          <>
                            {clase.estado === "cancelada" && (
                              <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-500" />
                            )}

                            <IndicadoresClase clase={clase} />

                            <div className="pr-14 font-bold tracking-tight">
                              {clase.hora_inicio.slice(0,5)} – {horaFinVisual}
                              <span className="font-medium opacity-65">
                                {" "}· {clase.duracion_minutos} min
                              </span>
                            </div>

                            <div
                              className="mt-1 line-clamp-2 text-[11px] font-bold leading-[1.2]"
                              title={alumnos || "Sin alumnos"}
                            >
                              {alumnos || "Sin alumnos"}
                            </div>

                            {clase.ubicaciones?.nombre && (
                              <div
                                className="mt-1 truncate text-[9px] font-medium opacity-70"
                                title={clase.ubicaciones.nombre}
                              >
                                {clase.ubicaciones.nombre}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {claseSeleccionada && (
        <AccionesRapidasClase
          clase={claseSeleccionada}
          volverA={`/agenda?vista=horario&fecha=${fechaSeleccionada}`}
          onCerrar={() =>
            setClaseSeleccionada(null)
          }
          onClaseActualizada={
            onClaseActualizada
          }
        />
      )}

      {creacionPendiente && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#17324D]">
              Crear en este horario
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Elige si quieres programar una sola clase o iniciar una serie recurrente desde este día y hora.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Horario seleccionado
              </p>
              <p className="mt-1 text-sm font-bold text-[#17324D]">
                {creacionPendiente.fecha
                  .split("-")
                  .reverse()
                  .join("/")} · {String(creacionPendiente.hora).padStart(2, "0")}:{String(creacionPendiente.minuto).padStart(2, "0")}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  continuarCreacionDesdeAgenda(
                    "individual"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-left font-semibold text-[#17324D] transition hover:bg-slate-50"
              >
                Clase individual
              </button>

              <button
                type="button"
                onClick={() =>
                  continuarCreacionDesdeAgenda(
                    "serie"
                  )
                }
                className="rounded-xl bg-[#00A79C] px-5 py-3 text-left font-semibold text-white transition hover:bg-[#008F86]"
              >
                Serie recurrente
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setCreacionPendiente(null)
              }
              className="mt-4 w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
