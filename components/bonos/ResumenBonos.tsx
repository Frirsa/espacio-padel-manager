type Props = {
  bonosActivos: number;
  clasesDisponibles: number;
  bonosFinalizados: number;
  importeBonos: number;
};

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

function IconoClases() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function IconoFinalizados() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 10.5 15 16 9.5" />
    </svg>
  );
}

function IconoImporte() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
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

export default function ResumenBonos({
  bonosActivos,
  clasesDisponibles,
  bonosFinalizados,
  importeBonos,
}: Props) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IconoBono />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Bonos activos
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {bonosActivos}
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
            <IconoClases />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Clases disponibles
            </p>

            <p className="mt-1 text-2xl font-bold text-[#09a9a3]">
              {clasesDisponibles}
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <IconoFinalizados />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Bonos finalizados
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-700">
              {bonosFinalizados}
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <IconoImporte />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Importe de bonos
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {importeBonos.toFixed(2)} €
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}