"use client";

import { useEffect, useState } from "react";

type Clase = {
  id: string;
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
    pagado: boolean;
    usa_bono: boolean;
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
};

type Props = {
  clases: Clase[];
  fechaSeleccionada: string;
  noDisponibilidades: NoDisponibilidad[];
  onFechaSeleccionadaChange?: (
    fecha: string
  ) => void;
};

function crearFecha(
  fecha: string
) {
  const [anio, mes, dia] =
    fecha
      .split("-")
      .map(Number);

  return new Date(
    anio,
    mes - 1,
    dia
  );
}

function fechaISO(
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

function nombreMes(
  fecha: Date
) {
  const mes =
    fecha
      .toLocaleDateString(
        "es-ES",
        {
          month: "long",
        }
      )
      .replace(
        /^\w/,
        (letra) =>
          letra.toUpperCase()
      );

  return `${mes} ${fecha.getFullYear()}`;
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

  const total =
    hora * 60 +
    minuto +
    duracionMinutos;

  const horaFin =
    Math.floor(
      total / 60
    ) % 24;

  const minutoFin =
    total % 60;

  return `${String(
    horaFin
  ).padStart(2, "0")}:${String(
    minutoFin
  ).padStart(2, "0")}`;
}

function estadoEconomicoClase(clase: Clase) {
  if (!clase.facturable) {
    return "no_facturable" as const;
  }

  if (clase.tipo === "club") {
    return clase.cobrada
      ? "cobrada" as const
      : "pendiente" as const;
  }

  if (clase.clase_alumnos.length === 0) {
    return "pendiente" as const;
  }

  const pagosNormales =
    clase.clase_alumnos.filter(
      (participante) =>
        !participante.usa_bono
    );

  if (pagosNormales.length === 0) {
    return "cobrada" as const;
  }

  return pagosNormales.every(
    (participante) =>
      participante.pagado
  )
    ? "cobrada" as const
    : "pendiente" as const;
}

function IconoEstadoClase({
  estado,
}: {
  estado: string;
}) {
  if (estado === "realizada") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="h-[9px] w-[9px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 10.2 8.1 13.8 15.6 6.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (estado === "cancelada") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="h-[9px] w-[9px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5.2 5.2 14.8 14.8M14.8 5.2 5.2 14.8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[9px] w-[9px]"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="6.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10 6.4v4l2.7 1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndicadoresClase({
  clase,
}: {
  clase: Clase;
}) {
  const economico =
    estadoEconomicoClase(
      clase
    );

  const estadoVisual =
    clase.estado === "realizada"
      ? {
          titulo: "Clase realizada",
          clase:
            "border-green-500 bg-green-500 text-white",
        }
      : clase.estado === "cancelada"
      ? {
          titulo: "Clase cancelada",
          clase:
            "border-red-600 bg-red-600 text-white",
        }
      : {
          titulo: "Clase programada",
          clase:
            "border-slate-300 bg-slate-100 text-slate-600",
        };

  const economicoVisual =
    economico === "cobrada"
      ? {
          titulo: "Cobrada",
          clase:
            "border-green-500 bg-green-500 text-white",
          tachado: false,
        }
      : economico ===
        "no_facturable"
      ? {
          titulo: "No facturable",
          clase:
            "border-slate-400 bg-slate-100 text-slate-500",
          tachado: true,
        }
      : {
          titulo: "Pendiente de cobro",
          clase:
            "border-red-600 bg-red-600 text-white",
          tachado: false,
        };

  return (
    <span className="pointer-events-none absolute right-1 top-1 flex items-center gap-0.5">
      <span
        title={
          estadoVisual.titulo
        }
        className={`inline-flex h-[14px] w-[14px] items-center justify-center rounded-full border shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${estadoVisual.clase}`}
      >
        <IconoEstadoClase
          estado={clase.estado}
        />
      </span>

      <span
        title={
          economicoVisual.titulo
        }
        className={`inline-flex h-[14px] w-[14px] items-center justify-center rounded-full border text-[7px] font-bold leading-none shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${economicoVisual.clase} ${economicoVisual.tachado ? "line-through" : ""}`}
      >
        €
      </span>
    </span>
  );
}


function claseColor(
  tipo: string
) {
  if (tipo === "club") {
    return "border-amber-300 bg-amber-50/90 text-amber-950";
  }

  if (tipo === "privada") {
    return "border-violet-300 bg-violet-50 text-violet-900";
  }

  return "border-[#00A79C]/40 bg-[#00A79C]/10 text-[#0B6F69]";
}

export default function VistaMensualAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
  onFechaSeleccionadaChange,
}: Props) {
  const [diasDesplegados, setDiasDesplegados] =
    useState<Record<string, boolean>>({});

  const [
    fechaMovil,
    setFechaMovil,
  ] = useState(
    fechaSeleccionada
  );

  useEffect(() => {
    setFechaMovil(
      fechaSeleccionada
    );
  }, [fechaSeleccionada]);

  function alternarDia(
    fecha: string
  ) {
    setDiasDesplegados(
      (actual) => ({
        ...actual,
        [fecha]: !actual[fecha],
      })
    );
  }

  const hoy =
    fechaISO(
      new Date()
    );

  const fechaBase =
    crearFecha(
      fechaSeleccionada
    );

  const primerDiaMes =
    new Date(
      fechaBase.getFullYear(),
      fechaBase.getMonth(),
      1
    );

  const diaSemanaInicio =
    primerDiaMes.getDay();

  const desplazamientoInicio =
    diaSemanaInicio === 0
      ? 6
      : diaSemanaInicio - 1;

  const inicioCalendario =
    new Date(
      primerDiaMes
    );

  inicioCalendario.setDate(
    primerDiaMes.getDate() -
      desplazamientoInicio
  );

  const diasCalendario =
    Array.from(
      {
        length: 42,
      },
      (_, indice) => {
        const dia =
          new Date(
            inicioCalendario
          );

        dia.setDate(
          inicioCalendario.getDate() +
            indice
        );

        return dia;
      }
    );

  const nombresDias = [
    "LUN",
    "MAR",
    "MIÉ",
    "JUE",
    "VIE",
    "SÁB",
    "DOM",
  ];

  const fechaMovilDate =
    crearFecha(
      fechaMovil
    );

  const clasesDiaMovil =
    clases
      .filter(
        (clase) =>
          clase.fecha ===
          fechaMovil
      )
      .sort(
        (a, b) =>
          a.hora_inicio.localeCompare(
            b.hora_inicio
          )
      );

  const noDisponibleMovil =
    noDisponibilidades.find(
      (periodo) =>
        fechaMovil >=
          periodo.fecha_inicio &&
        fechaMovil <=
          periodo.fecha_fin
    );

  function seleccionarDiaMovil(
    fecha: string
  ) {
    setFechaMovil(
      fecha
    );

    onFechaSeleccionadaChange?.(
      fecha
    );
  }

  function abrirClase(
    claseId: string
  ) {
    const volver =
      `/agenda?vista=mes&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?editar=${claseId}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  function crearClase(
    fecha: string
  ) {
    const volver =
      `/agenda?vista=mes&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?fecha=${fecha}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">

      <div className="border-b border-slate-100 px-5 py-4">

        <h2 className="text-lg font-bold text-[#17324D]">
          Vista mensual
        </h2>

        <p className="mt-1 text-sm capitalize text-slate-500">
          {nombreMes(
            fechaBase
          )}
        </p>

        <p className="mt-2 text-xs text-slate-400">
          <span className="md:hidden">
            Toca un día para ver sus clases.
          </span>
          <span className="hidden md:inline">
            Pulsa sobre el número de un día para crear una clase.
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold md:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00A79C]/10 px-2.5 py-1.5 text-[#0B6F69]">
            <span className="h-2 w-2 rounded-full bg-[#00A79C]" />
            Propia
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Club
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1.5 text-violet-800">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Privada
          </span>
        </div>

      </div>

      {/* MÓVIL: calendario limpio + detalle del día seleccionado. */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
          {nombresDias.map(
            (dia) => (
              <div
                key={dia}
                className="py-2.5 text-center"
              >
                <p className="text-[10px] font-extrabold tracking-wide text-slate-500">
                  {dia}
                </p>
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-white p-2">
          {diasCalendario.map(
            (dia) => {
              const fechaDia =
                fechaISO(
                  dia
                );

              const esMesActual =
                dia.getMonth() ===
                fechaBase.getMonth();

              const esHoy =
                fechaDia ===
                hoy;

              const seleccionado =
                fechaDia ===
                fechaMovil;

              const noDisponible =
                noDisponibilidades.find(
                  (periodo) =>
                    fechaDia >=
                      periodo.fecha_inicio &&
                    fechaDia <=
                      periodo.fecha_fin
                );

              const clasesDia =
                clases.filter(
                  (clase) =>
                    clase.fecha ===
                    fechaDia
                );

              const tienePropia =
                clasesDia.some(
                  (clase) =>
                    clase.tipo !==
                      "club" &&
                    clase.tipo !==
                      "privada"
                );

              const tieneClub =
                clasesDia.some(
                  (clase) =>
                    clase.tipo ===
                    "club"
                );

              const tienePrivada =
                clasesDia.some(
                  (clase) =>
                    clase.tipo ===
                    "privada"
                );

              return (
                <button
                  key={
                    fechaDia
                  }
                  type="button"
                  onClick={() =>
                    seleccionarDiaMovil(
                      fechaDia
                    )
                  }
                  className={
                    seleccionado
                      ? "relative flex h-[54px] min-w-0 flex-col items-center justify-center rounded-xl bg-[#00A79C] text-white shadow-sm"
                      : noDisponible
                      ? "relative flex h-[54px] min-w-0 flex-col items-center justify-center rounded-xl bg-red-50 text-red-700"
                      : esHoy
                      ? "relative flex h-[54px] min-w-0 flex-col items-center justify-center rounded-xl ring-1 ring-inset ring-[#00A79C]/40"
                      : esMesActual
                      ? "relative flex h-[54px] min-w-0 flex-col items-center justify-center rounded-xl text-[#17324D] transition active:bg-slate-100"
                      : "relative flex h-[54px] min-w-0 flex-col items-center justify-center rounded-xl text-slate-300 transition active:bg-slate-50"
                  }
                  aria-pressed={
                    seleccionado
                  }
                >
                  <span className="text-sm font-extrabold">
                    {
                      dia.getDate()
                    }
                  </span>

                  {clasesDia.length >
                    0 && (
                    <span
                      className={
                        seleccionado
                          ? "mt-0.5 text-[9px] font-bold text-white/75"
                          : "mt-0.5 text-[9px] font-bold text-slate-400"
                      }
                    >
                      {
                        clasesDia.length
                      }
                    </span>
                  )}

                  <span className="absolute bottom-1.5 flex h-1.5 items-center gap-[2px]">
                    {tienePropia && (
                      <span
                        className={
                          seleccionado
                            ? "h-1.5 w-1.5 rounded-full bg-white"
                            : "h-1.5 w-1.5 rounded-full bg-[#00A79C]"
                        }
                      />
                    )}

                    {tieneClub && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}

                    {tienePrivada && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    )}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold capitalize text-[#17324D]">
              {fechaMovilDate.toLocaleDateString(
                "es-ES",
                {
                  weekday:
                    "long",
                  day:
                    "numeric",
                  month:
                    "long",
                }
              )}
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {
                clasesDiaMovil.length
              }{" "}
              {clasesDiaMovil.length ===
              1
                ? "clase"
                : "clases"}
            </p>
          </div>

          <button
            type="button"
            disabled={Boolean(
              noDisponibleMovil
            )}
            onClick={() =>
              crearClase(
                fechaMovil
              )
            }
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-[#00A79C] px-3 text-xs font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            + Clase
          </button>
        </div>

        {noDisponibleMovil && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2.5">
            <p className="text-xs font-bold text-red-700">
              Día no disponible
              {noDisponibleMovil.motivo
                ? ` · ${noDisponibleMovil.motivo}`
                : ""}
            </p>
          </div>
        )}

        <div
          className={
            noDisponibleMovil
              ? "space-y-2.5 bg-red-50/20 p-3"
              : "space-y-2.5 p-3"
          }
        >
          {clasesDiaMovil.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-7 text-center">
              <p className="text-sm font-semibold text-slate-500">
                No hay clases este día
              </p>

              {!noDisponibleMovil && (
                <button
                  type="button"
                  onClick={() =>
                    crearClase(
                      fechaMovil
                    )
                  }
                  className="mt-2 text-xs font-extrabold text-[#00A79C]"
                >
                  + Crear clase
                </button>
              )}
            </div>
          ) : (
            clasesDiaMovil.map(
              (clase) => {
                const alumnosDatos =
                  clase.clase_alumnos
                    .map(
                      (item) =>
                        item.alumnos
                    )
                    .filter(Boolean);

                const alumnos =
                  alumnosDatos.length ===
                  1
                    ? `${alumnosDatos[0]?.nombre || ""} ${alumnosDatos[0]?.apellidos || ""}`.trim()
                    : alumnosDatos
                        .map(
                          (alumno) =>
                            (
                              alumno?.nombre ||
                              ""
                            ).trim()
                        )
                        .filter(Boolean)
                        .join(" · ");

                const horaFin =
                  calcularHoraFin(
                    clase.hora_inicio,
                    clase.duracion_minutos
                  );

                return (
                  <button
                    key={
                      clase.id
                    }
                    type="button"
                    onClick={() =>
                      abrirClase(
                        clase.id
                      )
                    }
                    className={`relative block w-full rounded-xl border border-l-[4px] p-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition active:scale-[0.995] ${claseColor(
                      clase.tipo
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-extrabold tracking-tight text-[#17324D]">
                        {clase.hora_inicio.slice(
                          0,
                          5
                        )}{" "}
                        –{" "}
                        {
                          horaFin
                        }
                        <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                          ·{" "}
                          {
                            clase.duracion_minutos
                          }{" "}
                          min
                        </span>
                      </p>

                      <div className="relative h-4 w-9 shrink-0">
                        <IndicadoresClase
                          clase={
                            clase
                          }
                        />
                      </div>
                    </div>

                    <p
                      className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-[#17324D]"
                      title={
                        alumnos ||
                        "Sin alumnos"
                      }
                    >
                      {alumnos ||
                        "Sin alumnos"}
                    </p>

                    <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                      {clase
                        .ubicaciones
                        ?.nombre ||
                        "Sin ubicación"}
                    </p>

                    {clase.estado ===
                      "cancelada" &&
                      clase.observaciones && (
                        <p className="mt-2 line-clamp-2 border-t border-red-200 pt-2 text-[10px] font-semibold leading-snug text-red-700">
                          Cancelación
                          {" · "}
                          {
                            clase.observaciones
                          }
                        </p>
                      )}
                  </button>
                );
              }
            )
          )}
        </div>
      </div>

      {/* ESCRITORIO/TABLET: conserva el calendario mensual actual. */}
      <div className="hidden md:block">

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">

        {nombresDias.map(
          (dia) => (
            <div
              key={dia}
              className="border-r border-slate-200 px-3 py-3 text-center last:border-r-0"
            >
              <p className="text-xs font-bold tracking-wide text-slate-500">
                {dia}
              </p>
            </div>
          )
        )}

      </div>

      <div className="grid grid-cols-7">

        {diasCalendario.map(
          (dia) => {
            const fechaDia =
              fechaISO(
                dia
              );

            const esMesActual =
              dia.getMonth() ===
              fechaBase.getMonth();

            const esHoy =
              fechaDia ===
              hoy;

            const noDisponible =
              noDisponibilidades.find(
                (periodo) =>
                  fechaDia >= periodo.fecha_inicio &&
                  fechaDia <= periodo.fecha_fin
              );

            const clasesDia =
              clases
                .filter(
                  (clase) =>
                    clase.fecha ===
                    fechaDia
                )
                .sort(
                  (a, b) =>
                    a.hora_inicio.localeCompare(
                      b.hora_inicio
                    )
                );

            const diaDesplegado =
              Boolean(
                diasDesplegados[
                  fechaDia
                ]
              );

            const clasesVisibles =
              diaDesplegado
                ? clasesDia
                : clasesDia.slice(
                    0,
                    6
                  );

            return (
              <div
                key={
                  fechaDia
                }
                className={
                  noDisponible
                    ? "min-h-[165px] border-b border-r border-red-200 bg-red-50/70 p-1.5"
                    : esHoy
                    ? "min-h-[165px] border-b border-r border-slate-200 bg-[#E8F7F5] p-1.5"
                    : esMesActual
                    ? "min-h-[165px] border-b border-r border-slate-200 bg-white p-1.5"
                    : "min-h-[165px] border-b border-r border-slate-200 bg-slate-50/50 p-1.5"
                }
              >

                <div className="flex items-center justify-between gap-1">

                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      disabled={Boolean(noDisponible)}
                      onClick={() =>
                        crearClase(
                          fechaDia
                        )
                      }
                      title={`Crear clase el ${fechaDia}`}
                      className={
                        esHoy
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#00A79C] text-[11px] font-bold text-white transition hover:bg-[#008C83]"
                          : esMesActual
                          ? "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-800 transition hover:bg-[#E8F7F5] hover:text-[#008C83]"
                          : "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-slate-300 transition hover:bg-slate-200"
                      }
                    >
                      {
                        dia.getDate()
                      }
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(noDisponible)}
                      onClick={() =>
                        crearClase(
                          fechaDia
                        )
                      }
                      title={`Crear clase el ${fechaDia}`}
                      aria-label={`Crear clase el ${fechaDia}`}
                      className={
                        esMesActual
                          ? "flex h-6 w-6 items-center justify-center rounded-full border border-[#00A79C]/25 bg-white text-sm font-bold leading-none text-[#00A79C] transition hover:bg-[#E8F7F5]"
                          : "flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold leading-none text-slate-300 transition hover:bg-slate-100"
                      }
                    >
                      +
                    </button>

                  </div>

                  {clasesDia.length >
                    0 && (
                    <span className="text-[9px] font-bold text-slate-400">
                      {
                        clasesDia.length
                      }{" "}
                      {
                        clasesDia.length ===
                        1
                          ? "clase"
                          : "clases"
                      }
                    </span>
                  )}

                </div>

                {noDisponible && (
                  <div className="mt-1 rounded-md bg-red-100 px-1.5 py-1 text-[9px] font-bold text-red-700">
                    NO DISPONIBLE
                    {noDisponible.motivo
                      ? ` · ${noDisponible.motivo}`
                      : ""}
                  </div>
                )}

                <div className="mt-1.5 space-y-1">

                  <div
                    className={
                      diaDesplegado
                        ? "max-h-[150px] space-y-1 overflow-y-auto pr-1"
                        : "space-y-1"
                    }
                  >
                  {clasesVisibles
                    .map(
                      (clase) => {
                        const alumnosDatos =
                          clase.clase_alumnos
                            .map(
                              (item) =>
                                item.alumnos
                            )
                            .filter(Boolean);

                        const nombres =
                          alumnosDatos.length === 1
                            ? `${alumnosDatos[0]?.nombre || ""} ${alumnosDatos[0]?.apellidos || ""}`.trim()
                            : alumnosDatos
                                .map(
                                  (alumno) =>
                                    (
                                      alumno?.nombre ||
                                      ""
                                    ).trim()
                                )
                                .filter(Boolean)
                                .join(" · ");

                        return (
                          <button
                            type="button"
                            key={
                              clase.id
                            }
                            onClick={() =>
                              abrirClase(
                                clase.id
                              )
                            }
                            title="Abrir esta clase para editar"
                            className={`relative block w-full cursor-pointer rounded-lg border border-l-[3px] px-1.5 py-1.5 pr-9 text-left text-[9px] leading-tight shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition hover:shadow-sm ${claseColor(
                              clase.tipo
                            )}`}
                          >

                            <IndicadoresClase
                              clase={
                                clase
                              }
                            />

                            <div className="flex min-w-0 items-center gap-1.5">

                              <span className="shrink-0 font-bold">
                                {clase.hora_inicio.slice(
                                  0,
                                  5
                                )}
                              </span>

                              <span className="min-w-0 truncate font-medium">
                                {nombres ||
                                  "Sin alumnos"}
                              </span>

                            </div>

                          </button>
                        );
                      }
                    )}
                  </div>

                  {clasesDia.length >
                    6 && (
                    <button
                      type="button"
                      onClick={() =>
                        alternarDia(
                          fechaDia
                        )
                      }
                      className="pt-0.5 text-[9px] font-semibold text-[#008C83] transition hover:text-[#056d69] hover:underline"
                    >
                      {diaDesplegado
                        ? "Mostrar menos"
                        : `+${clasesDia.length - 6} más`}
                    </button>
                  )}

                </div>

              </div>
            );
          }
        )}

      </div>

      </div>

    </div>
  );
}
