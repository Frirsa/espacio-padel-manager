type Ubicacion = {
  id: string;
  nombre: string;
};

type Props = {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  precio: string;
  procedencia: string;
  clubOrigen: string;
  ubicaciones: Ubicacion[];
  ubicacionHabitualId: string;
  tipoClaseHabitual: string;
  activo: boolean;
  alumnoEditandoId: string | null;
  mensaje: string;
  fotoUrl: string;
  setNombre: (valor: string) => void;
  setApellidos: (valor: string) => void;
  setTelefono: (valor: string) => void;
  setEmail: (valor: string) => void;
  setPrecio: (valor: string) => void;
  setProcedencia: (valor: string) => void;
  setClubOrigen: (valor: string) => void;
  setUbicacionHabitualId: (valor: string) => void;
  setTipoClaseHabitual: (valor: string) => void;
  setActivo: (valor: boolean) => void;
  onFotoSeleccionada: (archivo: File | null) => void;
  onGuardar: (e: React.FormEvent) => void;
  onCancelar: () => void;
};

function IconoCamara() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h4l2-3h4l2 3h4v13H4V7Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function FormularioAlumno({
  nombre,
  apellidos,
  telefono,
  email,
  precio,
  procedencia,
  clubOrigen,
  ubicaciones,
  ubicacionHabitualId,
  tipoClaseHabitual,
  activo,
  alumnoEditandoId,
  mensaje,
  fotoUrl,
  setNombre,
  setApellidos,
  setTelefono,
  setEmail,
  setPrecio,
  setProcedencia,
  setClubOrigen,
  setUbicacionHabitualId,
  setTipoClaseHabitual,
  setActivo,
  onFotoSeleccionada,
  onGuardar,
  onCancelar,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-slate-900">
        {alumnoEditandoId
          ? "Editar alumno"
          : "Nuevo alumno"}
      </h2>

      <form
        onSubmit={onGuardar}
        className="mt-6 space-y-4"
      >
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Foto del alumno
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <img
                src={
                  fotoUrl ||
                  "/logo-espacio-padel.png"
                }
                alt="Foto alumno"
                className={
                  fotoUrl
                    ? "h-full w-full object-cover"
                    : "h-[92%] w-[92%] object-contain"
                }
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <IconoCamara />

              {fotoUrl
                ? "Cambiar foto"
                : "Subir foto"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  onFotoSeleccionada(
                    e.target.files?.[0] || null
                  )
                }
                className="hidden"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            JPG, PNG o WEBP
          </p>
        </div>

        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <input
          type="text"
          placeholder="Apellidos"
          value={apellidos}
          onChange={(e) =>
            setApellidos(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) =>
            setTelefono(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Precio habitual"
          value={precio}
          onChange={(e) =>
            setPrecio(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Procedencia
          </label>

          <select
            value={procedencia}
            onChange={(e) => {
              setProcedencia(e.target.value);

              if (e.target.value !== "otro_club") {
                setClubOrigen("");
              }
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="propio">
              Alumno propio
            </option>

            <option value="iql">
              IQL
            </option>

            <option value="otro_club">
              Otro club
            </option>
          </select>
        </div>

        {procedencia === "otro_club" && (
          <input
            type="text"
            placeholder="Nombre del club"
            value={clubOrigen}
            onChange={(e) =>
              setClubOrigen(e.target.value)
            }
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        )}

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Ubicación habitual
          </label>

          <select
            value={ubicacionHabitualId}
            onChange={(e) =>
              setUbicacionHabitualId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Sin ubicación habitual
            </option>

            {ubicaciones.map((ubicacion) => (
              <option
                key={ubicacion.id}
                value={ubicacion.id}
              >
                {ubicacion.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Tipo de clase habitual
          </label>
          <select
            value={tipoClaseHabitual}
            onChange={(e) => setTipoClaseHabitual(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Seleccionar tipo habitual</option>
            <option value="club">Clase para club</option>
            <option value="propia">Clase propia en club / pista de pago</option>
            <option value="privada">Clase propia en pista privada</option>
          </select>
        </div>

        {alumnoEditandoId && (
          <select
            value={
              activo
                ? "activo"
                : "inactivo"
            }
            onChange={(e) =>
              setActivo(
                e.target.value === "activo"
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
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-[#09a9a3] px-5 py-3 font-semibold text-white"
        >
          {alumnoEditandoId
            ? "Guardar cambios"
            : "Guardar alumno"}
        </button>

        {alumnoEditandoId && (
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
