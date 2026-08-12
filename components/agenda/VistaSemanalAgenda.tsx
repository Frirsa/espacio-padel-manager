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

function crearFecha(
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

  return new Date(
    anio,
    mes - 1,
    dia
  );
}

function obtenerLunes(
  fecha: string
) {
  const actual =
    crearFecha(
      fecha
    );

  const diaSemana =
    actual.getDay();

  const diferencia =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  actual.setDate(
    actual.getDate() +
      diferencia
  );

  return actual;
}

function sumarDias(
  fecha: Date,
  dias: number
) {
  const resultado =
    new Date(
      fecha
    );

  resultado.setDate(
    resultado.getDate() +
      dias
  );

  return resultado;
}

function calcularHoraFin(
  horaInicio: string,
  duracion: number
) {
  const [
    hora,
    minuto,
  ] =
    horaInicio
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
      duracion
  );

  return `${String(
    fecha.getHours()
  ).padStart(
    2,
    "0"
  )}:${String(
    fecha.getMinutes()
  ).padStart(
    2,
    "0"
  )}`;
}

function nombreDia(
  fecha: Date
) {
  return fecha
    .toLocaleDateString(
      "es-ES",
      {
        weekday: "short",
      }
    )
    .replace(
      ".",
      ""
    )
    .toUpperCase();
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
        className="h-[11px] w-[11px]"
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
        className="h-[11px] w-[11px]"
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
      className="h-[11px] w-[11px]"
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
    <span className="inline-flex items-center gap-1">
      <span
        title={
          estadoVisual.titulo
        }
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${estadoVisual.clase}`}
      >
        <IconoEstadoClase
          estado={clase.estado}
        />
      </span>

      <span
        title={
          economicoVisual.titulo
        }
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold leading-none shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${economicoVisual.clase} ${economicoVisual.tachado ? "line-through" : ""}`}
      >
        €
      </span>
    </span>
  );
}


