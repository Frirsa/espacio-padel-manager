type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  precio_habitual: number | null;
  activo: boolean;
  foto_url?: string | null;
  procedencia?: string | null;
  club_origen?: string | null;
  ubicacion_habitual_id?: string | null;
  tipo_clase_habitual?: string | null;

  // Campos V2 previstos. Son opcionales hasta hacer la migración.
  apodo?: string | null;
  fecha_nacimiento?: string | null;
  localidad?: string | null;
  pais?: string | null;
  observaciones?: string | null;
};

type ResumenAlumno = {
  clasesRestantes: number;
  tieneBonoActivo: boolean;
  bonoCompartido: boolean;
  bonoCompartidoCon: string;
  bonoTitularNombre: string;
  pendienteCobro: number;
  totalClasesRealizadas: number;
  ultimaClaseFecha: string;
  ultimaClaseHorario: string;
  proximaClaseFecha: string;
  proximaClaseHorario: string;
  diasDesdeUltimaClase: number | null;
};

type Props = {
  alumno: Alumno;
  ubicacionHabitualNombre: string | null;
  tipoClaseHabitual: string | null;
  resumen: ResumenAlumno;
  historialAbierto: boolean;
  onVerHistorial: () => void;
  onEditar: () => void;
  onCambiarEstado: () => void;
  onBorrar: () => void;
  onRegistrarPago: () => void;
  onGestionarBono: () => void;
  children?: React.ReactNode;
};

type IconoNombre =
  | "pago"
  | "bono"
  | "historial"
  | "editar"
  | "estado"
  | "borrar"
  | "telefono"
  | "email"
  | "ubicacion"
  | "raqueta"
  | "cumple"
  | "mapa"
  | "pais"
  | "persona"
  | "euro"
  | "clases"
  | "reloj"
  | "calendario"
  | "ajustes"
  | "cartera"
  | "actividad"
  | "etiqueta";

