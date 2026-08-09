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
};

type ResumenAlumno = {
  clasesRestantes: number;
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

function IconoHistorial() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function IconoPausa() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 3.5 9 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 4.5 2.5c.3.2.5.5.4.9l-.5 3c-.1.4-.4.7-.8.7C10.2 21.1 2.9 13.8 2.9 5.4c0-.4.3-.7.7-.8l3-.5c.4-.1.7.1.9.4Z" />
    </svg>
  );
}

function IconoEmail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconoBono() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

function IconoCartera() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h14a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V7Z" />
      <path d="M4 7V5h11" />
      <path d="M16 12h4" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}

function IconoClases() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-5 9 5-9 5-9-5Z" />
      <path d="M7 12v5c3 2 7 2 10 0v-5" />
    </svg>
  );
}

function IconoPagoRapido() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M15 15h3" />
    </svg>
  );
}

function IconoBonoRapido() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

type TarjetaProps = {
  titulo: string;
  icono: React.ReactNode;
  iconoClase: string;
  valor: React.ReactNode;
  subtitulo?: React.ReactNode;
};

function TarjetaResumen({
  titulo,
  icono,
  iconoClase,
  valor,
  subtitulo,
}: TarjetaProps) {
  return (
    <div className="flex min-h-[230px] flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconoClase}`}>
        {icono}
      </div>

      <p className="mt-4 min-h-[32px] text-xs font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <div className="mt-3">{valor}</div>

      {subtitulo && (
        <>
          <div className="mt-4 h-px w-full bg-slate-200" />
          <div className="mt-4 text-xs font-medium text-slate-500">
            {subtitulo}
          </div>
        </>
      )}
    </div>
  );
}

function textoTipoClaseHabitual(tipo: string | null) {
  if (tipo === "club") return "Clase para club";
  if (tipo === "propia") return "Propia · club / pista de pago";
  if (tipo === "privada") return "Propia · pista privada";
  return "Sin definir";
}

