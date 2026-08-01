"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string | null;
  coste_pista: number | null;
  activa: boolean;
};

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("club");
  const [direccion, setDireccion] = useState("");
  const [costePista, setCostePista] = useState("");
  const [activa, setActiva] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [ubicacionEditandoId, setUbicacionEditandoId] = useState<string | null>(null);

  async function cargarUbicaciones() {
    const { data, error } = await supabase
      .from("ubicaciones")
      .select("*")
      .order("nombre");

    if (error) {
      setMensaje("❌ Error al cargar ubicaciones: " + error.message);
      return;
    }

    setUbicaciones(data || []);
  }

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  function limpiarFormulario() {
    setNombre("");
    setTipo("club");
    setDireccion("");
    setCostePista("");
    setActiva(true);
    setUbicacionEditandoId(null);
  }

  async function guardarUbicacion(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const datos = {
      nombre,
      tipo,
      direccion: direccion || null,
      coste_pista: costePista ? Number(costePista) : 0,
      activa,
    };

    let error;

    if (ubicacionEditandoId) {
      const resultado = await supabase
        .from("ubicaciones")
        .update(datos)
        .eq("id", ubicacionEditandoId);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("ubicaciones")
        .insert(datos);

      error = resultado.error;
    }

    if (error) {
      setMensaje("❌ Error al guardar ubicación: " + error.message);
      return;
    }

    setMensaje(
      ubicacionEditandoId
        ? "✅ Ubicación actualizada correctamente"
        : "✅ Ubicación creada correctamente"
    );

    limpiarFormulario();
    cargarUbicaciones();
  }

  function editarUbicacion(ubicacion: Ubicacion) {
    setUbicacionEditandoId(ubicacion.id);
    setNombre(ubicacion.nombre);
    setTipo(ubicacion.tipo);
    setDireccion(ubicacion.direccion || "");
    setCostePista(String(ubicacion.coste_pista || ""));
    setActiva(ubicacion.activa);
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarUbicacion(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar esta ubicación?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("ubicaciones")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("❌ Error al borrar ubicación: " + error.message);
      return;
    }

    if (ubicacionEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje("✅ Ubicación borrada correctamente");
    cargarUbicaciones();
  }

  async function cambiarEstadoUbicacion(ubicacion: Ubicacion) {
    const { error } = await supabase
      .from("ubicaciones")
      .update({
        activa: !ubicacion.activa,
      })
      .eq("id", ubicacion.id);

    if (error) {
      setMensaje("❌ Error al cambiar el estado: " + error.message);
      return;
    }

    cargarUbicaciones();
  }

  const ubicacionesActivas = ubicaciones.filter(
    (ubicacion) => ubicacion.activa
  ).length;

  const ubicacionesInactivas = ubicaciones.filter(
    (ubicacion) => !ubicacion.activa
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Ubicaciones
        </h1>

        <p className="mt-2 text-slate-600">
          Clubes, urbanizaciones y pistas privadas
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Ubicaciones activas
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {ubicacionesActivas}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Ubicaciones inactivas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {ubicacionesInactivas}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              {ubicacionEditandoId ? "Editar ubicación" : "Nueva ubicación"}
            </h2>

            <form onSubmit={guardarUbicacion} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="club">Club</option>
                <option value="urbanizacion">Urbanización</option>
                <option value="privada">Pista privada</option>
                <option value="otro">Otro</option>
              </select>

              <input
                type="text"
                placeholder="Dirección"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
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

              {ubicacionEditandoId && (
                <select
                  value={activa ? "activa" : "inactiva"}
                  onChange={(e) => setActiva(e.target.value === "activa")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                {ubicacionEditandoId
                  ? "Guardar cambios"
                  : "Guardar ubicación"}
              </button>

              {ubicacionEditandoId && (
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
              Ubicaciones registradas
            </h2>

            <div className="mt-6 space-y-3">
              {ubicaciones.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay ubicaciones registradas.
                </p>
              )}

              {ubicaciones.map((ubicacion) => (
                <div
                  key={ubicacion.id}
                  className={
                    ubicacion.activa
                      ? "rounded-xl border border-slate-200 bg-white p-4"
                      : "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70"
                  }
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {ubicacion.nombre}
                      </p>

                      <p className="mt-1 text-sm capitalize text-slate-600">
                        {ubicacion.tipo}
                      </p>

                      <p
                        className={
                          ubicacion.activa
                            ? "mt-1 text-sm font-semibold text-green-600"
                            : "mt-1 text-sm font-semibold text-red-600"
                        }
                      >
                        {ubicacion.activa ? "Activa" : "Inactiva"}
                      </p>

                      {ubicacion.direccion && (
                        <p className="mt-2 text-sm text-slate-500">
                          {ubicacion.direccion}
                        </p>
                      )}

                      <p className="mt-2 text-sm font-medium text-teal-700">
                        Coste pista:{" "}
                        {Number(ubicacion.coste_pista || 0).toFixed(2)} €
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => editarUbicacion(ubicacion)}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => cambiarEstadoUbicacion(ubicacion)}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
                      >
                        {ubicacion.activa ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        onClick={() => borrarUbicacion(ubicacion.id)}
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