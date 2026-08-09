type Pago = {
  id: string;
  alumno_id: string | null;
  importe: number;
  metodo: string;
  estado: string;
  fecha_pago: string;
  notas: string | null;

  clases: {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    tipo: string;
    ubicaciones: {
      nombre: string;
    } | null;
  } | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

type Props = {
  pagos: Pago[];
  busquedaPagos: string;
  filtroEstado: string;
  filtroMetodo: string;
  filtroMes: string;
  setBusquedaPagos: (valor: string) => void;
  setFiltroEstado: (valor: string) => void;
  setFiltroMetodo: (valor: string) => void;
  setFiltroMes: (valor: string) => void;
  onLimpiarFiltros: () => void;
  onEditar: (pago: Pago) => void;
  onBorrar: (id: string) => void;
  formatearFecha: (fecha: string) => string;
  textoMetodo: (metodo: string) => string;
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

function IconoPago() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export default function ListadoPagos({
  pagos,
  busquedaPagos,
  filtroEstado,
  filtroMetodo,
  filtroMes,
  setBusquedaPagos,
  setFiltroEstado,
  setFiltroMetodo,
  setFiltroMes,
  onLimpiarFiltros,
  onEditar,
  onBorrar,
  formatearFecha,
  textoMetodo,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <IconoPago />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Pagos registrados
          </h2>

          <p className="text-sm text-slate-500">
            {pagos.length} pago(s) mostrado(s)
          </p>
        </div>

      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">

        <div className="relative">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <IconoBuscar />
          </span>

          <input
            type="text"
            placeholder="Buscar alumno..."
            value={busquedaPagos}
            onChange={(e) =>
              setBusquedaPagos(e.target.value)
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
          <option value="todos">
            Todos los estados
          </option>

          <option value="pagado">
            Pagados
          </option>

          <option value="pendiente">
            Pendientes
          </option>
        </select>

        <select
          value={filtroMetodo}
          onChange={(e) =>
            setFiltroMetodo(e.target.value)
          }
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="todos">
            Todos los métodos
          </option>

          <option value="efectivo">
            Efectivo
          </option>

          <option value="bizum">
            Bizum
          </option>

          <option value="transferencia">
            Transferencia
          </option>

          <option value="tarjeta">
            Tarjeta
          </option>
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

      <div className="mt-6 space-y-3">

        {pagos.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">
              No hay pagos que coincidan con los filtros.
            </p>

          </div>

        ) : (

          pagos.map((pago) => (

            <div
              key={pago.id}
              className={
                pago.estado === "pagado"
                  ? "rounded-2xl border border-green-200 bg-white p-5"
                  : "rounded-2xl border border-red-200 bg-white p-5"
              }
            >

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">

                <div className="flex min-w-0 gap-4">

                  <div
                    className={
                      pago.estado === "pagado"
                        ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"
                        : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                    }
                  >
                    <IconoPago />
                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="font-bold text-slate-900">
                        {pago.alumnos
                          ? `${pago.alumnos.nombre} ${
                              pago.alumnos.apellidos || ""
                            }`
                          : "Sin alumno"}
                      </p>

                      <span
                        className={
                          pago.estado === "pagado"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {pago.estado === "pagado"
                          ? "Pagado"
                          : "Pendiente"}
                      </span>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">

                      <span>
                        Fecha:{" "}
                        <strong className="text-slate-800">
                          {formatearFecha(
                            pago.fecha_pago
                          )}
                        </strong>
                      </span>

                      <span>
                        Método:{" "}
                        <strong className="text-slate-800">
                          {textoMetodo(
                            pago.metodo
                          )}
                        </strong>
                      </span>

                    </div>

                    {pago.notas && (
                      <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">

                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Notas
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {pago.notas}
                        </p>

                      </div>
                    )}

                  </div>

                </div>

                <div className="lg:text-right">

                  <p
                    className={
                      pago.estado === "pagado"
                        ? "text-3xl font-bold text-green-600"
                        : "text-3xl font-bold text-red-600"
                    }
                  >
                    {Number(
                      pago.importe
                    ).toFixed(2)}{" "}
                    €
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">

                    <button
                      onClick={() =>
                        onEditar(pago)
                      }
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <IconoEditar />
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        onBorrar(pago.id)
                      }
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <IconoPapelera />
                      Borrar
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}