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

  const [pendienteAlumnos, setPendienteAlumnos] =
    useState(0);

  const [pendienteClub, setPendienteClub] =
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

  const [numeroPendientesAlumnos, setNumeroPendientesAlumnos] =
    useState(0);

  const [numeroPendientesClub, setNumeroPendientesClub] =
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
          duracion_minutos,
          tipo,
          estado,
          facturable,
          cobrada,
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

    const clasesEconomicas =
      clasesMes.filter(
        (clase: any) =>
          clase.estado === "realizada" ||
          (
            clase.estado === "cancelada" &&
            clase.facturable === true
          )
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
      clasesEconomicas.reduce(
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
      clasesEconomicas.reduce(
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
      clasesEconomicas.reduce(
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
      clasesEconomicas.reduce(
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

    const {
      data: clasesClubPendientesData,
    } =
      await supabase
        .from("clases")
        .select(
          "id,importe_club"
        )
        .eq(
          "tipo",
          "club"
        )
        .eq(
          "facturable",
          true
        )
        .eq(
          "cobrada",
          false
        )
        .in(
          "estado",
          [
            "realizada",
            "cancelada",
          ]
        );

    const numeroPendientesNormales =
      (pagosPendientesData || []).length;

    const numeroPendientesClubCalculado =
      (clasesClubPendientesData || []).length;

    setNumeroPendientesAlumnos(
      numeroPendientesNormales
    );

    setNumeroPendientesClub(
      numeroPendientesClubCalculado
    );

    setNumeroPagosPendientes(
      numeroPendientesNormales +
      numeroPendientesClubCalculado
    );

    const totalPendienteNormal =
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

    const totalPendienteClub =
      (
        clasesClubPendientesData ||
        []
      ).reduce(
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

    setPendienteAlumnos(
      totalPendienteNormal
    );

    setPendienteClub(
      totalPendienteClub
    );

    const totalPendiente =
      totalPendienteNormal +
      totalPendienteClub;

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

        <div className="mb-7">
          <h1 className="text-4xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Resumen de tu actividad
          </p>
        </div>

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
            href={
              pendienteClub > 0 && pendienteAlumnos === 0
                ? "/pagos?seccion=clubs"
                : "/pagos?filtro=pendientes"
            }
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

                <div className="mt-2 space-y-0.5 text-xs text-red-500/80">
                  {pendienteAlumnos > 0 && (
                    <p>
                      Alumnos: {pendienteAlumnos.toFixed(2)} €
                    </p>
                  )}

                  {pendienteClub > 0 && (
                    <p>
                      Clubs: {pendienteClub.toFixed(2)} €
                    </p>
                  )}

                  {pendiente === 0 && (
                    <p>Todo cobrado</p>
                  )}
                </div>
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
                  href={
                    numeroPendientesClub > 0 &&
                    numeroPendientesAlumnos === 0
                      ? "/pagos?seccion=clubs"
                      : "/pagos?filtro=pendientes"
                  }
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 transition hover:border-red-300 hover:bg-red-100/70"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                    Cobros pendientes
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {numeroPagosPendientes}
                  </p>

                  <div className="mt-1 space-y-0.5 text-sm text-red-800">
                    {numeroPendientesAlumnos > 0 && (
                      <p>
                        Alumnos: {numeroPendientesAlumnos} · {pendienteAlumnos.toFixed(2)} €
                      </p>
                    )}

                    {numeroPendientesClub > 0 && (
                      <p>
                        Clubs: {numeroPendientesClub} · {pendienteClub.toFixed(2)} €
                      </p>
                    )}
                  </div>

                  <p className="mt-3 text-xs font-bold text-red-600">
                    Revisar cobros →
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

        {/* PRÓXIMA CLASE + ACCESOS */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* PRÓXIMAS CLASES */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <IconoCalendario />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Próximas clases
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tus siguientes clases programadas
                </p>
              </div>

            </div>

            {proximasClases.length > 0 ? (

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

                {proximasClases.map(
                  (clase: any, indice: number) => {
                    const nombres =
                      nombresClase(clase);

                    return (
                      <div
                        key={`${clase.fecha}-${clase.hora_inicio}-${indice}`}
                        className={`rounded-xl border px-3 py-2.5 ${colorProximaClase(
                          clase.tipo,
                          clase.estado
                        )}`}
                      >
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
                            <span className="text-xl font-bold text-slate-900">
                              {clase.hora_inicio.slice(0, 5)}
                            </span>

                            <span className="text-[9px] font-semibold text-slate-400">
                              horas
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">

                            {nombres && (
                              <p className="truncate text-sm font-bold text-slate-900">
                                {nombres}
                              </p>
                            )}

                            <p className="mt-0.5 truncate text-xs font-semibold text-purple-700">
                              {clase.ubicaciones?.nombre ||
                                "Sin ubicación"}
                            </p>

                            <div className="mt-1.5 flex flex-wrap gap-1.5">

                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                {formatearFecha(clase.fecha)}
                              </span>

                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                                {clase.duracion_minutos} min
                              </span>

                            </div>

                          </div>

                        </div>
                      </div>
                    );
                  }
                )}

              </div>

            ) : (

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">

                <p className="font-semibold text-slate-600">
                  No hay próximas clases programadas
                </p>

              </div>

            )}



          </section>

          {/* ACCESOS RÁPIDOS */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#09a9a3]">
                <IconoResultado />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Accesos rápidos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Funciones habituales
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <a
                href="/clases"
                className="rounded-xl bg-[#09a9a3] px-5 py-4 text-center font-bold text-white transition hover:bg-[#078b86]"
              >
                + Nueva clase
              </a>

              <a
                href="/alumnos"
                className="rounded-xl bg-slate-900 px-5 py-4 text-center font-bold text-white transition hover:bg-slate-700"
              >
                + Nuevo alumno
              </a>

              <a
                href="/pagos"
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Registrar pago
              </a>

              <a
                href="/bonos"
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Crear bono
              </a>

              <a
                href="/agenda"
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver agenda
              </a>

              <a
                href="/informes"
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver informes
              </a>

            </div>

          </section>

        </div>

      </div>
    </main>
  );
}      