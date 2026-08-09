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

function IconoTrofeo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4" />
      <path d="M16 6h4v2a4 4 0 0 1-4 4" />
      <path d="M12 12v5" />
      <path d="M9 21h6" />
      <path d="M10 17h4" />
    </svg>
  );
}

function medalla(
  posicion: number
) {
  if (posicion === 1) {
    return "🥇";
  }

  if (posicion === 2) {
    return "🥈";
  }

  if (posicion === 3) {
    return "🥉";
  }

  return `${posicion}.`;
}

export default function RankingAlumnos({
  datos,
}: Props) {
  const porIngresos = [
    ...datos,
  ]
    .sort(
      (a, b) =>
        b.ingresos -
        a.ingresos
    )
    .slice(0, 5);

  const porClases = [
    ...datos,
  ]
    .sort(
      (a, b) =>
        b.clases -
        a.clases
    )
    .slice(0, 5);
const posicionIngresos = (
  alumno: DatoAlumno
) =>
  porIngresos.findIndex(
    (otro) =>
      otro.ingresos ===
      alumno.ingresos
  ) + 1;

const posicionClases = (
  alumno: DatoAlumno
) =>
  porClases.findIndex(
    (otro) =>
      otro.clases ===
      alumno.clases
  ) + 1;
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <IconoTrofeo />
        </div>

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
            Ranking
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Alumnos con mayor actividad
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Clasificación del periodo seleccionado
          </p>

        </div>

      </div>

      {datos.length === 0 ? (

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">

          <p className="font-semibold text-slate-600">
            No hay datos suficientes para mostrar el ranking
          </p>

        </div>

      ) : (

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Por ingresos generados
            </p>

            <div className="mt-4 space-y-3">

              {porIngresos.map(
                (
                  alumno,
                  posicion
                ) => (

                  <div
                    key={
                      alumno.alumnoId
                    }
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <span className="w-7 shrink-0 text-center text-lg">
                       {medalla(
  posicionIngresos(alumno)
)}
                      </span>

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-slate-900">
                          {alumno.nombre}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {alumno.clases} clase
                          {alumno.clases === 1
                            ? ""
                            : "s"}
                        </p>

                      </div>

                    </div>

                    <p className="shrink-0 font-bold text-green-700">
                      {alumno.ingresos.toFixed(
                        2
                      )} €
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Por número de clases
            </p>

            <div className="mt-4 space-y-3">

              {porClases.map(
                (
                  alumno,
                  posicion
                ) => (

                  <div
                    key={
                      alumno.alumnoId
                    }
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <span className="w-7 shrink-0 text-center text-lg">
{medalla(
  posicionClases(alumno)
)}
                      </span>

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-slate-900">
                          {alumno.nombre}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {alumno.horas.toFixed(
                            1
                          )} h
                        </p>

                      </div>

                    </div>

                    <p className="shrink-0 text-xl font-bold text-blue-600">
                      {alumno.clases}
                    </p>

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