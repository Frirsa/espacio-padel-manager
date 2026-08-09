type Props = {
  clasesRealizadas: number;
  totalHoras: number;
  ingresosGenerados: number;
  totalPendiente: number;
  ingresosClubGeneral: number;
  gastosPistaGeneral: number;
};

export default function InformeEconomico({
  clasesRealizadas,
  totalHoras,
  ingresosGenerados,
  totalPendiente,
  ingresosClubGeneral,
  gastosPistaGeneral,
}: Props) {
  const resultadoGeneral =
    ingresosGenerados -
    gastosPistaGeneral;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="px-8 pb-7 pt-8">

        <div className="flex items-center gap-5">

          <img
            src="/logo-espacio-padel.png"
            alt="Espacio Pádel Academy"
            className="h-auto w-[110px] shrink-0"
          />

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#09a9a3]">
              Espacio Pádel Academy
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Resumen económico mensual
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actividad e ingresos generados en el periodo seleccionado
            </p>

          </div>

        </div>

        <div className="mt-7 h-1 rounded-full bg-[#09a9a3]" />

      </div>

      <div className="space-y-8 px-8 pb-10">

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clases realizadas
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {clasesRealizadas}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Horas impartidas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#09a9a3]">
              {totalHoras.toFixed(1)}
            </p>

          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Ingresos generados
            </p>

            <p className="mt-3 text-3xl font-bold text-green-700">
              {ingresosGenerados.toFixed(2)} €
            </p>

          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Pendiente de cobro
            </p>

            <p className="mt-3 text-3xl font-bold text-amber-600">
              {totalPendiente.toFixed(2)} €
            </p>

          </div>

        </div>

        <section>

          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Balance económico
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900">
            Resultado del periodo
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-sm text-slate-500">
                Ingresos de clubs
              </p>

              <p className="mt-2 text-2xl font-bold text-[#09a9a3]">
                {ingresosClubGeneral.toFixed(2)} €
              </p>

            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

              <p className="text-sm text-slate-500">
                Gastos de pista
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {gastosPistaGeneral.toFixed(2)} €
              </p>

            </div>

            <div className="rounded-2xl bg-slate-900 p-5">

              <p className="text-sm text-slate-300">
                Resultado
              </p>

              <p
                className={
                  resultadoGeneral >= 0
                    ? "mt-2 text-2xl font-bold text-[#25d0c8]"
                    : "mt-2 text-2xl font-bold text-red-400"
                }
              >
                {resultadoGeneral.toFixed(2)} €
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}