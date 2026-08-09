type Props = {
  ingresos: number;
  gastos: number;
  resultado: number;
  clases: number;
  horas: number;
  ingresoMedio: number;

  alumnosDistintos: number;
  mediaAlumnosClase: number;
  clasesClub: number;
  clasesPropiasPago: number;
  clasesPrivadas: number;
  ingresoMedioHora: number;
  variacionIngresos: number;
variacionGastos: number;
variacionResultado: number;
variacionClases: number;
variacionHoras: number;
};

function IconoEuro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 7.5A6 6 0 0 0 7.5 9" />
      <path d="M6 10h8M6 14h8" />
      <path d="M18 16.5A6 6 0 0 1 7.5 15" />
    </svg>
  );
}

function IconoGasto() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3v18" />
      <path d="m7 8 5-5 5 5" />
    </svg>
  );
}

function IconoResultado() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 17 9 12l4 4 7-9" />
      <path d="M15 7h5v5" />
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
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

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

function IconoMedia() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function IconoPersonas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14c2.5.5 4 2.5 4 5" />
    </svg>
  );
}

function IconoClub() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M9 21v-5h6v5" />
    </svg>
  );
}

function IconoPista() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 12h18" />
    </svg>
  );
}

function IconoCasa() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function PanelEstadisticas({
  ingresos,
  gastos,
  resultado,
  clases,
  horas,
  ingresoMedio,

  alumnosDistintos,
  mediaAlumnosClase,
  clasesClub,
  clasesPropiasPago,
  clasesPrivadas,
ingresoMedioHora,
variacionIngresos,
variacionGastos,
variacionResultado,
variacionClases,
variacionHoras,
}: Props) {
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
          Estadísticas
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Resumen del periodo
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Indicadores principales de la actividad seleccionada
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

        <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                Ingresos
              </p>

              <p className="mt-3 text-3xl font-bold text-green-700">
                {ingresos.toFixed(2)} €
{variacionIngresos === 100 ? (
  <p className="mt-1 text-xs font-semibold text-slate-500">
    Sin datos el mes anterior
  </p>
) : (
  <p
    className={
      variacionIngresos > 0
        ? "mt-1 text-xs font-semibold text-green-700"
        : variacionIngresos < 0
        ? "mt-1 text-xs font-semibold text-red-600"
        : "mt-1 text-xs font-semibold text-slate-500"
    }
  >
    {variacionIngresos > 0 ? "+" : ""}
    {variacionIngresos.toFixed(1)} % vs. mes anterior
  </p>
)}         
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-green-600">
              <IconoEuro />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                Gastos
              </p>

              <p className="mt-3 text-3xl font-bold text-red-600">
                {gastos.toFixed(2)} €
                <p
  className={
    variacionGastos > 0
      ? "mt-1 text-xs font-semibold text-red-600"
      : variacionGastos < 0
      ? "mt-1 text-xs font-semibold text-green-700"
      : "mt-1 text-xs font-semibold text-slate-500"
  }
>
  {variacionGastos > 0 ? "+" : ""}
  {variacionGastos.toFixed(1)} % vs. mes anterior
</p>
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600">
              <IconoGasto />
            </div>

          </div>
        </div>

        <div
          className={
            resultado >= 0
              ? "rounded-2xl border border-teal-200 bg-teal-50 p-5"
              : "rounded-2xl border border-red-200 bg-red-50 p-5"
          }
        >
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Resultado
              </p>

              <p
                className={
                  resultado >= 0
                    ? "mt-3 text-3xl font-bold text-[#078b86]"
                    : "mt-3 text-3xl font-bold text-red-600"
                }
              >
                {resultado.toFixed(2)} €
{variacionResultado === 100 ? (
  <p className="mt-1 text-xs font-semibold text-slate-500">
    Sin datos el mes anterior
  </p>
) : (
  <p
    className={
      variacionResultado > 0
        ? "mt-1 text-xs font-semibold text-green-700"
        : variacionResultado < 0
        ? "mt-1 text-xs font-semibold text-red-600"
        : "mt-1 text-xs font-semibold text-slate-500"
    }
  >
    {variacionResultado > 0 ? "+" : ""}
    {variacionResultado.toFixed(1)} % vs. mes anterior
  </p>
)}
              </p>
            </div>

            <div
              className={
                resultado >= 0
                  ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#09a9a3]"
                  : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600"
              }
            >
              <IconoResultado />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Clases
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {clases}
{variacionClases === 100 ? (
  <p className="mt-1 text-xs font-semibold text-slate-500">
    Sin datos el mes anterior
  </p>
) : (
  <p
    className={
      variacionClases > 0
        ? "mt-1 text-xs font-semibold text-green-700"
        : variacionClases < 0
        ? "mt-1 text-xs font-semibold text-red-600"
        : "mt-1 text-xs font-semibold text-slate-500"
    }
  >
    {variacionClases > 0 ? "+" : ""}
    {variacionClases.toFixed(1)} % vs. mes anterior
  </p>
)}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <IconoCalendario />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Horas
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {horas.toFixed(1)}
{variacionHoras === 100 ? (
  <p className="mt-1 text-xs font-semibold text-slate-500">
    Sin datos el mes anterior
  </p>
) : (
  <p
    className={
      variacionHoras > 0
        ? "mt-1 text-xs font-semibold text-green-700"
        : variacionHoras < 0
        ? "mt-1 text-xs font-semibold text-red-600"
        : "mt-1 text-xs font-semibold text-slate-500"
    }
  >
    {variacionHoras > 0 ? "+" : ""}
    {variacionHoras.toFixed(1)} % vs. mes anterior
  </p>
)}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <IconoReloj />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Ingreso medio
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {ingresoMedio.toFixed(2)} €
              </p>

              <p className="mt-1 text-xs text-slate-500">
                por clase
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <IconoMedia />
            </div>

          </div>
        </div>

      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">

        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Análisis de actividad
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Alumnos distintos
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {alumnosDistintos}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                <IconoPersonas />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Media alumnos
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {mediaAlumnosClase.toFixed(1)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  por clase
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <IconoPersonas />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Clases para club
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {clasesClub}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <IconoClub />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Propias en pista de pago
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {clasesPropiasPago}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <IconoPista />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pistas privadas
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {clasesPrivadas}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                <IconoCasa />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ingreso medio
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {ingresoMedioHora.toFixed(2)} €
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  por hora
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <IconoReloj />
              </div>

            </div>
          </div>

        </div>

      </div>

    </section>
  );
}