function textoProcedencia(alumno: Alumno) {
  if (alumno.procedencia === "iql") {
    return "Alumno IQL";
  }

  if (alumno.procedencia === "otro_club") {
    return alumno.club_origen
      ? `Club: ${alumno.club_origen}`
      : "Otro club";
  }

  return "Alumno propio";
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
  const mostrarAvisoInactividad =
    resumen.diasDesdeUltimaClase !== null &&
    resumen.diasDesdeUltimaClase >= 30;

  return (
    <div
      className={
        alumno.activo
          ? "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          : "rounded-3xl border border-slate-200 bg-slate-50 p-6 opacity-75 shadow-sm"
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_500px] xl:items-start">

        <div className="flex min-w-0 items-center gap-5">

          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">

            <img
              src={
                alumno.foto_url ||
                "/logo-espacio-padel.png"
              }
              alt={`${alumno.nombre} ${alumno.apellidos || ""}`}
              className={
                alumno.foto_url
                  ? "h-full w-full object-cover"
                  : "h-[92%] w-[92%] object-contain"
              }
            />

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="whitespace-normal break-words text-xl font-bold text-slate-900 lg:whitespace-nowrap 2xl:text-2xl">
                {alumno.nombre}{" "}
                {alumno.apellidos || ""}
              </h3>

              {mostrarAvisoInactividad && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {resumen.diasDesdeUltimaClase} días sin clase
                </span>
              )}

            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={
                  alumno.activo
                    ? "inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700"
                    : "inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                }
              >
                {alumno.activo
                  ? "Activo"
                  : "Inactivo"}
              </span>

              <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                {textoProcedencia(alumno)}
              </span>
            </div>

          </div>

        </div>

        <div className="grid grid-cols-3 gap-2 xl:justify-self-end">

          <button
            onClick={onRegistrarPago}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700"
          >
            <IconoPagoRapido />
            Registrar pago
          </button>

          <button
            onClick={onGestionarBono}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-purple-700"
          >
            <IconoBonoRapido />
            Gestionar bono
          </button>

          <button
            onClick={onVerHistorial}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#09a9a3] px-3 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <IconoHistorial />
            {historialAbierto
              ? "Ocultar historial"
              : "Ver historial"}
          </button>

          <button
            onClick={onEditar}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <IconoEditar />
            Editar
          </button>

          <button
            onClick={onCambiarEstado}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-300"
          >
            <IconoPausa />
            {alumno.activo
              ? "Desactivar"
              : "Activar"}
          </button>

          <button
            onClick={onBorrar}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            <IconoPapelera />
            Borrar
          </button>

        </div>

      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Contacto
          </p>

          <div className="mt-4 space-y-3">

            <div className="flex items-center gap-3 text-slate-700">
              <span className="text-[#09a9a3]">
                <IconoTelefono />
              </span>

              <p className="text-sm">
                Teléfono:{" "}
                <strong className="text-slate-900">
                  {alumno.telefono || "No indicado"}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <span className="text-[#09a9a3]">
                <IconoEmail />
              </span>

              <p className="break-all text-sm">
                Email:{" "}
                <strong className="text-slate-900">
                  {alumno.email || "No indicado"}
                </strong>
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Ubicación habitual
          </p>

          <p className="mt-5 text-lg font-bold text-purple-700">
            {ubicacionHabitualNombre || "Sin definir"}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Tipo habitual
          </p>
          <p className="mt-5 text-sm font-bold text-[#078b86]">
            {textoTipoClaseHabitual(tipoClaseHabitual)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Precio habitual
          </p>

          <p className="mt-5 text-3xl font-bold text-[#09a9a3]">
            {alumno.precio_habitual !== null
              ? `${Number(
                  alumno.precio_habitual
                ).toFixed(2)} €`
              : "Sin definir"}
          </p>

        </div>

      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">

        <TarjetaResumen
          titulo="Bono activo"
          icono={<IconoBono />}
          iconoClase="bg-teal-50 text-[#09a9a3]"
          valor={
            <p className={
              resumen.clasesRestantes > 0
                ? "text-xl font-bold text-[#09a9a3]"
                : "text-xl font-bold text-slate-900"
            }>
              {resumen.clasesRestantes > 0
                ? `${resumen.clasesRestantes} clase(s)`
                : "Sin bono"}
            </p>
          }
          subtitulo={
            resumen.clasesRestantes > 0
              ? `${resumen.clasesRestantes} clases restantes`
              : "0 clases restantes"
          }
        />

        <TarjetaResumen
          titulo="Pendiente de cobro"
          icono={<IconoCartera />}
          iconoClase="bg-red-50 text-red-600"
          valor={
            <p className={
              resumen.pendienteCobro > 0
                ? "text-xl font-bold text-red-600"
                : "text-xl font-bold text-green-600"
            }>
              {resumen.pendienteCobro.toFixed(2)} €
            </p>
          }
          subtitulo={
            resumen.pendienteCobro > 0
              ? "Importe pendiente"
              : "Sin pagos pendientes"
          }
        />

        <TarjetaResumen
          titulo="Última clase"
          icono={<IconoCalendario />}
          iconoClase="bg-purple-50 text-purple-600"
          valor={
            <div>
              <p className="text-base font-bold text-slate-900">
                {resumen.ultimaClaseFecha}
              </p>

              <p className="mt-2 whitespace-nowrap text-xs font-semibold text-slate-600">
                {resumen.ultimaClaseHorario}
              </p>
            </div>
          }
        />

        <TarjetaResumen
          titulo="Próxima clase"
          icono={<IconoCalendario />}
          iconoClase="bg-blue-50 text-blue-600"
          valor={
            <div>
              <p className="text-base font-bold text-slate-900">
                {resumen.proximaClaseFecha}
              </p>

              <p className="mt-2 whitespace-nowrap text-xs font-semibold text-slate-600">
                {resumen.proximaClaseHorario}
              </p>
            </div>
          }
        />

        <TarjetaResumen
          titulo="Días sin clase"
          icono={<IconoReloj />}
          iconoClase="bg-orange-50 text-orange-500"
          valor={
            <p className={
              resumen.diasDesdeUltimaClase === null
                ? "text-xl font-bold text-slate-500"
                : resumen.diasDesdeUltimaClase >= 30
                ? "text-xl font-bold text-amber-600"
                : "text-xl font-bold text-slate-900"
            }>
              {resumen.diasDesdeUltimaClase === null
                ? "—"
                : resumen.diasDesdeUltimaClase}
            </p>
          }
          subtitulo="Desde la última clase"
        />

        <TarjetaResumen
          titulo="Clases realizadas"
          icono={<IconoClases />}
          iconoClase="bg-green-50 text-green-600"
          valor={
            <p className="text-xl font-bold text-slate-900">
              {resumen.totalClasesRealizadas}
            </p>
          }
          subtitulo="Clases completadas"
        />

      </div>

      {historialAbierto && (
        <div className="mt-7 border-t border-slate-200 pt-7">
          {children}
        </div>
      )}

    </div>
  );
}