import SelectorAlumnosBono from "./SelectorAlumnosBono";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Props = {
  alumnos: Alumno[];
  alumnoId: string;
  busquedaAlumno: string;
  numeroClases: string;
  clasesRestantes: string;
  importe: string;
  fechaCompra: string;
  activo: boolean;
  bonoEditandoId: string | null;
  mensaje: string;

  alumnosAutorizados: string[];

  setAlumnoId: (valor: string) => void;
  setBusquedaAlumno: (valor: string) => void;
  setNumeroClases: (valor: string) => void;
  setClasesRestantes: (valor: string) => void;
  setImporte: (valor: string) => void;
  setFechaCompra: (valor: string) => void;
  setActivo: (valor: boolean) => void;

  setAlumnosAutorizados: (
    alumnos: string[]
  ) => void;

  onGuardar: (
    e: React.FormEvent
  ) => void;

  onCancelar: () => void;
};

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

export default function FormularioBono({
  alumnos,
  alumnoId,
  busquedaAlumno,
  numeroClases,
  clasesRestantes,
  importe,
  fechaCompra,
  activo,
  bonoEditandoId,
  mensaje,
  alumnosAutorizados,
  setAlumnoId,
  setBusquedaAlumno,
  setNumeroClases,
  setClasesRestantes,
  setImporte,
  setFechaCompra,
  setActivo,
  setAlumnosAutorizados,
  onGuardar,
  onCancelar,
}: Props) {
  const alumnosFiltrados =
    alumnos.filter(
      (alumno) => {
        const nombreCompleto =
          `${alumno.nombre} ${
            alumno.apellidos || ""
          }`.toLowerCase();

        return nombreCompleto.includes(
          busquedaAlumno.toLowerCase()
        );
      }
    );

  function cambiarTitular(
    nuevoTitular: string
  ) {
    setAlumnoId(
      nuevoTitular
    );

    if (
      nuevoTitular &&
      alumnosAutorizados.includes(
        nuevoTitular
      )
    ) {
      setAlumnosAutorizados(
        alumnosAutorizados.filter(
          (id) =>
            id !== nuevoTitular
        )
      );
    }
  }

  function cambiarNumeroClases(
    valor: string
  ) {
    setNumeroClases(
      valor
    );

    if (!bonoEditandoId) {
      setClasesRestantes(
        valor
      );
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600">
          <IconoBono />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {bonoEditandoId
              ? "Editar bono"
              : "Nuevo bono"}
          </h2>

          <p className="text-sm text-slate-500">
            Crea o modifica un bono de clases
          </p>
        </div>

      </div>

      <form
        onSubmit={onGuardar}
        className="mt-6 space-y-4"
      >

        <div>

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Titular del bono
          </label>

          <input
            type="text"
            placeholder="Buscar alumno..."
            value={
              busquedaAlumno
            }
            onChange={(e) =>
              setBusquedaAlumno(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />

          <select
            value={alumnoId}
            onChange={(e) =>
              cambiarTitular(
                e.target.value
              )
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Seleccionar titular
            </option>

            {alumnosFiltrados.map(
              (alumno) => (
                <option
                  key={alumno.id}
                  value={alumno.id}
                >
                  {alumno.nombre}{" "}
                  {alumno.apellidos || ""}
                </option>
              )
            )}
          </select>

        </div>

        <SelectorAlumnosBono
          alumnos={alumnos}
          titularId={
            alumnoId
          }
          alumnosAutorizados={
            alumnosAutorizados
          }
          setAlumnosAutorizados={
            setAlumnosAutorizados
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Número de clases
            </label>

            <input
              type="number"
              min="1"
              step="1"
              required
              placeholder="Ejemplo: 5, 10, 12..."
              value={
                numeroClases
              }
              onChange={(e) =>
                cambiarNumeroClases(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <p className="mt-2 text-xs text-slate-400">
              Puedes crear bonos con cualquier número de clases.
            </p>

          </div>

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Fecha de compra
            </label>

            <input
              type="date"
              value={
                fechaCompra
              }
              onChange={(e) =>
                setFechaCompra(
                  e.target.value
                )
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

          </div>

        </div>

        {bonoEditandoId && (

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Clases restantes
            </label>

            <input
              type="number"
              min="0"
              max={
                numeroClases
              }
              step="1"
              required
              placeholder="Clases restantes"
              value={
                clasesRestantes
              }
              onChange={(e) =>
                setClasesRestantes(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <p className="mt-2 text-xs text-slate-400">
              No puede superar el número total de clases del bono.
            </p>

          </div>

        )}

        <div>

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Importe pagado
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Importe pagado"
            value={
              importe
            }
            onChange={(e) =>
              setImporte(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />

        </div>

        {bonoEditandoId && (

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Estado
            </label>

            <select
              value={
                activo
                  ? "activo"
                  : "inactivo"
              }
              onChange={(e) =>
                setActivo(
                  e.target.value ===
                    "activo"
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="activo">
                Activo
              </option>

              <option value="inactivo">
                Inactivo
              </option>
            </select>

          </div>

        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
        >
          {bonoEditandoId
            ? "Guardar cambios"
            : "Crear bono"}
        </button>

        {bonoEditandoId && (

          <button
            type="button"
            onClick={
              onCancelar
            }
            className="w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800"
          >
            Cancelar edición
          </button>

        )}

      </form>

      {mensaje && (
        <p className="mt-4 text-sm">
          {mensaje}
        </p>
      )}

    </div>
  );
}