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
  const [mensaje, setMensaje] = useState("");

  async function cargarAlumnos() {
    const { data, error } = await supabase
      .from("alumnos")
      .select("*")
      .order("nombre");

    if (error) {
      setMensaje("Error al cargar alumnos");
      return;
    }

    setAlumnos(data || []);
  }

  useEffect(() => {
    cargarAlumnos();
  }, []);

  async function crearAlumno(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("alumnos").insert({
      nombre,
      apellidos: apellidos || null,
      telefono: telefono || null,
      email: email || null,
      precio_habitual: precio ? Number(precio) : null,
    });

    if (error) {
      setMensaje("❌ Error al crear alumno: " + error.message);
      return;
    }

    setMensaje("✅ Alumno creado correctamente");

    setNombre("");
    setApellidos("");
    setTelefono("");
    setEmail("");
    setPrecio("");

    cargarAlumnos();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Alumnos
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de alumnos de Espacio Pádel Manager
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Nuevo alumno
            </h2>

            <form onSubmit={crearAlumno} className="mt-6 space-y-4">
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

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Guardar alumno
              </button>
            </form>

            {mensaje && (
              <p className="mt-4 text-sm">
                {mensaje}
              </p>
            )}
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
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
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold">
                    {alumno.nombre} {alumno.apellidos}
                  </p>

                  {alumno.telefono && (
                    <p className="text-sm text-slate-600">
                      {alumno.telefono}
                    </p>
                  )}

                  {alumno.email && (
                    <p className="text-sm text-slate-600">
                      {alumno.email}
                    </p>
                  )}

                  {alumno.precio_habitual !== null && (
                    <p className="mt-1 text-sm font-medium text-teal-700">
                      {alumno.precio_habitual} €
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}