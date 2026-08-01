"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Grupo = {
  id: string;
  nombre: string;
};

export default function GruposPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos")
      .eq("activo", true)
      .order("nombre");

    const { data: gruposData } = await supabase
      .from("grupos")
      .select("id,nombre")
      .eq("activo", true)
      .order("nombre");

    setAlumnos(alumnosData || []);
    setGrupos(gruposData || []);
  }

  function cambiarAlumno(id: string) {
    setAlumnosSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((alumnoId) => alumnoId !== id)
        : [...actuales, id]
    );
  }

  async function crearGrupo(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const { data: grupoCreado, error: errorGrupo } = await supabase
      .from("grupos")
      .insert({
        nombre: nombreGrupo,
      })
      .select()
      .single();

    if (errorGrupo || !grupoCreado) {
      setMensaje("❌ Error al crear grupo");
      return;
    }

    if (alumnosSeleccionados.length > 0) {
      const relaciones = alumnosSeleccionados.map((alumnoId) => ({
        grupo_id: grupoCreado.id,
        alumno_id: alumnoId,
      }));

      const { error: errorRelaciones } = await supabase
        .from("grupo_alumnos")
        .insert(relaciones);

      if (errorRelaciones) {
        setMensaje("⚠️ Grupo creado, pero hubo un error al añadir alumnos");
        return;
      }
    }

    setMensaje("✅ Grupo creado correctamente");
    setNombreGrupo("");
    setAlumnosSeleccionados([]);

    cargarDatos();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Grupos
        </h1>

        <p className="mt-2 text-slate-600">
          Crea grupos habituales de alumnos
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Nuevo grupo
            </h2>

            <form onSubmit={crearGrupo} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

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
                        onChange={() => cambiarAlumno(alumno.id)}
                      />

                      <span>
                        {alumno.nombre} {alumno.apellidos || ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Guardar grupo
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
              Grupos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {grupos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay grupos registrados.
                </p>
              )}

              {grupos.map((grupo) => (
                <div
                  key={grupo.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold">
                    {grupo.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}