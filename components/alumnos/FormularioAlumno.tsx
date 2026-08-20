type Ubicacion = {
  id: string;
  nombre: string;
};

type Props = {
  nombre: string;
  apellidos: string;
  apodo: string;
  fechaNacimiento: string;
  localidad: string;
  pais: string;
  observaciones: string;
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
  setApodo: (valor: string) => void;
  setFechaNacimiento: (valor: string) => void;
  setLocalidad: (valor: string) => void;
  setPais: (valor: string) => void;
  setObservaciones: (valor: string) => void;
  setTelefono: (valor: string) => void;
  setEmail: (valor: string) => void;
  setPrecio: (valor: string) => void;
  setProcedencia: (valor: string) => void;
  setClubOrigen: (valor: string) => void;
  setUbicacionHabitualId: (valor: string) => void;
  setTipoClaseHabitual: (valor: string) => void;
  setActivo: (valor: boolean) => void;

  onFotoSeleccionada: (archivo: File | null) => void;
  onQuitarFoto: () => void;
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h4l2-3h4l2 3h4v13H4V7Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconoX() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function Campo({
  etiqueta,
  children,
  className = "",
}: {
  etiqueta: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

const claseCampo =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10";

export default function FormularioAlumno({
  nombre,
  apellidos,
  apodo,
  fechaNacimiento,
  localidad,
  pais,
  observaciones,
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
  setApodo,
  setFechaNacimiento,
  setLocalidad,
  setPais,
  setObservaciones,
  setTelefono,
  setEmail,
  setPrecio,
  setProcedencia,
  setClubOrigen,
  setUbicacionHabitualId,
  setTipoClaseHabitual,
  setActivo,
  onFotoSeleccionada,
  onQuitarFoto,
  onGuardar,
  onCancelar,
}: Props) {
  return (
    <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:block sm:max-h-none">

      {/* CABECERA */}
      <div className="shrink-0 bg-[#0F2742] px-4 py-4 text-white sm:px-6 sm:py-5">
        <div className="flex items-start gap-3.5 sm:gap-5">
          <div
            className={
              fotoUrl
                ? "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A79C] bg-white sm:h-24 sm:w-24"
                : "flex h-[92px] w-[128px] shrink-0 items-center justify-center overflow-hidden sm:h-[112px] sm:w-[165px]"
            }
          >
            <img
              src={
                fotoUrl ||
                "/logo-espacio-padel-blanco.png"
              }
              alt="Foto alumno"
              className={
                fotoUrl
                  ? "h-full w-full object-cover"
                  : "h-full w-full object-contain"
              }
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              {alumnoEditandoId
                ? "Editar alumno"
                : "Nuevo alumno"}
            </h2>

            <p className="mt-1 text-[11px] leading-snug text-white/55 sm:text-xs">
              Datos personales, contacto y configuración habitual
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/15">
                <IconoCamara />
                {fotoUrl
                  ? "Cambiar foto"
                  : "Subir foto"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    onFotoSeleccionada(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                  className="hidden"
                />
              </label>

              {fotoUrl && (
                <button
                  type="button"
                  onClick={onQuitarFoto}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-300/35 bg-red-500/10 px-3 text-xs font-bold text-red-100 transition hover:bg-red-500/20"
                >
                  <IconoX />
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={onGuardar}
        className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:overflow-visible lg:p-5"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-5">
            {/* IDENTIDAD */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#17324D]">
                  Datos personales
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Los campos salvo el nombre son opcionales
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo etiqueta="Nombre">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) =>
                      setNombre(e.target.value)
                    }
                    required
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="Apellidos">
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) =>
                      setApellidos(
                        e.target.value
                      )
                    }
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="Apodo">
                  <input
                    type="text"
                    value={apodo}
                    onChange={(e) =>
                      setApodo(e.target.value)
                    }
                    placeholder="Ej. Jovi"
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="Fecha de nacimiento">
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) =>
                      setFechaNacimiento(
                        e.target.value
                      )
                    }
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="Localidad">
                  <input
                    type="text"
                    value={localidad}
                    onChange={(e) =>
                      setLocalidad(
                        e.target.value
                      )
                    }
                    placeholder="Ej. Valencia"
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="País">
                  <input
                    type="text"
                    value={pais}
                    onChange={(e) =>
                      setPais(e.target.value)
                    }
                    placeholder="Ej. España"
                    className={claseCampo}
                  />
                </Campo>
              </div>
            </section>

            <div className="h-px bg-slate-100" />

            {/* CONTACTO */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#17324D]">
                  Contacto
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo etiqueta="Teléfono">
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(
                        e.target.value
                      )
                    }
                    className={claseCampo}
                  />
                </Campo>

                <Campo etiqueta="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className={claseCampo}
                  />
                </Campo>
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-5">
            {/* CONFIGURACIÓN */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#17324D]">
                  Configuración habitual
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Datos usados habitualmente al programar y cobrar
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo etiqueta="Vinculación">
                  <select
                    value={procedencia}
                    onChange={(e) => {
                      setProcedencia(
                        e.target.value
                      );

                      if (
                        e.target.value !==
                        "otro_club"
                      ) {
                        setClubOrigen("");
                      }
                    }}
                    className={claseCampo}
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
                </Campo>

                {procedencia ===
                "otro_club" ? (
                  <Campo etiqueta="Club">
                    <input
                      type="text"
                      value={clubOrigen}
                      onChange={(e) =>
                        setClubOrigen(
                          e.target.value
                        )
                      }
                      required
                      placeholder="Nombre del club"
                      className={claseCampo}
                    />
                  </Campo>
                ) : (
                  <Campo etiqueta="Precio habitual">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precio}
                      onChange={(e) =>
                        setPrecio(
                          e.target.value
                        )
                      }
                      placeholder="0,00"
                      className={claseCampo}
                    />
                  </Campo>
                )}

                {procedencia ===
                  "otro_club" && (
                  <Campo etiqueta="Precio habitual">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precio}
                      onChange={(e) =>
                        setPrecio(
                          e.target.value
                        )
                      }
                      placeholder="0,00"
                      className={claseCampo}
                    />
                  </Campo>
                )}

                <Campo etiqueta="Ubicación habitual">
                  <select
                    value={
                      ubicacionHabitualId
                    }
                    onChange={(e) =>
                      setUbicacionHabitualId(
                        e.target.value
                      )
                    }
                    className={claseCampo}
                  >
                    <option value="">
                      Sin ubicación habitual
                    </option>

                    {ubicaciones.map(
                      (ubicacion) => (
                        <option
                          key={ubicacion.id}
                          value={ubicacion.id}
                        >
                          {ubicacion.nombre}
                        </option>
                      )
                    )}
                  </select>
                </Campo>

                <Campo etiqueta="Tipo de clase habitual">
                  <select
                    value={
                      tipoClaseHabitual
                    }
                    onChange={(e) =>
                      setTipoClaseHabitual(
                        e.target.value
                      )
                    }
                    required
                    className={claseCampo}
                  >
                    <option value="">
                      Seleccionar tipo habitual
                    </option>
                    <option value="club">
                      Clase para club
                    </option>
                    <option value="propia">
                      Propia · club / pista de pago
                    </option>
                    <option value="privada">
                      Propia · pista privada
                    </option>
                  </select>
                </Campo>

                {alumnoEditandoId && (
                  <Campo etiqueta="Estado">
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
                      className={claseCampo}
                    >
                      <option value="activo">
                        Activo
                      </option>
                      <option value="inactivo">
                        Inactivo
                      </option>
                    </select>
                  </Campo>
                )}
              </div>
            </section>

            <div className="h-px bg-slate-100" />

            {/* OBSERVACIONES */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#17324D]">
                  Observaciones
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Notas internas y datos que conviene recordar del alumno
                </p>
              </div>

              <textarea
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Escribe aquí cualquier información útil sobre el alumno..."
                aria-label="Observaciones"
                className="min-h-[104px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              />
            </section>
          </div>
        </div>

        {mensaje && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-[#17324D]">
            {mensaje}
          </p>
        )}

        {/* ACCIONES */}
        <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.035)] sm:-mx-5 sm:-mb-5 sm:flex sm:justify-end sm:px-5 sm:py-3 lg:static lg:mx-0 lg:mb-0 lg:mt-5 lg:px-0 lg:pb-0 lg:shadow-none">
          <button
            type="button"
            onClick={onCancelar}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#17324D] transition hover:bg-slate-50 sm:h-10 sm:px-5"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="h-11 rounded-xl bg-[#00A79C] px-3 text-sm font-bold text-white transition hover:bg-[#008F86] sm:h-10 sm:px-5"
          >
            {alumnoEditandoId
              ? "Guardar cambios"
              : "Guardar alumno"}
          </button>
        </div>
      </form>
    </div>
  );
}
