"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [clasesHoy, setClasesHoy] = useState(0);
  const [horasHoy, setHorasHoy] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [pendiente, setPendiente] = useState(0);
  const [saldoClubMes, setSaldoClubMes] = useState(0);
  const [gastosPistaMes, setGastosPistaMes] = useState(0);
  const [ingresosClubMes, setIngresosClubMes] = useState(0);
  const [proximaClase, setProximaClase] = useState<any>(null);
  const [totalClasesMes, setTotalClasesMes] = useState(0);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    const ahora = new Date();

    const hoy = ahora.toISOString().slice(0, 10);
    const inicioMes = hoy.slice(0, 8) + "01";

    const { data: clasesMesData } = await supabase
      .from("clases")
      .select("id")
      .gte("fecha", inicioMes)
      .lte("fecha", hoy);

    setTotalClasesMes(clasesMesData?.length || 0);

    const { data: economiaClubData } = await supabase
      .from("clases")
      .select("importe_club,coste_pista")
      .gte("fecha", inicioMes)
      .lte("fecha", hoy);

    const economiaClub = economiaClubData || [];

    const saldoClub = economiaClub.reduce(
      (total, clase) =>
        total +
        Number(clase.importe_club || 0) -
        Number(clase.coste_pista || 0),
      0
    );

    const totalGastosPista = economiaClub.reduce(
      (total, clase) =>
        total + Number(clase.coste_pista || 0),
      0
    );

    const totalIngresosClub = economiaClub.reduce(
      (total, clase) =>
        total + Number(clase.importe_club || 0),
      0
    );

    setSaldoClubMes(saldoClub);
    setGastosPistaMes(totalGastosPista);
    setIngresosClubMes(totalIngresosClub);

    const { data: clasesData } = await supabase
      .from("clases")
      .select("duracion_minutos")
      .eq("fecha", hoy);

    const clases = clasesData || [];

    setClasesHoy(clases.length);

    const minutos = clases.reduce(
      (total, clase) =>
        total + Number(clase.duracion_minutos || 0),
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
        (total, pago) =>
          total + Number(pago.importe || 0),
        0
      );

    const totalPendiente = pagosMes
      .filter((pago) => pago.estado === "pendiente")
      .reduce(
        (total, pago) =>
          total + Number(pago.importe || 0),
        0
      );

    setIngresosMes(totalIngresos);
    setPendiente(totalPendiente);

    const fechaActual = ahora.toISOString().slice(0, 10);
    const horaActual = ahora.toTimeString().slice(0, 8);

    const { data: proximaData } = await supabase
      .from("clases")
      .select(`
        fecha,
        hora_inicio,
        duracion_minutos,
        tipo,
        estado,
        ubicaciones (
          nombre
        ),
        clase_alumnos (
          alumnos (
            nombre,
            apellidos
          )
        )
      `)
      .neq("estado", "cancelada")
      .or(
        `fecha.gt.${fechaActual},and(fecha.eq.${fechaActual},hora_inicio.gte.${horaActual})`
      )
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(1);

    setProximaClase(proximaData?.[0] || null);
  }

  const nombresProximaClase =
    proximaClase?.clase_alumnos
      ?.map((item: any) => item.alumnos)
      .filter(Boolean)
      .map(
        (alumno: any) =>
          `${alumno.nombre || ""} ${
            alumno.apellidos || ""
          }`.trim()
      )
      .join(", ") || "";

  const fechaProximaClase = proximaClase
    ? (() => {
        const [anio, mes, dia] =
          proximaClase.fecha.split("-");

        return `${dia}/${mes}/${anio}`;
      })()
    : "";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">

        <h1 className="text-4xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Resumen de tu actividad
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Clases hoy
            </p>

            <p className="mt-2 text-3xl font-bold">
              {clasesHoy}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Clases del mes
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalClasesMes}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Horas hoy
            </p>

            <p className="mt-2 text-3xl font-bold">
              {horasHoy.toFixed(1)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Ingresos del mes
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {ingresosMes.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Pendiente de cobro
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {pendiente.toFixed(2)} €
            </p>
          </div>

        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Ingresos del club
            </p>

            <p className="mt-2 text-3xl font-bold">
              {ingresosClubMes.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Gastos de pista
            </p>

            <p className="mt-2 text-3xl font-bold">
              {gastosPistaMes.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">
              Saldo con club
            </p>

            <p
              className={
                saldoClubMes > 0
                  ? "mt-2 text-3xl font-bold text-green-600"
                  : saldoClubMes < 0
                  ? "mt-2 text-3xl font-bold text-red-600"
                  : "mt-2 text-3xl font-bold text-slate-900"
              }
            >
              {saldoClubMes.toFixed(2)} €
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Próxima clase
            </h2>

            {proximaClase ? (
              <div className="mt-5">

                <p className="text-3xl font-bold">
                  {proximaClase.hora_inicio.slice(0, 5)} h
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {proximaClase.ubicaciones?.nombre ||
                    "Sin ubicación"}
                </p>

                <p className="mt-1 text-slate-600">
                  {fechaProximaClase}
                </p>

                <p className="mt-1 text-slate-500">
                  {proximaClase.duracion_minutos} minutos
                </p>

                {nombresProximaClase && (
                  <p className="mt-3 text-sm text-slate-600">
                    {nombresProximaClase}
                  </p>
                )}

              </div>
            ) : (
              <p className="mt-5 text-slate-500">
                No hay próximas clases programadas.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Accesos rápidos
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <a
                href="/clases"
                className="rounded-xl bg-slate-900 px-5 py-4 text-center font-semibold text-white"
              >
                + Nueva clase
              </a>

              <a
                href="/alumnos"
                className="rounded-xl bg-teal-600 px-5 py-4 text-center font-semibold text-white"
              >
                + Nuevo alumno
              </a>

              <a
                href="/pagos"
                className="rounded-xl bg-white px-5 py-4 text-center font-semibold text-slate-900 ring-1 ring-slate-300"
              >
                Registrar pago
              </a>

              <a
                href="/bonos"
                className="rounded-xl bg-white px-5 py-4 text-center font-semibold text-slate-900 ring-1 ring-slate-300"
              >
                Crear bono
              </a>

              <a
                href="/agenda"
                className="rounded-xl bg-white px-5 py-4 text-center font-semibold text-slate-900 ring-1 ring-slate-300"
              >
                Ver agenda
              </a>

              <a
                href="/informes"
                className="rounded-xl bg-white px-5 py-4 text-center font-semibold text-slate-900 ring-1 ring-slate-300"
              >
                Ver informes
              </a>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}