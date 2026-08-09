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

function EstadoClase({
  estado,
}: {
  estado: string;
}) {
  if (
    estado ===
    "realizada"
  ) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700">
        Realizada
      </span>
    );
  }

  if (
    estado ===
    "cancelada"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-700">
        Cancelada
      </span>
    );
  }

  return (
    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
      Programada
    </span>
  );
}

function colorClasePorTipo(tipo: string, estado: string) {
  if (estado === "cancelada") return "border-red-200 bg-red-50 hover:border-red-300";
  if (tipo === "club") return "border-orange-200 bg-orange-50 hover:border-orange-300";
  if (tipo === "privada") return "border-violet-200 bg-violet-50 hover:border-violet-300";
  return "border-[#09a9a3]/40 bg-[#09a9a3]/10 hover:border-[#09a9a3]/70";
}

export default function VistaSemanalAgenda({
  clases,
  fechaSeleccionada,
  noDisponibilidades,
}: Props) {
  const hoy =
    fechaISO(
      new Date()
    );

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
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">

        <h2 className="text-xl font-bold text-slate-900">
          Vista semanal
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Clases organizadas por día y hora
        </p>

        <p className="mt-2 text-xs text-slate-400">
          Pulsa sobre el encabezado de un día para crear una clase.
        </p>

      </div>

      <div className="overflow-x-auto">

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
                        ? "relative border-b border-teal-600 bg-[#09a9a3] px-3 py-4 text-center text-white"
                        : "relative border-b border-slate-200 bg-slate-50 px-3 py-4 text-center"
                    }
                  >

                    <p
                      className={
                        esHoy
                          ? "text-xs font-bold tracking-wide text-teal-50"
                          : "text-xs font-bold tracking-wide text-slate-500"
                      }
                    >
                      {nombreDia(
                        dia
                      )}
                    </p>

                    <p
                      className={
                        esHoy
                          ? "mt-1 text-2xl font-bold"
                          : "mt-1 text-2xl font-bold text-slate-900"
                      }
                    >
                      {
                        dia.getDate()
                      }
                    </p>

                    {esHoy && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">
                        Hoy
                      </p>
                    )}

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
                          ? "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold leading-none text-[#09a9a3] shadow-sm transition hover:scale-105 hover:bg-teal-50"
                          : "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-teal-200 bg-white text-lg font-bold leading-none text-[#09a9a3] shadow-sm transition hover:scale-105 hover:bg-teal-50"
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
                            : "block w-full rounded-xl border border-dashed border-slate-200 px-2 py-5 text-center transition hover:border-teal-300 hover:bg-teal-50"
                        }
                      >

                        <p className="text-xs text-slate-400">
                          Sin clases
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-teal-600">
                          + Crear clase
                        </p>

                      </button>

                    ) : (

                      clasesDia.map(
                        (
                          clase
                        ) => {
                          const alumnos =
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
                              className={`block w-full cursor-pointer rounded-2xl border p-3 text-left shadow-sm transition hover:shadow-md ${colorClasePorTipo(
                                clase.tipo,
                                clase.estado
                              )}`}
                            >

                              <div className="flex items-start justify-between gap-2">

                                <div>

                                  <p className="text-sm font-bold text-slate-900">
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

                                <EstadoClase
                                  estado={
                                    clase.estado
                                  }
                                />

                              </div>

                              <div className="mt-3 border-t border-slate-100 pt-3">

                                <p className="text-xs font-bold leading-snug text-slate-900">
                                  {alumnos ||
                                    "Sin alumnos"}
                                </p>

                                <p className="mt-2 text-[11px] font-medium leading-snug text-purple-700">
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