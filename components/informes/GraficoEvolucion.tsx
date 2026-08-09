type DatoEvolucion = {
  mes: string;
  ingresos: number;
  gastos: number;
  resultado: number;
  clases: number;
  horas: number;
};

type Props = {
  datos: DatoEvolucion[];
};

export default function GraficoEvolucion({
  datos,
}: Props) {
  const maximo =
    Math.max(
      ...datos.flatMap(
        (dato) => [
          dato.ingresos,
          dato.gastos,
          Math.abs(
            dato.resultado
          ),
        ]
      ),
      1
    );

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
          Evolución mensual
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Ingresos, gastos y resultado
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Comparativa de los últimos 6 meses
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold">

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-slate-600">
            Ingresos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-slate-600">
            Gastos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-teal-500" />
          <span className="text-slate-600">
            Resultado
          </span>
        </div>

      </div>

      <div className="mt-8 overflow-x-auto">

        <div className="min-w-[760px]">

          <div className="grid grid-cols-6 gap-5">

            {datos.map(
              (dato, indice) => {
                const esMesSeleccionado =
                  indice ===
                  datos.length - 1;

                return (
                  <div
                    key={dato.mes}
                    className="flex flex-col"
                  >

                    <div
                      className={
                        esMesSeleccionado
                          ? "flex h-[285px] items-end justify-center gap-3 rounded-2xl border-2 border-[#09a9a3] bg-teal-50/50 px-3 pb-4 pt-6"
                          : "flex h-[285px] items-end justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 pb-4 pt-6"
                      }
                    >

                      <div className="flex h-full w-10 flex-col items-center justify-end">

                        {dato.ingresos > 0 && (
                          <span className="mb-2 whitespace-nowrap text-[10px] font-bold text-green-700">
                            {dato.ingresos.toFixed(0)} €
                          </span>
                        )}

                        <div
                          className="w-5 rounded-t-md bg-green-500"
                          style={{
                            height:
                              `${Math.max(
                                (
                                  dato.ingresos /
                                  maximo
                                ) *
                                  85,
                                dato.ingresos >
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                          }}
                          title={`Ingresos: ${dato.ingresos.toFixed(
                            2
                          )} €`}
                        />

                      </div>

                      <div className="flex h-full w-10 flex-col items-center justify-end">

                        {dato.gastos > 0 && (
                          <span className="mb-2 whitespace-nowrap text-[10px] font-bold text-red-600">
                            {dato.gastos.toFixed(0)} €
                          </span>
                        )}

                        <div
                          className="w-5 rounded-t-md bg-red-500"
                          style={{
                            height:
                              `${Math.max(
                                (
                                  dato.gastos /
                                  maximo
                                ) *
                                  85,
                                dato.gastos >
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                          }}
                          title={`Gastos: ${dato.gastos.toFixed(
                            2
                          )} €`}
                        />

                      </div>

                      <div className="flex h-full w-10 flex-col items-center justify-end">

                        {dato.resultado !== 0 && (
                          <span
                            className={
                              dato.resultado >= 0
                                ? "mb-2 whitespace-nowrap text-[10px] font-bold text-[#078b86]"
                                : "mb-2 whitespace-nowrap text-[10px] font-bold text-red-600"
                            }
                          >
                            {dato.resultado.toFixed(0)} €
                          </span>
                        )}

                        <div
                          className={
                            dato.resultado >= 0
                              ? "w-5 rounded-t-md bg-teal-500"
                              : "w-5 rounded-t-md bg-red-700"
                          }
                          style={{
                            height:
                              `${Math.max(
                                (
                                  Math.abs(
                                    dato.resultado
                                  ) /
                                  maximo
                                ) *
                                  85,
                                dato.resultado !==
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                          }}
                          title={`Resultado: ${dato.resultado.toFixed(
                            2
                          )} €`}
                        />

                      </div>

                    </div>

                    <p
                      className={
                        esMesSeleccionado
                          ? "mt-3 text-center text-sm font-bold text-[#078b86]"
                          : "mt-3 text-center text-sm font-bold text-slate-700"
                      }
                    >
                      {dato.mes}
                    </p>

                    {esMesSeleccionado && (
                      <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#09a9a3]">
                        Mes seleccionado
                      </p>
                    )}

                    <p className="mt-1 text-center text-xs text-slate-500">
                      {dato.clases} clase
                      {dato.clases === 1
                        ? ""
                        : "s"}
                    </p>

                    <p className="mt-0.5 text-center text-xs text-slate-400">
                      {dato.horas.toFixed(
                        1
                      )} h
                    </p>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>

    </section>
  );
}