function Icono({
  nombre,
  className = "h-4 w-4",
}: {
  nombre: IconoNombre;
  className?: string;
}) {
  const base = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (nombre === "pago") {
    return (
      <svg {...base}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M15 15h3" />
      </svg>
    );
  }

  if (nombre === "bono") {
    return (
      <svg {...base}>
        <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
        <path d="M12 7v10" />
      </svg>
    );
  }

  if (nombre === "historial") {
    return (
      <svg {...base}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (nombre === "editar") {
    return (
      <svg {...base}>
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    );
  }

  if (nombre === "estado") {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12h7" />
      </svg>
    );
  }

  if (nombre === "borrar") {
    return (
      <svg {...base}>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M7 7l1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    );
  }

  if (nombre === "telefono") {
    return (
      <svg {...base}>
        <path d="M6.5 3.5 9 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 4.5 2.5c.3.2.5.5.4.9l-.5 3c-.1.4-.4.7-.8.7C10.2 21.1 2.9 13.8 2.9 5.4c0-.4.3-.7.7-.8l3-.5c.4-.1.7.1.9.4Z" />
      </svg>
    );
  }

  if (nombre === "email") {
    return (
      <svg {...base}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (nombre === "ubicacion") {
    return (
      <svg {...base}>
        <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.2" />
      </svg>
    );
  }

  if (nombre === "raqueta") {
    return (
      <svg {...base}>
        <path d="M7 4c3 0 5 2 5 5 0 4-3 7-6 10" />
        <path d="M17 20c-3 0-5-2-5-5 0-4 3-7 6-10" />
        <path d="M5 5l14 14" />
      </svg>
    );
  }

  if (nombre === "cumple") {
    return (
      <svg {...base}>
        <path d="M5 10h14v10H5Z" />
        <path d="M4 10h16M12 10v10" />
        <path d="M7.5 6.5C7.5 4.6 9 4 10 5.2L12 8l2-2.8c1-1.2 2.5-.6 2.5 1.3 0 1.5-1.2 2.5-3 2.5h-3c-1.8 0-3-1-3-2.5Z" />
      </svg>
    );
  }

  if (nombre === "mapa") {
    return (
      <svg {...base}>
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    );
  }

  if (nombre === "pais") {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21M12 3C9.6 5.5 8.5 8.5 8.5 12S9.6 18.5 12 21" />
      </svg>
    );
  }

  if (nombre === "persona") {
    return (
      <svg {...base}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
      </svg>
    );
  }

  if (nombre === "euro") {
    return (
      <svg {...base}>
        <path d="M18 7.5A6.5 6.5 0 1 0 18 16.5" />
        <path d="M5 10h9M5 14h8" />
      </svg>
    );
  }

  if (nombre === "clases") {
    return (
      <svg {...base}>
        <path d="M3 9l9-5 9 5-9 5-9-5Z" />
        <path d="M7 12v5c3 2 7 2 10 0v-5" />
      </svg>
    );
  }

  if (nombre === "reloj") {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </svg>
    );
  }


  if (nombre === "ajustes") {
    return (
      <svg {...base}>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4" />
      </svg>
    );
  }

  if (nombre === "cartera") {
    return (
      <svg {...base}>
        <path d="M4 7h14a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V7Z" />
        <path d="M4 7V5h11M16 12h4" />
      </svg>
    );
  }

  if (nombre === "actividad") {
    return (
      <svg {...base}>
        <path d="M4 18V9M10 18V5M16 18v-7M22 18V3" />
      </svg>
    );
  }

  if (nombre === "etiqueta") {
    return (
      <svg {...base}>
        <path d="M4 5h7l9 9-6 6-9-9Z" />
        <circle cx="8.5" cy="8.5" r="1" />
      </svg>
    );
  }

  return (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function textoProcedencia(
  alumno: Alumno
) {
  if (alumno.procedencia === "iql") {
    return "Alumno IQL";
  }

  if (alumno.procedencia === "otro_club") {
    return alumno.club_origen
      ? `Club · ${alumno.club_origen}`
      : "Otro club";
  }

  return "Alumno propio";
}

function textoTipo(
  tipo: string | null
) {
  if (tipo === "club") {
    return "Clase para club";
  }

  if (tipo === "propia") {
    return "Propia · club / pista de pago";
  }

  if (tipo === "privada") {
    return "Propia · pista privada";
  }

  return "Sin definir";
}

function formatearNacimiento(
  fecha: string | null | undefined
) {
  if (!fecha) {
    return "Sin indicar";
  }

  const [anio, mes, dia] =
    fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function calcularEdad(
  fecha: string | null | undefined
) {
  if (!fecha) {
    return null;
  }

  const nacimiento =
    new Date(`${fecha}T00:00:00`);

  if (
    Number.isNaN(
      nacimiento.getTime()
    )
  ) {
    return null;
  }

  const hoy = new Date();

  let edad =
    hoy.getFullYear() -
    nacimiento.getFullYear();

  const diferenciaMes =
    hoy.getMonth() -
    nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 &&
      hoy.getDate() <
        nacimiento.getDate())
  ) {
    edad -= 1;
  }

  return edad >= 0 ? edad : null;
}

function esCumpleHoy(
  fecha: string | null | undefined
) {
  if (!fecha) {
    return false;
  }

  const nacimiento =
    new Date(`${fecha}T00:00:00`);

  if (
    Number.isNaN(
      nacimiento.getTime()
    )
  ) {
    return false;
  }

  const hoy = new Date();

  return (
    nacimiento.getDate() ===
      hoy.getDate() &&
    nacimiento.getMonth() ===
      hoy.getMonth()
  );
}

function BotonCabecera({
  icono,
  texto,
  onClick,
  activo = false,
  peligro = false,
}: {
  icono: React.ReactNode;
  texto: string;
  onClick: () => void;
  activo?: boolean;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        peligro
          ? "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl sm:h-10 border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20"
          : activo
          ? "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl sm:h-10 border border-[#00A79C] bg-[#00A79C] px-3 text-[11px] font-bold text-white transition hover:bg-[#008F86]"
          : "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl sm:h-10 border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
      }
    >
      {icono}
      <span className="truncate">
        {texto}
      </span>
    </button>
  );
}

function MiniMetrica({
  icono,
  etiqueta,
  valor,
  detalle,
  valorClase = "text-white",
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  valorClase?: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-sm sm:px-4">
      <div className="flex items-center gap-2 text-[#4DD4CA]">
        {icono}

        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/55">
          {etiqueta}
        </p>
      </div>

      <p className={`mt-2 truncate text-lg font-bold tracking-tight ${valorClase}`}>
        {valor}
      </p>

      {detalle && (
        <p className="mt-0.5 truncate text-[9px] font-medium text-white/50">
          {detalle}
        </p>
      )}
    </div>
  );
}

function DatoFila({
  icono,
  etiqueta,
  valor,
  secundario,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: React.ReactNode;
  secundario?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
        {icono}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
          {etiqueta}
        </p>

        <div className="mt-0.5 break-words text-sm font-semibold text-[#17324D]">
          {valor}
        </div>

        {secundario && (
          <div className="mt-0.5 text-[10px] font-medium text-slate-400">
            {secundario}
          </div>
        )}
      </div>
    </div>
  );
}

function TituloTarjeta({
  icono,
  titulo,
  subtitulo,
}: {
  icono: React.ReactNode;
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-slate-100 pb-3">
      <span className="mt-0.5 text-[#00A79C]">
        {icono}
      </span>

      <div>
        <h3 className="text-sm font-bold text-[#17324D]">
          {titulo}
        </h3>

        {subtitulo && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {subtitulo}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FichaAlumno({
  alumno,
  ubicacionHabitualNombre,
  tipoClaseHabitual,
  resumen,
  historialAbierto,
  onVerHistorial,
  onEditar,
  onCambiarEstado,
  onBorrar,
  onRegistrarPago,
  onGestionarBono,
  children,
}: Props) {
  const edad =
    calcularEdad(
      alumno.fecha_nacimiento
    );

  const cumpleHoy =
    esCumpleHoy(
      alumno.fecha_nacimiento
    );

  const avisoInactividad =
    resumen.diasDesdeUltimaClase !==
      null &&
    resumen.diasDesdeUltimaClase >=
      30;

  return (
    <div className="min-w-0">

      {/* CABECERA CORPORATIVA */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.18)] sm:p-5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -right-8 -top-10 h-52 w-52 rounded-full border border-[#00A79C]/15" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#00A79C]/60 to-transparent" />

        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,1fr)_minmax(430px,1.15fr)] lg:gap-6">
          {/* IDENTIDAD */}
          <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A79C] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
              <img
                src={
                  alumno.foto_url ||
                  "/logo-espacio-padel.png"
                }
                alt={`${alumno.nombre} ${alumno.apellidos || ""}`}
                className={
                  alumno.foto_url
                    ? "h-full w-full object-cover"
                    : "h-[88%] w-[88%] object-contain"
                }
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-bold tracking-tight text-white sm:text-2xl lg:truncate">
                  {alumno.nombre}{" "}
                  {alumno.apellidos || ""}
                </h2>

                <span
                  className={
                    alumno.activo
                      ? "rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200"
                      : "rounded-full border border-red-300/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-200"
                  }
                >
                  {alumno.activo
                    ? "Activo"
                    : "Inactivo"}
                </span>
              </div>

              {alumno.apodo && (
                <p className="mt-1 text-base font-bold text-[#4DD4CA]">
                  {alumno.apodo}
                </p>
              )}

              <p className="mt-1.5 text-xs font-medium text-white/60">
                {textoProcedencia(
                  alumno
                )}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/80">
                  {textoTipo(
                    tipoClaseHabitual
                  )}
                </span>

                {cumpleHoy && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold text-amber-200">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 10h14v10H5Z" />
                      <path d="M4 10h16M12 10v10" />
                      <path d="M7.5 6.5C7.5 4.6 9 4 10 5.2L12 8l2-2.8c1-1.2 2.5-.6 2.5 1.3 0 1.5-1.2 2.5-3 2.5h-3c-1.8 0-3-1-3-2.5Z" />
                    </svg>
                    Cumpleaños hoy
                  </span>
                )}

                {avisoInactividad && (
                  <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold text-amber-200">
                    {resumen.diasDesdeUltimaClase} días sin clase
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KPIs EN CABECERA */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniMetrica
              icono={
                <Icono nombre="euro" />
              }
              etiqueta="Pendiente"
              valor={`${resumen.pendienteCobro.toFixed(
                2
              )} €`}
              valorClase={
                resumen.pendienteCobro > 0
                  ? "text-red-300"
                  : "text-emerald-300"
              }
              detalle={
                resumen.pendienteCobro > 0
                  ? "Por cobrar"
                  : "Al día"
              }
            />

            <MiniMetrica
              icono={
                <Icono nombre="bono" />
              }
              etiqueta="Bono"
              valor={
                resumen.tieneBonoActivo
                  ? `${resumen.clasesRestantes}`
                  : "—"
              }
              detalle={
                resumen.tieneBonoActivo
                  ? resumen.bonoCompartido
                    ? "Bono compartido"
                    : "Clases restantes"
                  : "Sin bono"
              }
            />

            <MiniMetrica
              icono={
                <Icono nombre="clases" />
              }
              etiqueta="Realizadas"
              valor={
                resumen.totalClasesRealizadas
              }
              detalle="Clases completadas"
            />

            <MiniMetrica
              icono={
                <Icono nombre="calendario" />
              }
              etiqueta="Próxima"
              valor={
                resumen.proximaClaseFecha
              }
              detalle={
                resumen.proximaClaseHorario
              }
            />
          </div>
        </div>

        {/* TODOS LOS BOTONES IGUALES Y A LA VISTA */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <BotonCabecera
            icono={
              <Icono nombre="pago" />
            }
            texto="Registrar pago"
            onClick={
              onRegistrarPago
            }
          />

          <BotonCabecera
            icono={
              <Icono nombre="bono" />
            }
            texto="Gestionar bono"
            onClick={
              onGestionarBono
            }
          />

          <BotonCabecera
            icono={
              <Icono nombre="historial" />
            }
            texto={
              historialAbierto
                ? "Ocultar historial"
                : "Ver historial"
            }
            onClick={
              onVerHistorial
            }
            activo={
              historialAbierto
            }
          />

          <BotonCabecera
            icono={
              <Icono nombre="editar" />
            }
            texto="Editar"
            onClick={onEditar}
          />

          <BotonCabecera
            icono={
              <Icono nombre="estado" />
            }
            texto={
              alumno.activo
                ? "Desactivar"
                : "Activar"
            }
            onClick={
              onCambiarEstado
            }
          />

          <BotonCabecera
            icono={
              <Icono nombre="borrar" />
            }
            texto="Borrar"
            onClick={onBorrar}
            peligro
          />
        </div>
      </section>

      {!historialAbierto ? (
        <>
          {/* PRIMERA FILA DE TARJETAS */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {/* DATOS PERSONALES */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="persona"
                    className="h-5 w-5"
                  />
                }
                titulo="Datos personales"
                subtitulo="Información básica del alumno"
              />

              <div className="mt-2 divide-y divide-slate-100">
                <DatoFila
                  icono={
                    <Icono nombre="persona" />
                  }
                  etiqueta="Apodo"
                  valor={
                    alumno.apodo ||
                    "Sin indicar"
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="cumple" />
                  }
                  etiqueta="Fecha de nacimiento"
                  valor={
                    formatearNacimiento(
                      alumno.fecha_nacimiento
                    )
                  }
                  secundario={
                    edad !== null
                      ? `${edad} años`
                      : undefined
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="mapa" />
                  }
                  etiqueta="Localidad"
                  valor={
                    alumno.localidad ||
                    "Sin indicar"
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="pais" />
                  }
                  etiqueta="País"
                  valor={
                    alumno.pais ||
                    "Sin indicar"
                  }
                />
              </div>
            </section>

            {/* CONTACTO */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="telefono"
                    className="h-5 w-5"
                  />
                }
                titulo="Contacto"
                subtitulo="Datos para comunicarte con el alumno"
              />

              <div className="mt-2 divide-y divide-slate-100">
                <DatoFila
                  icono={
                    <Icono nombre="telefono" />
                  }
                  etiqueta="Teléfono"
                  valor={
                    alumno.telefono ||
                    "No indicado"
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="email" />
                  }
                  etiqueta="Email"
                  valor={
                    alumno.email ||
                    "No indicado"
                  }
                />

              </div>
            </section>

            {/* CONFIGURACIÓN */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="ajustes"
                    className="h-5 w-5"
                  />
                }
                titulo="Configuración habitual"
                subtitulo="Preferencias usadas al programar"
              />

              <div className="mt-2 divide-y divide-slate-100">
                <DatoFila
                  icono={
                    <Icono nombre="persona" />
                  }
                  etiqueta="Vinculación"
                  valor={
                    textoProcedencia(
                      alumno
                    )
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="ubicacion" />
                  }
                  etiqueta="Ubicación habitual"
                  valor={
                    ubicacionHabitualNombre ||
                    "Sin definir"
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="raqueta" />
                  }
                  etiqueta="Tipo de clase habitual"
                  valor={
                    textoTipo(
                      tipoClaseHabitual
                    )
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="euro" />
                  }
                  etiqueta="Precio habitual"
                  valor={
                    alumno.precio_habitual !==
                    null
                      ? `${Number(
                          alumno.precio_habitual
                        ).toFixed(2)} €`
                      : "Sin definir"
                  }
                />
              </div>
            </section>
          </div>

          {/* SEGUNDA FILA */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {/* PAGOS Y BONO */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="cartera"
                    className="h-5 w-5"
                  />
                }
                titulo="Pagos y bono"
              />

              <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                    Pendiente
                  </p>
                  <p
                    className={
                      resumen.pendienteCobro > 0
                        ? "mt-1 text-2xl font-bold text-red-600"
                        : "mt-1 text-2xl font-bold text-emerald-600"
                    }
                  >
                    {resumen.pendienteCobro.toFixed(
                      2
                    )}{" "}
                    €
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {resumen.pendienteCobro > 0
                      ? "Importe por cobrar"
                      : "Sin pagos pendientes"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                    Bono activo
                  </p>

                  <p className="mt-1 text-2xl font-bold text-violet-700">
                    {resumen.tieneBonoActivo
                      ? resumen.clasesRestantes
                      : "—"}
                  </p>

                  {!resumen.tieneBonoActivo ? (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Sin bono activo
                    </p>
                  ) : resumen.bonoCompartido ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] font-bold text-violet-700">
                        Bono compartido
                      </p>

                      {resumen.bonoTitularNombre && (
                        <p className="text-[10px] text-slate-500">
                          Titular:{" "}
                          <span className="font-bold text-[#17324D]">
                            {resumen.bonoTitularNombre}
                          </span>
                        </p>
                      )}

                      {resumen.bonoCompartidoCon && (
                        <div className="pt-0.5">
                          <p className="text-[10px] text-slate-500">
                            Compartido con:
                          </p>

                          <p className="mt-0.5 text-[10px] font-normal leading-relaxed text-[#17324D]">
                            {resumen.bonoCompartidoCon}
                          </p>
                        </div>
                      )}

                      <p className="pt-0.5 text-[10px] text-slate-400">
                        Clases restantes del bono
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Clases restantes
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ACTIVIDAD */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="actividad"
                    className="h-5 w-5"
                  />
                }
                titulo="Actividad"
              />

              <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                    Realizadas
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#17324D]">
                    {
                      resumen.totalClasesRealizadas
                    }
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Clases completadas
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                    Días sin clase
                  </p>
                  <p
                    className={
                      avisoInactividad
                        ? "mt-1 text-2xl font-bold text-amber-600"
                        : "mt-1 text-2xl font-bold text-[#17324D]"
                    }
                  >
                    {resumen.diasDesdeUltimaClase ===
                    null
                      ? "—"
                      : resumen.diasDesdeUltimaClase}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Desde la última clase
                  </p>
                </div>
              </div>
            </section>

            {/* ÚLTIMA / PRÓXIMA */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="calendario"
                    className="h-5 w-5"
                  />
                }
                titulo="Clases"
              />

              <div className="mt-2 divide-y divide-slate-100">
                <DatoFila
                  icono={
                    <Icono nombre="calendario" />
                  }
                  etiqueta="Próxima clase"
                  valor={
                    resumen.proximaClaseFecha
                  }
                  secundario={
                    resumen.proximaClaseHorario
                  }
                />

                <DatoFila
                  icono={
                    <Icono nombre="reloj" />
                  }
                  etiqueta="Última clase"
                  valor={
                    resumen.ultimaClaseFecha
                  }
                  secundario={
                    resumen.ultimaClaseHorario
                  }
                />
              </div>
            </section>
          </div>

          {alumno.observaciones?.trim() && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
              <TituloTarjeta
                icono={
                  <Icono
                    nombre="etiqueta"
                    className="h-5 w-5"
                  />
                }
                titulo="Observaciones"
                subtitulo="Notas internas del alumno"
              />

              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#17324D]">
                {alumno.observaciones}
              </p>
            </section>
          )}
        </>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17324D]">
                Historial del alumno
              </h3>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Clases y pagos registrados
              </p>
            </div>
          </div>

          {children}
        </section>
      )}
    </div>
  );
}
