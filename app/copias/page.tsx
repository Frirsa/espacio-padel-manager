"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const tablas = [
  "alumnos",
  "ubicaciones",
  "grupos",
  "grupo_alumnos",
  "bonos",
  "bono_alumnos",
  "series_clases",
  "clases",
  "clase_alumnos",
  "pagos",
];

const ordenBorrado = [
  "pagos",
  "clase_alumnos",
  "bono_alumnos",
  "grupo_alumnos",
  "clases",
  "series_clases",
  "bonos",
  "grupos",
  "ubicaciones",
  "alumnos",
];

const ordenRestauracion = [
  "alumnos",
  "ubicaciones",
  "grupos",
  "bonos",
  "series_clases",
  "clases",
  "grupo_alumnos",
  "bono_alumnos",
  "clase_alumnos",
  "pagos",
];

type CopiaSeguridad = {
  aplicacion: string;
  version_copia: number;
  fecha_exportacion: string;
  tablas: Record<string, any[]>;
};

function IconoCopia() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 7V4h12v12h-3" />
      <rect x="4" y="8" width="12" height="12" rx="2" />
    </svg>
  );
}

function IconoDescarga() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function IconoRestaurar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function CopiasPage() {
  const [generando, setGenerando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<File | null>(null);
  const [copiaSeleccionada, setCopiaSeleccionada] =
    useState<CopiaSeguridad | null>(null);

  const inputArchivoRef = useRef<HTMLInputElement | null>(null);

  async function construirCopia() {
    const datos: Record<string, unknown[]> = {};

    for (const tabla of tablas) {
      const { data, error } = await supabase
        .from(tabla)
        .select("*");

      if (error) {
        throw new Error(
          `Error al copiar ${tabla}: ${error.message}`
        );
      }

      datos[tabla] = data || [];
    }

    return {
      aplicacion: "Espacio Pádel Manager",
      version_copia: 1,
      fecha_exportacion: new Date().toISOString(),
      tablas: datos,
    };
  }

  function descargarObjeto(
    copia: CopiaSeguridad,
    nombreArchivo: string
  ) {
    const contenido = JSON.stringify(copia, null, 2);

    const archivo = new Blob([contenido], {
      type: "application/json",
    });

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  async function descargarCopia() {
    setGenerando(true);
    setMensaje("");

    try {
      const copia = await construirCopia();

      const fechaNombre = new Date()
        .toISOString()
        .slice(0, 10);

      descargarObjeto(
        copia as CopiaSeguridad,
        `espacio-padel-backup-${fechaNombre}.json`
      );

      setMensaje(
        "✅ Copia de seguridad descargada correctamente"
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo crear la copia: " + texto
      );
    } finally {
      setGenerando(false);
    }
  }

  function validarCopia(datos: any): CopiaSeguridad {
    if (
      !datos ||
      datos.aplicacion !== "Espacio Pádel Manager" ||
      datos.version_copia !== 1 ||
      !datos.tablas
    ) {
      throw new Error(
        "El archivo no es una copia válida de Espacio Pádel Manager"
      );
    }

    for (const tabla of tablas) {
      if (!Array.isArray(datos.tablas[tabla])) {
        throw new Error(
          `La copia no contiene correctamente la tabla ${tabla}`
        );
      }
    }

    return datos as CopiaSeguridad;
  }

  async function seleccionarArchivo(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0] || null;

    setArchivoSeleccionado(null);
    setCopiaSeleccionada(null);
    setMensaje("");

    if (!archivo) {
      return;
    }

    try {
      const texto = await archivo.text();
      const datos = JSON.parse(texto);
      const copia = validarCopia(datos);

      setArchivoSeleccionado(archivo);
      setCopiaSeleccionada(copia);

      setMensaje(
        "✅ Copia válida. Revisa el resumen antes de restaurar."
      );
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Archivo no válido";

      setMensaje("❌ " + texto);

      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = "";
      }
    }
  }

  async function borrarTabla(tabla: string) {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .neq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );

    if (error) {
      throw new Error(
        `Error al vaciar ${tabla}: ${error.message}`
      );
    }
  }

  async function restaurarTabla(
    tabla: string,
    registros: any[]
  ) {
    if (registros.length === 0) {
      return;
    }

    const { error } = await supabase
      .from(tabla)
      .insert(registros);

    if (error) {
      throw new Error(
        `Error al restaurar ${tabla}: ${error.message}`
      );
    }
  }

  async function restaurarCopia() {
    if (!copiaSeleccionada || !archivoSeleccionado) {
      setMensaje(
        "❌ Selecciona primero una copia de seguridad válida"
      );
      return;
    }

    const confirmar1 = window.confirm(
      "ATENCIÓN: la restauración sustituirá los datos actuales por los de la copia seleccionada.\n\nAntes de continuar se descargará automáticamente una copia de seguridad de los datos actuales.\n\n¿Quieres continuar?"
    );

    if (!confirmar1) {
      return;
    }

    const confirmar2 = window.confirm(
      "Última confirmación: se borrarán los datos actuales de la aplicación y se restaurarán los del archivo seleccionado.\n\n¿Restaurar ahora?"
    );

    if (!confirmar2) {
      return;
    }

    setRestaurando(true);
    setMensaje(
      "Creando copia automática de seguridad antes de restaurar..."
    );

    try {
      const copiaAntes = await construirCopia();

      const fechaHora = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

      descargarObjeto(
        copiaAntes as CopiaSeguridad,
        `espacio-padel-antes-de-restaurar-${fechaHora}.json`
      );

      setMensaje(
        "Restaurando datos. No cierres esta página..."
      );

      for (const tabla of ordenBorrado) {
        await borrarTabla(tabla);
      }

      for (const tabla of ordenRestauracion) {
        await restaurarTabla(
          tabla,
          copiaSeleccionada.tablas[tabla] || []
        );
      }

      setMensaje(
        "✅ Restauración completada correctamente. Recarga la aplicación."
      );

      setArchivoSeleccionado(null);
      setCopiaSeleccionada(null);

      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = "";
      }
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ La restauración no se ha completado: " +
          texto +
          ". Conserva la copia automática descargada antes de la restauración."
      );
    } finally {
      setRestaurando(false);
    }
  }

  function totalRegistros() {
    if (!copiaSeleccionada) {
      return 0;
    }

    return tablas.reduce(
      (total, tabla) =>
        total +
        (copiaSeleccionada.tablas[tabla]?.length || 0),
      0
    );
  }

  function formatearFechaCopia() {
    if (!copiaSeleccionada?.fecha_exportacion) {
      return "Sin fecha";
    }

    const fecha = new Date(
      copiaSeleccionada.fecha_exportacion
    );

    return fecha.toLocaleString("es-ES");
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">
        {/* CABECERA V2 */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Seguridad
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Copias de seguridad
              </h1>

              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Guarda una copia de tus datos y restaúrala si alguna vez fuera necesario.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[360px]">
              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Copia
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  Completa
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Un único archivo JSON
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Restauración
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  Protegida
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Con doble confirmación
                </p>
              </div>
            </div>
          </div>
        </section>

        {mensaje && (
          <section
            className={
              mensaje.startsWith("✅")
                ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                : mensaje.startsWith("❌")
                ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                : "mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700"
            }
          >
            {mensaje}
          </section>
        )}

        <div className="mt-4 grid gap-4 sm:mt-5 xl:grid-cols-2">
          {/* DESCARGA */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                  <IconoCopia />
                </span>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Exportar
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    Copia completa de datos
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/55">
                    Descarga los datos principales en un único archivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  La copia incluye
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-[#17324D] sm:grid-cols-3">
                  {[
                    "Alumnos",
                    "Clases",
                    "Series recurrentes",
                    "Pagos",
                    "Bonos",
                    "Bonos compartidos",
                    "Grupos",
                    "Ubicaciones",
                    "Relaciones entre datos",
                  ].map(
                    (elemento) => (
                      <div
                        key={elemento}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8F7F5] text-[10px] font-bold text-[#008F86]">
                          ✓
                        </span>
                        <span>{elemento}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold leading-relaxed text-sky-800">
                  Guarda varias copias con fechas diferentes. Es más seguro conservar un histórico que sustituir siempre el mismo archivo.
                </p>
              </div>

              <button
                type="button"
                onClick={descargarCopia}
                disabled={generando || restaurando}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconoDescarga />
                {generando
                  ? "Creando copia..."
                  : "Descargar copia de seguridad"}
              </button>
            </div>
          </section>

          {/* RESTAURAR */}
          <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-200">
                  <IconoRestaurar />
                </span>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200">
                    Restaurar
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    Recuperar una copia
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/55">
                    Selecciona un archivo creado por Espacio Pádel Manager.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Archivo de copia
              </label>

              <input
                ref={inputArchivoRef}
                type="file"
                accept=".json,application/json"
                onChange={seleccionarArchivo}
                disabled={restaurando}
                className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#17324D] file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-bold file:text-[#008F86] focus:border-[#00A79C]/60 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/10 disabled:opacity-60"
              />

              {copiaSeleccionada ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-[#FBFCFD]">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Copia seleccionada
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-[#17324D]">
                          {archivoSeleccionado?.name}
                        </p>
                      </div>

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        Válida
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-slate-200">
                    <div className="bg-white px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Fecha
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#17324D]">
                        {formatearFechaCopia()}
                      </p>
                    </div>

                    <div className="bg-white px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Versión
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#17324D]">
                        {copiaSeleccionada.version_copia}
                      </p>
                    </div>

                    <div className="col-span-2 bg-white px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Registros totales
                      </p>
                      <p className="mt-1 text-lg font-bold text-[#17324D]">
                        {totalRegistros()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                    {tablas.map((tabla) => (
                      <div
                        key={tabla}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          {tabla}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#17324D]">
                          {copiaSeleccionada.tablas[tabla]?.length || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-[#FBFCFD] px-4 py-5 text-center">
                  <p className="text-xs font-semibold text-slate-400">
                    Selecciona un archivo JSON para comprobarlo antes de restaurar.
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-bold text-red-700">
                  Importante
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-700/80">
                  Restaurar sustituye los datos actuales. Antes de hacerlo se descargará automáticamente una copia de seguridad y tendrás que confirmar la operación dos veces.
                </p>
              </div>

              <button
                type="button"
                onClick={restaurarCopia}
                disabled={
                  restaurando ||
                  generando ||
                  !copiaSeleccionada
                }
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconoRestaurar />
                {restaurando
                  ? "Restaurando..."
                  : "Restaurar esta copia"}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:mt-5 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-700">
              !
            </span>

            <div>
              <p className="text-sm font-bold text-amber-900">
                Recomendación
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Haz una copia periódicamente y conserva varias fechas diferentes. Una copia JSON es una salvaguarda rápida de los datos de negocio.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
