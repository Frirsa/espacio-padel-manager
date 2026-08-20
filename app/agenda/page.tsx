"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { supabase } from "../../lib/supabase";

import FiltrosAgenda from "../../components/agenda/FiltrosAgenda";
import ListadoAgenda from "../../components/agenda/ListadoAgenda";
import VistaSemanalAgenda from "../../components/agenda/VistaSemanalAgenda";
import VistaHorarioAgenda from "../../components/agenda/VistaHorarioAgenda";
import VistaMensualAgenda from "../../components/agenda/VistaMensualAgenda";

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const DIAS_SEMANA = [
  "L",
  "M",
  "X",
  "J",
  "V",
  "S",
  "D",
];

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
};

type Clase = {
  id: string;
  google_calendar_event_id: string | null;
  google_calendar_synced_at: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  grupo_id: string | null;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  observaciones: string | null;

  ubicaciones: {
    nombre: string;
  } | null;

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

function fechaLocalISO(
  fecha: Date
) {
  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}-${dia}`;
}

function sumarDias(
  fecha: string,
  cantidad: number
) {
  const [
    anio,
    mes,
    dia,
  ] =
    fecha
      .split("-")
      .map(Number);

  const nuevaFecha =
    new Date(
      anio,
      mes - 1,
      dia
    );

  nuevaFecha.setDate(
    nuevaFecha.getDate() +
      cantidad
  );

  return fechaLocalISO(
    nuevaFecha
  );
}

function sumarMeses(
  fecha: string,
  cantidad: number
) {
  const [
    anio,
    mes,
    dia,
  ] =
    fecha
      .split("-")
      .map(Number);

  const nuevaFecha =
    new Date(
      anio,
      mes - 1,
      1
    );

  nuevaFecha.setMonth(
    nuevaFecha.getMonth() +
      cantidad
  );

  const ultimoDiaMes =
    new Date(
      nuevaFecha.getFullYear(),
      nuevaFecha.getMonth() + 1,
      0
    ).getDate();

  nuevaFecha.setDate(
    Math.min(
      dia,
      ultimoDiaMes
    )
  );

  return fechaLocalISO(
    nuevaFecha
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoIzquierda() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconoDerecha() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function AgendaPage() {
  const searchParams = useSearchParams();
  const filtroDashboard = searchParams.get("filtro");
  const [clases, setClases] =
    useState<Clase[]>([]);

  const [
    noDisponibilidades,
    setNoDisponibilidades,
  ] = useState<NoDisponibilidad[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState("todas");

  const [
    filtroMes,
    setFiltroMes,
  ] =
    useState("");

  const [
    vistaAgenda,
    setVistaAgenda,
  ] =
    useState<
      "lista" | "semana" | "horario" | "mes"
    >("horario");

  const hoy =
    fechaLocalISO(
      new Date()
    );

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] =
    useState(hoy);

  const [
    selectorFechaAbierto,
    setSelectorFechaAbierto,
  ] =
    useState(false);

  const [
    filtrosAbiertos,
    setFiltrosAbiertos,
  ] =
    useState(false);

  const [
    mesSelectorFecha,
    setMesSelectorFecha,
  ] =
    useState(
      hoy.slice(0, 7)
    );

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const vista =
      parametros.get("vista");

    const fecha =
      parametros.get("fecha");

    if (filtroDashboard === "sin-cerrar") {
      setVistaAgenda("lista");
    } else if (
      vista === "lista" ||
      vista === "semana" ||
      vista === "horario" ||
      vista === "mes"
    ) {
      setVistaAgenda(
        vista
      );
    }

    if (fecha) {
      setFechaSeleccionada(
        fecha
      );
    }

    cargarClases();
  }, []);

  async function cargarClases() {
    setCargando(true);

    const {
      data,
      error,
    } = await supabase
      .from("clases")
      .select(`
        id,
        google_calendar_event_id,
        google_calendar_synced_at,
        fecha,
        hora_inicio,
        duracion_minutos,
        grupo_id,
        tipo,
        estado,
        facturable,
        cobrada,
        observaciones,
        ubicaciones (
          nombre
        ),
        clase_alumnos (
          id,
          alumno_id,
          importe,
          pagado,
          usa_bono,
          bono_id,
          asistio,
          alumnos (
            id,
            nombre,
            apellidos,
            apodo
          )
        )
      `)
      .order(
        "fecha",
        {
          ascending: true,
        }
      )
      .order(
        "hora_inicio",
        {
          ascending: true,
        }
      );

    if (!error) {
      setClases(
        (data ||
          []) as unknown as Clase[]
      );
    }

    const {
      data: noDisponibilidadData,
    } = await supabase
      .from("no_disponibilidades")
      .select("id,fecha_inicio,fecha_fin,motivo")
      .order("fecha_inicio", { ascending: true });

    setNoDisponibilidades(
      (noDisponibilidadData || []) as NoDisponibilidad[]
    );

    setCargando(false);
  }

  const clasesFiltradas =
    useMemo(() => {
      return clases.filter(
        (clase) => {
          const nombresAlumnos =
            clase.clase_alumnos
              .map(
                (item) =>
                  item.alumnos
              )
              .filter(Boolean)
              .map(
                (alumno) =>
                  `${
                    alumno?.nombre ||
                    ""
                  } ${
                    alumno?.apellidos ||
                    ""
                  } ${
                    alumno?.apodo ||
                    ""
                  }`.trim()
              )
              .join(" ")
              .toLowerCase();

          const ubicacion =
            (
              clase
                .ubicaciones
                ?.nombre ||
              ""
            ).toLowerCase();

          const textoBusqueda =
            busqueda
              .trim()
              .toLowerCase();

          const coincideBusqueda =
            nombresAlumnos.includes(
              textoBusqueda
            ) ||
            ubicacion.includes(
              textoBusqueda
            );

          const coincideEstado =
            filtroEstado ===
              "todas" ||
            clase.estado ===
              filtroEstado;

          const coincideMes =
            !filtroMes ||
            clase.fecha.startsWith(
              filtroMes
            );

          const ahoraFiltro = new Date();
          const fechaHoyFiltro = fechaLocalISO(ahoraFiltro);
          const horaHoyFiltro =
            `${String(ahoraFiltro.getHours()).padStart(2, "0")}:${String(
              ahoraFiltro.getMinutes()
            ).padStart(2, "0")}`;

          const coincideSinCerrar =
            filtroDashboard === "sin-cerrar"
              ? clase.estado === "programada" &&
                (clase.fecha < fechaHoyFiltro ||
                  (clase.fecha === fechaHoyFiltro &&
                    clase.hora_inicio.slice(0, 5) < horaHoyFiltro))
              : true;

          const coincideFechaLista =
            filtroDashboard === "sin-cerrar"
              ? true
              : vistaAgenda === "lista"
              ? clase.fecha >= fechaSeleccionada
              : true;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideMes &&
            coincideFechaLista &&
            coincideSinCerrar
          );
        }
      );
    }, [
      clases,
      busqueda,
      filtroEstado,
      filtroMes,
      fechaSeleccionada,
      vistaAgenda,
      filtroDashboard,
    ]);

  const clasesAgrupadas =
    useMemo(() => {
      const grupos:
        Record<
          string,
          Clase[]
        > = {};

      clasesFiltradas.forEach(
        (clase) => {
          if (
            !grupos[
              clase.fecha
            ]
          ) {
            grupos[
              clase.fecha
            ] = [];
          }

          grupos[
            clase.fecha
          ].push(clase);
        }
      );

      return Object.entries(
        grupos
      ).sort(
        (
          [fechaA],
          [fechaB]
        ) =>
          fechaA.localeCompare(
            fechaB
          )
      );
    }, [clasesFiltradas]);

  const clasesHoy =
    clases.filter(
      (clase) =>
        clase.fecha === hoy
    ).length;

  const proximasClases =
    clases.filter(
      (clase) =>
        clase.fecha >= hoy &&
        clase.estado !==
          "cancelada"
    ).length;

  function formatearCabeceraFecha(
    fecha: string
  ) {
    const [
      anio,
      mes,
      dia,
    ] =
      fecha
        .split("-")
        .map(Number);

    const fechaLocal =
      new Date(
        anio,
        mes - 1,
        dia
      );

    return fechaLocal
      .toLocaleDateString(
        "es-ES",
        {
          weekday:
            "long",
          day: "numeric",
          month: "long",
        }
      )
      .toUpperCase();
  }

  function formatearFechaSeleccionada() {
    const [
      anio,
      mes,
      dia,
    ] =
      fechaSeleccionada
        .split("-")
        .map(Number);

    const fecha =
      new Date(
        anio,
        mes - 1,
        dia
      );

    if (
      vistaAgenda ===
      "mes"
    ) {
      return fecha.toLocaleDateString(
        "es-ES",
        {
          month: "long",
          year: "numeric",
        }
      );
    }

    return fecha.toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatearPeriodoAgenda() {
    const [
      anio,
      mes,
      dia,
    ] =
      fechaSeleccionada
        .split("-")
        .map(Number);

    const fecha =
      new Date(
        anio,
        mes - 1,
        dia
      );

    if (
      vistaAgenda ===
      "mes"
    ) {
      const texto =
        fecha.toLocaleDateString(
          "es-ES",
          {
            month: "long",
            year: "numeric",
          }
        );

      return (
        texto.charAt(0).toUpperCase() +
        texto.slice(1)
      );
    }

    if (
      vistaAgenda === "semana" ||
      vistaAgenda === "horario"
    ) {
      const diaSemana =
        fecha.getDay();

      const lunes =
        new Date(
          fecha
        );

      lunes.setDate(
        fecha.getDate() -
          (diaSemana === 0
            ? 6
            : diaSemana - 1)
      );

      const domingo =
        new Date(
          lunes
        );

      domingo.setDate(
        lunes.getDate() + 6
      );

      const mismoMes =
        lunes.getMonth() ===
        domingo.getMonth();

      const mismoAnio =
        lunes.getFullYear() ===
        domingo.getFullYear();

      if (
        mismoMes &&
        mismoAnio
      ) {
        return `${lunes.getDate()}–${domingo.getDate()} ${domingo.toLocaleDateString(
          "es-ES",
          {
            month: "long",
            year: "numeric",
          }
        )}`;
      }

      return `${lunes.toLocaleDateString(
        "es-ES",
        {
          day: "numeric",
          month: "short",
        }
      )} – ${domingo.toLocaleDateString(
        "es-ES",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )}`;
    }

    return fecha.toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatearPeriodoAgendaMovil() {
    const [
      anio,
      mes,
      dia,
    ] =
      fechaSeleccionada
        .split("-")
        .map(Number);

    const fecha =
      new Date(
        anio,
        mes - 1,
        dia
      );

    if (
      vistaAgenda ===
      "mes"
    ) {
      const mesCorto =
        fecha
          .toLocaleDateString(
            "es-ES",
            {
              month: "short",
            }
          )
          .replace(".", "");

      return `${mesCorto} ${anio}`;
    }

    if (
      vistaAgenda === "semana" ||
      vistaAgenda === "horario"
    ) {
      const diaSemana =
        fecha.getDay();

      const lunes =
        new Date(fecha);

      lunes.setDate(
        fecha.getDate() -
          (diaSemana === 0
            ? 6
            : diaSemana - 1)
      );

      const domingo =
        new Date(lunes);

      domingo.setDate(
        lunes.getDate() + 6
      );

      const mesLunes =
        lunes
          .toLocaleDateString(
            "es-ES",
            {
              month: "short",
            }
          )
          .replace(".", "");

      const mesDomingo =
        domingo
          .toLocaleDateString(
            "es-ES",
            {
              month: "short",
            }
          )
          .replace(".", "");

      if (
        lunes.getMonth() ===
          domingo.getMonth() &&
        lunes.getFullYear() ===
          domingo.getFullYear()
      ) {
        return `${lunes.getDate()}–${domingo.getDate()} ${mesDomingo} ${domingo.getFullYear()}`;
      }

      return `${lunes.getDate()} ${mesLunes}–${domingo.getDate()} ${mesDomingo} ${domingo.getFullYear()}`;
    }

    const diaSemanaCorto =
      fecha
        .toLocaleDateString(
          "es-ES",
          {
            weekday: "short",
          }
        )
        .replace(".", "");

    const mesCorto =
      fecha
        .toLocaleDateString(
          "es-ES",
          {
            month: "short",
          }
        )
        .replace(".", "");

    return `${diaSemanaCorto}, ${dia} ${mesCorto} ${anio}`;
  }

  function calcularHorario(
    clase: {
      hora_inicio: string;
      duracion_minutos: number;
    }
  ) {
    const [
      hora,
      minuto,
    ] =
      clase.hora_inicio
        .split(":")
        .map(Number);

    const inicio =
      new Date();

    inicio.setHours(
      hora,
      minuto,
      0,
      0
    );

    const fin =
      new Date(
        inicio.getTime() +
          clase
            .duracion_minutos *
            60 *
            1000
      );

    const horaInicio =
      `${String(
        inicio.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        inicio.getMinutes()
      ).padStart(
        2,
        "0"
      )}`;

    const horaFin =
      `${String(
        fin.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        fin.getMinutes()
      ).padStart(
        2,
        "0"
      )}`;

    return {
      horaInicio,
      horaFin,
    };
  }

  function textoTipo(
    tipo: string
  ) {
    if (
      tipo === "club"
    ) {
      return "Clase para club";
    }

    if (
      tipo === "propia"
    ) {
      return "Clase propia";
    }

    if (
      tipo === "privada"
    ) {
      return "Pista privada";
    }

    return tipo;
  }

  function abrirSelectorFecha() {
    setMesSelectorFecha(
      fechaSeleccionada.slice(
        0,
        7
      )
    );
    setSelectorFechaAbierto(
      true
    );
  }

  function cambiarMesSelectorFecha(
    cantidad: number
  ) {
    const [
      anio,
      mes,
    ] =
      mesSelectorFecha
        .split("-")
        .map(Number);

    const nuevaFecha =
      new Date(
        anio,
        mes - 1 + cantidad,
        1
      );

    setMesSelectorFecha(
      `${nuevaFecha.getFullYear()}-${String(
        nuevaFecha.getMonth() + 1
      ).padStart(2, "0")}`
    );
  }

  function seleccionarFechaAgenda(
    fecha: string
  ) {
    setFechaSeleccionada(
      fecha
    );
    setSelectorFechaAbierto(
      false
    );
  }

  const [
    anioSelectorFecha,
    numeroMesSelectorFecha,
  ] =
    mesSelectorFecha
      .split("-")
      .map(Number);

  const primerDiaSelector =
    new Date(
      anioSelectorFecha,
      numeroMesSelectorFecha - 1,
      1
    );

  const desplazamientoSelector =
    primerDiaSelector.getDay() ===
    0
      ? 6
      : primerDiaSelector.getDay() -
        1;

  const inicioSelector =
    new Date(
      primerDiaSelector
    );

  inicioSelector.setDate(
    primerDiaSelector.getDate() -
      desplazamientoSelector
  );

  const diasSelectorFecha =
    Array.from(
      {
        length: 42,
      },
      (_, indice) => {
        const dia =
          new Date(
            inicioSelector
          );

        dia.setDate(
          inicioSelector.getDate() +
            indice
        );

        return dia;
      }
    );

  function irAnterior() {
    setSelectorFechaAbierto(
      false
    );

    if (
      vistaAgenda ===
      "mes"
    ) {
      setFechaSeleccionada(
        sumarMeses(
          fechaSeleccionada,
          -1
        )
      );

      return;
    }

    setFechaSeleccionada(
      sumarDias(
        fechaSeleccionada,
        vistaAgenda === "semana" ||
        vistaAgenda === "horario"
          ? -7
          : -1
      )
    );
  }

  function irSiguiente() {
    setSelectorFechaAbierto(
      false
    );

    if (
      vistaAgenda ===
      "mes"
    ) {
      setFechaSeleccionada(
        sumarMeses(
          fechaSeleccionada,
          1
        )
      );

      return;
    }

    setFechaSeleccionada(
      sumarDias(
        fechaSeleccionada,
        vistaAgenda === "semana" ||
        vistaAgenda === "horario"
          ? 7
          : 1
      )
    );
  }

  function irHoy() {
    setFechaSeleccionada(
      hoy
    );
    setSelectorFechaAbierto(
      false
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">

      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA + CONTROLES PRINCIPALES */}
        <section className="overflow-visible rounded-2xl bg-[#0F2742] p-5 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
              Gestión
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Agenda
            </h1>

            <p className="mt-2 text-sm text-white/55">
              Organiza y gestiona tus clases desde una vista clara y rápida.
            </p>
          </div>

          {/* BARRA PRINCIPAL DE AGENDA */}
          <section className="mt-5 border-t border-white/10 pt-4">

          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">

            <div className="grid grid-cols-4 rounded-xl border border-white/10 bg-white/10 p-1 2xl:flex">
              {[
                ["lista", "Lista"],
                ["semana", "Semana"],
                ["horario", "Horario"],
                ["mes", "Mes"],
              ].map(
                ([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      setVistaAgenda(
                        valor as
                          | "lista"
                          | "semana"
                          | "horario"
                          | "mes"
                      );
                      setSelectorFechaAbierto(
                        false
                      );
                    }}
                    className={
                      vistaAgenda ===
                      valor
                        ? "rounded-lg bg-[#00A79C] px-3 py-2 text-xs font-bold text-white shadow-sm sm:text-sm"
                        : "rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white sm:text-sm"
                    }
                  >
                    {etiqueta}
                  </button>
                )
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">

              <div className="mx-auto grid w-full max-w-[300px] min-w-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:mx-0 sm:flex sm:w-auto sm:max-w-none">

                <button
                  type="button"
                  onClick={
                    irAnterior
                  }
                  className="order-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                  aria-label="Anterior"
                  title="Anterior"
                >
                  <IconoIzquierda />
                </button>

                <button
                  type="button"
                  onClick={
                    irSiguiente
                  }
                  className="order-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 sm:order-2"
                  aria-label="Siguiente"
                  title="Siguiente"
                >
                  <IconoDerecha />
                </button>

                <button
                  type="button"
                  onClick={
                    irHoy
                  }
                  className={
                    fechaSeleccionada ===
                    hoy
                      ? "order-3 hidden h-10 shrink-0 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white sm:block"
                      : "order-3 hidden h-10 shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 sm:block"
                  }
                >
                  Hoy
                </button>

                <div className="relative order-2 w-full min-w-0 sm:order-4 sm:w-auto sm:flex-none">

                  <button
                    type="button"
                    onClick={
                      abrirSelectorFecha
                    }
                    className={
                      selectorFechaAbierto
                        ? "flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-[#4DD4CA]/40 bg-white/15 px-2 text-center text-sm font-bold capitalize text-white sm:min-w-[245px] sm:px-3"
                        : "flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2 text-center text-sm font-bold capitalize text-white transition hover:bg-white/15 sm:min-w-[245px] sm:px-3"
                    }
                    aria-label="Elegir fecha"
                    aria-expanded={
                      selectorFechaAbierto
                    }
                  >
                    <IconoCalendario />
                    <span className="min-w-0 truncate sm:hidden">
                      {formatearPeriodoAgendaMovil()}
                    </span>
                    <span className="hidden min-w-0 truncate sm:inline">
                      {formatearPeriodoAgenda()}
                    </span>
                    <span className="text-xs">
                      ⌄
                    </span>
                  </button>

                  {selectorFechaAbierto && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectorFechaAbierto(
                            false
                          )
                        }
                        className="fixed inset-0 z-40 cursor-default"
                        aria-label="Cerrar selector de fecha"
                      />

                      <div className="absolute left-0 top-12 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">

                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">

                          <button
                            type="button"
                            onClick={() =>
                              cambiarMesSelectorFecha(
                                -1
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#17324D] transition hover:bg-slate-50"
                            aria-label="Mes anterior"
                          >
                            <IconoIzquierda />
                          </button>

                          <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              Mes
                            </p>
                            <p className="mt-0.5 text-base font-bold text-[#17324D]">
                              {MESES_CORTOS[
                                numeroMesSelectorFecha -
                                  1
                              ]}{" "}
                              {anioSelectorFecha}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarMesSelectorFecha(
                                1
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#17324D] transition hover:bg-slate-50"
                            aria-label="Mes siguiente"
                          >
                            <IconoDerecha />
                          </button>

                        </div>

                        <div className="mt-3 grid grid-cols-7 gap-1">
                          {DIAS_SEMANA.map(
                            (dia) => (
                              <div
                                key={dia}
                                className="py-1 text-center text-[10px] font-bold text-slate-400"
                              >
                                {dia}
                              </div>
                            )
                          )}

                          {diasSelectorFecha.map(
                            (dia) => {
                              const fechaDia =
                                fechaLocalISO(
                                  dia
                                );

                              const esMesVisible =
                                dia.getMonth() ===
                                numeroMesSelectorFecha -
                                  1;

                              const esSeleccionada =
                                fechaDia ===
                                fechaSeleccionada;

                              const esHoy =
                                fechaDia ===
                                hoy;

                              return (
                                <button
                                  key={
                                    fechaDia
                                  }
                                  type="button"
                                  onClick={() =>
                                    seleccionarFechaAgenda(
                                      fechaDia
                                    )
                                  }
                                  className={
                                    esSeleccionada
                                      ? "flex h-9 w-9 items-center justify-center rounded-lg bg-[#00A79C] text-xs font-bold text-white shadow-sm"
                                      : esHoy
                                      ? "flex h-9 w-9 items-center justify-center rounded-lg border border-[#00A79C]/35 bg-[#E8F7F5] text-xs font-bold text-[#008C83]"
                                      : esMesVisible
                                      ? "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-[#17324D] transition hover:bg-slate-100"
                                      : "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium text-slate-300 transition hover:bg-slate-50"
                                  }
                                >
                                  {dia.getDate()}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <p className="text-[11px] text-slate-400">
                            Selecciona cualquier día
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              seleccionarFechaAgenda(
                                hoy
                              )
                            }
                            className="rounded-lg px-3 py-2 text-xs font-bold text-[#00A79C] transition hover:bg-[#E8F7F5]"
                          >
                            Hoy
                          </button>
                        </div>

                      </div>
                    </>
                  )}

                </div>

              </div>

              <div className="grid grid-cols-3 gap-2 sm:ml-auto sm:flex sm:items-center">

                <button
                  type="button"
                  onClick={irHoy}
                  className={
                    fechaSeleccionada ===
                    hoy
                      ? "inline-flex h-10 min-w-0 items-center justify-center rounded-xl bg-[#00A79C] px-2 text-xs font-bold text-white sm:hidden"
                      : "inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-2 text-xs font-bold text-white sm:hidden"
                  }
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltrosAbiertos(
                      (abierto) =>
                        !abierto
                    )
                  }
                  className={
                    filtrosAbiertos ||
                    busqueda.trim().length >
                      0 ||
                    filtroEstado !==
                      "todas" ||
                    filtroMes.length >
                      0
                      ? "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#00A79C] bg-[#00A79C] px-2 text-xs font-bold text-white transition hover:bg-[#008F86] sm:px-4 sm:text-sm"
                      : "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2 text-xs font-bold text-white transition hover:bg-white/15 sm:px-4 sm:text-sm"
                  }
                >
                  <span>
                    Filtros
                  </span>

                  {(busqueda.trim().length >
                    0 ||
                    filtroEstado !==
                      "todas" ||
                    filtroMes.length >
                      0) && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white">
                      {
                        [
                          busqueda.trim().length >
                            0,
                          filtroEstado !==
                            "todas",
                          filtroMes.length >
                            0,
                        ].filter(
                          Boolean
                        ).length
                      }
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      `/clases?fecha=${fechaSeleccionada}`;
                  }}
                  className="inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#00A79C] px-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.14)] transition hover:bg-[#008F86] sm:px-4 sm:text-sm"
                >
                  + Nueva clase
                </button>

              </div>

            </div>

          </div>

          {filtrosAbiertos && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <FiltrosAgenda
                busqueda={
                  busqueda
                }
                filtroEstado={
                  filtroEstado
                }
                filtroMes={
                  filtroMes
                }
                totalClases={
                  clasesFiltradas.length
                }
                setBusqueda={
                  setBusqueda
                }
                setFiltroEstado={
                  setFiltroEstado
                }
                setFiltroMes={
                  setFiltroMes
                }
                onLimpiar={() => {
                  setBusqueda("");
                  setFiltroEstado(
                    "todas"
                  );
                  setFiltroMes("");
                }}
                integrado
              />
            </div>
          )}

          </section>
        </section>

        {filtroDashboard === "sin-cerrar" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:px-5">
            <div>
              <p className="font-bold text-amber-800">
                Clases pasadas sin cerrar
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Solo se muestran las clases que ya han pasado y continúan como programadas.
              </p>
            </div>

            <a
              href="/agenda"
              className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-50"
            >
              Quitar filtro
            </a>
          </div>
        )}


        {vistaAgenda ===
        "lista" ? (
          <ListadoAgenda
            clasesAgrupadas={
              clasesAgrupadas
            }
            noDisponibilidades={
              noDisponibilidades
            }
            fechaSeleccionada={
              fechaSeleccionada
            }
            hoy={hoy}
            cargando={
              cargando
            }
            totalClases={
              clasesFiltradas.length
            }
            onClaseActualizada={
              cargarClases
            }
            formatearCabeceraFecha={
              formatearCabeceraFecha
            }
            calcularHorario={
              calcularHorario
            }
            textoTipo={
              textoTipo
            }
          />
        ) : vistaAgenda ===
          "semana" ? (
          <VistaSemanalAgenda
            clases={
              clasesFiltradas
            }
            fechaSeleccionada={
              fechaSeleccionada
            }
            noDisponibilidades={
              noDisponibilidades
            }
            onClaseActualizada={
              cargarClases
            }
            onFechaSeleccionadaChange={
              setFechaSeleccionada
            }
          />
        ) : vistaAgenda ===
          "horario" ? (
          <VistaHorarioAgenda
            clases={
              clasesFiltradas
            }
            fechaSeleccionada={
              fechaSeleccionada
            }
            noDisponibilidades={
              noDisponibilidades
            }
            onClaseActualizada={
              cargarClases
            }
            onFechaSeleccionadaChange={
              setFechaSeleccionada
            }
          />
        ) : (
          <VistaMensualAgenda
            clases={
              clasesFiltradas
            }
            fechaSeleccionada={
              fechaSeleccionada
            }
            noDisponibilidades={
              noDisponibilidades
            }
            onClaseActualizada={
              cargarClases
            }
            onFechaSeleccionadaChange={
              setFechaSeleccionada
            }
          />
        )}

      </div>

    </main>
  );
}