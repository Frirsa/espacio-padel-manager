import type { Clase } from "./tipos";
import {
  calcularHorario,
  formatearFecha,
  obtenerNombreAlumnos,
  obtenerNombreMes,
} from "./utils";

type Props = {
  mes: string;
  clasesParaClub: Clase[];
  clasesPropiasIQL: Clase[];
  totalClub: number;
  totalAlquiler: number;
  saldoIQL: number;
  totalHorasClub: number;
  totalHorasPropias: number;
};

export default function InformeIQL({
  mes,
  clasesParaClub,
  clasesPropiasIQL,
  totalClub,
  totalAlquiler,
  saldoIQL,
  totalHorasClub,
  totalHorasPropias,
}: Props) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow">

      <div className="px-8 pb-7 pt-8">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-5">

            <img
              src="/logo-espacio-padel.png"
              alt="Espacio Pádel Academy"
              className="h-auto w-[115px] shrink-0"
            />

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#09a9a3]">
                Espacio Pádel Academy
              </p>

              <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
                Liquidación mensual
              </h2>

              <p className="mt-1 text-base font-semibold text-slate-500">
                IQL
              </p>

            </div>

          </div>

          <div className="rounded-2xl bg-slate-50 px-5 py-4 text-left sm:text-right">

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Periodo
            </p>

            <p className="mt-1 text-base font-bold text-slate-800">
              {obtenerNombreMes(mes)}
            </p>

          </div>

        </div>

        <div className="mt-7 h-1 rounded-full bg-[#09a9a3]" />

      </div>

      <div className="space-y-10 px-8 pb-10">

        <section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Servicios para el club
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Clases impartidas para IQL
              </h3>

            </div>

            <div className="sm:text-right">

              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#078f8a]">
                IQL debe abonar
              </p>

              <p className="mt-1 text-xl font-bold text-[#09a9a3]">
                {totalClub.toFixed(2)} €
              </p>

            </div>

          </div>

          {clasesParaClub.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
              <p className="text-sm text-slate-500">
                No hay clases para IQL registradas en este mes.
              </p>
            </div>

          ) : (

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">

              <table className="w-full min-w-[700px] border-collapse">

                <thead className="bg-slate-900 text-white">

                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Fecha
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Horario
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Alumnos
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Importe
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {clasesParaClub.map((clase) => (

                    <tr
                      key={clase.id}
                      className="border-t border-slate-200"
                    >

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">
                        {formatearFecha(clase.fecha)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {calcularHorario(
                          clase.hora_inicio,
                          clase.duracion_minutos
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {obtenerNombreAlumnos(clase) || "Sin alumnos"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-[#09a9a3]">
                        {Number(clase.importe_club || 0).toFixed(2)} €
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

          <div className="mt-4 flex flex-wrap justify-end gap-x-7 gap-y-2 text-sm text-slate-500">

            <span>
              Clases:{" "}
              <strong className="text-slate-800">
                {clasesParaClub.length}
              </strong>
            </span>

            <span>
              Horas:{" "}
              <strong className="text-slate-800">
                {totalHorasClub.toFixed(1)}
              </strong>
            </span>

            <span>
              Total:{" "}
              <strong className="text-[#09a9a3]">
                {totalClub.toFixed(2)} €
              </strong>
            </span>

          </div>

        </section>

        <section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Uso de instalaciones
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Clases propias en IQL
              </h3>

            </div>

            <div className="sm:text-right">

              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">
                A pagar a IQL
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                {totalAlquiler.toFixed(2)} €
              </p>

            </div>

          </div>

          {clasesPropiasIQL.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
              <p className="text-sm text-slate-500">
                No hay clases propias en IQL registradas en este mes.
              </p>
            </div>

          ) : (

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">

              <table className="w-full min-w-[700px] border-collapse">

                <thead className="bg-slate-900 text-white">

                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Fecha
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Horario
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Importe
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {clasesPropiasIQL.map((clase) => (

                    <tr
                      key={clase.id}
                      className="border-t border-slate-200"
                    >

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">
                        {formatearFecha(clase.fecha)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {calcularHorario(
                          clase.hora_inicio,
                          clase.duracion_minutos
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-red-600">
                        {Number(clase.coste_pista || 0).toFixed(2)} €
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

          <div className="mt-4 flex flex-wrap justify-end gap-x-7 gap-y-2 text-sm text-slate-500">

            <span>
              Clases:{" "}
              <strong className="text-slate-800">
                {clasesPropiasIQL.length}
              </strong>
            </span>

            <span>
              Horas:{" "}
              <strong className="text-slate-800">
                {totalHorasPropias.toFixed(1)}
              </strong>
            </span>

            <span>
              Total:{" "}
              <strong className="text-red-600">
                {totalAlquiler.toFixed(2)} €
              </strong>
            </span>

          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200">

          <div className="grid gap-0 sm:grid-cols-3">

            <div className="border-b border-slate-200 bg-slate-50 p-5 sm:border-b-0 sm:border-r">

              <p className="text-xs font-medium text-slate-500">
                IQL debe abonar
              </p>

              <p className="mt-2 text-xl font-bold text-[#09a9a3]">
                {totalClub.toFixed(2)} €
              </p>

            </div>

            <div className="border-b border-slate-200 bg-slate-50 p-5 sm:border-b-0 sm:border-r">

              <p className="text-xs font-medium text-slate-500">
                A pagar a IQL
              </p>

              <p className="mt-2 text-xl font-bold text-red-600">
                - {totalAlquiler.toFixed(2)} €
              </p>

            </div>

            <div className="bg-slate-900 p-5 text-left sm:text-right">

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                Saldo final
              </p>

              <p
                className={
                  saldoIQL >= 0
                    ? "mt-2 text-2xl font-bold text-[#25d0c8]"
                    : "mt-2 text-2xl font-bold text-red-400"
                }
              >
                {saldoIQL.toFixed(2)} €
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}