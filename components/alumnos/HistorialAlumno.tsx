type PagoResumen = {
  id: string;
  clase_id: string | null;
  importe: number;
  estado: string;
  metodo: string;
  fecha_pago: string;
};

type ClaseAlumnoResumen = {
  importe: number;
  usa_bono: boolean;
  clases: {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    estado: string;
    tipo: string;
    ubicaciones: {
      nombre: string;
    } | null;
  } | null;
};

type Props = {
  clasesAlumno: ClaseAlumnoResumen[];
  pagosAlumno: PagoResumen[];
  formatearFecha: (fecha: string) => string;
  calcularHorario: (
    horaInicio: string,
    duracionMinutos: number
  ) => string;
};

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function IconoPago() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function IconoBono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

export default function HistorialAlumno({
  clasesAlumno,
  pagosAlumno,
  formatearFecha,
  calcularHorario,
}: Props) {
  return (
    <div className="space-y-8">

      <section>

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
            <IconoCalendario />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Historial de clases
            </h3>

            <p className="text-sm text-slate-500">
              {clasesAlumno.length} clase(s) registradas
            </p>
          </div>

        </div>

        {clasesAlumno.length === 0 ? (

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">
              Este alumno todavía no tiene clases registradas.
            </p>

          </div>

        ) : (

          <div className="mt-4 space-y-3">

            {clasesAlumno.map(
              (registro, indice) => {
                const clase = registro.clases;

                if (!clase) {
                  return null;
                }

                const pagoClase =
                  pagosAlumno.find(
                    (pago) =>
                      pago.clase_id === clase.id
                  );

                return (
                  <div
                    key={`${clase.id}-${indice}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                          <IconoCalendario />
                        </div>

                        <div className="min-w-0">

                          <p className="font-bold text-slate-900">
                            {formatearFecha(
                              clase.fecha
                            )}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {calcularHorario(
                              clase.hora_inicio,
                              clase.duracion_minutos
                            )}
                          </p>

                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                            <span className="text-slate-400">
                              <IconoUbicacion />
                            </span>

                            <span>
                              {clase.ubicaciones
                                ?.nombre ||
                                "Sin ubicación"}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                        <span
                          className={
                            clase.estado ===
                            "realizada"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                              : clase.estado ===
                                "cancelada"
                              ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                              : "rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                          }
                        >
                          {clase.estado ===
                          "realizada"
                            ? "Realizada"
                            : clase.estado ===
                              "cancelada"
                            ? "Cancelada"
                            : "Programada"}
                        </span>

                        {registro.usa_bono ? (

                          <span className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">

                            <IconoBono />

                            Bono

                          </span>

                        ) : pagoClase ? (

                          <span
                            className={
                              pagoClase.estado ===
                              "pagado"
                                ? "flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                                : "flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                            }
                          >

                            <IconoPago />

                            {pagoClase.estado ===
                            "pagado"
                              ? "Pagado"
                              : "Pendiente"}{" "}
                            ·{" "}
                            {Number(
                              pagoClase.importe
                            ).toFixed(2)}{" "}
                            €

                          </span>

                        ) : (

                          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

                            <IconoPago />

                            Pago normal ·{" "}
                            {Number(
                              registro.importe || 0
                            ).toFixed(2)}{" "}
                            €

                          </span>

                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>

      <section>

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IconoPago />
          </div>

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              Historial de pagos
            </h3>

            <p className="text-sm text-slate-500">
              {pagosAlumno.length} pago(s) registrados
            </p>

          </div>

        </div>

        {pagosAlumno.length === 0 ? (

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">
              Este alumno todavía no tiene pagos registrados.
            </p>

          </div>

        ) : (

          <div className="mt-4 grid gap-3 md:grid-cols-2">

            {pagosAlumno.map((pago) => (

              <div
                key={pago.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <IconoPago />
                    </div>

                    <div>

                      <p className="font-bold text-slate-900">
                        {formatearFecha(
                          pago.fecha_pago
                        )}
                      </p>

                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {pago.metodo}
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p
                      className={
                        pago.estado ===
                        "pagado"
                          ? "text-xl font-bold text-green-600"
                          : "text-xl font-bold text-red-600"
                      }
                    >
                      {Number(
                        pago.importe
                      ).toFixed(2)}{" "}
                      €
                    </p>

                    <span
                      className={
                        pago.estado ===
                        "pagado"
                          ? "mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                          : "mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                      }
                    >
                      {pago.estado ===
                      "pagado"
                        ? "Pagado"
                        : "Pendiente"}
                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}