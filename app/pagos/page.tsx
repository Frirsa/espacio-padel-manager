"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Pago = {
  id: string;
  importe: number;
  metodo: string;
  estado: string;
  fecha_pago: string;
  notas: string | null;
  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

export default function PagosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const [alumnoId, setAlumnoId] = useState("");
  const [importe, setImporte] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [estado, setEstado] = useState("pagado");
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos")
      .eq("activo", true)
      .order("nombre");

    const { data: pagosData } = await supabase
      .from("pagos")
      .select(`
        id,
        importe,
        metodo,
        estado,
        fecha_pago,
        notas,
        alumnos (
          nombre,
          apellidos
        )
      `)
      .order("fecha_pago", { ascending: false });

    setAlumnos(alumnosData || []);
    setPagos((pagosData || []) as Pago[]);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function crearPago(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    const { error } = await supabase.from("pagos").insert({
      alumno_id: alumnoId || null,
      importe: Number(importe),
      metodo,
      estado,
      notas: notas || null,
    });

    if (error) {
      setMensaje("❌ Error al crear pago: " + error.message);
      return;
    }

    setMensaje("✅ Pago registrado correctamente");

    setAlumnoId("");
    setImporte("");
    setMetodo("efectivo");
    setEstado("pagado");
    setNotas("");

    cargarDatos();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Pagos
        </h1>

        <p className="mt-2 text-slate-600">
          Registro de cobros y pagos pendientes
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Nuevo pago
            </h2>

            <form onSubmit={crearPago} className="mt-6 space-y-4">
              <select
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">Sin alumno</option>

                {alumnos.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre} {alumno.apellidos || ""}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Importe"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="efectivo">Efectivo</option>
                <option value="bizum">Bizum</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>

              <textarea
                placeholder="Notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                rows={3}
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
                Guardar pago
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
              Pagos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {pagos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay pagos registrados.
                </p>
              )}

              {pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {pago.alumnos
                          ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`
                          : "Sin alumno"}
                      </p>

                      <p className="text-sm capitalize text-slate-600">
                        {pago.metodo} · {pago.estado}
                      </p>

                      <p className="text-sm text-slate-500">
                        {pago.fecha_pago}
                      </p>

                      {pago.notas && (
                        <p className="mt-1 text-sm text-slate-500">
                          {pago.notas}
                        </p>
                      )}
                    </div>

                    <p className="text-2xl font-bold text-teal-700">
                      {Number(pago.importe).toFixed(2)} €
                    </p>
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