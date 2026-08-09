type DatoAlumno = {
  alumnoId: string;
  nombre: string;
  clases: number;
  horas: number;
  ingresos: number;
  pendiente: number;
};

type Props = {
  datos: DatoAlumno[];
};

function IconoPersona() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19c.5-3.5 2.5-5.5 5.5-5.5s5 2 5.5 5.5" />
    </svg>
  );
}

export default function ResumenAlumnos({
  datos,
}: Props) {
  const datosOrdenados = [
    ...datos,
  ].sort(
    (a, b) =>
      b.ingresos - a.ingresos
  );

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
          <IconoPersona />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
            Alumnos
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Resumen por alumno
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Actividad económica y deportiva del periodo seleccionado
          </p>
        </div>

      </div>

      {datosOrdenados.length === 0 ? (

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">

          <p className="font-semibold text-slate-600">
            No hay alumnos con clases realizadas en este periodo
          </p>

        </div>

      ) : (

        <div className="mt-6 overflow-x-auto">

          <div className="min-w-[760px]">

            <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_1fr_1fr] gap-3 border-b border-slate-200 px-4 pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">

              <div>Alumno</div>

              <div className="text-center">
                Clases
              </div>

              <div className="text-center">
                Horas
              </div>

              <div className="text-center text-green-700">
                Ingresos
              </div>

              <div className="text-center text-red-600">
                Pendiente
              </div>

            </div>

            <div className="divide-y divide-slate-100">

              {datosOrdenados.map(
                (alumno) => (
                  <div
                    key={alumno.alumnoId}
                    className="grid grid-cols-[1.5fr_0.7fr_0.7fr_1fr_1fr] gap-3 px-4 py-4 text-sm"
                  >

                    <div className="font-semibold text-slate-900">
                      {alumno.nombre}
                    </div>

                    <div className="text-center font-semibold text-slate-700">
                      {alumno.clases}
                    </div>

                    <div className="text-center font-semibold text-slate-700">
                      {alumno.horas.toFixed(1)}
                    </div>

                    <div className="text-center font-bold text-green-700">
                      {alumno.ingresos.toFixed(2)} €
                    </div>

                    <div
                      className={
                        alumno.pendiente > 0
                          ? "text-center font-bold text-red-600"
                          : "text-center font-semibold text-slate-400"
                      }
                    >
                      {alumno.pendiente.toFixed(2)} €
                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      )}

    </section>
  );
}