"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { sincronizarClaseConGoogleCalendar } from "../../lib/googleCalendarClient";

type NombreAlumno = {
  nombre: string;
  apellidos: string | null;
};

type RelacionAlumno = {
  alumnos: NombreAlumno | NombreAlumno[] | null;
};

type UbicacionRelacion =
  | { nombre: string }
  | { nombre: string }[]
  | null;

type ClaseSincronizable = {
  id: string;
  google_calendar_event_id: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  observaciones: string | null;
  ubicaciones: UbicacionRelacion;
  clase_alumnos: RelacionAlumno[];
};

const CAMPOS_CLASES = `
  id,
  google_calendar_event_id,
  fecha,
  hora_inicio,
  duracion_minutos,
  tipo,
  estado,
  observaciones,
  ubicaciones (
    nombre
  ),
  clase_alumnos (
    alumnos (
      nombre,
      apellidos
    )
  )
`;

function nombreUbicacion(valor: UbicacionRelacion) {
  if (!valor) return null;

  if (Array.isArray(valor)) {
    return valor[0]?.nombre || null;
  }

  return valor.nombre || null;
}

function nombresAlumnos(relaciones: RelacionAlumno[]) {
  const resultado: string[] = [];

  for (const relacion of relaciones || []) {
    const alumnos = Array.isArray(relacion.alumnos)
      ? relacion.alumnos
      : relacion.alumnos
      ? [relacion.alumnos]
      : [];

    for (const alumno of alumnos) {
      const nombre = `${alumno.nombre || ""} ${
        alumno.apellidos || ""
      }`.trim();

      if (nombre) {
        resultado.push(nombre);
      }
    }
  }

  return resultado;
}

export default function SincronizarGooglePage() {
  const [pendientes, setPendientes] = useState<ClaseSincronizable[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [procesadas, setProcesadas] = useState(0);
  const [totalProceso, setTotalProceso] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarPendientes();
  }, []);

  async function cargarPendientes() {
    setCargando(true);

    const { data, error } = await supabase
      .from("clases")
      .select(CAMPOS_CLASES)
      .is("google_calendar_event_id", null)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      setMensaje(`❌ No se pudieron cargar las clases pendientes: ${error.message}`);
      setPendientes([]);
      setCargando(false);
      return;
    }

    setPendientes((data || []) as unknown as ClaseSincronizable[]);
    setCargando(false);
  }

  async function cargarTodasLasClases() {
    const { data, error } = await supabase
      .from("clases")
      .select(CAMPOS_CLASES)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      throw new Error(`No se pudieron cargar las clases: ${error.message}`);
    }

    return (data || []) as unknown as ClaseSincronizable[];
  }

  async function ejecutarSincronizacion(
    clases: ClaseSincronizable[],
    textoFinal: string
  ) {
    setSincronizando(true);
    setProcesadas(0);
    setTotalProceso(clases.length);
    setCorrectas(0);
    setErrores([]);
    setMensaje("");

    let totalCorrectas = 0;
    const fallos: string[] = [];

    for (let indice = 0; indice < clases.length; indice += 1) {
      const clase = clases[indice];

      try {
        await sincronizarClaseConGoogleCalendar({
          id: clase.id,
          google_calendar_event_id: clase.google_calendar_event_id,
          fecha: clase.fecha,
          hora_inicio: clase.hora_inicio,
          duracion_minutos: Number(clase.duracion_minutos || 60),
          tipo: clase.tipo,
          estado: clase.estado,
          observaciones: clase.observaciones,
          ubicacion: nombreUbicacion(clase.ubicaciones),
          alumnos: nombresAlumnos(clase.clase_alumnos),
        });

        totalCorrectas += 1;
        setCorrectas(totalCorrectas);
      } catch (error) {
        const texto =
          error instanceof Error ? error.message : "Error desconocido";

        fallos.push(
          `${clase.fecha} ${clase.hora_inicio.slice(0, 5)} · ${texto}`
        );
        setErrores([...fallos]);
      }

      setProcesadas(indice + 1);
    }

    await cargarPendientes();

    if (fallos.length === 0) {
      setMensaje(
        `✅ ${textoFinal} ${totalCorrectas} clase(s) actualizadas correctamente.`
      );
    } else {
      setMensaje(
        `⚠️ Proceso terminado. ${totalCorrectas} correcta(s) y ${fallos.length} con error.`
      );
    }

    setSincronizando(false);
  }

  async function sincronizarPendientes() {
    if (sincronizando || pendientes.length === 0) {
      return;
    }

    const confirmar = window.confirm(
      `Se van a sincronizar ${pendientes.length} clase(s) que todavía no tienen evento asociado en Google Calendar. ¿Continuar?`
    );

    if (!confirmar) {
      return;
    }

    await ejecutarSincronizacion(
      pendientes,
      "Sincronización terminada."
    );
  }

  async function actualizarTodosLosEventos() {
    if (sincronizando) {
      return;
    }

    try {
      setMensaje("Comprobando clases para actualizar...");
      const clases = await cargarTodasLasClases();

      if (clases.length === 0) {
        setMensaje("No hay clases para actualizar.");
        return;
      }

      const confirmar = window.confirm(
        `Se van a actualizar ${clases.length} evento(s) de Google Calendar con el nuevo formato, poniendo primero el nombre del alumno o alumnos. No se crearán duplicados. ¿Continuar?`
      );

      if (!confirmar) {
        setMensaje("");
        return;
      }

      await ejecutarSincronizacion(
        clases,
        "Actualización de títulos terminada."
      );
    } catch (error) {
      const texto =
        error instanceof Error ? error.message : "Error desconocido";
      setMensaje(`❌ ${texto}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-7 lg:px-9">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#09a9a3]">
            Google Calendar
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Sincronización con Google Calendar
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Esta pantalla permite sincronizar clases pendientes y también
            actualizar los eventos ya existentes sin volver a crearlos.
          </p>

          <div className="mt-7 rounded-2xl bg-slate-50 p-5">
            {cargando ? (
              <p className="font-semibold text-slate-600">
                Comprobando clases pendientes...
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-500">
                  Clases pendientes de sincronizar
                </p>
                <p className="mt-1 text-4xl font-bold text-slate-900">
                  {pendientes.length}
                </p>
              </>
            )}
          </div>

          {sincronizando && (
            <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-5">
              <p className="font-bold text-teal-800">
                Procesando {procesadas} de {totalProceso}
              </p>
              <p className="mt-1 text-sm text-teal-700">
                Correctas hasta ahora: {correctas}
              </p>
            </div>
          )}

          {mensaje && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              {mensaje}
            </div>
          )}

          {errores.length > 0 && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-bold text-red-800">
                Clases que no se pudieron actualizar
              </p>
              <div className="mt-3 space-y-2 text-sm text-red-700">
                {errores.map((error, indice) => (
                  <p key={`${indice}-${error}`}>{error}</p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sincronizarPendientes}
              disabled={
                cargando || sincronizando || pendientes.length === 0
              }
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sincronizar clases pendientes
            </button>

            <button
              type="button"
              onClick={actualizarTodosLosEventos}
              disabled={cargando || sincronizando}
              className="rounded-xl bg-[#09a9a3] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Poner nombres primero en todos los eventos
            </button>

            <button
              type="button"
              onClick={cargarPendientes}
              disabled={cargando || sincronizando}
              className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Volver a comprobar
            </button>
          </div>

          {!cargando && pendientes.length === 0 && (
            <p className="mt-6 font-semibold text-green-700">
              ✅ No quedan clases pendientes de sincronización.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
