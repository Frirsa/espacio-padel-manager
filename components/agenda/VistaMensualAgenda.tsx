"use client";

import { useState } from "react";

type Clase = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  observaciones: string | null;

  ubicaciones: {
    nombre: string;
  } | null;

  clase_alumnos: {
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
  return fecha
    .toLocaleDateString(
      "es-ES",
      {
        month: "long",
        year: "numeric",
      }
    )
    .replace(
      /^\w/,
      (letra) =>
        letra.toUpperCase()
    );
}

function claseColor(tipo: string, estado: string) {
  if (estado === "cancelada") {
    return "border-red-200 bg-red-50 text-red-700 hover:border-red-300";
  }
  if (tipo === "club") {
    return "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300";
  }
  if (tipo === "privada") {
    return "border-violet-300 bg-violet-100 text-violet-800 hover:border-violet-400";
  }
  return "border-[#09a9a3]/40 bg-[#09a9a3]/10 text-[#078b86] hover:border-[#09a9a3]/70";
}

export default function VistaMensualAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
}: Props) {
  const [diasDesplegados, setDiasDesplegados] =
    useState<Record<string, boolean>>({});

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
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">

        <h2 className="text-xl font-bold text-slate-900">
          Vista mensual
        </h2>

        <p className="mt-1 text-sm capitalize text-slate-500">
          {nombreMes(
            fechaBase
          )}
        </p>

        <p className="mt-2 text-xs text-slate-400">
          Pulsa sobre el número de un día para crear una clase.
        </p>

      </div>

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
                    ? "min-h-[165px] border-b border-r border-slate-200 bg-teal-50 p-1.5"
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
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#09a9a3] text-[11px] font-bold text-white transition hover:bg-[#078b86]"
                          : esMesActual
                          ? "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-800 transition hover:bg-teal-100 hover:text-[#078b86]"
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
                          ? "flex h-6 w-6 items-center justify-center rounded-full border border-teal-200 bg-white text-sm font-bold leading-none text-[#09a9a3] transition hover:bg-teal-50"
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
                        const nombres =
                          clase.clase_alumnos
                            .map(
                              (
                                item
                              ) =>
                                item.alumnos
                            )
                            .filter(
                              Boolean
                            )
                            .map(
                              (
                                alumno
                              ) =>
                                `${
                                  alumno?.nombre ||
                                  ""
                                } ${
                                  alumno?.apellidos ||
                                  ""
                                }`.trim()
                            )
                            .join(
                              ", "
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
                            className={`block w-full cursor-pointer rounded-md border px-1.5 py-1 text-left text-[9px] leading-tight transition hover:shadow-sm ${claseColor(
                              clase.tipo,
                              clase.estado
                            )}`}
                          >

                            <div className="flex items-center gap-1.5">

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
                      className="pt-0.5 text-[9px] font-semibold text-[#078b86] transition hover:text-[#056d69] hover:underline"
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
  );
}
