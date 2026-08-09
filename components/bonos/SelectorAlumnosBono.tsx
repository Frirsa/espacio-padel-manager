type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Props = {
  alumnos: Alumno[];
  titularId: string;
  alumnosAutorizados: string[];
  setAlumnosAutorizados: (alumnos: string[]) => void;
};

function IconoFamilia() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 20c0-4 2.5-7 6-7s6 3 6 7" />
      <path d="M14 14c3.5 0 6 2.3 6 6" />
    </svg>
  );
}

export default function SelectorAlumnosBono({
  alumnos,
  titularId,
  alumnosAutorizados,
  setAlumnosAutorizados,
}: Props) {
  function cambiarAlumno(
    alumnoId: string
  ) {
    if (alumnoId === titularId) {
      return;
    }

    if (
      alumnosAutorizados.includes(
        alumnoId
      )
    ) {
      setAlumnosAutorizados(
        alumnosAutorizados.filter(
          (id) => id !== alumnoId
        )
      );
    } else {
      setAlumnosAutorizados([
        ...alumnosAutorizados,
        alumnoId,
      ]);
    }
  }

  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple-600">
          <IconoFamilia />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-900">
            Bono compartido
          </p>

          <p className="text-xs text-slate-500">
            Selecciona otros alumnos que podrán utilizar este bono
          </p>
        </div>

      </div>

      {!titularId ? (

        <p className="mt-4 text-sm text-slate-500">
          Primero selecciona el titular del bono.
        </p>

      ) : (

        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">

          {alumnos.map((alumno) => {
            const esTitular =
              alumno.id === titularId;

            const seleccionado =
              esTitular ||
              alumnosAutorizados.includes(
                alumno.id
              );

            return (
              <label
                key={alumno.id}
                className={
                  esTitular
                    ? "flex items-center justify-between rounded-xl border border-purple-200 bg-white px-4 py-3"
                    : "flex cursor-pointer items-center justify-between rounded-xl bg-white px-4 py-3 transition hover:bg-purple-100"
                }
              >

                <div className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={seleccionado}
                    disabled={esTitular}
                    onChange={() =>
                      cambiarAlumno(
                        alumno.id
                      )
                    }
                    className="h-4 w-4 accent-purple-600"
                  />

                  <span className="text-sm font-medium text-slate-800">
                    {alumno.nombre}{" "}
                    {alumno.apellidos || ""}
                  </span>

                </div>

                {esTitular && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-purple-700">
                    TITULAR
                  </span>
                )}

              </label>
            );
          })}

        </div>

      )}

    </div>
  );
}