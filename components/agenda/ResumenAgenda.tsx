type Props = {
  clasesHoy: number;
  proximasClases: number;
};

function IconoHoy() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h3M13 14h3M8 17h3" />
    </svg>
  );
}

function IconoProximas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function ResumenAgenda({
  clasesHoy,
  proximasClases,
}: Props) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
            <IconoHoy />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Clases de hoy
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {clasesHoy}
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <IconoProximas />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Próximas clases
            </p>

            <p className="mt-1 text-3xl font-bold text-[#09a9a3]">
              {proximasClases}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}