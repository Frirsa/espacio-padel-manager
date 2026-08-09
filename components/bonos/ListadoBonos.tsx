type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
};

type UsoBono = {
  bono_id: string | null;
  alumno_id: string;
  usa_bono: boolean;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;

  clases: {
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    estado: string;

    ubicaciones: {
      nombre: string;
    } | null;
  } | null;
};

type Bono = {
  id: string;
  alumno_id: string;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  fecha_compra: string;
  activo: boolean;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;

  clase_alumnos: UsoBono[];
};

type Props = {
  bonos: Bono[];
  alumnos: Alumno[];
  relacionesBonoAlumno: RelacionBonoAlumno[];
  busquedaBonos: string;
  filtroEstado: string;
  filtroMes: string;
  setBusquedaBonos: (valor: string) => void;
  setFiltroEstado: (valor: string) => void;
  setFiltroMes: (valor: string) => void;
  onLimpiarFiltros: () => void;
  onEditar: (bono: Bono) => void;
  onBorrar: (id: string) => void;
  onGenerarImagen: (bono: Bono) => void;
  generandoImagenBono: boolean;
  formatearFecha: (fecha: string) => string;
  calcularHorario: (
    horaInicio: string,
    duracionMinutos: number
  ) => string;
};

function IconoBuscar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoPersona() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
    </svg>
  );
}

