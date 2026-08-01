"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type Clase = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  ubicaciones: {
    nombre: string;
  } | null;
  clase_alumnos: {
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

export default function ClasesPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [ubicacionId, setUbicacionId] = useState("");
  const [tipo, setTipo] = useState("club");
 const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([]);
  const [importe, setImporte] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos")
      .eq("activo", true)
      .order("nombre");

    const { data: ubicacionesData } = await supabase
      .from("ubicaciones")
      .select("id,nombre")
      .eq("activa", true)
      .order("nombre");

    const { data: clasesData } = await supabase
  .from("clases")
  .select(`
    id,
    fecha,
    hora_inicio,
    duracion_minutos,
    tipo,
    estado,
    ubicaciones (
      nombre
    ),
    clase_alumnos (
      alumnos (
        nombre,
        apellidos
      )
    )
  `)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    setAlumnos(alumnosData || []);
    setUbicaciones(ubicacionesData || []);
    setClases((clasesData || []) as Clase[]);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function crearClase(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const { data: claseCreada, error: errorClase } = await supabase
      .from("clases")
      .insert({
        fecha,
        hora_inicio: hora,
        duracion_minutos: Number(duracion),
        ubicacion_id: ubicacionId || null,
        tipo,
        estado: "realizada",
      })
      .select()
      .single();

    if (errorClase) {
      setMensaje("❌ Error al crear clase: " + errorClase.message);
      return;
    }

   if (alumnosSeleccionados.length > 0 && claseCreada) {
  const participantes = alumnosSeleccionados.map((alumnoId) => ({
    clase_id: claseCreada.id,
    alumno_id: alumnoId,
    importe: importe ? Number(importe) : 0,
    pagado: false,
    usa_bono: false,
    asistio: true,
  }));

  const { error: errorAlumnos } = await supabase
    .from("clase_alumnos")
    .insert(participantes);

  if (errorAlumnos) {
    setMensaje(
      "⚠️ Clase creada, pero hubo un error al añadir los alumnos: " +
        errorAlumnos.message
    );
    return;
  }
}

    setMensaje("✅ Clase creada correctamente");

    setFecha("");
    setHora("");
    setDuracion("60");
    setUbicacionId("");
    setTipo("club");
    setAlumnosSeleccionados([]);
    setImporte("");

    cargarDatos();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Clases
        </h1>

        <p className="mt-2 text-slate-600">
          Registro y control de clases
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Nueva clase
            </h2>

            <form onSubmit={crearClase} className="mt-6 space-y-4">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <select
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>

              <select
                value={ubicacionId}
                onChange={(e) => setUbicacionId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">Seleccionar ubicación</option>

                {ubicaciones.map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="club">Clase para club</option>
                <option value="propia">Clase propia</option>
                <option value="privada">Pista privada</option>
              </select>

              <div>
  <p className="mb-3 text-sm font-medium">
    Alumnos
  </p>

  <div className="space-y-2">
    {alumnos.map((alumno) => (
      <label
        key={alumno.id}
        className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
      >
        <input
          type="checkbox"
          checked={alumnosSeleccionados.includes(alumno.id)}
          onChange={() =>
            setAlumnosSeleccionados((actuales) =>
              actuales.includes(alumno.id)
                ? actuales.filter((id) => id !== alumno.id)
                : [...actuales, alumno.id]
            )
          }
        />

        <span>
          {alumno.nombre} {alumno.apellidos || ""}
        </span>
      </label>
    ))}
  </div>
</div>

              <input
                type="number"
                step="0.01"
                placeholder="Importe"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Guardar clase
              </button>
            </form>

            {mensaje && (
              <p className="mt-4 text-sm">
                {mensaje}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
            <h2 className="text-xl font-bold">
              Clases registradas
            </h2>

            <div className="mt-6 space-y-3">
              {clases.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay clases registradas.
                </p>
              )}

              {clases.map((clase) => {
  const [hora, minuto] = clase.hora_inicio.split(":").map(Number);

  const inicio = new Date();
  inicio.setHours(hora, minuto, 0, 0);

  const fin = new Date(
    inicio.getTime() + clase.duracion_minutos * 60 * 1000
  );

  const horaInicio = `${String(inicio.getHours()).padStart(2, "0")}:${String(
    inicio.getMinutes()
  ).padStart(2, "0")} h`;

  const horaFin = `${String(fin.getHours()).padStart(2, "0")}:${String(
    fin.getMinutes()
  ).padStart(2, "0")} h`;

  const [anio, mes, dia] = clase.fecha.split("-");
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  const nombresAlumnos = clase.clase_alumnos
    .map((participante) => participante.alumnos)
    .filter(Boolean)
    .map(
      (alumno) =>
        `${alumno?.nombre || ""} ${alumno?.apellidos || ""}`.trim()
    )
    .join(", ");

  return (
    <div
      key={clase.id}
      className="rounded-xl border border-slate-200 p-4"
    >
      <p className="font-semibold">{fechaFormateada}</p>
      <p className="mt-1 text-lg font-medium">
        {horaInicio} a {horaFin}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {clase.ubicaciones?.nombre || "Sin ubicación"}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">
        {nombresAlumnos || "Sin alumnos"}
      </p>
    </div>
  );
})}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}