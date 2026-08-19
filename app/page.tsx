"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

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

function TarjetaMetrica({
  icono,
  etiqueta,
  valor,
  detalle,
  tono = "marca",
}: {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono?: "marca" | "azul" | "rojo";
}) {
  const claseIcono =
    tono === "rojo"
      ? "bg-red-50 text-red-600"
      : tono === "azul"
      ? "bg-[#EEF3F8] text-[#17324D]"
      : "bg-[#E8F7F5] text-[#00A79C]";

  return (
    <div className="flex min-h-[104px] flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.025)] sm:min-h-[92px] sm:flex-row sm:items-center sm:gap-2.5 sm:rounded-2xl sm:px-3.5 sm:py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${claseIcono}`}>
        {icono}
      </div>

      <div className="min-w-0 flex-1">
        <p className="whitespace-normal text-[10px] font-bold uppercase leading-[1.2] tracking-[0.06em] text-slate-500">
          {etiqueta}
        </p>
        <p
          className={
            tono === "rojo"
              ? "mt-1 whitespace-nowrap text-[17px] font-bold leading-tight text-red-600 sm:text-lg xl:text-xl"
              : "mt-1 whitespace-nowrap text-[17px] font-bold leading-tight text-[#17324D] sm:text-lg xl:text-xl"
          }
        >
          {valor}
        </p>
        {detalle && (
          <p className="mt-1 whitespace-normal text-[10px] font-medium leading-tight text-slate-400">
            {detalle}
          </p>
        )}
      </div>
    </div>
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

  return "border-[#00A79C]/60 bg-[#00A79C]/10";
}

export default function Home() {
  const ahoraInicial = new Date();
  const mesInicial = `${ahoraInicial.getFullYear()}-${String(
    ahoraInicial.getMonth() + 1
  ).padStart(2, "0")}`;

  const [mesSeleccionado, setMesSeleccionado] =
    useState(mesInicial);

  const [selectorMesAbierto, setSelectorMesAbierto] =
    useState(false);

  const [anioSelector, setAnioSelector] =
    useState(ahoraInicial.getFullYear());

  const [clasesHoy, setClasesHoy] =
    useState(0);

  const [totalClasesMes, setTotalClasesMes] =
    useState(0);

  const [
    totalClasesFacturables,
    setTotalClasesFacturables,
  ] = useState(0);

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

  const [pendienteBonos, setPendienteBonos] =
    useState(0);

  const [bonosPendientesCobro, setBonosPendientesCobro] =
    useState<any[]>([]);

  const [gastosPistaMes, setGastosPistaMes] =
    useState(0);

  const [resultadoMes, setResultadoMes] =
    useState(0);

  const [alumnosDistintos, setAlumnosDistintos] =
    useState(0);

  const [clasesClubMes, setClasesClubMes] =
    useState(0);

  const [clasesPropiasMes, setClasesPropiasMes] =
    useState(0);

  const [proximasClases, setProximasClases] =
    useState<any[]>([]);

  const [bonosAviso, setBonosAviso] =
    useState<any[]>([]);

  const [
    cumpleanosHoy,
    setCumpleanosHoy,
  ] = useState<any[]>([]);

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
    cargarDashboard(mesSeleccionado);
  }, [mesSeleccionado]);

  function abrirSelectorMes() {
    setAnioSelector(
      Number(
        mesSeleccionado.slice(
          0,
          4
        )
      )
    );
    setSelectorMesAbierto(true);
  }

  function seleccionarMes(
    numeroMes: number
  ) {
    setMesSeleccionado(
      `${anioSelector}-${String(
        numeroMes
      ).padStart(2, "0")}`
    );
    setSelectorMesAbierto(false);
  }

  function volverAlMesActual() {
    const ahora =
      new Date();

    setMesSeleccionado(
      `${ahora.getFullYear()}-${String(
        ahora.getMonth() + 1
      ).padStart(2, "0")}`
    );

    setSelectorMesAbierto(false);
  }

  function cambiarMes(desplazamiento: number) {
    const [anio, mes] =
      mesSeleccionado.split("-").map(Number);

    const nuevaFecha =
      new Date(
        anio,
        mes - 1 + desplazamiento,
        1
      );

    setMesSeleccionado(
      `${nuevaFecha.getFullYear()}-${String(
        nuevaFecha.getMonth() + 1
      ).padStart(2, "0")}`
    );
  }

  async function cargarDashboard(mesClave: string) {
    const ahora =
      new Date();

    const hoy =
      fechaLocalISO(
        ahora
      );

    const inicioMes =
      `${mesClave}-01`;

    const [anioActual, mesActual] =
      mesClave.split("-").map(Number);

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

    const mesHoy =
      hoy.slice(0, 7);

    const clasesMesHastaHoy =
      mesClave > mesHoy
        ? []
        : mesClave === mesHoy
        ? clasesMes.filter(
            (clase: any) =>
              clase.fecha <= hoy
          )
        : clasesMes;

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

    clasesMesHastaHoy
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

    setTotalClasesFacturables(
      clasesEconomicas.length
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

    clasesRealizadas.forEach(
      (clase) => {
        const participantes =
          clase.clase_alumnos ||
          [];

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

    const {
      data: bonosPendientesCobroData,
    } =
      await supabase
        .from("bonos")
        .select(`
          id,
          importe_pagado,
          grupo_id,
          fecha_compra,
          alumnos (
            nombre,
            apellidos
          ),
          grupos (
            nombre
          )
        `)
        .eq(
          "estado_cobro",
          "pendiente"
        )
        .order(
          "fecha_compra",
          { ascending: true }
        );

    const bonosPendientesActuales =
      bonosPendientesCobroData || [];

    setBonosPendientesCobro(
      bonosPendientesActuales
    );

    const totalPendienteBonos =
      bonosPendientesActuales.reduce(
        (total, bono) =>
          total +
          Number(
            bono.importe_pagado ||
              0
          ),
        0
      );

    setPendienteBonos(
      totalPendienteBonos
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
        grupo_id,
        clases_restantes,
        alumnos (
          nombre,
          apellidos
        ),
        grupos (
          nombre
        )
      `)
      .eq("activo", true)
      .gt("clases_restantes", 0)
      .lte("clases_restantes", 2)
      .order("clases_restantes", { ascending: true });

    setBonosAviso(
      bonosAvisoData || []
    );

    const {
      data: alumnosCumpleanosData,
    } = await supabase
      .from("alumnos")
      .select(`
        id,
        nombre,
        apellidos,
        apodo,
        fecha_nacimiento
      `)
      .eq("activo", true)
      .not(
        "fecha_nacimiento",
        "is",
        null
      );

    const mesDiaHoy =
      hoy.slice(5);

    const cumpleanos =
      (
        alumnosCumpleanosData ||
        []
      )
        .filter(
          (alumno: any) =>
            alumno.fecha_nacimiento &&
            String(
              alumno.fecha_nacimiento
            ).slice(5) ===
              mesDiaHoy
        )
        .map((alumno: any) => {
          const anioNacimiento =
            Number(
              String(
                alumno.fecha_nacimiento
              ).slice(0, 4)
            );

          return {
            ...alumno,
            edad:
              ahora.getFullYear() -
              anioNacimiento,
          };
        })
        .sort(
          (a: any, b: any) =>
            `${a.nombre || ""} ${
              a.apellidos || ""
            }`.localeCompare(
              `${b.nombre || ""} ${
                b.apellidos || ""
              }`,
              "es"
            )
        );

    setCumpleanosHoy(
      cumpleanos
    );
  }

  function nombreCumpleanos(
    alumno: any
  ) {
    const nombreCompleto =
      `${alumno?.nombre || ""} ${
        alumno?.apellidos || ""
      }`.trim();

    return alumno?.apodo
      ? `${nombreCompleto} (${alumno.apodo})`
      : nombreCompleto;
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
    if (
      bono?.grupo_id &&
      bono?.grupos?.nombre
    ) {
      return bono.grupos.nombre;
    }

    if (!bono?.alumnos) {
      return "Bono";
    }

    return `${bono.alumnos.nombre || ""} ${
      bono.alumnos.apellidos || ""
    }`.trim();
  }

  const hoyDashboard = fechaLocalISO(new Date());
  const mesActualClave = hoyDashboard.slice(0, 7);
  const esMesActual = mesSeleccionado === mesActualClave;

  const detalleEncontrado =
    esMesActual
      ? acumuladoDiario.find(
          (dia: any) => dia.fecha === hoyDashboard
        )
      : acumuladoDiario.length > 0
      ? acumuladoDiario[acumuladoDiario.length - 1]
      : null;

  const detalleDia = detalleEncontrado || {
    fecha: esMesActual ? hoyDashboard : `${mesSeleccionado}-01`,
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
    acumulado:
      acumuladoDiario.length > 0
        ? acumuladoDiario[acumuladoDiario.length - 1].acumulado
        : 0,
  };

  const etiquetaDetalle =
    esMesActual
      ? "Hoy"
      : detalleEncontrado
      ? "Último día con actividad"
      : "Sin actividad";

  const [anioMesSeleccionado, numeroMesSeleccionado] =
    mesSeleccionado.split("-").map(Number);

  const textoMes = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(
    new Date(
      anioMesSeleccionado,
      numeroMesSeleccionado - 1,
      1
    )
  );

  const mesSeleccionadoCapitalizado =
    textoMes.charAt(0).toUpperCase() +
    textoMes.slice(1);

  const totalCanceladasMes = acumuladoDiario.reduce(
    (total: number, dia: any) =>
      total + dia.canceladas,
    0
  );

  const totalCanceladasFacturablesMes = acumuladoDiario.reduce(
    (total: number, dia: any) =>
      total + dia.canceladasFacturables,
    0
  );

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA DASHBOARD */}
        <section className="mb-4 overflow-visible rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:mb-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                Gestión
              </p>
              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55 sm:mt-2 sm:text-sm">
                Resumen de tu actividad, ingresos y situación del mes.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center rounded-xl border border-white/15 bg-white/10 p-1 sm:flex sm:w-auto">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
                aria-label="Mes anterior"
              >
                ‹
              </button>

              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={abrirSelectorMes}
                  className={
                    selectorMesAbierto
                      ? "flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2 text-xs font-bold text-white transition sm:min-w-[190px] sm:gap-2 sm:px-3 sm:text-sm"
                      : "flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-white transition hover:bg-white/10 sm:min-w-[190px] sm:gap-2 sm:px-3 sm:text-sm"
                  }
                  aria-label="Elegir mes y año"
                  aria-expanded={selectorMesAbierto}
                >
                  <IconoCalendario />
                  <span>{mesSeleccionadoCapitalizado}</span>
                  <span className="text-xs">⌄</span>
                </button>

                {selectorMesAbierto && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectorMesAbierto(
                          false
                        )
                      }
                      className="fixed inset-0 z-40 cursor-default"
                      aria-label="Cerrar selector de mes"
                    />

                    <div className="absolute left-1/2 top-12 z-50 w-[318px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:left-auto sm:right-0 sm:w-[330px] sm:translate-x-0 sm:p-4">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <button
                          type="button"
                          onClick={() =>
                            setAnioSelector(
                              (anio) =>
                                anio - 1
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                          aria-label="Año anterior"
                        >
                          ‹
                        </button>

                        <label className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Año
                          </span>
                          <input
                            type="number"
                            min="2000"
                            max="2100"
                            value={
                              anioSelector
                            }
                            onChange={(e) => {
                              const nuevoAnio =
                                Number(
                                  e.target
                                    .value
                                );

                              if (
                                Number.isFinite(
                                  nuevoAnio
                                )
                              ) {
                                setAnioSelector(
                                  nuevoAnio
                                );
                              }
                            }}
                            className="w-[88px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-base font-bold text-[#17324D] outline-none transition focus:border-[#00A79C] focus:ring-2 focus:ring-[#00A79C]/10"
                            aria-label="Año"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setAnioSelector(
                              (anio) =>
                                anio + 1
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                          aria-label="Año siguiente"
                        >
                          ›
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {MESES.map(
                          (
                            nombreMes,
                            indice
                          ) => {
                            const numeroMes =
                              indice + 1;

                            const [
                              anioActivo,
                              mesActivo,
                            ] =
                              mesSeleccionado
                                .split("-")
                                .map(
                                  Number
                                );

                            const activo =
                              anioActivo ===
                                anioSelector &&
                              mesActivo ===
                                numeroMes;

                            return (
                              <button
                                key={
                                  nombreMes
                                }
                                type="button"
                                onClick={() =>
                                  seleccionarMes(
                                    numeroMes
                                  )
                                }
                                className={
                                  activo
                                    ? "rounded-lg bg-[#00A79C] px-2 py-2.5 text-xs font-bold text-white shadow-sm"
                                    : "rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-[#17324D] transition hover:border-[#00A79C]/40 hover:bg-[#E8F7F5]"
                                }
                              >
                                {
                                  nombreMes
                                }
                              </button>
                            );
                          }
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="text-[11px] text-slate-400">
                          Elige directamente año y mes
                        </p>

                        <button
                          type="button"
                          onClick={
                            volverAlMesActual
                          }
                          className="rounded-lg px-3 py-2 text-xs font-bold text-[#00A79C] transition hover:bg-[#E8F7F5]"
                        >
                          Mes actual
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => cambiarMes(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>

            <a
              href={`/clases?fecha=${hoyDashboard}&modo=individual&volver=%2F`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#00A79C] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.16)] transition hover:bg-[#008F86] sm:h-12 sm:w-auto"
            >
              + Nueva clase
            </a>
            </div>
          </div>
        </section>

        {/* AVISOS IMPORTANTES */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-6 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
              Prioridad
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-white">
              Avisos importantes
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-sm">
              Primero, lo que necesita tu atención
            </p>
          </div>

          {clasesPasadasProgramadas.length === 0 &&
          numeroPagosPendientes === 0 &&
          bonosPendientesCobro.length === 0 &&
          bonosAviso.length === 0 &&
          cumpleanosHoy.length === 0 ? (
            <div className="m-3 flex items-start gap-3 rounded-xl border border-[#00A79C]/20 bg-[#E8F7F5] px-3.5 py-3.5 sm:m-5 sm:px-4 sm:py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#00A79C] shadow-sm">
                <IconoResultado />
              </div>
              <div>
                <p className="font-bold text-[#17324D]">Todo al día</p>
                <p className="mt-1 text-sm text-slate-600">
                  No hay cobros pendientes, bonos pendientes de cobro, clases pasadas sin cerrar ni bonos próximos a agotarse.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5 xl:grid-cols-4">
              {cumpleanosHoy.length > 0 && (
                <a
                  href="/alumnos"
                  className="rounded-xl border border-[#00A79C]/25 bg-[#E8F7F5] p-3.5 transition hover:border-[#00A79C]/40 hover:bg-[#DDF3F0] sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00A79C] shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 10h14v10H5Z" />
                        <path d="M4 10h16M12 10v10" />
                        <path d="M7.5 6.5C7.5 4.6 9 4 10 5.2L12 8l2-2.8c1-1.2 2.5-.6 2.5 1.3 0 1.5-1.2 2.5-3 2.5h-3c-1.8 0-3-1-3-2.5Z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#008C83]">
                        Cumpleaños hoy
                      </p>

                      <p className="mt-1 text-2xl font-bold text-[#17324D]">
                        {cumpleanosHoy.length}
                      </p>

                      <div className="mt-1 space-y-1 text-xs text-slate-700">
                        {cumpleanosHoy.map(
                          (alumno: any) => (
                            <p
                              key={alumno.id}
                              className="leading-relaxed"
                            >
                              <span className="font-bold text-[#17324D]">
                                {nombreCumpleanos(
                                  alumno
                                )}
                              </span>
                              {Number.isFinite(
                                alumno.edad
                              ) &&
                                alumno.edad >=
                                  0 && (
                                  <>
                                    {" "}
                                    · cumple{" "}
                                    {alumno.edad}{" "}
                                    años
                                  </>
                                )}
                            </p>
                          )
                        )}
                      </div>

                      <p className="mt-2 text-xs font-bold text-[#008C83]">
                        Ver alumnos →
                      </p>
                    </div>
                  </div>
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
                  className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 transition hover:border-red-300 hover:bg-red-50 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <IconoPendiente />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                        Cobros pendientes
                      </p>
                      <p className="mt-1 text-2xl font-bold text-red-600">
                        {pendiente.toFixed(2)} €
                      </p>
                      <div className="mt-1 text-xs text-red-800/80">
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
                      <p className="mt-2 text-xs font-bold text-red-600">
                        Revisar cobros →
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {bonosPendientesCobro.length > 0 && (
                <a
                  href="/bonos?filtro=pendientes-cobro"
                  className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 transition hover:border-red-300 hover:bg-red-50 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <IconoEuro />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                        Bonos pendientes de cobro
                      </p>
                      <div className="mt-1 flex items-end gap-2">
                        <p className="text-2xl font-bold text-red-600">
                          {pendienteBonos.toFixed(2)} €
                        </p>
                        <p className="pb-1 text-[10px] font-semibold text-red-800/75">
                          {bonosPendientesCobro.length === 1
                            ? "1 bono"
                            : `${bonosPendientesCobro.length} bonos`}
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        {bonosPendientesCobro
                          .slice(0, 3)
                          .map((bono: any) => (
                            <div
                              key={bono.id}
                              className="flex items-center justify-between gap-3 text-[10px] font-semibold text-red-900/80"
                            >
                              <span className="min-w-0 truncate">
                                {nombreTitularBono(bono)}
                              </span>
                              <span className="shrink-0 font-bold text-red-600">
                                {Number(bono.importe_pagado || 0).toFixed(2)} €
                              </span>
                            </div>
                          ))}

                        {bonosPendientesCobro.length > 3 && (
                          <p className="text-[10px] font-semibold text-red-700">
                            + {bonosPendientesCobro.length - 3} más
                          </p>
                        )}
                      </div>

                      <p className="mt-2 text-xs font-bold text-red-600">
                        Revisar bonos →
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {clasesPasadasProgramadas.length > 0 && (
                <a
                  href="/agenda?filtro=sin-cerrar"
                  className="rounded-xl border border-[#17324D]/15 bg-[#EEF3F8] p-3.5 transition hover:border-[#17324D]/25 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#17324D] shadow-sm">
                      <IconoCalendario />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#17324D]">
                        Clases sin cerrar
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#17324D]">
                        {clasesPasadasProgramadas.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {clasesPasadasProgramadas.length === 1
                          ? "Clase pasada sigue como programada"
                          : "Clases pasadas siguen como programadas"}
                      </p>
                      <p className="mt-2 text-xs font-bold text-[#17324D]">
                        Revisar en Agenda →
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {bonosAviso.length > 0 && (
                <a
                  href="/bonos?filtro=por-terminar"
                  className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 transition hover:border-red-300 hover:bg-red-50 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <IconoPersonas />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                        Atención · Bonos críticos
                      </p>

                      <div className="mt-1 flex items-end gap-2">
                        <p className="text-2xl font-bold text-red-600">
                          {bonosAviso.length}
                        </p>
                        <p className="pb-1 text-[10px] font-semibold text-red-800/75">
                          con 1 o 2 clases restantes
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        {bonosAviso
                          .slice(0, 3)
                          .map(
                            (
                              bono: any
                            ) => (
                              <div
                                key={
                                  bono.id
                                }
                                className="flex items-center justify-between gap-3 text-[10px] font-semibold text-red-900/80"
                              >
                                <span className="min-w-0 truncate">
                                  {nombreTitularBono(
                                    bono
                                  )}
                                </span>
                                <span className="shrink-0 font-bold text-red-600">
                                  {
                                    bono.clases_restantes
                                  }{" "}
                                  {bono.clases_restantes ===
                                  1
                                    ? "clase"
                                    : "clases"}
                                </span>
                              </div>
                            )
                          )}

                        {bonosAviso.length >
                          3 && (
                          <p className="text-[10px] font-semibold text-red-700">
                            +{" "}
                            {bonosAviso.length -
                              3}{" "}
                            más
                          </p>
                        )}
                      </div>

                      <p className="mt-2 text-xs font-bold text-red-600">
                        Revisar y renovar bonos →
                      </p>
                    </div>
                  </div>
                </a>
              )}
            </div>
          )}
        </section>

        {/* RESUMEN DEL PERIODO */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5">
          <div className="border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-6 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
              Resumen del periodo
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-white">
              {mesSeleccionadoCapitalizado}
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Ingresos, gastos, resultado y volumen de trabajo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-5 lg:grid-cols-3 2xl:grid-cols-6">
            <TarjetaMetrica
              icono={<IconoEuro />}
              etiqueta="Ingresos"
              valor={`${ingresosMes.toFixed(2)} €`}
              detalle={ingresosExtraMes > 0 ? `Incluye ${ingresosExtraMes.toFixed(2)} € extra` : undefined}
            />
            <TarjetaMetrica
              icono={<IconoGasto />}
              etiqueta="Gastos"
              valor={`${gastosPistaMes.toFixed(2)} €`}
              detalle="Costes de pista"
              tono="rojo"
            />
            <TarjetaMetrica
              icono={<IconoResultado />}
              etiqueta="Resultado"
              valor={`${resultadoMes.toFixed(2)} €`}
              detalle="Ingresos − gastos"
              tono={resultadoMes >= 0 ? "marca" : "rojo"}
            />
            <TarjetaMetrica
              icono={<IconoCalendario />}
              etiqueta="Clases"
              valor={String(totalClasesMes)}
              detalle="Realizadas"
              tono="azul"
            />
            <TarjetaMetrica
              icono={<IconoReloj />}
              etiqueta="Horas"
              valor={horasMes.toFixed(1)}
              detalle="Impartidas"
              tono="azul"
            />
            <TarjetaMetrica
              icono={<IconoEuro />}
              etiqueta="Resultado medio"
              valor={`${totalClasesFacturables > 0 ? (resultadoMes / totalClasesFacturables).toFixed(2) : "0.00"} €`}
              detalle="Por clase facturable"
              tono={resultadoMes >= 0 ? "marca" : "rojo"}
            />
          </div>
        </section>

        {/* ACTIVIDAD + CLUB */}
        <div className="mt-4 grid gap-4 sm:mt-5 2xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-5 sm:py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                Actividad
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-white">
                Actividad del mes
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Volumen real de trabajo
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 [&>*:last-child]:col-span-2 sm:grid-cols-3 sm:gap-3 sm:p-4 sm:[&>*:last-child]:col-span-1">
              <TarjetaMetrica
                icono={<IconoPersonas />}
                etiqueta="Alumnos distintos"
                valor={String(alumnosDistintos)}
                tono="azul"
              />
              <TarjetaMetrica
                icono={<IconoCalendario />}
                etiqueta="Clases propias"
                valor={String(clasesPropiasMes)}
                tono="azul"
              />
              <TarjetaMetrica
                icono={<IconoClub />}
                etiqueta="Clases para club"
                valor={String(clasesClubMes)}
                tono="azul"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-5 sm:py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                Club
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-white">
                Club / IQL
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Generado, costes y liquidación
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 [&>*:last-child]:col-span-2 sm:grid-cols-3 sm:gap-3 sm:p-4 sm:[&>*:last-child]:col-span-1">
              <TarjetaMetrica
                icono={<IconoClub />}
                etiqueta="Club generado"
                valor={`${clubGeneradoMes.toFixed(2)} €`}
                tono="azul"
              />
              <TarjetaMetrica
                icono={<IconoGasto />}
                etiqueta="Pistas pagadas"
                valor={`${pistasPagadasClubMes.toFixed(2)} €`}
                detalle="IQL Sports"
                tono="rojo"
              />
              <TarjetaMetrica
                icono={<IconoResultado />}
                etiqueta="Saldo club"
                valor={`${saldoClubMes.toFixed(2)} €`}
                detalle="Generado − pistas"
                tono={saldoClubMes >= 0 ? "marca" : "rojo"}
              />
            </div>
          </section>
        </div>

        {/* DETALLE DIARIO */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:mt-5">
          <div className="flex flex-row items-end justify-between gap-3 border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-6 sm:py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                Detalle diario
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-white">
                {etiquetaDetalle}
              </h2>
            </div>
            <p className="text-sm font-semibold text-white/60">
              {formatearFecha(detalleDia.fecha)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4 lg:hidden">
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Realizadas</p>
              <p className="mt-1 text-lg font-bold text-[#17324D]">{detalleDia.clases}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Canceladas</p>
              <p className="mt-1 text-lg font-bold text-red-600">{detalleDia.canceladas}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Ingresos</p>
              <p className="mt-1 text-lg font-bold text-[#17324D]">{detalleDia.ingresos.toFixed(2)} €</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Resultado</p>
              <p className={detalleDia.resultado >= 0 ? "mt-1 text-lg font-bold text-[#00A79C]" : "mt-1 text-lg font-bold text-red-600"}>
                {detalleDia.resultado.toFixed(2)} €
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Horas</p>
              <p className="mt-1 font-bold text-[#17324D]">{detalleDia.horas.toFixed(1)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Club generado</p>
              <p className="mt-1 font-bold text-[#17324D]">{detalleDia.clubGenerado.toFixed(2)} €</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Pistas</p>
              <p className="mt-1 font-bold text-red-600">{detalleDia.pistasPagadasClub.toFixed(2)} €</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Saldo club</p>
              <p className={detalleDia.saldoClub >= 0 ? "mt-1 font-bold text-[#00A79C]" : "mt-1 font-bold text-red-600"}>
                {detalleDia.saldoClub.toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px] table-fixed text-center">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-3 text-center">Día</th>
                  <th className="px-2 py-3 text-center">Realizadas</th>
                  <th className="px-2 py-3 text-center">Canceladas</th>
                  <th className="px-2 py-3 text-center">Horas</th>
                  <th className="px-2 py-3 text-center">Ingresos</th>
                  <th className="px-2 py-3 text-center">Club generado</th>
                  <th className="px-2 py-3 text-center">Pistas pagadas</th>
                  <th className="px-2 py-3 text-center">Saldo club</th>
                  <th className="px-2 py-3 text-center">Club cobrado</th>
                  <th className="px-2 py-3 text-center">Ingreso extra</th>
                  <th className="px-2 py-3 text-center">Gastos</th>
                  <th className="px-2 py-3 text-center">Resultado</th>
                  <th className="px-2 py-3 text-center">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 text-xs text-slate-700">
                  <td className="px-2 py-4 text-center font-semibold text-[#17324D]">{formatearFecha(detalleDia.fecha)}</td>
                  <td className="px-2 py-4 text-center">{detalleDia.clases}</td>
                  <td className="px-2 py-4 text-center">
                    <div className="font-semibold text-red-600">{detalleDia.canceladas}</div>
                    {detalleDia.canceladas > 0 && (
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {detalleDia.canceladasFacturables} facturable{detalleDia.canceladasFacturables === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-4 text-center">{detalleDia.horas.toFixed(1)}</td>
                  <td className="px-2 py-4 text-center font-semibold text-[#17324D]">{detalleDia.ingresos.toFixed(2)} €</td>
                  <td className="px-2 py-4 text-center font-semibold text-[#17324D]">{detalleDia.clubGenerado.toFixed(2)} €</td>
                  <td className="px-2 py-4 text-center font-semibold text-red-600">{detalleDia.pistasPagadasClub.toFixed(2)} €</td>
                  <td className={detalleDia.saldoClub >= 0 ? "px-2 py-4 text-center font-bold text-[#00A79C]" : "px-2 py-4 text-center font-bold text-red-600"}>{detalleDia.saldoClub.toFixed(2)} €</td>
                  <td className="px-2 py-4 text-center font-semibold text-[#00A79C]">{detalleDia.clubCobrado.toFixed(2)} €</td>
                  <td className="px-2 py-4 text-center font-semibold text-[#17324D]">{detalleDia.ingresoExtra.toFixed(2)} €</td>
                  <td className="px-2 py-4 text-center font-semibold text-red-600">{detalleDia.gastos.toFixed(2)} €</td>
                  <td className={detalleDia.resultado >= 0 ? "px-2 py-4 text-center font-bold text-[#00A79C]" : "px-2 py-4 text-center font-bold text-red-600"}>{detalleDia.resultado.toFixed(2)} €</td>
                  <td className={detalleDia.acumulado >= 0 ? "px-2 py-4 text-center font-bold text-[#17324D]" : "px-2 py-4 text-center font-bold text-red-600"}>{detalleDia.acumulado.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* EVOLUCIÓN DEL MES */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="border-b border-white/10 bg-[#0F2742] px-4 py-3.5 text-white sm:px-6 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
              Evolución del mes
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-white">
              Acumulado diario
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Resultado de cada día y acumulado progresivo en {mesSeleccionadoCapitalizado.toLowerCase()}
            </p>
          </div>

          {acumuladoDiario.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">
              No hay clases realizadas ni canceladas en este mes.
            </div>
          ) : (
            <>
              <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4 lg:hidden">
                {acumuladoDiario.map((dia: any) => (
                  <div key={dia.fecha} className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#17324D]">{formatearFecha(dia.fecha)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dia.clases} realizada{dia.clases === 1 ? "" : "s"} · {dia.canceladas} cancelada{dia.canceladas === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className={dia.resultado >= 0 ? "text-lg font-bold text-[#00A79C]" : "text-lg font-bold text-red-600"}>
                        {dia.resultado.toFixed(2)} €
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-center text-xs sm:gap-2">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-slate-400">Ingresos</span>
                        <p className="mt-0.5 font-bold text-[#17324D]">{dia.ingresos.toFixed(2)} €</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-slate-400">Gastos</span>
                        <p className="mt-0.5 font-bold text-red-600">{dia.gastos.toFixed(2)} €</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-slate-400">Saldo club día</span>
                        <p className={dia.saldoClub >= 0 ? "mt-0.5 font-bold text-[#00A79C]" : "mt-0.5 font-bold text-red-600"}>{dia.saldoClub.toFixed(2)} €</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-slate-400">Acumulado</span>
                        <p className="mt-0.5 font-bold text-[#17324D]">{dia.acumulado.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-[#17324D] p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Total mes
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-center text-sm">
                    <div><span className="text-white/60">Ingresos</span><p className="font-bold">{ingresosMes.toFixed(2)} €</p></div>
                    <div><span className="text-white/60">Gastos</span><p className="font-bold">{gastosPistaMes.toFixed(2)} €</p></div>
                    <div><span className="text-white/60">Clases</span><p className="font-bold">{totalClasesMes}</p></div>
                    <div><span className="text-white/60">Resultado</span><p className="font-bold text-[#55D9D0]">{resultadoMes.toFixed(2)} €</p></div>
                  </div>
                </div>
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] table-fixed text-center">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-3 text-center">Día</th>
                      <th className="px-2 py-3 text-center">Realizadas</th>
                      <th className="px-2 py-3 text-center">Canceladas</th>
                      <th className="px-2 py-3 text-center">Horas</th>
                      <th className="px-2 py-3 text-center">Ingresos</th>
                      <th className="px-2 py-3 text-center">Club generado</th>
                      <th className="px-2 py-3 text-center">Pistas pagadas</th>
                      <th className="px-2 py-3 text-center">Saldo club día</th>
                      <th className="px-2 py-3 text-center">Club cobrado</th>
                      <th className="px-2 py-3 text-center">Ingreso extra</th>
                      <th className="px-2 py-3 text-center">Gastos</th>
                      <th className="px-2 py-3 text-center">Resultado</th>
                      <th className="px-2 py-3 text-center">Acumulado</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {acumuladoDiario.map((dia: any) => (
                      <tr key={dia.fecha} className="text-xs text-slate-700 transition hover:bg-slate-50/70">
                        <td className="px-2 py-3 text-center font-semibold text-[#17324D]">{formatearFecha(dia.fecha)}</td>
                        <td className="px-2 py-3 text-center">{dia.clases}</td>
                        <td className="px-2 py-3 text-center">
                          <div className="font-semibold text-red-600">{dia.canceladas}</div>
                          {dia.canceladas > 0 && (
                            <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                              {dia.canceladasFacturables} facturable{dia.canceladasFacturables === 1 ? "" : "s"}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">{dia.horas.toFixed(1)}</td>
                        <td className="px-2 py-3 text-center font-semibold text-[#17324D]">{dia.ingresos.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center font-semibold text-[#17324D]">{dia.clubGenerado.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center font-semibold text-red-600">{dia.pistasPagadasClub.toFixed(2)} €</td>
                        <td className={dia.saldoClub >= 0 ? "px-2 py-3 text-center font-bold text-[#00A79C]" : "px-2 py-3 text-center font-bold text-red-600"}>{dia.saldoClub.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center font-semibold text-[#00A79C]">{dia.clubCobrado.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center font-semibold text-[#17324D]">{dia.ingresoExtra.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center font-semibold text-red-600">{dia.gastos.toFixed(2)} €</td>
                        <td className={dia.resultado >= 0 ? "px-2 py-3 text-center font-bold text-[#00A79C]" : "px-2 py-3 text-center font-bold text-red-600"}>{dia.resultado.toFixed(2)} €</td>
                        <td className={dia.acumulado >= 0 ? "px-2 py-3 text-center text-sm font-bold text-[#17324D]" : "px-2 py-3 text-center text-sm font-bold text-red-600"}>{dia.acumulado.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr className="text-xs font-bold text-[#17324D]">
                      <td className="px-2 py-3 text-center">TOTAL MES</td>
                      <td className="px-2 py-3 text-center">{totalClasesMes}</td>
                      <td className="px-2 py-3 text-center">
                        <div className="text-red-600">{totalCanceladasMes}</div>
                        {totalCanceladasMes > 0 && (
                          <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                            {totalCanceladasFacturablesMes} facturables
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">{horasMes.toFixed(1)}</td>
                      <td className="px-2 py-3 text-center">{ingresosMes.toFixed(2)} €</td>
                      <td className="px-2 py-3 text-center">{clubGeneradoMes.toFixed(2)} €</td>
                      <td className="px-2 py-3 text-center text-red-600">{pistasPagadasClubMes.toFixed(2)} €</td>
                      <td className={saldoClubMes >= 0 ? "px-2 py-3 text-center text-[#00A79C]" : "px-2 py-3 text-center text-red-600"}>{saldoClubMes.toFixed(2)} €</td>
                      <td className="px-2 py-3 text-center text-[#00A79C]">{clubCobradoMes.toFixed(2)} €</td>
                      <td className="px-2 py-3 text-center">{ingresosExtraMes.toFixed(2)} €</td>
                      <td className="px-2 py-3 text-center text-red-600">{gastosPistaMes.toFixed(2)} €</td>
                      <td className={resultadoMes >= 0 ? "px-2 py-3 text-center text-[#00A79C]" : "px-2 py-3 text-center text-red-600"}>{resultadoMes.toFixed(2)} €</td>
                      <td className={resultadoMes >= 0 ? "px-2 py-3 text-center text-[#17324D]" : "px-2 py-3 text-center text-red-600"}>{resultadoMes.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
