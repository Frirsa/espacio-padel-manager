"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import InformeIQL from "../../components/informes/InformeIQL";
import InformeEconomico from "../../components/informes/InformeEconomico";
import InformePendientes from "../../components/informes/InformePendientes";
import PanelEstadisticas from "../../components/informes/PanelEstadisticas";
import GraficoEvolucion from "../../components/informes/GraficoEvolucion";
import GraficoActividad from "../../components/informes/GraficoActividad";
import ResumenAlumnos from "../../components/informes/ResumenAlumnos";
import RankingAlumnos from "../../components/informes/RankingAlumnos";

import { generarPdfIQL } from "../../components/informes/generarPdfIQL";
import { generarPdfEconomico } from "../../components/informes/generarPdfEconomico";
import { generarPdfPendientes } from "../../components/informes/generarPdfPendientes";

import type {
  Clase,
  Pago,
  TipoInforme,
} from "../../components/informes/tipos";
type ClaseConExtra = Clase & {
  ingreso_extra?: number | null;
  facturable?: boolean;
  cobrada?: boolean;
};

type DatoEvolucion = {
  mes: string;
  ingresos: number;
  gastos: number;
  resultado: number;
  clases: number;
  horas: number;
};
export default function InformesPage() {
  const [mes, setMes] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [
    tipoInforme,
    setTipoInforme,
  ] =
    useState<TipoInforme>(
      "iql"
    );

const [
  clases,
  setClases,
] =
  useState<ClaseConExtra[]>([]);

const [
  clasesMesAnterior,
  setClasesMesAnterior,
] =
  useState<ClaseConExtra[]>([]);
  const [
    pagos,
    setPagos,
  ] =
    useState<Pago[]>([]);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    generando,
    setGenerando,
  ] =
    useState(false);

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

const [
  evolucionMensual,
  setEvolucionMensual,
] =
  useState<DatoEvolucion[]>([]);    
  useEffect(() => {
    cargarDatos();
  }, [mes]);

  function obtenerFechasMes() {
    const [
      anio,
      numeroMes,
    ] =
      mes
        .split("-")
        .map(Number);

    const inicio =
      `${anio}-${String(
        numeroMes
      ).padStart(
        2,
        "0"
      )}-01`;

    const ultimoDia =
      new Date(
        anio,
        numeroMes,
        0
      ).getDate();

    const fin =
      `${anio}-${String(
        numeroMes
      ).padStart(
        2,
        "0"
      )}-${String(
        ultimoDia
      ).padStart(
        2,
        "0"
      )}`;

    return {
      inicio,
      fin,
    };
  }

