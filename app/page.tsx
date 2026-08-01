"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [clasesHoy, setClasesHoy] = useState(0);
  const [horasHoy, setHorasHoy] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [pendiente, setPendiente] = useState(0);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    const hoy = new Date().toISOString().slice(0, 10);

    const inicioMes = hoy.slice(0, 8) + "01";

    const { data: clasesData } = await supabase
      .from("clases")
      .select("duracion_minutos")
      .eq("fecha", hoy);

    const clases = clasesData || [];

    setClasesHoy(clases.length);

    const minutos = clases.reduce(
      (total, clase) => total + Number(clase.duracion_minutos || 0),
      0
    );

    setHorasHoy(minutos / 60);

    const { data: pagosMesData } = await supabase
      .from("pagos")
      .select("importe,estado")
      .gte("fecha_pago", inicioMes)
      .lte("fecha_pago", hoy);

    const pagosMes = pagosMesData || [];

    const totalIngresos = pagosMes
      .filter((pago) => pago.estado === "pagado")
      .reduce(
        (total, pago) => total + Number(pago.importe || 0),
        0
      );

    const totalPendiente = pagosMes
      .filter((pago) => pago.estado === "pendiente")
      .reduce(
        (total, pago) => total + Number(pago.importe || 0),
        0
      );

    setIngresosMes(totalIngresos);
    setPendiente(totalPendiente);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">Espacio Pádel</h1>
          <p className="mt-1 text-sm text-slate-400">Manager</p>

          <nav className="mt-10 space-y-3">
            <a href="/" className="block rounded-lg bg-teal-600 px-4 py-3">
              Dashboard
            </a>
            <a href="/agenda" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
  Agenda
</a>

            <a href="/clases" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
              Clases
            </a>

            <a href="/alumnos" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
              Alumnos
            </a>

            <a href="/ubicaciones" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
              Ubicaciones
            </a>

            <a href="/bonos" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
              Bonos
            </a>

            <a href="/pagos" className="block rounded-lg px-4 py-3 hover:bg-slate-800">
              Pagos
            </a>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold text-slate-900">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-600">
              Resumen de tu actividad
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Clases hoy</p>
                <p className="mt-2 text-3xl font-bold">
                  {clasesHoy}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Horas hoy</p>
                <p className="mt-2 text-3xl font-bold">
                  {horasHoy.toFixed(1)}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">
                  Ingresos del mes
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {ingresosMes.toFixed(2)} €
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">
                  Pendiente de cobro
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {pendiente.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow">
              <h3 className="text-xl font-bold">
                Accesos rápidos
              </h3>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/clases"
                  className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                >
                  + Nueva clase
                </a>

                <a
                  href="/alumnos"
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
                >
                  + Nuevo alumno
                </a>

                <a
                  href="/pagos"
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 ring-1 ring-slate-300"
                >
                  Registrar pago
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}