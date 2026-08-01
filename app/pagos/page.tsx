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
  alumno_id: string | null;
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
  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pagoEditandoId, setPagoEditandoId] = useState<string | null>(null);

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
        alumno_id,
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

  function limpiarFormulario() {
    setAlumnoId("");
    setImporte("");
    setMetodo("efectivo");
    setEstado("pagado");
    setFechaPago(new Date().toISOString().slice(0, 10));
    setNotas("");
    setPagoEditandoId(null);
  }

  async function guardarPago(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");

    if (!importe) {
      setMensaje("❌ Introduce un importe");
      return;
    }

    const datos = {
      alumno_id: alumnoId || null,
      importe: Number(importe),
      metodo,
      estado,
      fecha_pago: fechaPago,
      notas: notas || null,
    };

    let error;

    if (pagoEditandoId) {
      const resultado = await supabase
        .from("pagos")
        .update(datos)
        .eq("id", pagoEditandoId);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("pagos")
        .insert(datos);

      error = resultado.error;
    }

    if (error) {
      setMensaje("❌ Error al guardar el pago: " + error.message);
      return;
    }

    setMensaje(
      pagoEditandoId
        ? "✅ Pago actualizado correctamente"
        : "✅ Pago registrado correctamente"
    );

    limpiarFormulario();
    cargarDatos();
  }

  function editarPago(pago: Pago) {
    setPagoEditandoId(pago.id);
    setAlumnoId(pago.alumno_id || "");
    setImporte(String(pago.importe));
    setMetodo(pago.metodo);
    setEstado(pago.estado);
    setFechaPago(pago.fecha_pago);
    setNotas(pago.notas || "");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function borrarPago(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar este pago?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("pagos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("❌ Error al borrar el pago: " + error.message);
      return;
    }

    if (pagoEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje("✅ Pago borrado correctamente");
    cargarDatos();
  }

  const totalPagado = pagos
    .filter((pago) => pago.estado === "pagado")
    .reduce((total, pago) => total + Number(pago.importe || 0), 0);

  const totalPendiente = pagos
    .filter((pago) => pago.estado === "pendiente")
    .reduce((total, pago) => total + Number(pago.importe || 0), 0);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">
          Pagos
        </h1>

        <p className="mt-2 text-slate-600">
          Registro de cobros y pagos pendientes
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Total pagado</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {totalPagado.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Pendiente de cobro</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalPendiente.toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              {pagoEditandoId ? "Editar pago" : "Nuevo pago"}
            </h2>

            <form onSubmit={guardarPago} className="mt-6 space-y-4">
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
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                required
              />

              <input
                type="number"
                step="0.01"
                placeholder="Importe"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                required
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
                {pagoEditandoId ? "Guardar cambios" : "Guardar pago"}
              </button>

              {pagoEditandoId && (
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
              Pagos registrados
            </h2>

            <div className="mt-6 space-y-3">
              {pagos.length === 0 && (
                <p className="text-slate-500">
                  Todavía no hay pagos registrados.
                </p>
              )}

              {pagos.map((pago) => {
                const [anio, mes, dia] = pago.fecha_pago.split("-");
                const fechaFormateada = `${dia}/${mes}/${anio}`;

                return (
                  <div
                    key={pago.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {pago.alumnos
                            ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`
                            : "Sin alumno"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {fechaFormateada}
                        </p>

                        <p className="mt-1 text-sm capitalize text-slate-600">
                          {pago.metodo}
                        </p>

                        <p
                          className={
                            pago.estado === "pagado"
                              ? "mt-1 text-sm font-semibold text-green-600"
                              : "mt-1 text-sm font-semibold text-red-600"
                          }
                        >
                          {pago.estado === "pagado"
                            ? "Pagado"
                            : "Pendiente"}
                        </p>

                        {pago.notas && (
                          <p className="mt-2 text-sm text-slate-500">
                            {pago.notas}
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <p className="text-2xl font-bold text-teal-700">
                          {Number(pago.importe).toFixed(2)} €
                        </p>

                        <div className="mt-3">
                          <button
                            onClick={() => editarPago(pago)}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => borrarPago(pago.id)}
                            className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Borrar
                          </button>
                        </div>
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