"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { supabase } from "../../lib/supabase";

import ResumenAgenda from "../../components/agenda/ResumenAgenda";
import FiltrosAgenda from "../../components/agenda/FiltrosAgenda";
import ListadoAgenda from "../../components/agenda/ListadoAgenda";
import VistaSemanalAgenda from "../../components/agenda/VistaSemanalAgenda";
import VistaHorarioAgenda from "../../components/agenda/VistaHorarioAgenda";
import VistaMensualAgenda from "../../components/agenda/VistaMensualAgenda";

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
            apellidos
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

  function irAnterior() {
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
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
              <IconoCalendario />
            </div>

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                Agenda
              </h1>

              <p className="mt-1 text-slate-600">
                Agenda de clases
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                `/clases?fecha=${fechaSeleccionada}`;
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#09a9a3] px-5 py-3 font-semibold text-white transition hover:bg-[#078b86]"
          >
            + Nueva clase
          </button>

        </div>

        <ResumenAgenda
          clasesHoy={
            clasesHoy
          }
          proximasClases={
            proximasClases
          }
        />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {vistaAgenda ===
                "mes"
                  ? "Mes seleccionado"
                  : "Mostrar agenda desde"}
              </p>

              <p className="mt-1 text-lg font-bold capitalize text-slate-900">
                {formatearFechaSeleccionada()}
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <div className="mr-2 flex rounded-xl bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() =>
                    setVistaAgenda(
                      "lista"
                    )
                  }
                  className={
                    vistaAgenda ===
                    "lista"
                      ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  Lista
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVistaAgenda(
                      "semana"
                    )
                  }
                  className={
                    vistaAgenda ===
                    "semana"
                      ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  Semana
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVistaAgenda(
                      "horario"
                    )
                  }
                  className={
                    vistaAgenda ===
                    "horario"
                      ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  Horario
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVistaAgenda(
                      "mes"
                    )
                  }
                  className={
                    vistaAgenda ===
                    "mes"
                      ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  Mes
                </button>

              </div>

              <button
                type="button"
                onClick={
                  irAnterior
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <IconoIzquierda />
                Anterior
              </button>

              <button
                type="button"
                onClick={
                  irHoy
                }
                className={
                  fechaSeleccionada ===
                  hoy
                    ? "rounded-xl bg-[#09a9a3] px-5 py-3 text-sm font-bold text-white"
                    : "rounded-xl bg-teal-50 px-5 py-3 text-sm font-bold text-[#078b86] transition hover:bg-teal-100"
                }
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={
                  irSiguiente
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Siguiente
                <IconoDerecha />
              </button>

              <input
                type="date"
                value={
                  fechaSeleccionada
                }
                onChange={(e) => {
                  if (
                    e.target.value
                  ) {
                    setFechaSeleccionada(
                      e.target.value
                    );
                  }
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              />

            </div>

          </div>

        </div>

        {filtroDashboard === "sin-cerrar" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
            <div>
              <p className="font-bold text-orange-800">Clases pasadas sin cerrar</p>
              <p className="mt-1 text-sm text-orange-700">
                Solo se muestran las clases que ya han pasado y continúan como programadas.
              </p>
            </div>
            <a href="/agenda" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm">
              Quitar filtro
            </a>
          </div>
        )}

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
        />

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
          />
        )}

      </div>

    </main>
  );
}