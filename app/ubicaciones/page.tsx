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
  const [mensaje, setMensaje] = useState("");

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

  async function crearUbicacion(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("ubicaciones").insert({
      nombre,
      tipo,
      direccion: direccion || null,
      coste_pista: costePista ? Number(costePista) : 0,
    });

    if (error) {
      setMensaje("❌ Error al crear ubicación: " + error.message);
      return;
    }

    setMensaje("✅ Ubicación creada correctamente");
    setNombre("");
    setTipo("club");
    setDireccion("");
    setCostePista("");

    cargarUbicaciones();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Ubicaciones
        </h1>

        <p className="mt-2 text-slate-600">
          Clubes, urbanizaciones y pistas privadas
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Nueva ubicación</h2>

            <form onSubmit={crearUbicacion} className="mt-6 space-y-4">
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

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Guardar ubicación
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
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold">{ubicacion.nombre}</p>
                  <p className="text-sm capitalize text-slate-600">
                    {ubicacion.tipo}
                  </p>

                  {ubicacion.direccion && (
                    <p className="text-sm text-slate-500">
                      {ubicacion.direccion}
                    </p>
                  )}

                  <p className="mt-1 text-sm font-medium text-teal-700">
                    Coste pista: {Number(ubicacion.coste_pista || 0).toFixed(2)} €
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