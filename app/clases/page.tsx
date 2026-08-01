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
  ubicacion_id: string | null;
  importe_club: number;
  coste_pista: number;
  tipo: string;
  estado: string;
  ubicaciones: {
    nombre: string;
  } | null;
  clase_alumnos: {
    alumno_id: string;
    importe: number;
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
  const [importeClub, setImporteClub] = useState("");
const [costePista, setCostePista] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [claseEditandoId, setClaseEditandoId] = useState<string | null>(null);

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
ubicacion_id,
tipo,
estado,
importe_club,
coste_pista,
    ubicaciones (
      nombre
    ),
   clase_alumnos (
  alumno_id,
  importe,
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
function editarClase(clase: Clase) {
  setClaseEditandoId(clase.id);
  setFecha(clase.fecha);
  setHora(clase.hora_inicio.slice(0, 5));
  setDuracion(String(clase.duracion_minutos));
  setUbicacionId(clase.ubicacion_id || "");
  setTipo(clase.tipo);
  setImporteClub(String(clase.importe_club || ""));
  setCostePista(String(clase.coste_pista || ""));

  setAlumnosSeleccionados(
    clase.clase_alumnos.map((participante) => participante.alumno_id)
  );

  setImporte(
    clase.clase_alumnos.length > 0
      ? String(clase.clase_alumnos[0].importe || "")
      : ""
  );

  setMensaje("Editando clase");
}
  useEffect(() => {
    cargarDatos();
  }, []);

  async function crearClase(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

   let claseCreada;
let errorClase;

if (claseEditandoId) {
  const resultado = await supabase
    .from("clases")
    .update({
      fecha,
      hora_inicio: hora,
      duracion_minutos: Number(duracion),
      ubicacion_id: ubicacionId || null,
      tipo,
      importe_club: importeClub ? Number(importeClub) : 0,
      coste_pista: costePista ? Number(costePista) : 0,
      estado: "realizada",
    })
    .eq("id", claseEditandoId)
    .select()
    .single();

  claseCreada = resultado.data;
  errorClase = resultado.error;
} else {
  const resultado = await supabase
    .from("clases")
    .insert({
      fecha,
      hora_inicio: hora,
      duracion_minutos: Number(duracion),
      ubicacion_id: ubicacionId || null,
      tipo,
      importe_club: importeClub ? Number(importeClub) : 0,
      coste_pista: costePista ? Number(costePista) : 0,
      estado: "realizada",
    })
    .select()
    .single();

  claseCreada = resultado.data;
  errorClase = resultado.error;
}

    if (errorClase) {
      setMensaje("❌ Error al crear clase: " + errorClase.message);
      return;
    }
if (claseEditandoId && claseCreada) {
  await supabase
    .from("clase_alumnos")
    .delete()
    .eq("clase_id", claseEditandoId);
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
                <input
  type="number"
  step="0.01"
  placeholder="Importe que paga el club"
  value={importeClub}
  onChange={(e) => setImporteClub(e.target.value)}
  className="w-full rounded-xl border border-slate-300 px-4 py-3"
/>

<input
  type="number"
  step="0.01"
  placeholder="Coste de pista"
  value={costePista}
  onChange={(e) => setCostePista(e.target.value)}
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
    const precioClase = clase.clase_alumnos.reduce(
  (total, participante) => total + Number(participante.importe || 0),
  0
);
    const saldoClase =
  Number(clase.importe_club || 0) - Number(clase.coste_pista || 0);

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
     <p className="mt-2 text-sm font-semibold">
  Precio clase: {precioClase.toFixed(2)} €
</p>
      <p className="mt-2 text-sm font-semibold">
  Saldo con club: {saldoClase.toFixed(2)} €
</p>
<button
  onClick={() => editarClase(clase)}
  className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
>
  Editar
</button>
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