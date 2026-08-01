"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  precio_habitual: number | null;
  activo: boolean;
};

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [precio, setPrecio] = useState("");
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [alumnoEditandoId, setAlumnoEditandoId] = useState<string | null>(null);

  async function cargarAlumnos() {
    const { data, error } = await supabase
      .from("alumnos")
      .select("*")
      .order("nombre");

    if (error) {
      setMensaje("❌ Error al cargar alumnos: " + error.message);
      return;
    }

    setAlumnos(data || []);
  }

  useEffect(() => {
    cargarAlumnos();
  }, []);

  function limpiarFormulario() {
    setNombre("");
    setApellidos("");
    setTelefono("");
    setEmail("");
    setPrecio("");
    setActivo(true);
    setAlumnoEditandoId(null);
  }

  async function guardarAlumno(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const datos = {
      nombre,
      apellidos: apellidos || null,
      telefono: telefono || null,
      email: email || null,
      precio_habitual: precio ? Number(precio) : null,
      activo,
    };

    let error;

    if (alumnoEditandoId) {
      const resultado = await supabase
        .from("alumnos")
        .update(datos)
        .eq("id", alumnoEditandoId);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("alumnos")
        .insert(datos);

      error = resultado.error;
    }

    if (error) {
      setMensaje("❌ Error al guardar alumno: " + error.message);
      return;
    }

    setMensaje(
      alumnoEditandoId
        ? "✅ Alumno actualizado correctamente"
        : "✅ Alumno creado correctamente"
    );

    limpiarFormulario();
    cargarAlumnos();
  }

  function editarAlumno(alumno: Alumno) {
    setAlumnoEditandoId(alumno.id);
    setNombre(alumno.nombre);
    setApellidos(alumno.apellidos || "");
    setTelefono(alumno.telefono || "");
    setEmail(alumno.email || "");
    setPrecio(
      alumno.precio_habitual !== null
        ? String(alumno.precio_habitual)
        : ""
    );
    setActivo(alumno.activo);
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarAlumno(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar este alumno?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("alumnos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("❌ Error al borrar alumno: " + error.message);
      return;
    }

    if (alumnoEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje("✅ Alumno borrado correctamente");
    cargarAlumnos();
  }

  async function cambiarEstadoAlumno(alumno: Alumno) {
    const { error } = await supabase
      .from("alumnos")
      .update({
        activo: !alumno.activo,
      })
      .eq("id", alumno.id);

    if (error) {
      setMensaje("❌ Error al cambiar el estado: " + error.message);
      return;
    }

    cargarAlumnos();
  }

  const alumnosActivos = alumnos.filter(
    (alumno) => alumno.activo
  ).length;

  const alumnosInactivos = alumnos.filter(
    (alumno) => !alumno.activo
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Alumnos
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de alumnos de Espacio Pádel Manager
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Alumnos activos
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {alumnosActivos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Alumnos inactivos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {alumnosInactivos}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              {alumnoEditandoId ? "Editar alumno" : "Nuevo alumno"}
            </h2>

            <form onSubmit={guardarAlumno} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="text"
                placeholder="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="text"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="number"
                step="0.01"
                placeholder="Precio habitual"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              {alumnoEditandoId && (
                <select
                  value={activo ? "activo" : "inactivo"}
                  onChange={(e) =>
                    setActivo(e.target.value === "activo")
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
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                {alumnoEditandoId
                  ? "Guardar cambios"
                  : "Guardar alumno"}
              </button>

              {alumnoEditandoId && (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMensaje("");
                  }}
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

          <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
            <h2 className="text-xl font-bold">
              Alumnos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {alumnos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay alumnos registrados.
                </p>
              )}

              {alumnos.map((alumno) => (
                <div
                  key={alumno.id}
                  className={
                    alumno.activo
                      ? "rounded-xl border border-slate-200 bg-white p-4"
                      : "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70"
                  }
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {alumno.nombre} {alumno.apellidos || ""}
                      </p>

                      <p
                        className={
                          alumno.activo
                            ? "mt-1 text-sm font-semibold text-green-600"
                            : "mt-1 text-sm font-semibold text-red-600"
                        }
                      >
                        {alumno.activo ? "Activo" : "Inactivo"}
                      </p>

                      {alumno.telefono && (
                        <p className="mt-2 text-sm text-slate-600">
                          Tel: {alumno.telefono}
                        </p>
                      )}

                      {alumno.email && (
                        <p className="text-sm text-slate-600">
                          {alumno.email}
                        </p>
                      )}

                      {alumno.precio_habitual !== null && (
                        <p className="mt-2 text-sm font-medium text-teal-700">
                          Precio habitual:{" "}
                          {Number(alumno.precio_habitual).toFixed(2)} €
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => editarAlumno(alumno)}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => cambiarEstadoAlumno(alumno)}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
                      >
                        {alumno.activo
                          ? "Desactivar"
                          : "Activar"}
                      </button>

                      <button
                        onClick={() => borrarAlumno(alumno.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}