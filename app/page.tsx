"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoEuro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 7.5A6 6 0 0 0 7.5 9" />
      <path d="M6 10h8M6 14h8" />
      <path d="M18 16.5A6 6 0 0 1 7.5 15" />
    </svg>
  );
}

function IconoGasto() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3v18" />
      <path d="m7 8 5-5 5 5" />
    </svg>
  );
}

function IconoResultado() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 17 9 12l4 4 7-9" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

function IconoPendiente() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoPersonas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14c2.5.5 4 2.5 4 5" />
    </svg>
  );
}

function IconoClub() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M9 21v-5h6v5" />
    </svg>
  );
}

function fechaLocalISO(
  fecha: Date
) {
  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      fecha.getDate()
    ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function colorProximaClase(
  tipo: string,
  estado: string
) {
  if (estado === "cancelada") {
    return "border-red-200 bg-red-50";
  }

  if (tipo === "club") {
    return "border-orange-300 bg-orange-50";
  }

  if (tipo === "privada") {
    return "border-violet-300 bg-violet-100";
  }

  return "border-[#09a9a3]/60 bg-[#09a9a3]/10";
}

export default function Home() {
  const [clasesHoy, setClasesHoy] =
    useState(0);

  const [clasesHoyTotal, setClasesHoyTotal] =
    useState(0);

  const [clasesHoyProgramadas, setClasesHoyProgramadas] =
    useState(0);

  const [horasHoyPrevistas, setHorasHoyPrevistas] =
    useState(0);

  const [totalClasesMes, setTotalClasesMes] =
    useState(0);

  const [horasMes, setHorasMes] =
    useState(0);

  const [ingresosMes, setIngresosMes] =
    useState(0);

  const [ingresosExtraMes, setIngresosExtraMes] =
    useState(0);

  const [pendiente, setPendiente] =
    useState(0);

  const [gastosPistaMes, setGastosPistaMes] =
    useState(0);

  const [resultadoMes, setResultadoMes] =
    useState(0);

  const [alumnosDistintos, setAlumnosDistintos] =
    useState(0);

  const [mediaAlumnos, setMediaAlumnos] =
    useState(0);

  const [clasesClubMes, setClasesClubMes] =
    useState(0);

  const [clasesPropiasMes, setClasesPropiasMes] =
    useState(0);

  const [proximasClases, setProximasClases] =
    useState<any[]>([]);

  const [bonosAviso, setBonosAviso] =
    useState<any[]>([]);

  const [clasesPasadasProgramadas, setClasesPasadasProgramadas] =
    useState<any[]>([]);

  const [numeroPagosPendientes, setNumeroPagosPendientes] =
    useState(0);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    const ahora =
      new Date();

    const hoy =
      fechaLocalISO(
        ahora
      );

    const inicioMes =
      hoy.slice(0, 8) +
      "01";

    const [anioActual, mesActual] =
      hoy.split("-").map(Number);

    const ultimoDiaMesDate =
      new Date(
        anioActual,
        mesActual,
        0
      );

    const ultimoDiaMes =
      `${ultimoDiaMesDate.getFullYear()}-${String(
        ultimoDiaMesDate.getMonth() + 1
      ).padStart(2, "0")}-${String(
        ultimoDiaMesDate.getDate()
      ).padStart(2, "0")}`;

    const {
      data: clasesMesData,
    } =
      await supabase
        .from("clases")
        .select(`
          id,
          fecha,
          hora_inicio,
          duracion_minutos,
          tipo,
          estado,
          importe_club,
          coste_pista,
          ingreso_extra,
          clase_alumnos (
            alumno_id,
            importe,
            usa_bono
          )
        `)
        .gte(
          "fecha",
          inicioMes
        )
        .lte(
          "fecha",
          ultimoDiaMes
        );

    const clasesMes =
      clasesMesData ||
      [];

    const clasesRealizadas =
      clasesMes.filter(
        (clase) =>
          clase.estado ===
          "realizada"
      );

    setTotalClasesMes(
      clasesRealizadas.length
    );

    const clasesHoyRealizadas =
      clasesRealizadas.filter(
        (clase) =>
          clase.fecha ===
          hoy
      );

    setClasesHoy(
      clasesHoyRealizadas.length
    );

    const clasesDeHoy =
      clasesMes.filter(
        (clase) =>
          clase.fecha === hoy &&
          clase.estado !== "cancelada"
      );

    const clasesProgramadasHoy =
      clasesDeHoy.filter(
        (clase) =>
          clase.estado === "programada"
      );

    const minutosPrevistosHoy =
      clasesDeHoy.reduce(
        (total, clase) =>
          total +
          Number(
            clase.duracion_minutos || 0
          ),
        0
      );

    setClasesHoyTotal(
      clasesDeHoy.length
    );

    setClasesHoyProgramadas(
      clasesProgramadasHoy.length
    );

    setHorasHoyPrevistas(
      minutosPrevistosHoy / 60
    );

    const minutosMes =
      clasesRealizadas.reduce(
        (
          total,
          clase
        ) =>
          total +
          Number(
            clase.duracion_minutos ||
              0
          ),
        0
      );

    setHorasMes(
      minutosMes / 60
    );

    const totalGastosPista =
      clasesRealizadas.reduce(
        (
          total,
          clase
        ) =>
          total +
          Number(
            clase.coste_pista ||
              0
          ),
        0
      );

    setGastosPistaMes(
      totalGastosPista
    );

    const totalIngresosClub =
      clasesRealizadas.reduce(
        (
          total,
          clase
        ) =>
          total +
          Number(
            clase.importe_club ||
              0
          ),
        0
      );

    const clasesClub =
      clasesRealizadas.filter(
        (clase) =>
          clase.tipo ===
          "club"
      ).length;

    setClasesClubMes(
      clasesClub
    );

    const clasesPropias =
      clasesRealizadas.filter(
        (clase) =>
          clase.tipo ===
            "propia" ||
          clase.tipo ===
            "privada"
      ).length;

    setClasesPropiasMes(
      clasesPropias
    );

    const idsAlumnos =
      new Set<string>();

    let participaciones =
      0;

    clasesRealizadas.forEach(
      (clase) => {
        const participantes =
          clase.clase_alumnos ||
          [];

        participaciones +=
          participantes.length;

        participantes.forEach(
          (participante: any) => {
            if (
              participante.alumno_id
            ) {
              idsAlumnos.add(
                participante.alumno_id
              );
            }
          }
        );
      }
    );

    setAlumnosDistintos(
      idsAlumnos.size
    );

    setMediaAlumnos(
      clasesRealizadas.length >
        0
        ? participaciones /
            clasesRealizadas.length
        : 0
    );

    const totalIngresosExtra =
      clasesRealizadas.reduce(
        (
          total,
          clase
        ) =>
          total +
          Number(
            clase.ingreso_extra ||
              0
          ),
        0
      );

    setIngresosExtraMes(
      totalIngresosExtra
    );

    const ingresosGeneradosMes =
      clasesRealizadas.reduce(
        (
          total,
          clase
        ) => {
          if (
            clase.tipo ===
            "club"
          ) {
            return (
              total +
              Number(
                clase.importe_club ||
                  0
              ) +
              Number(
                clase.ingreso_extra ||
                  0
              )
            );
          }

          const ingresosAlumnos =
            (
              clase.clase_alumnos ||
              []
            ).reduce(
              (
                subtotal,
                participante
              ) =>
                subtotal +
                Number(
                  participante.importe ||
                    0
                ),
              0
            );

          return (
            total +
            ingresosAlumnos +
            Number(
              clase.ingreso_extra ||
                0
            )
          );
        },
        0
      );

    const {
      data: pagosPendientesData,
    } =
      await supabase
        .from("pagos")
        .select(
          "importe,estado"
        )
        .eq(
          "estado",
          "pendiente"
        );

    setNumeroPagosPendientes(
      (pagosPendientesData || []).length
    );

    const totalPendiente =
      (
        pagosPendientesData ||
        []
      ).reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe ||
              0
          ),
        0
      );

    const resultadoTotalMes =
      ingresosGeneradosMes -
      totalGastosPista;

    setIngresosMes(
      ingresosGeneradosMes
    );

    setPendiente(
      totalPendiente
    );

    setResultadoMes(
      resultadoTotalMes
    );

    const fechaActual =
      fechaLocalISO(
        ahora
      );

    const horaActual =
      ahora
        .toTimeString()
        .slice(0, 8);

    const {
      data: clasesPasadasData,
    } =
      await supabase
        .from("clases")
        .select(`
          id,
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
        .eq(
          "estado",
          "programada"
        )
        .or(
          `fecha.lt.${fechaActual},and(fecha.eq.${fechaActual},hora_inicio.lt.${horaActual})`
        )
        .order(
          "fecha",
          {
            ascending: false,
          }
        )
        .order(
          "hora_inicio",
          {
            ascending: false,
          }
        );

    setClasesPasadasProgramadas(
      clasesPasadasData || []
    );

    const {
      data: proximaData,
    } =
      await supabase
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
        .neq(
          "estado",
          "cancelada"
        )
        .or(
          `fecha.gt.${fechaActual},and(fecha.eq.${fechaActual},hora_inicio.gte.${horaActual})`
        )
        .order(
          "fecha",
          {
            ascending: true,
          }
        )
        .order(
          "hora_inicio",
          {
            ascending: true,
          }
        )
        .limit(10);

    setProximasClases(
      proximaData || []
    );

    const {
      data: bonosAvisoData,
    } = await supabase
      .from("bonos")
      .select(`
        id,
        clases_restantes,
        alumnos (
          nombre,
          apellidos
        )
      `)
      .eq("activo", true)
      .gt("clases_restantes", 0)
      .lte("clases_restantes", 2)
      .order("clases_restantes", { ascending: true });

    setBonosAviso(
      bonosAvisoData || []
    );
  }

  function nombresClase(clase: any) {
    return (
      clase?.clase_alumnos
        ?.map((item: any) => item.alumnos)
        .filter(Boolean)
        .map(
          (alumno: any) =>
            `${alumno.nombre || ""} ${
              alumno.apellidos || ""
            }`.trim()
        )
        .join(", ") || ""
    );
  }

  function formatearFecha(fecha: string) {
    const [anio, mes, dia] =
      fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  function nombreMesActual() {
    return new Date().toLocaleDateString(
      "es-ES",
      {
        month: "long",
        year: "numeric",
      }
    );
  }

  function siguienteClaseHoy() {
    const hoy =
      fechaLocalISO(
        new Date()
      );

    return proximasClases.find(
      (clase: any) =>
        clase.fecha === hoy
    );
  }

  function nombreTitularBono(bono: any) {
    if (!bono?.alumnos) {
      return "Bono";
    }

    return `${bono.alumnos.nombre || ""} ${
      bono.alumnos.apellidos || ""
    }`.trim();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Resumen de tu actividad
            </p>
          </div>

          <div className="w-fit rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold capitalize text-[#078b86]">
            {nombreMesActual()}
          </div>

        </div>

        {/* HOY */}

        <section className="mb-6 rounded-3xl border border-teal-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                <IconoCalendario />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#078b86]">
                  Hoy
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {new Date().toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </h2>
              </div>

            </div>

            <a
              href={`/agenda?vista=horario&fecha=${fechaLocalISO(
                new Date()
              )}`}
              className="rounded-xl bg-[#09a9a3] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#078b86]"
            >
              Abrir horario de hoy
            </a>

          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Clases hoy
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {clasesHoyTotal}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                Realizadas
              </p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {clasesHoy}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                Pendientes hoy
              </p>
              <p className="mt-2 text-2xl font-bold text-orange-700">
                {clasesHoyProgramadas}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Horas previstas
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {horasHoyPrevistas.toFixed(1)}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Siguiente hoy
              </p>

              {siguienteClaseHoy() ? (
                <>
                  <p className="mt-2 text-2xl font-bold text-violet-800">
                    {siguienteClaseHoy().hora_inicio.slice(0, 5)}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-violet-700">
                    {nombresClase(
                      siguienteClaseHoy()
                    ) ||
                      siguienteClaseHoy().ubicaciones?.nombre ||
                      "Clase programada"}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-bold text-violet-700">
                  No quedan clases hoy
                </p>
              )}

            </div>

          </div>

        </section>

        {/* ESTADÍSTICAS PRINCIPALES */}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

          {/* CLASES DEL MES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Clases del mes
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {totalClasesMes}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {clasesHoy} realizadas hoy
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <IconoCalendario />
              </div>

            </div>
          </div>

          {/* HORAS DEL MES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Horas del mes
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {horasMes.toFixed(1)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  horas impartidas
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <IconoReloj />
              </div>

            </div>
          </div>

          {/* INGRESOS */}

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ingresos del mes
                </p>

                <p className="mt-3 text-3xl font-bold text-green-600">
                  {ingresosMes.toFixed(2)} €
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  alumnos + clubs + extras
                </p>

                {ingresosExtraMes > 0 && (
                  <p className="mt-1 text-xs font-semibold text-purple-600">
                    Extras: {ingresosExtraMes.toFixed(2)} €
                  </p>
                )}
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                <IconoEuro />
              </div>

            </div>
          </div>

          {/* GASTOS */}

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Gastos de pista
                </p>

                <p className="mt-3 text-3xl font-bold text-red-600">
                  {gastosPistaMes.toFixed(2)} €
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  acumulado del mes
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <IconoGasto />
              </div>

            </div>
          </div>

          {/* RESULTADO */}

          <div
            className={
              resultadoMes >= 0
                ? "rounded-2xl border border-teal-200 bg-white p-5 shadow-sm"
                : "rounded-2xl border border-red-200 bg-white p-5 shadow-sm"
            }
          >
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Resultado del mes
                </p>

                <p
                  className={
                    resultadoMes > 0
                      ? "mt-3 text-3xl font-bold text-[#078b86]"
                      : resultadoMes < 0
                      ? "mt-3 text-3xl font-bold text-red-600"
                      : "mt-3 text-3xl font-bold text-slate-700"
                  }
                >
                  {resultadoMes.toFixed(2)} €
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  ingresos − pistas
                </p>
              </div>

              <div
                className={
                  resultadoMes >= 0
                    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]"
                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                }
              >
                <IconoResultado />
              </div>

            </div>
          </div>

          {/* PENDIENTE */}

          <a
            href="/pagos?filtro=pendientes"
            className="block rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm transition hover:border-red-300 hover:bg-red-50"
          >
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                  Pendiente de cobro
                </p>

                <p
                  className={
                    pendiente > 0
                      ? "mt-3 text-3xl font-bold text-red-600"
                      : "mt-3 text-3xl font-bold text-slate-700"
                  }
                >
                  {pendiente.toFixed(2)} €
                </p>

                <p className="mt-1 text-xs text-red-500/80">
                  pagos pendientes · ver pagos
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <IconoPendiente />
              </div>

            </div>
          </a>

        </div>

        {/* AVISOS IMPORTANTES */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Avisos importantes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Cosas que conviene revisar
              </p>
            </div>

            {clasesPasadasProgramadas.length === 0 &&
              numeroPagosPendientes === 0 &&
              bonosAviso.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
                <p className="font-bold text-green-700">
                  ✓ Todo al día
                </p>
                <p className="mt-1 text-sm text-green-700/80">
                  No hay clases pasadas sin cerrar, pagos pendientes ni bonos próximos a agotarse.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 lg:grid-cols-3">

              {clasesPasadasProgramadas.length > 0 && (
                <a
                  href="/agenda?filtro=sin-cerrar"
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-4 transition hover:border-orange-300 hover:bg-orange-100/70"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                    Clases sin cerrar
                  </p>

                  <p className="mt-2 text-3xl font-bold text-orange-700">
                    {clasesPasadasProgramadas.length}
                  </p>

                  <p className="mt-1 text-sm text-orange-800">
                    {clasesPasadasProgramadas.length === 1
                      ? "clase pasada sigue como programada"
                      : "clases pasadas siguen como programadas"}
                  </p>

                  <p className="mt-3 text-xs font-bold text-orange-700">
                    Revisar en Agenda →
                  </p>
                </a>
              )}

              {numeroPagosPendientes > 0 && (
                <a
                  href="/pagos?filtro=pendientes"
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 transition hover:border-red-300 hover:bg-red-100/70"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                    Pagos pendientes
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {numeroPagosPendientes}
                  </p>

                  <p className="mt-1 text-sm text-red-800">
                    Pendiente total: {pendiente.toFixed(2)} €
                  </p>

                  <p className="mt-3 text-xs font-bold text-red-600">
                    Revisar pagos →
                  </p>
                </a>
              )}

              {bonosAviso.length > 0 && (
                <a
                  href="/bonos?filtro=por-terminar"
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 hover:bg-amber-100/70"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                    Bonos por terminar
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-700">
                    {bonosAviso.length}
                  </p>

                  <p className="mt-1 text-sm text-amber-900">
                    Con 1 o 2 clases restantes
                  </p>

                  <p className="mt-3 text-xs font-bold text-amber-700">
                    Revisar bonos →
                  </p>
                </a>
              )}

              </div>
            )}

          </section>

        {/* ACTIVIDAD DEL MES */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
              <IconoPersonas />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Actividad del mes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Resumen de las clases realizadas
              </p>
            </div>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Alumnos distintos
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {alumnosDistintos}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                  <IconoPersonas />
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Media alumnos / clase
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {mediaAlumnos.toFixed(1)}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <IconoPersonas />
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Clases para club
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {clasesClubMes}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <IconoClub />
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Clases propias
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {clasesPropiasMes}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <IconoCalendario />
                </div>

              </div>
            </div>

          </div>

        </section>


      </div>
    </main>
  );
}      