type Props = {
  clasesHoy: number;
  proximasClases: number;
};

function IconoHoy() {
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
      <path d="M8 14h3M13 14h3M8 17h3" />
    </svg>
  );
}

function IconoProximas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
    <div className="mt-4 grid gap-3 sm:grid-cols-2">

      <div className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_5px_18px_rgba(15,23,42,0.025)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F5] text-[#00A79C]">
          <IconoHoy />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Clases de hoy
          </p>

          <p className="mt-1 text-2xl font-bold leading-none text-[#17324D]">
            {clasesHoy}
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Programadas, realizadas o canceladas
          </p>
        </div>
      </div>

      <div className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_5px_18px_rgba(15,23,42,0.025)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#17324D]">
          <IconoProximas />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Próximas clases
          </p>

          <p className="mt-1 text-2xl font-bold leading-none text-[#17324D]">
            {proximasClases}
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Desde hoy en adelante
          </p>
        </div>
      </div>

    </div>
  );
}
