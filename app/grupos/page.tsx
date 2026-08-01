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
  activo: boolean;
  grupo_alumnos: {
    alumno_id: string;
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

export default function GruposPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [grupoEditandoId, setGrupoEditandoId] = useState<string | null>(null);

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
      .select(`
        id,
        nombre,
        activo,
        grupo_alumnos (
          alumno_id,
          alumnos (
            nombre,
            apellidos
          )
        )
      `)
      .order("nombre");

    setAlumnos(alumnosData || []);
    setGrupos((gruposData || []) as Grupo[]);
  }

  function cambiarAlumno(id: string) {
    setAlumnosSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((alumnoId) => alumnoId !== id)
        : [...actuales, id]
    );
  }

  function limpiarFormulario() {
    setNombreGrupo("");
    setAlumnosSeleccionados([]);
    setActivo(true);
    setGrupoEditandoId(null);
  }

  async function guardarGrupo(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    let grupoId = grupoEditandoId;

    if (grupoEditandoId) {
      const { error } = await supabase
        .from("grupos")
        .update({
          nombre: nombreGrupo,
          activo,
        })
        .eq("id", grupoEditandoId);

      if (error) {
        setMensaje("❌ Error al actualizar grupo: " + error.message);
        return;
      }

      await supabase
        .from("grupo_alumnos")
        .delete()
        .eq("grupo_id", grupoEditandoId);
    } else {
      const { data: grupoCreado, error } = await supabase
        .from("grupos")
        .insert({
          nombre: nombreGrupo,
          activo: true,
        })
        .select()
        .single();

      if (error || !grupoCreado) {
        setMensaje("❌ Error al crear grupo");
        return;
      }

      grupoId = grupoCreado.id;
    }

    if (grupoId && alumnosSeleccionados.length > 0) {
      const relaciones = alumnosSeleccionados.map((alumnoId) => ({
        grupo_id: grupoId,
        alumno_id: alumnoId,
      }));

      const { error } = await supabase
        .from("grupo_alumnos")
        .insert(relaciones);

      if (error) {
        setMensaje("⚠️ Error al guardar los alumnos del grupo");
        return;
      }
    }

    setMensaje(
      grupoEditandoId
        ? "✅ Grupo actualizado correctamente"
        : "✅ Grupo creado correctamente"
    );

    limpiarFormulario();
    cargarDatos();
  }

  function editarGrupo(grupo: Grupo) {
    setGrupoEditandoId(grupo.id);
    setNombreGrupo(grupo.nombre);
    setActivo(grupo.activo);
    setAlumnosSeleccionados(
      grupo.grupo_alumnos.map((item) => item.alumno_id)
    );
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarGrupo(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar este grupo?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("grupos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("❌ Error al borrar grupo: " + error.message);
      return;
    }

    if (grupoEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje("✅ Grupo borrado correctamente");
    cargarDatos();
  }

  async function cambiarEstadoGrupo(grupo: Grupo) {
    const { error } = await supabase
      .from("grupos")
      .update({
        activo: !grupo.activo,
      })
      .eq("id", grupo.id);

    if (error) {
      setMensaje("❌ Error al cambiar el estado: " + error.message);
      return;
    }

    cargarDatos();
  }

  const gruposActivos = grupos.filter((grupo) => grupo.activo).length;
  const gruposInactivos = grupos.filter((grupo) => !grupo.activo).length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Grupos
        </h1>

        <p className="mt-2 text-slate-600">
          Crea grupos habituales de alumnos
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Grupos activos
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {gruposActivos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Grupos inactivos
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-500">
              {gruposInactivos}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              {grupoEditandoId ? "Editar grupo" : "Nuevo grupo"}
            </h2>

            <form onSubmit={guardarGrupo} className="mt-6 space-y-4">
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

              {grupoEditandoId && (
                <select
                  value={activo ? "activo" : "inactivo"}
                  onChange={(e) =>
                    setActivo(e.target.value === "activo")
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                {grupoEditandoId ? "Guardar cambios" : "Guardar grupo"}
              </button>

              {grupoEditandoId && (
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
              Grupos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {grupos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay grupos registrados.
                </p>
              )}

              {grupos.map((grupo) => {
                const nombres = grupo.grupo_alumnos
                  .map((item) => item.alumnos)
                  .filter(Boolean)
                  .map(
                    (alumno) =>
                      `${alumno?.nombre || ""} ${
                        alumno?.apellidos || ""
                      }`.trim()
                  )
                  .join(", ");

                return (
                  <div
                    key={grupo.id}
                    className={
                      grupo.activo
                        ? "rounded-xl border border-slate-200 bg-white p-4"
                        : "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70"
                    }
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {grupo.nombre}
                        </p>

                        <p
                          className={
                            grupo.activo
                              ? "mt-1 text-sm font-semibold text-green-600"
                              : "mt-1 text-sm font-semibold text-red-600"
                          }
                        >
                          {grupo.activo ? "Activo" : "Inactivo"}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {nombres || "Sin alumnos"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => editarGrupo(grupo)}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => cambiarEstadoGrupo(grupo)}
                          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
                        >
                          {grupo.activo ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          onClick={() => borrarGrupo(grupo.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
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