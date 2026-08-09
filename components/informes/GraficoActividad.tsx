type DatoActividad = {
  mes: string;
  clases: number;
  horas: number;
};

type Props = {
  datos: DatoActividad[];
};

export default function GraficoActividad({
  datos,
}: Props) {
  const maxClases =
    Math.max(
      ...datos.map(
        (dato) =>
          dato.clases
      ),
      1
    );

  const maxHoras =
    Math.max(
      ...datos.map(
        (dato) =>
          dato.horas
      ),
      1
    );

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
          Evolución de actividad
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Clases y horas impartidas
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Comparativa de los últimos 6 meses
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold">

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />

          <span className="text-slate-600">
            Clases
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />

          <span className="text-slate-600">
            Horas
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
                          ? "flex h-[285px] items-end justify-center gap-5 rounded-2xl border-2 border-[#09a9a3] bg-teal-50/50 px-3 pb-4 pt-6"
                          : "flex h-[285px] items-end justify-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-3 pb-4 pt-6"
                      }
                    >

                      <div className="flex h-full w-12 flex-col items-center justify-end">

                        {dato.clases > 0 && (
                          <span className="mb-2 whitespace-nowrap text-[10px] font-bold text-blue-700">
                            {dato.clases}
                          </span>
                        )}

                        <div
                          className="w-6 rounded-t-md bg-blue-500"
                          style={{
                            height:
                              `${Math.max(
                                (
                                  dato.clases /
                                  maxClases
                                ) *
                                  85,
                                dato.clases >
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                          }}
                        />

                      </div>

                      <div className="flex h-full w-12 flex-col items-center justify-end">

                        {dato.horas > 0 && (
                          <span className="mb-2 whitespace-nowrap text-[10px] font-bold text-orange-600">
                            {dato.horas.toFixed(
                              1
                            )} h
                          </span>
                        )}

                        <div
                          className="w-6 rounded-t-md bg-orange-500"
                          style={{
                            height:
                              `${Math.max(
                                (
                                  dato.horas /
                                  maxHoras
                                ) *
                                  85,
                                dato.horas >
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                          }}
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