function colorClasePorTipo(
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

export default function VistaSemanalAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
  onFechaSeleccionadaChange,
}: Props) {
  const hoy =
    fechaISO(
      new Date()
    );

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

  const lunes =
    obtenerLunes(
      fechaSeleccionada
    );

  const diasSemana =
    Array.from(
      {
        length: 7,
      },
      (
        _,
        indice
      ) =>
        sumarDias(
          lunes,
          indice
        )
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

  const fechaMovilDate =
    crearFecha(
      fechaMovil
    );

  function abrirClase(
    claseId: string
  ) {
    const volver =
      `/agenda?vista=semana&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?editar=${claseId}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  function crearClase(
    fecha: string
  ) {
    const volver =
      `/agenda?vista=semana&fecha=${fechaSeleccionada}`;

    window.location.href =
      `/clases?fecha=${fecha}&volver=${encodeURIComponent(
        volver
      )}`;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">

      <div className="border-b border-slate-100 px-5 py-4">

        <h2 className="text-lg font-bold text-[#17324D]">
          Vista semanal
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Clases organizadas por día y hora
        </p>

        <p className="mt-2 text-xs text-slate-400">
          <span className="md:hidden">
            Elige un día para ver sus clases.
          </span>
          <span className="hidden md:inline">
            Pulsa el + de un día para crear una clase.
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

      {/* MÓVIL: selector semanal + lista de un solo día. */}
      <div className="md:hidden">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="grid grid-cols-7 gap-1">
            {diasSemana.map(
              (dia) => {
                const fechaDia =
                  fechaISO(
                    dia
                  );

                const activo =
                  fechaDia ===
                  fechaMovil;

                const bloqueado =
                  Boolean(
                    noDisponibilidades.find(
                      (periodo) =>
                        fechaDia >=
                          periodo.fecha_inicio &&
                        fechaDia <=
                          periodo.fecha_fin
                    )
                  );

                return (
                  <button
                    key={
                      fechaDia
                    }
                    type="button"
                    onClick={() => {
                      setFechaMovil(
                        fechaDia
                      );

                      onFechaSeleccionadaChange?.(
                        fechaDia
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
                      {nombreDia(
                        dia
                      )}
                    </span>

                    <span className="mt-0.5 text-sm font-extrabold">
                      {
                        dia.getDate()
                      }
                    </span>

                    {fechaDia ===
                      hoy && (
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
              }
            )}
          </div>
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
              ? "space-y-2.5 bg-red-50/25 p-3"
              : "space-y-2.5 p-3"
          }
        >
          {clasesDiaMovil.length ===
          0 ? (
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
              className="block w-full rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center transition active:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-slate-500">
                Sin clases
              </p>

              {!noDisponibleMovil && (
                <p className="mt-1 text-xs font-bold text-[#00A79C]">
                  + Crear clase
                </p>
              )}
            </button>
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
                    type="button"
                    key={
                      clase.id
                    }
                    onClick={() =>
                      abrirClase(
                        clase.id
                      )
                    }
                    className={`block w-full rounded-xl border border-l-[4px] p-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition active:scale-[0.995] ${colorClasePorTipo(
                      clase.tipo
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold tracking-tight text-[#17324D]">
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
                      </div>

                      <IndicadoresClase
                        clase={
                          clase
                        }
                      />
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

      {/* ESCRITORIO/TABLET: conserva las 7 columnas. */}
      <div className="hidden overflow-x-auto md:block">

        <div className="grid min-w-[1100px] grid-cols-7">

          {diasSemana.map(
            (
              dia
            ) => {
              const fechaDia =
                fechaISO(
                  dia
                );

              const clasesDia =
                clases
                  .filter(
                    (
                      clase
                    ) =>
                      clase.fecha ===
                      fechaDia
                  )
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      a.hora_inicio.localeCompare(
                        b.hora_inicio
                      )
                  );

              const esHoy =
                fechaDia ===
                hoy;

              const noDisponible =
                noDisponibilidades.find(
                  (periodo) =>
                    fechaDia >= periodo.fecha_inicio &&
                    fechaDia <= periodo.fecha_fin
                );

              return (
                <div
                  key={
                    fechaDia
                  }
                  className="min-h-[480px] border-r border-slate-200 last:border-r-0"
                >

                  <div
                    className={
                      esHoy
                        ? "relative border-b border-[#00A79C]/20 bg-[#E8F7F5] px-3 py-3 text-center"
                        : "relative border-b border-slate-200 bg-slate-50 px-3 py-3 text-center"
                    }
                  >

                    <p
                      className={
                        esHoy
                          ? "text-[10px] font-bold tracking-wide text-[#008C83]"
                          : "text-[10px] font-bold tracking-wide text-slate-500"
                      }
                    >
                      {nombreDia(
                        dia
                      )}
                    </p>

                    <p
                      className={
                        esHoy
                          ? "mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#00A79C] text-lg font-bold text-white"
                          : "mx-auto mt-1 flex h-9 w-9 items-center justify-center text-lg font-bold text-[#17324D]"
                      }
                    >
                      {
                        dia.getDate()
                      }
                    </p>


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
                        esHoy
                          ? "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-lg font-bold leading-none text-[#00A79C] shadow-sm transition hover:bg-white"
                          : "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold leading-none text-[#00A79C] shadow-sm transition hover:bg-[#E8F7F5]"
                      }
                    >
                      +
                    </button>

                  </div>

                  <div
                    className={
                      noDisponible
                        ? "space-y-3 bg-red-50/70 p-3"
                        : "space-y-3 p-3"
                    }
                  >

                    {noDisponible && (
                      <div className="rounded-xl border border-red-200 bg-red-100 px-3 py-2 text-center">
                        <p className="text-xs font-bold text-red-700">
                          NO DISPONIBLE
                        </p>
                        {noDisponible.motivo && (
                          <p className="mt-1 text-[10px] text-red-600">
                            {noDisponible.motivo}
                          </p>
                        )}
                      </div>
                    )}

                    {clasesDia.length ===
                    0 ? (

                      <button
                        type="button"
                        disabled={Boolean(noDisponible)}
                        onClick={() =>
                          crearClase(
                            fechaDia
                          )
                        }
                        className={
                          noDisponible
                            ? "block w-full cursor-not-allowed rounded-xl border border-dashed border-red-200 bg-red-50 px-2 py-5 text-center opacity-60"
                            : "block w-full rounded-xl border border-dashed border-slate-200 px-2 py-5 text-center transition hover:border-[#00A79C]/30 hover:bg-[#E8F7F5]"
                        }
                      >

                        <p className="text-xs text-slate-400">
                          Sin clases
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-[#00A79C]">
                          + Crear clase
                        </p>

                      </button>

                    ) : (

                      clasesDia.map(
                        (
                          clase
                        ) => {
                          const alumnosDatos =
                            clase.clase_alumnos
                              .map(
                                (item) =>
                                  item.alumnos
                              )
                              .filter(Boolean);

                          const alumnos =
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

                          const horaFin =
                            calcularHoraFin(
                              clase.hora_inicio,
                              clase.duracion_minutos
                            );

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
                              className={`block w-full cursor-pointer rounded-xl border border-l-[3px] p-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:-translate-y-[1px] hover:shadow-md ${colorClasePorTipo(
                                clase.tipo
                              )}`}
                            >

                              <div className="flex items-start justify-between gap-2">

                                <div>

                                  <p className="text-sm font-bold text-[#17324D]">
                                    {clase.hora_inicio.slice(
                                      0,
                                      5
                                    )}
                                  </p>

                                  <p className="text-[11px] text-slate-500">
                                    hasta{" "}
                                    {
                                      horaFin
                                    }
                                  </p>

                                </div>

                                <IndicadoresClase
                                  clase={
                                    clase
                                  }
                                />

                              </div>

                              <div className="mt-3 border-t border-slate-100 pt-3">

                                <p className="text-xs font-bold leading-snug text-[#17324D]">
                                  {alumnos ||
                                    "Sin alumnos"}
                                </p>

                                <p className="mt-2 text-[11px] font-medium leading-snug text-slate-500">
                                  {clase
                                    .ubicaciones
                                    ?.nombre ||
                                    "Sin ubicación"}
                                </p>

                                <p className="mt-2 text-[10px] text-slate-400">
                                  {
                                    clase.duracion_minutos
                                  }{" "}
                                  min
                                </p>

                              </div>

                              {clase.estado ===
                                "cancelada" &&
                                clase.observaciones && (

                                  <div className="mt-3 border-t border-red-200 pt-2">

                                    <p className="text-[10px] font-bold uppercase text-red-700">
                                      Motivo
                                    </p>

                                    <p className="mt-1 text-[11px] leading-snug text-red-800">
                                      {
                                        clase.observaciones
                                      }
                                    </p>

                                  </div>
                                )}

                            </button>
                          );
                        }
                      )
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