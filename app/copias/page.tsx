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
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Copias de seguridad
          </h1>

          <p className="mt-2 text-slate-600">
            Guarda y restaura los datos de Espacio Pádel Manager
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
              <IconoCopia />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Copia completa de datos
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Descarga todos los datos principales de la aplicación en un único archivo.
                Guárdalo en un lugar seguro para poder utilizarlo en el futuro si fuera necesario.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              La copia incluye
            </p>

            <div className="mt-4 grid gap-2 text-sm font-medium text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              <p>✓ Alumnos</p>
              <p>✓ Clases</p>
              <p>✓ Series recurrentes</p>
              <p>✓ Pagos</p>
              <p>✓ Bonos</p>
              <p>✓ Bonos compartidos</p>
              <p>✓ Grupos</p>
              <p>✓ Ubicaciones</p>
              <p>✓ Relaciones entre datos</p>
            </div>
          </div>

          <button
            type="button"
            onClick={descargarCopia}
            disabled={generando || restaurando}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#09a9a3] px-5 py-4 font-semibold text-white transition hover:bg-[#078f8a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconoDescarga />

            {generando
              ? "Creando copia..."
              : "Descargar copia de seguridad"}
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <IconoRestaurar />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Restaurar copia de seguridad
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Selecciona un archivo de copia creado por Espacio Pádel Manager.
                La aplicación comprobará el archivo antes de permitir la restauración.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <input
              ref={inputArchivoRef}
              type="file"
              accept=".json,application/json"
              onChange={seleccionarArchivo}
              disabled={restaurando}
              className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          {copiaSeleccionada && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-900">
                Copia seleccionada
              </p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-slate-500">
                    Archivo:
                  </span>{" "}
                  <strong>
                    {archivoSeleccionado?.name}
                  </strong>
                </p>

                <p>
                  <span className="text-slate-500">
                    Fecha de la copia:
                  </span>{" "}
                  <strong>
                    {formatearFechaCopia()}
                  </strong>
                </p>

                <p>
                  <span className="text-slate-500">
                    Versión:
                  </span>{" "}
                  <strong>
                    {copiaSeleccionada.version_copia}
                  </strong>
                </p>

                <p>
                  <span className="text-slate-500">
                    Registros totales:
                  </span>{" "}
                  <strong>
                    {totalRegistros()}
                  </strong>
                </p>
              </div>

              <div className="mt-5 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                {tablas.map((tabla) => (
                  <div
                    key={tabla}
                    className="rounded-lg bg-white px-3 py-2"
                  >
                    {tabla}:{" "}
                    <strong>
                      {copiaSeleccionada.tablas[tabla]?.length || 0}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={restaurarCopia}
            disabled={
              restaurando ||
              generando ||
              !copiaSeleccionada
            }
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconoRestaurar />

            {restaurando
              ? "Restaurando..."
              : "Restaurar esta copia"}
          </button>

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-900">
              Importante
            </p>

            <p className="mt-2 text-sm leading-6 text-red-800">
              Restaurar sustituye los datos actuales por los contenidos en la copia.
              Antes de hacerlo, la aplicación descargará automáticamente una copia de los datos actuales.
              Además, tendrás que confirmar la operación dos veces.
            </p>
          </div>
        </div>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">
              {mensaje}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">
            Recomendación
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Haz una copia periódicamente y conserva varias fechas diferentes.
            No sustituyas siempre el archivo anterior.
          </p>
        </div>
      </div>
    </main>
  );
}
