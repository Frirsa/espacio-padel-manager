"use client";

import { useState } from "react";
import AccionesRapidasClase, { type ClaseAccionesRapidas } from "./AccionesRapidasClase";

type Clase = ClaseAccionesRapidas & {
  grupo_id: string | null;
};

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
};

type Props = {
  clasesAgrupadas: [string, Clase[]][];
  noDisponibilidades: NoDisponibilidad[];
  fechaSeleccionada: string;
  hoy: string;
  cargando: boolean;
  totalClases: number;
  onClaseActualizada: () => Promise<void>;

  formatearCabeceraFecha: (
    fecha: string
  ) => string;

  calcularHorario: (
    clase: Clase
  ) => {
    horaInicio: string;
    horaFin: string;
  };

  textoTipo: (
    tipo: string
  ) => string;
};


function nombreAlumnoAgenda(
  alumno:
    | {
        nombre: string;
        apellidos: string | null;
        apodo: string | null;
      }
    | null
    | undefined,
  unico: boolean
) {
  if (!alumno) {
    return "";
  }

  const apodo =
    (alumno.apodo || "").trim();

  if (apodo) {
    return apodo;
  }

  if (unico) {
    return `${alumno.nombre || ""} ${
      alumno.apellidos || ""
    }`.trim();
  }

  return (
    alumno.nombre || ""
  ).trim();
}

function IconoAlumno() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.25"
      />

      <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
    </svg>
  );
}

function IconoGrupo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8.5"
        r="2.5"
      />

      <circle
        cx="16"
        cy="8.5"
        r="2.5"
      />

      <path d="M3.75 18.5c.45-3 1.85-4.75 4.25-4.75s3.8 1.75 4.25 4.75" />

      <path d="M11.75 18.5c.45-3 1.85-4.75 4.25-4.75s3.8 1.75 4.25 4.75" />
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