function obtenerFechasMesAnterior() {
  const [
    anio,
    numeroMes,
  ] =
    mes
      .split("-")
      .map(Number);

  const fechaAnterior =
    new Date(
      anio,
      numeroMes - 2,
      1
    );

  const anioAnterior =
    fechaAnterior.getFullYear();

  const mesAnterior =
    fechaAnterior.getMonth() + 1;

  const inicio =
    `${anioAnterior}-${String(
      mesAnterior
    ).padStart(
      2,
      "0"
    )}-01`;

  const ultimoDia =
    new Date(
      anioAnterior,
      mesAnterior,
      0
    ).getDate();

  const fin =
    `${anioAnterior}-${String(
      mesAnterior
    ).padStart(
      2,
      "0"
    )}-${String(
      ultimoDia
    ).padStart(
      2,
      "0"
    )}`;

  return {
    inicio,
    fin,
  };
}  
  async function cargarDatos() {
    setCargando(true);
    setMensaje("");

    const {
      inicio,
      fin,
    } =
      obtenerFechasMes();
const {
  inicio: inicioAnterior,
  fin: finAnterior,
} =
  obtenerFechasMesAnterior();
    const {
      data: clasesData,
      error: errorClases,
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

          ubicaciones (
  nombre,
  tipo
),

          clase_alumnos (
            alumno_id,
            importe,
            usa_bono,
            bono_id,

            alumnos (
              nombre,
              apellidos
            )
          )
        `)
        .gte(
          "fecha",
          inicio
        )
        .lte(
          "fecha",
          fin
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
        );

    if (errorClases) {
      setMensaje(
        "❌ Error al cargar las clases: " +
          errorClases.message
      );

      setCargando(false);
      return;
    }

    const {
      data: pagosData,
      error: errorPagos,
    } =
      await supabase
        .from("pagos")
        .select(`
          id,
          alumno_id,
          importe,
          estado,
          metodo,
          fecha_pago,

          alumnos (
            nombre,
            apellidos
          )
        `)
        .gte(
          "fecha_pago",
          inicio
        )
        .lte(
          "fecha_pago",
          fin
        )
        .order(
          "fecha_pago",
          {
            ascending: true,
          }
        );

    if (errorPagos) {
      setMensaje(
        "❌ Error al cargar los pagos: " +
          errorPagos.message
      );

      setCargando(false);
      return;
    }
const {
  data: clasesMesAnteriorData,
  error: errorClasesMesAnterior,
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
      facturable,
      cobrada,
      importe_club,
      coste_pista,
      ingreso_extra,

      ubicaciones (
        nombre,
        tipo
      ),

      clase_alumnos (
        alumno_id,
        importe,
        usa_bono,
        bono_id,

        alumnos (
          nombre,
          apellidos
        )
      )
    `)
    .gte(
      "fecha",
      inicioAnterior
    )
    .lte(
      "fecha",
      finAnterior
    );

if (
  errorClasesMesAnterior
) {
  setMensaje(
    "❌ Error al cargar el mes anterior: " +
      errorClasesMesAnterior.message
  );

  setCargando(false);
  return;
}
    setClases(
      (clasesData ||
        []) as unknown as ClaseConExtra[]
    );
setClasesMesAnterior(
  (clasesMesAnteriorData ||
    []) as unknown as ClaseConExtra[]
);
    setPagos(
      (pagosData ||
        []) as unknown as Pago[]
    );
const [
  anioSeleccionado,
  mesSeleccionado,
] =
  mes
    .split("-")
    .map(Number);

const fechaInicioEvolucion =
  new Date(
    anioSeleccionado,
    mesSeleccionado - 6,
    1
  );

const inicioEvolucion =
  `${fechaInicioEvolucion.getFullYear()}-${String(
    fechaInicioEvolucion.getMonth() + 1
  ).padStart(2, "0")}-01`;

const {
  data: clasesEvolucionData,
  error: errorEvolucion,
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
        usa_bono,
        bono_id,

        alumnos (
          nombre,
          apellidos
        )
      )
    `)
    .gte(
      "fecha",
      inicioEvolucion
    )
    .lte(
      "fecha",
      fin
    )
    .order(
      "fecha",
      {
        ascending: true,
      }
    );

if (errorEvolucion) {
  setMensaje(
    "❌ Error al cargar la evolución mensual: " +
      errorEvolucion.message
  );

  setCargando(false);
  return;
}

const datosEvolucion: DatoEvolucion[] =
  [];

for (
  let indice = 0;
  indice < 6;
  indice++
) {
  const fechaMes =
    new Date(
      anioSeleccionado,
      mesSeleccionado - 6 + indice,
      1
    );

  const claveMes =
    `${fechaMes.getFullYear()}-${String(
      fechaMes.getMonth() + 1
    ).padStart(2, "0")}`;

  const clasesDelMes =
    (
      clasesEvolucionData ||
      []
    ).filter(
      (clase) =>
        clase.fecha.startsWith(
          claveMes
        ) &&
        (
          clase.estado === "realizada" ||
          (
            clase.estado === "cancelada" &&
            clase.facturable === true
          )
        )
    );

  const ingresosDelMes =
    clasesDelMes.reduce(
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

  const gastosDelMes =
    clasesDelMes.reduce(
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

  const horasDelMes =
    clasesDelMes.reduce(
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
    ) / 60;

  const nombreMes =
    fechaMes.toLocaleDateString(
      "es-ES",
      {
        month: "short",
      }
    );

  datosEvolucion.push({
    mes:
      nombreMes
        .replace(".", "")
        .toUpperCase(),

    ingresos:
      ingresosDelMes,

    gastos:
      gastosDelMes,

    resultado:
      ingresosDelMes -
      gastosDelMes,

    clases:
      clasesDelMes.length,

    horas:
      horasDelMes,
  });
}

setEvolucionMensual(
  datosEvolucion
);
    setCargando(false);
  }

  const clasesRealizadas =
    clases.filter(
      (clase) =>
        clase.estado ===
        "realizada"
    );
const clasesRealizadasMesAnterior =
  clasesMesAnterior.filter(
    (clase) =>
      clase.estado ===
      "realizada"
  );

const clasesEconomicas =
  clases.filter(
    (clase) =>
      clase.estado === "realizada" ||
      (
        clase.estado === "cancelada" &&
        clase.facturable === true
      )
  );

const clasesEconomicasMesAnterior =
  clasesMesAnterior.filter(
    (clase) =>
      clase.estado === "realizada" ||
      (
        clase.estado === "cancelada" &&
        clase.facturable === true
      )
  );

const ingresosMesAnterior =
  clasesEconomicasMesAnterior.reduce(
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

const gastosMesAnterior =
  clasesEconomicasMesAnterior.reduce(
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

const resultadoMesAnterior =
  ingresosMesAnterior -
  gastosMesAnterior;

const horasMesAnterior =
  clasesRealizadasMesAnterior.reduce(
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
  ) / 60;
  const clasesIQL =
    clasesRealizadas.filter(
      (clase) =>
        (
          clase
            .ubicaciones
            ?.nombre ||
          ""
        )
          .toLowerCase()
          .includes(
            "iql"
          )
    );

  const clasesParaClub =
    clasesIQL.filter(
      (clase) =>
        clase.tipo ===
        "club"
    );

  const clasesPropiasIQL =
    clasesIQL.filter(
      (clase) =>
        clase.tipo ===
        "propia"
    );

  const totalClub =
    clasesParaClub.reduce(
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

  const totalAlquiler =
    clasesPropiasIQL.reduce(
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

  const saldoIQL =
    totalClub -
    totalAlquiler;

  const totalHorasClub =
    clasesParaClub.reduce(
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
    ) / 60;

  const totalHorasPropias =
    clasesPropiasIQL.reduce(
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
    ) / 60;

  const pagosPendientes =
    pagos.filter(
      (pago) =>
        pago.estado ===
        "pendiente"
    );

  const totalPendienteNormal =
    pagosPendientes.reduce(
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

  const clasesClubPendientes =
    clases.filter(
      (clase) =>
        clase.tipo === "club" &&
        clase.facturable === true &&
        clase.cobrada !== true &&
        (
          clase.estado === "realizada" ||
          clase.estado === "cancelada"
        )
    );

  const totalPendienteClub =
    clasesClubPendientes.reduce(
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

  const totalPendiente =
    totalPendienteNormal +
    totalPendienteClub;

  const totalHoras =
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
    ) / 60;

  const ingresosClubGeneral =
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

  const gastosPistaGeneral =
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

  const ingresosGenerados =
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
              subtotal:
                number,
              participante:
                any
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
const ingresosExtraGeneral =
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

const ingresosClasesClub =
  clasesRealizadas
    .filter(
      (clase) =>
        clase.tipo === "club"
    )
    .reduce(
      (total, clase) =>
        total +
        Number(
          clase.importe_club ||
            0
        ),
      0
    );

const ingresosClasesPropiasPago =
  clasesRealizadas
    .filter(
      (clase) =>
        clase.tipo === "propia"
    )
    .reduce(
      (total, clase) =>
        total +
        (
          clase.clase_alumnos ||
          []
        ).reduce(
          (subtotal, participante) =>
            subtotal +
            Number(
              participante.importe ||
                0
            ),
          0
        ),
      0
    );

const ingresosClasesPrivadas =
  clasesRealizadas
    .filter(
      (clase) =>
        clase.tipo === "privada"
    )
    .reduce(
      (total, clase) =>
        total +
        (
          clase.clase_alumnos ||
          []
        ).reduce(
          (subtotal, participante) =>
            subtotal +
            Number(
              participante.importe ||
                0
            ),
          0
        ),
      0
    );

const ingresosPorBonoConsumido =
  clasesRealizadas.reduce(
    (total, clase) =>
      total +
      (
        clase.clase_alumnos ||
        []
      )
        .filter(
          (participante) =>
            clase.tipo !== "club" &&
            participante.usa_bono
        )
        .reduce(
          (subtotal, participante) =>
            subtotal +
            Number(
              participante.importe ||
                0
            ),
          0
        ),
    0
  );

const ingresosPagoNormalGenerado =
  clasesRealizadas.reduce(
    (total, clase) =>
      total +
      (
        clase.clase_alumnos ||
        []
      )
        .filter(
          (participante) =>
            clase.tipo !== "club" &&
            !participante.usa_bono
        )
        .reduce(
          (subtotal, participante) =>
            subtotal +
            Number(
              participante.importe ||
                0
            ),
          0
        ),
    0
  );

const ingresosBaseSinExtra =
  ingresosClasesClub +
  ingresosClasesPropiasPago +
  ingresosClasesPrivadas;

const comprobacionIngresos =
  ingresosBaseSinExtra +
  ingresosExtraGeneral;

const diferenciaComprobacion =
  comprobacionIngresos -
  ingresosGenerados;

const alumnosDistintos =
  new Set(
    clasesRealizadas.flatMap(
      (clase) =>
        (clase.clase_alumnos || [])
          .map(
            (participante) =>
              participante.alumno_id
          )
          .filter(Boolean)
    )
  ).size;

const totalParticipaciones =
  clasesRealizadas.reduce(
    (total, clase) =>
      total +
      (clase.clase_alumnos || []).length,
    0
  );

const mediaAlumnosClase =
  clasesRealizadas.length > 0
    ? totalParticipaciones /
      clasesRealizadas.length
    : 0;

const numeroClasesClub =
  clasesRealizadas.filter(
    (clase) =>
      clase.tipo === "club"
  ).length;

const numeroClasesPropiasPago =
  clasesRealizadas.filter(
    (clase) =>
      clase.tipo === "propia"
  ).length;

const numeroClasesPrivadas =
  clasesRealizadas.filter(
    (clase) =>
      clase.tipo === "privada"
  ).length;

const ingresoMedioHora =
  totalHoras > 0
    ? ingresosGenerados / totalHoras
    : 0;
function calcularVariacion(
  actual: number,
  anterior: number
) {
  if (
    anterior === 0
  ) {
    return actual === 0
      ? 0
      : 100;
  }

  return (
    (
      actual -
      anterior
    ) /
    Math.abs(anterior)
  ) * 100;
}

const variacionIngresos =
  calcularVariacion(
    ingresosGenerados,
    ingresosMesAnterior
  );

const variacionGastos =
  calcularVariacion(
    gastosPistaGeneral,
    gastosMesAnterior
  );

const variacionResultado =
  calcularVariacion(
    ingresosGenerados -
      gastosPistaGeneral,
    resultadoMesAnterior
  );

const variacionClases =
  calcularVariacion(
    clasesRealizadas.length,
    clasesRealizadasMesAnterior.length
  );

const variacionHoras =
  calcularVariacion(
    totalHoras,
    horasMesAnterior
  );
const datosResumenAlumnos =
  Array.from(
    clasesRealizadas.reduce(
      (
        mapa,
        clase
      ) => {
        (
          clase.clase_alumnos ||
          []
        ).forEach(
          (
            participante
          ) => {
            if (
              !participante.alumno_id ||
              !participante.alumnos
            ) {
              return;
            }

            const nombre =
              `${participante.alumnos.nombre || ""} ${
                participante.alumnos.apellidos || ""
              }`.trim();

            const actual =
              mapa.get(
                participante.alumno_id
              ) || {
                alumnoId:
                  participante.alumno_id,
                nombre,
                clases: 0,
                horas: 0,
                ingresos: 0,
                pendiente: 0,
              };

            actual.clases += 1;

            actual.horas +=
              Number(
                clase.duracion_minutos ||
                  0
              ) / 60;

            if (
              clase.tipo !==
              "club"
            ) {
              actual.ingresos +=
                Number(
                  participante.importe ||
                    0
                );
            }

            mapa.set(
              participante.alumno_id,
              actual
            );
          }
        );

        return mapa;
      },
      new Map<
        string,
        {
          alumnoId: string;
          nombre: string;
          clases: number;
          horas: number;
          ingresos: number;
          pendiente: number;
        }
      >()
    ).values()
  ).map(
    (alumno) => ({
      ...alumno,

      pendiente:
        pagosPendientes
          .filter(
            (pago) =>
              pago.alumno_id ===
              alumno.alumnoId
          )
          .reduce(
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
          ),
    })
  );          
const acumuladoDiario = (() => {
  const porDia = new Map<
    string,
    {
      fecha: string;
      clases: number;
      horas: number;
      ingresos: number;
      ingresoExtra: number;
      gastos: number;
      resultado: number;
      acumulado: number;
    }
  >();

  clasesEconomicas.forEach(
    (clase) => {
      const actual =
        porDia.get(
          clase.fecha
        ) || {
          fecha: clase.fecha,
          clases: 0,
          horas: 0,
          ingresos: 0,
          ingresoExtra: 0,
          gastos: 0,
          resultado: 0,
          acumulado: 0,
        };

      const ingresoClase =
        clase.tipo === "club"
          ? Number(
              clase.importe_club ||
                0
            )
          : (
              clase.clase_alumnos ||
              []
            ).reduce(
              (
                total,
                participante
              ) =>
                total +
                Number(
                  participante.importe ||
                    0
                ),
              0
            );

      const ingresoExtra =
        Number(
          clase.ingreso_extra ||
            0
        );

      const gastoClase =
        Number(
          clase.coste_pista ||
            0
        );

      if (
        clase.estado === "realizada"
      ) {
        actual.clases += 1;

        actual.horas +=
          Number(
            clase.duracion_minutos ||
              0
          ) / 60;
      }

      actual.ingresos +=
        ingresoClase +
        ingresoExtra;

      actual.ingresoExtra +=
        ingresoExtra;

      actual.gastos +=
        gastoClase;

      actual.resultado +=
        ingresoClase +
        ingresoExtra -
        gastoClase;

      porDia.set(
        clase.fecha,
        actual
      );
    }
  );

  let acumulado = 0;

  return Array.from(
    porDia.values()
  )
    .sort(
      (a, b) =>
        a.fecha.localeCompare(
          b.fecha
        )
    )
    .map((dia) => {
      acumulado +=
        dia.resultado;

      return {
        ...dia,
        acumulado,
      };
    });
})();

const resultadoPeriodo =
  ingresosGenerados -
  gastosPistaGeneral;

const ingresoMedio =
  clasesRealizadas.length > 0
    ? ingresosGenerados /
      clasesRealizadas.length
    : 0;
  async function generarPDF() {
    try {
      setGenerando(true);
      setMensaje("");

      if (
        tipoInforme ===
        "iql"
      ) {
        await generarPdfIQL({
          mes,
          clasesParaClub,
          clasesPropiasIQL,
          totalClub,
          totalAlquiler,
          saldoIQL,
          totalHorasClub,
          totalHorasPropias,
        });

        setMensaje(
          "✅ PDF generado correctamente"
        );

        return;
      }

      if (
        tipoInforme ===
        "economico"
      ) {
        await generarPdfEconomico({
          mes,
          clases:
            clasesRealizadas,
          totalIngresos:
            ingresosGenerados,
          totalGastos:
            gastosPistaGeneral,
          totalPendiente,
          totalHoras,
          totalClases:
            clasesRealizadas.length,
        });

        setMensaje(
          "✅ PDF generado correctamente"
        );

        return;
      }

      if (
        tipoInforme ===
        "pendientes"
      ) {
        await generarPdfPendientes({
          mes,
          pagosPendientes,
          totalPendiente,
        });

        setMensaje(
          "✅ PDF generado correctamente"
        );

        return;
      }
    } catch (error) {
      console.error(error);

      setMensaje(
        "❌ No se ha podido generar el PDF"
      );
    } finally {
      setGenerando(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        <div className="mb-7">
          <h1 className="text-4xl font-bold text-slate-900">
            Informes
          </h1>

          <p className="mt-2 text-slate-600">
            Consulta, analiza y exporta la información de tu actividad
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
                Informes mensuales
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Selecciona el informe y el periodo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Los datos se actualizan automáticamente según el mes elegido
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Informe
              </label>

              <select
                value={tipoInforme}
                onChange={(e) =>
                  setTipoInforme(
                    e.target.value as TipoInforme
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              >
                <option value="iql">
                  Liquidación mensual IQL
                </option>

                <option value="economico">
                  Informe mensual completo
                </option>

                <option value="pendientes">
                  Pendientes de cobro
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Mes
              </label>

              <input
                type="month"
                value={mes}
                onChange={(e) =>
                  setMes(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={generarPDF}
                disabled={
                  cargando ||
                  generando
                }
                className="w-full rounded-xl bg-[#09a9a3] px-5 py-3 font-bold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generando
                  ? "Generando PDF..."
                  : "Generar PDF"}
              </button>
            </div>

          </div>

          {mensaje && (
            <div
              className={
                mensaje.startsWith("❌")
                  ? "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  : "mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
              }
            >
              {mensaje}
            </div>
          )}

        </section>
<section className="mt-8 rounded-2xl border border-purple-200 bg-purple-50 p-5">
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-purple-600">
        Ingresos extra del mes
      </p>

      <p className="mt-2 text-sm text-purple-700">
        Propinas u otros ingresos excepcionales asociados a clases
      </p>
    </div>

    <p className="text-3xl font-bold text-purple-700">
      {ingresosExtraGeneral.toFixed(2)} €
    </p>
  </div>
</section>

{tipoInforme === "economico" && (
<section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

  <div className="border-b border-slate-200 px-6 py-5">

    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
      Comprobación económica
    </p>

    <h2 className="mt-1 text-xl font-bold text-slate-900">
      Desglose del mes
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Utiliza este cuadro para comparar el resultado de la aplicación con tu control manual.
    </p>

  </div>

  <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">

    <div className="bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Clases para club
      </p>
      <p className="mt-2 text-2xl font-bold text-orange-600">
        {ingresosClasesClub.toFixed(2)} €
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Importe que te pagan los clubes
      </p>
    </div>

    <div className="bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Propias · pista de pago
      </p>
      <p className="mt-2 text-2xl font-bold text-[#078b86]">
        {ingresosClasesPropiasPago.toFixed(2)} €
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Ingresos generados por alumnos
      </p>
    </div>

    <div className="bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Propias · pista privada
      </p>
      <p className="mt-2 text-2xl font-bold text-teal-600">
        {ingresosClasesPrivadas.toFixed(2)} €
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Ingresos generados por alumnos
      </p>
    </div>

    <div className="bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Ingresos extra
      </p>
      <p className="mt-2 text-2xl font-bold text-purple-700">
        {ingresosExtraGeneral.toFixed(2)} €
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Propinas u otros extras
      </p>
    </div>

  </div>

  <div className="grid gap-4 border-t border-slate-200 p-6 lg:grid-cols-2">

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <h3 className="font-bold text-slate-900">
        Cómo se generan los ingresos propios
      </h3>

      <div className="mt-4 space-y-3">

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            Pago normal
          </span>
          <strong className="text-slate-900">
            {ingresosPagoNormalGenerado.toFixed(2)} €
          </strong>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            Valor consumido de bonos
          </span>
          <strong className="text-slate-900">
            {ingresosPorBonoConsumido.toFixed(2)} €
          </strong>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700">
              Total clases propias
            </span>
            <strong className="text-[#078b86]">
              {(ingresosClasesPropiasPago + ingresosClasesPrivadas).toFixed(2)} €
            </strong>
          </div>
        </div>

      </div>

    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <h3 className="font-bold text-slate-900">
        Resultado del periodo
      </h3>

      <div className="mt-4 space-y-3">

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            Ingresos generados
          </span>
          <strong className="text-green-700">
            {ingresosGenerados.toFixed(2)} €
          </strong>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            Costes de pista
          </span>
          <strong className="text-red-600">
            - {gastosPistaGeneral.toFixed(2)} €
          </strong>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            Pendiente de cobro
          </span>
          <strong className="text-amber-700">
            {totalPendiente.toFixed(2)} €
          </strong>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-slate-900">
              Resultado neto generado
            </span>
            <strong
              className={
                resultadoPeriodo >= 0
                  ? "text-xl text-green-700"
                  : "text-xl text-red-600"
              }
            >
              {resultadoPeriodo.toFixed(2)} €
            </strong>
          </div>
        </div>

      </div>

    </div>

  </div>

  <div
    className={
      Math.abs(diferenciaComprobacion) < 0.01
        ? "border-t border-green-200 bg-green-50 px-6 py-4"
        : "border-t border-red-200 bg-red-50 px-6 py-4"
    }
  >
    <p
      className={
        Math.abs(diferenciaComprobacion) < 0.01
          ? "text-sm font-bold text-green-700"
          : "text-sm font-bold text-red-700"
      }
    >
      {Math.abs(diferenciaComprobacion) < 0.01
        ? "✓ La suma del desglose coincide con el total de ingresos generados."
        : `⚠️ Hay una diferencia interna de ${diferenciaComprobacion.toFixed(2)} € que debemos revisar.`}
    </p>
  </div>

</section>
)}

<PanelEstadisticas
  ingresos={
    ingresosGenerados
  }
  gastos={
    gastosPistaGeneral
  }
  resultado={
    resultadoPeriodo
  }
  clases={
    clasesRealizadas.length
  }
  horas={
    totalHoras
  }
  ingresoMedio={
    ingresoMedio
  }

  alumnosDistintos={
    alumnosDistintos
  }
  mediaAlumnosClase={
    mediaAlumnosClase
  }
  clasesClub={
    numeroClasesClub
  }
  clasesPropiasPago={
    numeroClasesPropiasPago
  }
  clasesPrivadas={
    numeroClasesPrivadas
  }
  ingresoMedioHora={
    ingresoMedioHora
  }
  variacionIngresos={
  variacionIngresos
}
variacionGastos={
  variacionGastos
}
variacionResultado={
  variacionResultado
}
variacionClases={
  variacionClases
}
variacionHoras={
  variacionHoras
}
/>
<section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

  <div className="border-b border-slate-200 px-6 py-5">

    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
      Evolución del mes
    </p>

    <h2 className="mt-1 text-xl font-bold text-slate-900">
      Acumulado diario
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Resultado de cada día y acumulado progresivo durante el mes seleccionado
    </p>

  </div>

  {acumuladoDiario.length === 0 ? (

    <div className="px-6 py-8 text-sm text-slate-500">
      No hay clases realizadas en este mes.
    </div>

  ) : (

    <div className="overflow-x-auto">

      <table className="w-full min-w-[980px]">

        <thead className="bg-slate-50">

          <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">

            <th className="px-6 py-4">
              Día
            </th>

            <th className="px-4 py-4 text-right">
              Clases
            </th>

            <th className="px-4 py-4 text-right">
              Horas
            </th>

            <th className="px-4 py-4 text-right">
              Ingresos
            </th>

            <th className="px-4 py-4 text-right">
              Ingreso extra
            </th>

            <th className="px-4 py-4 text-right">
              Gastos
            </th>

            <th className="px-4 py-4 text-right">
              Resultado
            </th>

            <th className="px-6 py-4 text-right">
              Acumulado
            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-slate-100">

          {acumuladoDiario.map(
            (dia) => {

              const [
                anio,
                numeroMes,
                numeroDia,
              ] =
                dia.fecha.split("-");

              return (

                <tr
                  key={dia.fecha}
                  className="text-sm text-slate-700"
                >

                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {numeroDia}/{numeroMes}/{anio}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {dia.clases}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {dia.horas.toFixed(1)}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-900">
                    {dia.ingresos.toFixed(2)} €
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-purple-700">
                    {dia.ingresoExtra.toFixed(2)} €
                  </td>

                  <td className="px-4 py-4 text-right text-red-600">
                    {dia.gastos.toFixed(2)} €
                  </td>

                  <td
                    className={
                      dia.resultado >= 0
                        ? "px-4 py-4 text-right font-bold text-emerald-600"
                        : "px-4 py-4 text-right font-bold text-red-600"
                    }
                  >
                    {dia.resultado.toFixed(2)} €
                  </td>

                  <td
                    className={
                      dia.acumulado >= 0
                        ? "px-6 py-4 text-right text-base font-bold text-[#09a9a3]"
                        : "px-6 py-4 text-right text-base font-bold text-red-600"
                    }
                  >
                    {dia.acumulado.toFixed(2)} €
                  </td>

                </tr>

              );
            }
          )}

        </tbody>

        <tfoot className="border-t-2 border-slate-200 bg-slate-50">

          <tr className="font-bold text-slate-900">

            <td className="px-6 py-4">
              TOTAL MES
            </td>

            <td className="px-4 py-4 text-right">
              {clasesRealizadas.length}
            </td>

            <td className="px-4 py-4 text-right">
              {totalHoras.toFixed(1)}
            </td>

            <td className="px-4 py-4 text-right">
              {ingresosGenerados.toFixed(2)} €
            </td>

            <td className="px-4 py-4 text-right text-purple-700">
              {ingresosExtraGeneral.toFixed(2)} €
            </td>

            <td className="px-4 py-4 text-right">
              {gastosPistaGeneral.toFixed(2)} €
            </td>

            <td className="px-4 py-4 text-right">
              {resultadoPeriodo.toFixed(2)} €
            </td>

            <td className="px-6 py-4 text-right text-[#09a9a3]">
              {resultadoPeriodo.toFixed(2)} €
            </td>

          </tr>

        </tfoot>

      </table>

    </div>

  )}

</section>

<GraficoEvolucion
  datos={
    evolucionMensual
  }
/>
<GraficoActividad
  datos={
    evolucionMensual
  }
/>
<ResumenAlumnos
  datos={
    datosResumenAlumnos
  }
/>
<RankingAlumnos
  datos={
    datosResumenAlumnos
  }
/>
        {cargando ? (

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Cargando informe...
            </p>
          </div>

        ) : tipoInforme === "iql" ? (

          <InformeIQL
            mes={mes}
            clasesParaClub={
              clasesParaClub
            }
            clasesPropiasIQL={
              clasesPropiasIQL
            }
            totalClub={
              totalClub
            }
            totalAlquiler={
              totalAlquiler
            }
            saldoIQL={
              saldoIQL
            }
            totalHorasClub={
              totalHorasClub
            }
            totalHorasPropias={
              totalHorasPropias
            }
          />

        ) : tipoInforme === "economico" ? (

          <InformeEconomico
            clasesRealizadas={
              clasesRealizadas.length
            }
            totalHoras={
              totalHoras
            }
            ingresosGenerados={
              ingresosGenerados
            }
            totalPendiente={
              totalPendiente
            }
            ingresosClubGeneral={
              ingresosClubGeneral
            }
            gastosPistaGeneral={
              gastosPistaGeneral
            }
          />

        ) : (

          <InformePendientes
            pagosPendientes={
              pagosPendientes
            }
            totalPendiente={
              totalPendiente
            }
          />

        )}

      </div>
    </main>
  );
}  