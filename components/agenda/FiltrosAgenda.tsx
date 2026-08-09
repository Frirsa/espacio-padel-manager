type Props = {
  busqueda: string;
  filtroEstado: string;
  filtroMes: string;
  totalClases: number;
  setBusqueda: (valor: string) => void;
  setFiltroEstado: (valor: string) => void;
  setFiltroMes: (valor: string) => void;
  onLimpiar: () => void;
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

function IconoFiltro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

export default function FiltrosAgenda({
  busqueda,
  filtroEstado,
  filtroMes,
  totalClases,
  setBusqueda,
  setFiltroEstado,
  setFiltroMes,
  onLimpiar,
}: Props) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <IconoFiltro />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Filtrar agenda
          </h2>

          <p className="text-sm text-slate-500">
            {totalClases} clase(s) mostrada(s)
          </p>
        </div>

      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <div className="relative">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <IconoBuscar />
          </span>

          <input
            type="text"
            placeholder="Alumno o ubicación..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
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
          <option value="todas">
            Todos los estados
          </option>

          <option value="programada">
            Programadas
          </option>

          <option value="realizada">
            Realizadas
          </option>

          <option value="cancelada">
            Canceladas
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
          onClick={onLimpiar}
          className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
        >
          Limpiar filtros
        </button>

      </div>

    </div>
  );
}