export default function ListadoBonos({
  bonos,
  alumnos,
  relacionesBonoAlumno,
  busquedaBonos,
  filtroEstado,
  filtroMes,
  setBusquedaBonos,
  setFiltroEstado,
  setFiltroMes,
  onLimpiarFiltros,
  onEditar,
  onBorrar,
  onGenerarImagen,
  generandoImagenBono,
  formatearFecha,
  calcularHorario,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600">
          <IconoBono />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Bonos registrados
          </h2>

          <p className="text-sm text-slate-500">
            {bonos.length} bono(s) mostrado(s)
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <IconoBuscar />
          </span>

          <input
            type="text"
            placeholder="Buscar alumno..."
            value={busquedaBonos}
            onChange={(e) =>
              setBusquedaBonos(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) =>
            setFiltroEstado(e.target.value)
          }
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="finalizados">Finalizados</option>
          <option value="inactivos">Inactivos</option>
        </select>

        <input
          type="month"
          value={filtroMes}
          onChange={(e) =>
            setFiltroMes(e.target.value)
          }
          className="rounded-xl border border-slate-300 px-4 py-3"
        />

        <button
          type="button"
          onClick={onLimpiarFiltros}
          className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {bonos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No hay bonos que coincidan con los filtros.
            </p>
          </div>
        ) : (
          bonos.map((bono) => {
            const estaActivo =
              bono.activo &&
              bono.clases_restantes > 0;

            const relacionesDelBono =
              relacionesBonoAlumno.filter(
                (relacion) =>
                  relacion.bono_id === bono.id
              );

            const alumnosAutorizados =
              relacionesDelBono
                .filter(
                  (relacion) =>
                    relacion.alumno_id !==
                    bono.alumno_id
                )
                .map((relacion) =>
                  alumnos.find(
                    (alumno) =>
                      alumno.id ===
                      relacion.alumno_id
                  )
                )
                .filter(
                  (alumno): alumno is Alumno =>
                    !!alumno
                );

            const esCompartido =
              alumnosAutorizados.length > 0;

            const usosRealizados =
              (bono.clase_alumnos || [])
                .filter(
                  (uso) =>
                    uso.usa_bono &&
                    uso.bono_id === bono.id &&
                    uso.clases?.estado ===
                      "realizada"
                )
                .sort((a, b) => {
                  const fechaA =
                    `${a.clases?.fecha || ""} ${
                      a.clases?.hora_inicio || ""
                    }`;

                  const fechaB =
                    `${b.clases?.fecha || ""} ${
                      b.clases?.hora_inicio || ""
                    }`;

                  return fechaB.localeCompare(
                    fechaA
                  );
                });

            const clasesUsadas =
              usosRealizados.length;

            const porcentajeDisponible =
              bono.numero_clases > 0
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      (bono.clases_restantes /
                        bono.numero_clases) *
                        100
                    )
                  )
                : 0;

            return (
              <div
                key={bono.id}
                className={
                  estaActivo
                    ? "rounded-3xl border border-green-200 bg-white p-5"
                    : bono.clases_restantes <= 0
                    ? "rounded-3xl border border-slate-300 bg-white p-5"
                    : "rounded-3xl border border-red-200 bg-white p-5"
                }
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <div className="flex items-start gap-4">
                      <div
                        className={
                          estaActivo
                            ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"
                            : bono.clases_restantes <= 0
                            ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                            : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                        }
                      >
                        <IconoBono />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-slate-900">
                            {bono.alumnos?.nombre}{" "}
                            {bono.alumnos?.apellidos || ""}
                          </p>

                          <span
                            className={
                              estaActivo
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                : bono.clases_restantes <= 0
                                ? "rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                                : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                            }
                          >
                            {estaActivo
                              ? "Activo"
                              : bono.clases_restantes <= 0
                              ? "Finalizado"
                              : "Inactivo"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-purple-600">
                          Titular del bono
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                          <span>
                            Bono de{" "}
                            <strong className="text-slate-800">
                              {bono.numero_clases} clases
                            </strong>
                          </span>

                          <span>
                            Comprado:{" "}
                            <strong className="text-slate-800">
                              {formatearFecha(
                                bono.fecha_compra
                              )}
                            </strong>
                          </span>

                          <span>
                            Importe:{" "}
                            <strong className="text-slate-800">
                              {Number(
                                bono.importe_pagado || 0
                              ).toFixed(2)}{" "}
                              €
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                            Alumnos autorizados
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {esCompartido
                              ? "También pueden utilizar este bono"
                              : "Uso individual"}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700">
                          {alumnosAutorizados.length}
                        </span>
                      </div>

                      {alumnosAutorizados.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-dashed border-purple-200 bg-white/60 px-4 py-3">
                          <p className="text-sm text-slate-500">
                            Sin alumnos autorizados adicionales.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {alumnosAutorizados.map(
                            (alumno) => (
                              <div
                                key={alumno.id}
                                className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                              >
                                <span className="text-purple-600">
                                  <IconoPersona />
                                </span>

                                <span>
                                  {alumno.nombre}{" "}
                                  {alumno.apellidos || ""}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500">
                          Disponibilidad
                        </p>

                        <p className="text-sm font-bold text-slate-700">
                          {bono.clases_restantes} de{" "}
                          {bono.numero_clases}
                        </p>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={
                            bono.clases_restantes <= 0
                              ? "h-full rounded-full bg-slate-400"
                              : "h-full rounded-full bg-[#09a9a3]"
                          }
                          style={{
                            width: `${porcentajeDisponible}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl bg-slate-900 p-5 text-center">
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                        <IconoBono />
                      </div>

                      <p
                        className={
                          bono.clases_restantes > 0
                            ? "mt-4 text-4xl font-bold text-[#25d0c8]"
                            : "mt-4 text-4xl font-bold text-slate-400"
                        }
                      >
                        {bono.clases_restantes}
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        clases restantes
                      </p>

                      <p className="mt-3 text-sm font-medium text-slate-400">
                        {clasesUsadas} uso(s) registrado(s)
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditar(bono)}
                          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                        >
                          <IconoEditar />
                          Editar
                        </button>

                        <button
                          onClick={() => onBorrar(bono.id)}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <IconoPapelera />
                          Borrar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onGenerarImagen(bono)}
                        disabled={generandoImagenBono}
                        className="mt-3 w-full rounded-xl bg-[#09a9a3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generandoImagenBono ? "Generando..." : "Generar PNG"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <IconoCalendario />
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          Historial de uso
                        </p>

                        <p className="text-sm text-slate-500">
                          Clases consumidas con este bono
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {usosRealizados.length} clase(s)
                    </span>
                  </div>

                  {usosRealizados.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
                      <p className="text-sm text-slate-500">
                        Este bono todavía no tiene clases utilizadas.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {usosRealizados.map(
                        (uso, indice) => {
                          if (!uso.clases) {
                            return null;
                          }

                          const fechaUso =
                            formatearFecha(
                              uso.clases.fecha
                            );

                          const horario =
                            calcularHorario(
                              uso.clases.hora_inicio,
                              uso.clases.duracion_minutos
                            );

                          const nombreUsuario =
                            `${uso.alumnos?.nombre || ""} ${
                              uso.alumnos?.apellidos || ""
                            }`.trim();

                          return (
                            <div
                              key={indice}
                              className={
                                esCompartido
                                  ? "grid gap-4 rounded-xl bg-white p-4 md:grid-cols-[80px_120px_180px_minmax(0,1fr)] md:items-center"
                                  : "grid gap-4 rounded-xl bg-white p-4 md:grid-cols-[90px_130px_minmax(0,1fr)] md:items-center"
                              }
                            >
                              <div>
                                <p className="text-xs font-medium text-slate-400">
                                  Uso
                                </p>

                                <p className="mt-1 font-bold text-[#09a9a3]">
                                  #
                                  {usosRealizados.length -
                                    indice}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-400">
                                  Fecha
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                  {fechaUso}
                                </p>
                              </div>

                              {esCompartido && (
                                <div>
                                  <p className="text-xs font-medium text-slate-400">
                                    Alumno
                                  </p>

                                  <p className="mt-1 font-semibold text-purple-700">
                                    {nombreUsuario ||
                                      "Alumno"}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-medium text-slate-400">
                                  Horario
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                  {horario}
                                </p>

                                {uso.clases.ubicaciones
                                  ?.nombre && (
                                  <p className="mt-1 text-sm text-slate-500">
                                    {
                                      uso.clases
                                        .ubicaciones
                                        .nombre
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}