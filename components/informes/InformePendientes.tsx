export type PendienteCobro = {
  id: string;
  nombre: string;
  concepto: string;
  fecha: string;
  origen: "Clase" | "Bono" | "Club" | string;
  importe: number;
};

type Props = {
  pendientesCobro: PendienteCobro[];
  totalPendiente: number;
};

function formatearFecha(fecha: string) {
  if (!fecha) return "—";

  const [anio, mes, dia] =
    fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

export default function InformePendientes({
  pendientesCobro,
  totalPendiente,
}: Props) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow">
      <div className="px-5 pb-7 pt-8 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
                Pendientes de cobro
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Detalle real de importes todavía pendientes
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-red-50 px-5 py-4 text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">
              Total pendiente
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {totalPendiente.toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="mt-7 h-1 rounded-full bg-[#09a9a3]" />
      </div>

      <div className="px-5 pb-10 sm:px-8">
        {pendientesCobro.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              No existen cobros pendientes en este periodo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Pendiente de
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                    Importe
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendientesCobro.map((pendiente) => (
                  <tr
                    key={pendiente.id}
                    className="border-t border-slate-200"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {pendiente.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pendiente.concepto}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {formatearFecha(pendiente.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-500">
                      {pendiente.origen}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-red-600">
                      {Number(pendiente.importe || 0).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
