type Props = {
  totalCobrado: number;
  totalPendiente: number;
  totalPrevisto: number;
  numeroPagos: number;
};

function IconoCobrado() {
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

function IconoPendiente() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconoPrevisto() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h14a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V7Z" />
      <path d="M4 7V5h11" />
      <path d="M16 12h4" />
    </svg>
  );
}

function IconoPagos() {
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

export default function ResumenPagos({
  totalCobrado,
  totalPendiente,
  totalPrevisto,
  numeroPagos,
}: Props) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IconoCobrado />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Cobrado
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {totalCobrado.toFixed(2)} €
            </p>

          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <IconoPendiente />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pendiente de cobro
            </p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {totalPendiente.toFixed(2)} €
            </p>

          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <IconoPrevisto />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total previsto
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalPrevisto.toFixed(2)} €
            </p>

          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
            <IconoPagos />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Nº de pagos
            </p>

            <p className="mt-1 text-2xl font-bold text-[#09a9a3]">
              {numeroPagos}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}