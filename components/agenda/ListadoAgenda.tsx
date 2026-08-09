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
  clasesAgrupadas: [string, Clase[]][];
  noDisponibilidades: NoDisponibilidad[];
  fechaSeleccionada: string;
  hoy: string;
  cargando: boolean;
  totalClases: number;

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

function IconoReloj() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function IconoAlumnos() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
      />

      <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />

      <circle
        cx="17"
        cy="9"
        r="2"
      />

      <path d="M16 14c3 0 5 2.2 5 5" />
    </svg>
  );
}

function IconoPala() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse
        cx="10"
        cy="9"
        rx="5"
        ry="6"
      />

      <path d="m13 14 6 6" />

      <path d="m17 18 2-2" />
    </svg>
  );
}

function EstadoClase({
  estado,
}: {
  estado: string;
}) {
  if (
    estado === "realizada"
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
        Realizada
      </span>
    );
  }

  if (
    estado === "cancelada"
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
        Cancelada
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
      Programada
    </span>
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
  tipo: string,
  estado: string
) {
  if (estado === "cancelada") {
    return "border-red-200 bg-red-50";
  }

  if (tipo === "club") {
    return "border-orange-200 bg-orange-50";
  }

  if (tipo === "privada") {
    return "border-violet-200 bg-violet-50";
  }

  return "border-[#09a9a3]/50 bg-[#09a9a3]/10";
}

export default function ListadoAgenda({
  clasesAgrupadas,
  noDisponibilidades,
  fechaSeleccionada,
  hoy,
  cargando,
  totalClases,
  formatearCabeceraFecha,
  calcularHorario,
  textoTipo,
}: Props) {
  if (cargando) {
    return (
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-slate-500">
          Cargando agenda...
        </p>
      </div>
    );
  }

  if (
    totalClases === 0
  ) {
    return (
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-medium text-slate-500">
          No hay clases que coincidan con los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">

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
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >

              <div
                className={
                  esHoy
                    ? "flex items-center justify-between bg-[#09a9a3] px-6 py-5 text-white"
                    : "flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5"
                }
              >

                <div>

                  <p
                    className={
                      esHoy
                        ? "text-lg font-bold"
                        : "text-lg font-bold text-slate-900"
                    }
                  >
                    {formatearCabeceraFecha(
                      fecha
                    )}
                  </p>

                  <p
                    className={
                      esHoy
                        ? "mt-1 text-sm text-teal-50"
                        : "mt-1 text-sm text-slate-500"
                    }
                  >
                    {
                      clasesDia.length
                    }{" "}
                    {clasesDia.length ===
                    1
                      ? "clase"
                      : "clases"}
                  </p>

                </div>

                <div className="flex items-center gap-2">

                  {noDisponible ? (
                    <span className="rounded-full bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
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
                      className={
                        esHoy
                          ? "flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-[#09a9a3] shadow-sm"
                          : "flex h-9 w-9 items-center justify-center rounded-full border border-teal-200 bg-white text-xl font-bold text-[#09a9a3] shadow-sm hover:bg-teal-50"
                      }
                      title={`Crear clase el ${fecha}`}
                    >
                      +
                    </button>
                  )}

                  {esHoy && (
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#078b86] shadow-sm">
                      HOY
                    </span>
                  )}

                </div>

              </div>

              {noDisponible && (
                <div className="border-b border-red-200 bg-red-50 px-6 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    Día bloqueado
                    {noDisponible.motivo
                      ? ` · ${noDisponible.motivo}`
                      : ""}
                  </p>
                </div>
              )}

              <div className="divide-y divide-slate-200">

                {clasesDia.map(
                  (clase) => {
                    const {
                      horaInicio,
                      horaFin,
                    } =
                      calcularHorario(
                        clase
                      );

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
                        .join(", ");

                    const esPasada =
                      clase.fecha <
                      hoy;

                    return (
                      <button
                        type="button"
                        key={
                          clase.id
                        }
                        onClick={() => {
                          const volver =
                            `/agenda?vista=lista&fecha=${fechaSeleccionada}`;

                          window.location.href =
                            `/clases?editar=${clase.id}&volver=${encodeURIComponent(
                              volver
                            )}`;
                        }}
                        className={`block w-full border-l-4 px-6 py-5 text-left transition hover:brightness-[0.98] ${
                          esPasada
                            ? "opacity-65"
                            : ""
                        } ${colorClasePorTipo(
                          clase.tipo,
                          clase.estado
                        )}`}
                      >

                        <div className="grid gap-5 lg:grid-cols-[175px_minmax(0,1fr)_130px] lg:items-center">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                              <IconoReloj />
                            </div>

                            <div>

                              <p className="text-lg font-bold text-slate-900">
                                {
                                  horaInicio
                                }{" "}
                                h
                              </p>

                              <p className="text-xs font-medium text-slate-500">
                                hasta{" "}
                                {
                                  horaFin
                                }{" "}
                                h
                              </p>

                            </div>

                          </div>

                          <div className="grid gap-3 sm:grid-cols-[1.35fr_1fr]">

                            <div className="flex min-w-0 items-start gap-3">

                              <span className="mt-0.5 shrink-0 text-purple-600">
                                <IconoUbicacion />
                              </span>

                              <div className="min-w-0">

                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Ubicación
                                </p>

                                <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                                  {clase
                                    .ubicaciones
                                    ?.nombre ||
                                    "Sin ubicación"}
                                </p>

                              </div>

                            </div>

                            <div className="flex min-w-0 items-start gap-3">

                              <span className="mt-0.5 shrink-0 text-blue-600">
                                <IconoAlumnos />
                              </span>

                              <div className="min-w-0">

                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Alumno(s)
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {nombresAlumnos ||
                                    "Sin alumnos"}
                                </p>

                              </div>

                            </div>

                            <div className="flex items-start gap-3 sm:col-span-2">

                              <span className="mt-0.5 shrink-0 text-orange-500">
                                <IconoPala />
                              </span>

                              <div>

                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Tipo de clase
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {textoTipo(
                                    clase.tipo
                                  )}{" "}
                                  ·{" "}
                                  {
                                    clase.duracion_minutos
                                  }{" "}
                                  min
                                </p>

                              </div>

                            </div>

                          </div>

                          <div className="lg:text-right">

                            <EstadoClase
                              estado={
                                clase.estado
                              }
                            />

                          </div>

                        </div>

                        {clase.estado ===
                          "cancelada" &&
                          clase.observaciones && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

                              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                Motivo de cancelación
                              </p>

                              <p className="mt-1 text-sm text-red-900">
                                {
                                  clase.observaciones
                                }
                              </p>

                            </div>
                          )}

                      </button>
                    );
                  }
                )}

              </div>

            </section>
          );
        }
      )}

    </div>
  );
}