function IconoEstadoClase({
  estado,
}: {
  estado: string;
}) {
  if (estado === "realizada") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="h-3.5 w-3.5"
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
        className="h-3.5 w-3.5"
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
      className="h-3.5 w-3.5"
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

function estadoEconomicoClase(
  clase: Clase
) {
  if (!clase.facturable) {
    return "no_facturable" as const;
  }

  if (clase.tipo === "club") {
    return clase.cobrada
      ? "cobrada" as const
      : "pendiente" as const;
  }

  if (
    clase.clase_alumnos.length === 0
  ) {
    return "pendiente" as const;
  }

  const pagosNormales =
    clase.clase_alumnos.filter(
      (participante) =>
        !participante.usa_bono
    );

  if (
    pagosNormales.length === 0
  ) {
    return "cobrada" as const;
  }

  return pagosNormales.every(
    (participante) =>
      participante.pagado
  )
    ? "cobrada" as const
    : "pendiente" as const;
}

function EstadosClase({
  clase,
}: {
  clase: Clase;
}) {
  const economico =
    estadoEconomicoClase(
      clase
    );

  const operativo =
    clase.estado === "realizada"
      ? {
          texto: "Realizada",
          clase:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
      : clase.estado ===
        "cancelada"
      ? {
          texto: "Cancelada",
          clase:
            "border-red-200 bg-red-50 text-red-700",
        }
      : {
          texto: "Programada",
          clase:
            "border-slate-200 bg-slate-50 text-slate-600",
        };

  const economicoVisual =
    economico === "cobrada"
      ? {
          texto: "Cobrada",
          clase:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
      : economico ===
        "no_facturable"
      ? {
          texto:
            "No facturable",
          clase:
            "border-slate-200 bg-slate-50 text-slate-500",
        }
      : {
          texto: "Pendiente",
          clase:
            "border-red-200 bg-red-50 text-red-700",
        };

  return (
    <div className="inline-grid grid-cols-[115px_115px] gap-1.5 lg:ml-auto">
      <span
        className={`inline-flex h-7 w-[115px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-bold ${operativo.clase}`}
        title={`Estado: ${operativo.texto}`}
      >
        <IconoEstadoClase
          estado={clase.estado}
        />

        {operativo.texto}
      </span>

      <span
        className={`inline-flex h-7 w-[115px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-bold ${economicoVisual.clase}`}
        title={`Cobro: ${economicoVisual.texto}`}
      >
        <span className="text-[12px] font-black leading-none">
          €
        </span>

        {economicoVisual.texto}
      </span>
    </div>
  );
}

function fechaEnPeriodo(
  fecha: string,
  periodo: NoDisponibilidad
) {
  return (
    fecha >= periodo.fecha_inicio &&
    fecha <= periodo.fecha_fin
  );
}

function colorClasePorTipo(
  tipo: string
) {
  if (tipo === "club") {
    return "border-l-amber-300 bg-amber-50/90 hover:bg-amber-50";
  }

  if (tipo === "privada") {
    return "border-l-violet-300 bg-violet-50 hover:bg-violet-50/80";
  }

  return "border-l-[#00A79C]/40 bg-[#00A79C]/10 hover:bg-[#00A79C]/[0.13]";
}

export default function ListadoAgenda({
  clasesAgrupadas,
  noDisponibilidades,
  fechaSeleccionada,
  hoy,
  cargando,
  totalClases,
  onClaseActualizada,
  formatearCabeceraFecha,
  calcularHorario,
  textoTipo,
}: Props) {
  const [
    claseSeleccionada,
    setClaseSeleccionada,
  ] = useState<Clase | null>(
    null
  );

  if (cargando) {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <p className="text-sm text-slate-500">
          Cargando agenda...
        </p>
      </div>
    );
  }

  if (totalClases === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <p className="text-sm font-medium text-slate-500">
          No hay clases que coincidan con los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {clasesAgrupadas.map(
        ([fecha, clasesDia]) => {
          const esHoy =
            fecha === hoy;

          const noDisponible =
            noDisponibilidades.find(
              (periodo) =>
                fechaEnPeriodo(
                  fecha,
                  periodo
                )
            );

          return (
            <section
              key={fecha}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
            >
              <div
                className={
                  esHoy
                    ? "flex min-h-12 items-center justify-between gap-3 border-b border-[#00A79C]/20 bg-[#E8F7F5] px-4 py-2.5"
                    : "flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5"
                }
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <p
                    className={
                      esHoy
                        ? "text-sm font-extrabold uppercase tracking-[0.03em] text-[#008C83]"
                        : "text-sm font-extrabold uppercase tracking-[0.03em] text-[#17324D]"
                    }
                  >
                    {formatearCabeceraFecha(
                      fecha
                    )}
                  </p>

                  <span
                    className={
                      esHoy
                        ? "text-xs font-semibold text-[#008C83]/70"
                        : "text-xs font-semibold text-slate-400"
                    }
                  >
                    {clasesDia.length}{" "}
                    {clasesDia.length === 1
                      ? "clase"
                      : "clases"}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {noDisponible ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-1.5 text-[10px] font-bold text-red-700">
                      No disponible
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const volver =
                          `/agenda?vista=lista&fecha=${fechaSeleccionada}`;

                        window.location.href =
                          `/clases?fecha=${fecha}&volver=${encodeURIComponent(
                            volver
                          )}`;
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold leading-none text-[#00A79C] shadow-sm transition hover:border-[#00A79C]/30 hover:bg-[#E8F7F5]"
                      title={`Crear clase el ${fecha}`}
                    >
                      +
                    </button>
                  )}

                  {esHoy && (
                    <span className="rounded-full bg-[#00A79C] px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                      Hoy
                    </span>
                  )}
                </div>
              </div>

              {noDisponible && (
                <div className="border-b border-red-200 bg-red-50 px-4 py-2">
                  <p className="text-xs font-semibold text-red-700">
                    Día bloqueado
                    {noDisponible.motivo
                      ? ` · ${noDisponible.motivo}`
                      : ""}
                  </p>
                </div>
              )}

              <div className="divide-y divide-slate-200/80">
                {clasesDia.map(
                  (clase) => {
                    const {
                      horaInicio,
                      horaFin,
                    } =
                      calcularHorario(
                        clase
                      );

                    const alumnosDatos =
                      clase.clase_alumnos
                        .map(
                          (item) =>
                            item.alumnos
                        )
                        .filter(Boolean);

                    const nombresAlumnos =
                      alumnosDatos
                        .map((alumno) =>
                          nombreAlumnoAgenda(
                            alumno,
                            alumnosDatos.length === 1
                          )
                        )
                        .filter(Boolean)
                        .join(" · ");

                    const esGrupo =
                      Boolean(
                        clase.grupo_id
                      );

                    return (
                      <button
                        type="button"
                        key={clase.id}
                        onClick={() =>
                          setClaseSeleccionada(
                            clase
                          )
                        }
                        className={`relative block w-full overflow-hidden border-l-[3px] px-4 py-3 text-left transition ${colorClasePorTipo(
                          clase.tipo
                        )}`}
                      >
                        {/* ListaAgendaLineaCanceladaV1 */}
                        {clase.estado === "cancelada" && (
                          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-500" />
                        )}

                        <div className="grid gap-3 lg:grid-cols-[150px_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
                          <div className="min-w-0">
                            <p className="whitespace-nowrap text-sm font-extrabold tracking-tight text-[#17324D]">
                              {horaInicio} –{" "}
                              {horaFin}
                            </p>

                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                              {
                                clase.duracion_minutos
                              }{" "}
                              min
                            </p>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[#17324D]">
                              <span className="shrink-0">
                                {esGrupo ? (
                                  <IconoGrupo />
                                ) : (
                                  <IconoAlumno />
                                )}
                              </span>

                              <span className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-slate-400">
                                {esGrupo
                                  ? "Grupo"
                                  : "Alumno(s)"}
                              </span>

                              <span className="min-w-0 truncate text-sm font-bold text-[#17324D]">
                                {nombresAlumnos ||
                                  "Sin alumnos"}
                              </span>

                              {clase.observaciones?.trim() &&
                          (
                            clase.estado !== "cancelada" ||
                            Boolean(
                              clase.motivo_cancelacion?.trim()
                            )
                          ) && (
                                <span
                                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500 bg-amber-500 text-white"
                                  title="Esta clase tiene una anotación"
                                  aria-label="Esta clase tiene una anotación"
                                >
                                  <IconoNota />
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs font-medium text-slate-500">
                              {clase
                                .ubicaciones
                                ?.nombre ||
                                "Sin ubicación"}
                              {" · "}
                              {textoTipo(
                                clase.tipo
                              )}
                            </p>

                            {clase.estado ===
                              "cancelada" &&
                              (
                                clase.motivo_cancelacion ||
                                clase.observaciones
                              ) && (
                                <p
                                  className="mt-1 truncate text-[11px] font-semibold text-red-700"
                                  title={
                                    clase.motivo_cancelacion ||
                                    clase.observaciones ||
                                    undefined
                                  }
                                >
                                  Cancelación
                                  {" · "}
                                  {
                                    clase.motivo_cancelacion ||
                                    clase.observaciones
                                  }
                                </p>
                              )}
                          </div>

                          <EstadosClase
                            clase={clase}
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          );
        }
      )}

      {claseSeleccionada && (
        <AccionesRapidasClase
          clase={
            claseSeleccionada
          }
          volverA={`/agenda?vista=lista&fecha=${fechaSeleccionada}`}
          onCerrar={() =>
            setClaseSeleccionada(
              null
            )
          }
          onClaseActualizada={
            onClaseActualizada
          }
        />
      )}
    </div>
  );
}
