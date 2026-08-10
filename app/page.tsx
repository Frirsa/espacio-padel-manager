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

  const [acumuladoDiario, setAcumuladoDiario] =
    useState<any[]>([]);

  const [clubGeneradoMes, setClubGeneradoMes] =
    useState(0);

  const [clubCobradoMes, setClubCobradoMes] =
    useState(0);

  const [pistasPagadasClubMes, setPistasPagadasClubMes] =
    useState(0);

  const [saldoClubMes, setSaldoClubMes] =
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
          ubicaciones (
            nombre
          ),
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

    const porDia = new Map<string, any>();

    clasesMes
      .filter(
        (clase: any) =>
          clase.estado === "realizada" ||
          clase.estado === "cancelada"
      )
      .forEach((clase: any) => {
        const actual =
          porDia.get(clase.fecha) || {
            fecha: clase.fecha,
            clases: 0,
            canceladas: 0,
            canceladasFacturables: 0,
            horas: 0,
            ingresos: 0,
            clubGenerado: 0,
            pistasPagadasClub: 0,
            saldoClub: 0,
            clubCobrado: 0,
            ingresoExtra: 0,
            gastos: 0,
            resultado: 0,
            acumulado: 0,
          };

        const realizada =
          clase.estado === "realizada";

        const cancelada =
          clase.estado === "cancelada";

        const cuentaEconomicamente =
          realizada ||
          (
            cancelada &&
            clase.facturable === true
          );

        if (realizada) {
          actual.clases += 1;
          actual.horas +=
            Number(
              clase.duracion_minutos || 0
            ) / 60;
        }

        if (cancelada) {
          actual.canceladas += 1;

          if (
            clase.facturable === true
          ) {
            actual.canceladasFacturables += 1;
          }
        }

        if (cuentaEconomicamente) {
          const ingresoClase =
            clase.tipo === "club"
              ? Number(
                  clase.importe_club || 0
                )
              : (
                  clase.clase_alumnos || []
                ).reduce(
                  (
                    total: number,
                    participante: any
                  ) =>
                    total +
                    Number(
                      participante.importe || 0
                    ),
                  0
                );

          const extra =
            Number(
              clase.ingreso_extra || 0
            );

          const gasto =
            Number(
              clase.coste_pista || 0
            );

          actual.ingresos +=
            ingresoClase + extra;

          actual.ingresoExtra +=
            extra;

          actual.gastos +=
            gasto;

          actual.resultado +=
            ingresoClase +
            extra -
            gasto;

          if (
            clase.tipo === "club"
          ) {
            actual.clubGenerado +=
              ingresoClase;

            if (
              clase.cobrada === true
            ) {
              actual.clubCobrado +=
                ingresoClase;
            }
          }

          const esIQL =
            clase.ubicaciones?.nombre ===
            "IQL Sports";

          if (
            esIQL &&
            clase.tipo !== "club"
          ) {
            actual.pistasPagadasClub +=
              gasto;
          }

          actual.saldoClub =
            actual.clubGenerado -
            actual.pistasPagadasClub;
        }

        porDia.set(
          clase.fecha,
          actual
        );
      });

    let acumuladoResultado = 0;

    const diasOrdenados =
      Array.from(
        porDia.values()
      )
        .sort(
          (a: any, b: any) =>
            a.fecha.localeCompare(
              b.fecha
            )
        )
        .map((dia: any) => {
          acumuladoResultado +=
            dia.resultado;

          return {
            ...dia,
            acumulado:
              acumuladoResultado,
          };
        });

    setAcumuladoDiario(
      diasOrdenados
    );

    setClubGeneradoMes(
      diasOrdenados.reduce(
        (total: number, dia: any) =>
          total +
          dia.clubGenerado,
        0
      )
    );

    setClubCobradoMes(
      diasOrdenados.reduce(
        (total: number, dia: any) =>
          total +
          dia.clubCobrado,
        0
      )
    );

    const totalPistasIQL =
      diasOrdenados.reduce(
        (total: number, dia: any) =>
          total +
          dia.pistasPagadasClub,
        0
      );

    setPistasPagadasClubMes(
      totalPistasIQL
    );

    setSaldoClubMes(
      diasOrdenados.reduce(
        (total: number, dia: any) =>
          total +
          dia.clubGenerado,
        0
      ) -
      totalPistasIQL
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
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
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
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
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
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
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


        {/* ESTADÍSTICAS · RESUMEN DEL PERIODO */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
              Estadísticas
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Resumen del periodo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Situación económica y actividad del mes actual
            </p>
          </div>

          <div className="grid gap-3 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Ingresos
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {ingresosMes.toFixed(2)} €
              </p>
              {ingresosExtraMes > 0 && (
                <p className="mt-1 text-xs font-semibold text-purple-600">
                  Extras: {ingresosExtraMes.toFixed(2)} €
                </p>
              )}
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Gastos
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {gastosPistaMes.toFixed(2)} €
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Resultado
              </p>
              <p
                className={
                  resultadoMes >= 0
                    ? "mt-2 text-2xl font-bold text-[#078b86]"
                    : "mt-2 text-2xl font-bold text-red-600"
                }
              >
                {resultadoMes.toFixed(2)} €
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Clases
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalClasesMes}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                realizadas
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Horas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {horasMes.toFixed(1)}
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Ingreso medio
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalClasesMes > 0
                  ? (ingresosMes / totalClasesMes).toFixed(2)
                  : "0.00"} €
              </p>
              <p className="mt-1 text-xs text-slate-500">
                por clase realizada
              </p>
            </div>

          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Análisis de actividad
            </p>
          </div>

          <div className="grid gap-3 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Alumnos distintos
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {alumnosDistintos}
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Media alumnos
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {mediaAlumnos.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                por clase
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Clases para club
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {clasesClubMes}
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Clases propias
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {clasesPropiasMes}
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Club generado
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {clubGeneradoMes.toFixed(2)} €
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Pistas pagadas
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {pistasPagadasClubMes.toFixed(2)} €
              </p>
              <p className="mt-1 text-xs text-slate-500">
                IQL Sports
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Saldo club
              </p>
              <p
                className={
                  saldoClubMes >= 0
                    ? "mt-2 text-2xl font-bold text-[#078b86]"
                    : "mt-2 text-2xl font-bold text-red-600"
                }
              >
                {saldoClubMes.toFixed(2)} €
              </p>
              <p className="mt-1 text-xs text-slate-500">
                generado − pistas
              </p>
            </div>

            <div className="min-h-[118px] rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Club cobrado
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {clubCobradoMes.toFixed(2)} €
              </p>
            </div>

          </div>

        </section>

        {/* EVOLUCIÓN DEL MES */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
              Evolución del mes
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Acumulado diario
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resultado de cada día y acumulado progresivo durante el mes actual
            </p>

          </div>

          {acumuladoDiario.length === 0 ? (

            <div className="px-6 py-8 text-sm text-slate-500">
              No hay clases realizadas ni canceladas en este mes.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1180px] table-fixed">

                <thead className="bg-slate-50">

                  <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">

                    <th className="px-3 py-3">
                      Día
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Realizadas
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Canceladas
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Horas
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Ingresos
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Club generado
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Pistas pagadas
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Saldo club día
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Club cobrado
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Ingreso extra
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Gastos
                    </th>

                    <th className="px-2 py-3 text-center leading-tight">
                      Resultado
                    </th>

                    <th className="px-3 py-3 text-center">
                      Acumulado
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {acumuladoDiario.map(
                    (dia: any) => {

                      const [
                        anio,
                        numeroMes,
                        numeroDia,
                      ] =
                        dia.fecha.split("-");

                      return (

                        <tr
                          key={dia.fecha}
                          className="text-xs text-slate-700"
                        >

                          <td className="px-3 py-3 font-semibold text-slate-900">
                            {numeroDia}/{numeroMes}/{anio}
                          </td>

                          <td className="px-2 py-3 text-center">
                            {dia.clases}
                          </td>

                          <td className="px-2 py-3 text-center">
                            <div className="font-semibold text-red-600">
                              {dia.canceladas}
                            </div>

                            {dia.canceladas > 0 && (
                              <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {dia.canceladasFacturables} facturable{dia.canceladasFacturables === 1 ? "" : "s"}
                              </div>
                            )}
                          </td>

                          <td className="px-2 py-3 text-center">
                            {dia.horas.toFixed(1)}
                          </td>

                          <td className="px-2 py-3 text-center font-semibold text-slate-900">
                            {dia.ingresos.toFixed(2)} €
                          </td>

                          <td className="px-2 py-3 text-center font-semibold text-blue-700">
                            {dia.clubGenerado.toFixed(2)} €
                          </td>

                          <td className="px-2 py-3 text-center font-semibold text-red-600">
                            {dia.pistasPagadasClub.toFixed(2)} €
                          </td>

                          <td
                            className={
                              dia.saldoClub >= 0
                                ? "px-2 py-3 text-center font-bold text-[#078b86]"
                                : "px-2 py-3 text-center font-bold text-red-600"
                            }
                          >
                            {dia.saldoClub.toFixed(2)} €
                          </td>

                          <td className="px-2 py-3 text-center font-semibold text-emerald-700">
                            {dia.clubCobrado.toFixed(2)} €
                          </td>

                          <td className="px-2 py-3 text-center font-semibold text-purple-700">
                            {dia.ingresoExtra.toFixed(2)} €
                          </td>

                          <td className="px-2 py-3 text-center text-red-600">
                            {dia.gastos.toFixed(2)} €
                          </td>

                          <td
                            className={
                              dia.resultado >= 0
                                ? "px-2 py-3 text-center font-bold text-emerald-600"
                                : "px-2 py-3 text-center font-bold text-red-600"
                            }
                          >
                            {dia.resultado.toFixed(2)} €
                          </td>

                          <td
                            className={
                              dia.acumulado >= 0
                                ? "px-3 py-3 text-center text-sm font-bold text-[#09a9a3]"
                                : "px-3 py-3 text-center text-sm font-bold text-red-600"
                            }
                          >
                            {dia.acumulado.toFixed(2)} €
                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

                <tfoot className="border-t border-slate-200 bg-slate-50">

                  <tr className="text-sm font-bold text-slate-900">

                    <td className="px-3 py-3">
                      TOTAL MES
                    </td>

                    <td className="px-2 py-3 text-center">
                      {totalClasesMes}
                    </td>

                    <td className="px-2 py-3 text-center">
                      <div className="text-red-600">
                        {acumuladoDiario.reduce(
                          (total: number, dia: any) =>
                            total + dia.canceladas,
                          0
                        )}
                      </div>

                      {acumuladoDiario.reduce(
                        (total: number, dia: any) =>
                          total + dia.canceladas,
                        0
                      ) > 0 && (
                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                          {acumuladoDiario.reduce(
                            (total: number, dia: any) =>
                              total + dia.canceladasFacturables,
                            0
                          )} facturables
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {horasMes.toFixed(1)}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {ingresosMes.toFixed(2)} €
                    </td>

                    <td className="px-2 py-3 text-center text-blue-700">
                      {clubGeneradoMes.toFixed(2)} €
                    </td>

                    <td className="px-2 py-3 text-center text-red-600">
                      {pistasPagadasClubMes.toFixed(2)} €
                    </td>

                    <td
                      className={
                        saldoClubMes >= 0
                          ? "px-2 py-3 text-center text-[#078b86]"
                          : "px-2 py-3 text-center text-red-600"
                      }
                    >
                      {saldoClubMes.toFixed(2)} €
                    </td>

                    <td className="px-2 py-3 text-center text-emerald-700">
                      {clubCobradoMes.toFixed(2)} €
                    </td>

                    <td className="px-2 py-3 text-center text-purple-700">
                      {ingresosExtraMes.toFixed(2)} €
                    </td>

                    <td className="px-2 py-3 text-center text-red-600">
                      {gastosPistaMes.toFixed(2)} €
                    </td>

                    <td
                      className={
                        resultadoMes >= 0
                          ? "px-2 py-3 text-center text-emerald-600"
                          : "px-2 py-3 text-center text-red-600"
                      }
                    >
                      {resultadoMes.toFixed(2)} €
                    </td>

                    <td
                      className={
                        resultadoMes >= 0
                          ? "px-3 py-3 text-center text-[#09a9a3]"
                          : "px-3 py-3 text-center text-red-600"
                      }
                    >
                      {resultadoMes.toFixed(2)} €
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          )}

        </section>

      </div>
    </main>
  );
}      