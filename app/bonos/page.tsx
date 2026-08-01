"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Bono = {
  id: string;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  fecha_compra: string;
  activo: boolean;
  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

export default function BonosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);

  const [alumnoId, setAlumnoId] = useState("");
  const [numeroClases, setNumeroClases] = useState("5");
  const [importe, setImporte] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos")
      .eq("activo", true)
      .order("nombre");

    const { data: bonosData } = await supabase
      .from("bonos")
      .select(`
        id,
        numero_clases,
        clases_restantes,
        importe_pagado,
        fecha_compra,
        activo,
        alumnos (
          nombre,
          apellidos
        )
      `)
      .order("fecha_compra", { ascending: false });

    setAlumnos(alumnosData || []);
    setBonos((bonosData || []) as Bono[]);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function crearBono(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const totalClases = Number(numeroClases);

    const { error } = await supabase.from("bonos").insert({
      alumno_id: alumnoId,
      numero_clases: totalClases,
      clases_restantes: totalClases,
      importe_pagado: importe ? Number(importe) : 0,
      activo: true,
    });

    if (error) {
      setMensaje("❌ Error al crear bono: " + error.message);
      return;
    }

    setMensaje("✅ Bono creado correctamente");
    setAlumnoId("");
    setNumeroClases("5");
    setImporte("");

    cargarDatos();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Bonos
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de bonos de clases
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Nuevo bono
            </h2>

            <form onSubmit={crearBono} className="mt-6 space-y-4">
              <select
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">Seleccionar alumno</option>

                {alumnos.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre} {alumno.apellidos || ""}
                  </option>
                ))}
              </select>

              <select
                value={numeroClases}
                onChange={(e) => setNumeroClases(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="5">Bono de 5 clases</option>
                <option value="10">Bono de 10 clases</option>
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Importe pagado"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Crear bono
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
              Bonos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {bonos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay bonos registrados.
                </p>
              )}

              {bonos.map((bono) => (
                <div
                  key={bono.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {bono.alumnos?.nombre}{" "}
                        {bono.alumnos?.apellidos || ""}
                      </p>

                      <p className="text-sm text-slate-600">
                        Bono de {bono.numero_clases} clases
                      </p>

                      <p className="text-sm text-slate-500">
                        Comprado: {bono.fecha_compra}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-700">
                        {bono.clases_restantes}
                      </p>

                      <p className="text-sm text-slate-500">
                        clases restantes
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {Number(bono.importe_pagado || 0).toFixed(2)} €
                      </p>
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