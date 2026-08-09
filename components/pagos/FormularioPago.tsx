type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Props = {
  alumnos: Alumno[];
  alumnoId: string;
  busquedaAlumno: string;
  importe: string;
  metodo: string;
  estado: string;
  fechaPago: string;
  notas: string;
  pagoEditandoId: string | null;
  mensaje: string;
  setAlumnoId: (valor: string) => void;
  setBusquedaAlumno: (valor: string) => void;
  setImporte: (valor: string) => void;
  setMetodo: (valor: string) => void;
  setEstado: (valor: string) => void;
  setFechaPago: (valor: string) => void;
  setNotas: (valor: string) => void;
  onGuardar: (e: React.FormEvent) => void;
  onCancelar: () => void;
};

function IconoPago() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M15 15h3" />
    </svg>
  );
}

export default function FormularioPago({
  alumnos,
  alumnoId,
  busquedaAlumno,
  importe,
  metodo,
  estado,
  fechaPago,
  notas,
  pagoEditandoId,
  mensaje,
  setAlumnoId,
  setBusquedaAlumno,
  setImporte,
  setMetodo,
  setEstado,
  setFechaPago,
  setNotas,
  onGuardar,
  onCancelar,
}: Props) {
  const alumnosFiltrados =
    alumnos.filter((alumno) => {
      const nombreCompleto =
        `${alumno.nombre} ${
          alumno.apellidos || ""
        }`.toLowerCase();

      return nombreCompleto.includes(
        busquedaAlumno.toLowerCase()
      );
    });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
          <IconoPago />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {pagoEditandoId
              ? "Editar pago"
              : "Nuevo pago"}
          </h2>

          <p className="text-sm text-slate-500">
            Registra un cobro o un importe pendiente
          </p>
        </div>

      </div>

      <form
        onSubmit={onGuardar}
        className="mt-6 space-y-4"
      >

        <div>

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Alumno
          </label>

          <input
            type="text"
            placeholder="Buscar alumno..."
            value={busquedaAlumno}
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
              setAlumnoId(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Sin alumno
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

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Fecha
            </label>

            <input
              type="date"
              value={fechaPago}
              onChange={(e) =>
                setFechaPago(
                  e.target.value
                )
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

          </div>

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Importe
            </label>

            <input
              type="number"
              step="0.01"
              placeholder="Importe"
              value={importe}
              onChange={(e) =>
                setImporte(
                  e.target.value
                )
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

          </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Método
            </label>

            <select
              value={metodo}
              onChange={(e) =>
                setMetodo(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="efectivo">
                Efectivo
              </option>

              <option value="bizum">
                Bizum
              </option>

              <option value="transferencia">
                Transferencia
              </option>

              <option value="tarjeta">
                Tarjeta
              </option>
            </select>

          </div>

          <div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Estado
            </label>

            <select
              value={estado}
              onChange={(e) =>
                setEstado(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="pagado">
                Pagado
              </option>

              <option value="pendiente">
                Pendiente
              </option>
            </select>

          </div>

        </div>

        <div>

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Notas
          </label>

          <textarea
            placeholder="Notas"
            value={notas}
            onChange={(e) =>
              setNotas(
                e.target.value
              )
            }
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />

        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#09a9a3] px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          {pagoEditandoId
            ? "Guardar cambios"
            : "Guardar pago"}
        </button>

        {pagoEditandoId && (

          <button
            type="button"
            onClick={onCancelar}
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