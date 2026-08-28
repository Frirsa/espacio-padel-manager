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
import { generarPdfIQLSimplificado } from "../../components/informes/generarPdfIQLSimplificado";
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
    modeloPdfIQL,
    setModeloPdfIQL,
  ] = useState<
    "actual" | "simplificado"
  >("actual");

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

  const clasesRealizadasDelMes =
    clasesDelMes.filter(
      (clase) =>
        clase.estado === "realizada"
    );

  const horasDelMes =
    clasesRealizadasDelMes.reduce(
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
      clasesRealizadasDelMes.length,

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

const ingresosClasesClub =
  clasesEconomicas
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
  clasesEconomicas
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
  clasesEconomicas
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
  clasesEconomicas.reduce(
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
  clasesEconomicas.reduce(
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
      canceladas: number;
      canceladasFacturables: number;
      horas: number;
      ingresos: number;
      clubGenerado: number;
      pistasPagadasClub: number;
      saldoClub: number;
      clubCobrado: number;
      ingresoExtra: number;
      gastos: number;
      resultado: number;
      acumulado: number;
    }
  >();

  clases
    .filter(
      (clase) =>
        clase.estado === "realizada" ||
        clase.estado === "cancelada"
    )
    .forEach(
    (clase) => {
      const actual =
        porDia.get(
          clase.fecha
        ) || {
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

      const cuentaEconomicamente =
        clase.estado === "realizada" ||
        (
          clase.estado === "cancelada" &&
          clase.facturable === true
        );

      const ingresoClase =
        !cuentaEconomicamente
          ? 0
          : clase.tipo === "club"
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
        cuentaEconomicamente
          ? Number(
              clase.ingreso_extra ||
                0
            )
          : 0;

      const gastoClase =
        cuentaEconomicamente
          ? Number(
              clase.coste_pista ||
                0
            )
          : 0;

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

      if (
        clase.estado === "cancelada"
      ) {
        actual.canceladas += 1;

        if (
          clase.facturable === true
        ) {
          actual.canceladasFacturables += 1;
        }
      }

      actual.ingresos +=
        ingresoClase +
        ingresoExtra;

      if (
        cuentaEconomicamente &&
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
        cuentaEconomicamente &&
        esIQL &&
        clase.tipo !== "club"
      ) {
        actual.pistasPagadasClub +=
          gastoClase;
      }

      actual.saldoClub =
        actual.clubGenerado -
        actual.pistasPagadasClub;

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

const totalCanceladas =
  clases.filter(
    (clase) =>
      clase.estado === "cancelada"
  ).length;

const totalCanceladasFacturables =
  clases.filter(
    (clase) =>
      clase.estado === "cancelada" &&
      clase.facturable === true
  ).length;

const totalClubGenerado =
  acumuladoDiario.reduce(
    (total, dia) =>
      total +
      dia.clubGenerado,
    0
  );

const totalPistasPagadasClub =
  acumuladoDiario.reduce(
    (total, dia) =>
      total +
      dia.pistasPagadasClub,
    0
  );

const totalSaldoClub =
  totalClubGenerado -
  totalPistasPagadasClub;

const totalClubCobrado =
  acumuladoDiario.reduce(
    (total, dia) =>
      total +
      dia.clubCobrado,
    0
  );

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
        const datosPdfIQL = {
          mes,
          clasesParaClub,
          clasesPropiasIQL,
          totalClub,
          totalAlquiler,
          saldoIQL,
          totalHorasClub,
          totalHorasPropias,
        };

        if (
          modeloPdfIQL ===
          "simplificado"
        ) {
          await generarPdfIQLSimplificado(
            datosPdfIQL
          );
        } else {
          await generarPdfIQL(
            datosPdfIQL
          );
        }

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
    <main className="min-h-screen bg-[#F3F6F8] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[1540px] space-y-5">
        {/* CABECERA */}
        <section className="overflow-hidden rounded-[28px] bg-[#0F2742] text-white shadow-[0_18px_45px_rgba(15,39,66,0.18)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                  Gestión · Análisis
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                  Informes
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  Revisa la actividad, controla la evolución económica y genera los documentos del periodo.
                </p>
              </div>

              <div className="inline-flex w-full rounded-2xl border border-white/10 bg-white/10 p-1 xl:w-auto">
                {[
                  ["iql", "IQL"],
                  ["economico", "Mensual"],
                  ["pendientes", "Pendientes"],
                ].map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setTipoInforme(valor as TipoInforme)}
                    className={
                      tipoInforme === valor
                        ? "flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#17324D] shadow-sm xl:flex-none"
                        : "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white xl:flex-none"
                    }
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#0B2037]/55 px-5 py-4 sm:px-7 lg:px-8">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  Periodo
                </label>
                <input
                  type="month"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-[#17324D] outline-none transition focus:border-[#4DD4CA] focus:ring-2 focus:ring-[#4DD4CA]/20"
                />
              </div>

              {tipoInforme === "iql" ? (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Modelo PDF
                  </label>
                  <select
                    value={modeloPdfIQL}
                    onChange={(e) =>
                      setModeloPdfIQL(
                        e.target.value as "actual" | "simplificado"
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-[#17324D] outline-none transition focus:border-[#4DD4CA] focus:ring-2 focus:ring-[#4DD4CA]/20"
                  >
                    <option value="actual">Modelo actual</option>
                    <option value="simplificado">Modelo simplificado</option>
                  </select>
                </div>
              ) : (
                <div className="hidden xl:block" />
              )}

              <button
                type="button"
                onClick={generarPDF}
                disabled={cargando || generando}
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#09A9A3] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(9,169,163,0.25)] transition hover:bg-[#078B86] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generando ? "Generando PDF..." : "Generar PDF"}
              </button>
            </div>

            {mensaje && (
              <div
                className={
                  mensaje.startsWith("❌")
                    ? "mt-3 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100"
                    : "mt-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100"
                }
              >
                {mensaje}
              </div>
            )}
          </div>
        </section>

        {/* RESUMEN CONTEXTUAL */}
        <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09A9A3]">
                Resumen del periodo
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#17324D]">
                {tipoInforme === "iql"
                  ? "Liquidación IQL"
                  : tipoInforme === "economico"
                  ? "Informe mensual completo"
                  : "Pendientes de cobro"}
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {mes}
            </p>
          </div>

          {tipoInforme === "iql" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700/70">IQL debe abonar</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{totalClub.toFixed(2)} €</p>
                <p className="mt-1 text-xs text-emerald-900/55">{clasesParaClub.length} clases · {totalHorasClub.toFixed(1)} h</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/55 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-700/70">A pagar a IQL</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{totalAlquiler.toFixed(2)} €</p>
                <p className="mt-1 text-xs text-rose-900/55">{clasesPropiasIQL.length} clases · {totalHorasPropias.toFixed(1)} h</p>
              </div>
              <div className="rounded-2xl border border-[#09A9A3]/20 bg-[#E9F9F8] p-4 sm:col-span-2 xl:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#078B86]">Saldo de la liquidación</p>
                <p className={saldoIQL >= 0 ? "mt-1 text-3xl font-bold text-[#078B86]" : "mt-1 text-3xl font-bold text-rose-700"}>
                  {Math.abs(saldoIQL).toFixed(2)} €
                </p>
                <p className="mt-1 text-xs font-semibold text-[#17324D]/60">
                  {saldoIQL > 0
                    ? "A favor de Espacio Pádel Academy"
                    : saldoIQL < 0
                    ? "A favor de IQL"
                    : "Liquidación compensada"}
                </p>
              </div>
            </div>
          ) : tipoInforme === "economico" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700/70">Ingresos generados</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{ingresosGenerados.toFixed(2)} €</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/55 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-700/70">Gastos de pista</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{gastosPistaGeneral.toFixed(2)} €</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700/70">Pendiente de cobro</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{totalPendiente.toFixed(2)} €</p>
              </div>
              <div className="rounded-2xl border border-[#09A9A3]/20 bg-[#E9F9F8] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#078B86]">Resultado</p>
                <p className={resultadoPeriodo >= 0 ? "mt-1 text-2xl font-bold text-[#078B86]" : "mt-1 text-2xl font-bold text-rose-700"}>
                  {resultadoPeriodo.toFixed(2)} €
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700/70">Total pendiente</p>
                <p className="mt-1 text-3xl font-bold text-amber-700">{totalPendiente.toFixed(2)} €</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Operaciones pendientes</p>
                <p className="mt-1 text-3xl font-bold text-[#17324D]">{pagosPendientes.length}</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">Ingresos extra</p>
                <p className="mt-1 text-3xl font-bold text-violet-700">{ingresosExtraGeneral.toFixed(2)} €</p>
              </div>
            </div>
          )}
        </section>

        {cargando ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,39,66,0.05)]">
            <p className="text-sm font-semibold text-slate-500">Cargando informe...</p>
          </section>
        ) : (
          <>
            {/* INFORME PRINCIPAL */}
            <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,39,66,0.05)]">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09A9A3]">Vista del informe</p>
                <h2 className="mt-1 text-lg font-bold text-[#17324D]">
                  {tipoInforme === "iql"
                    ? "Detalle de la liquidación"
                    : tipoInforme === "economico"
                    ? "Resumen económico del mes"
                    : "Cobros pendientes"}
                </h2>
              </div>
              <div className="p-4 sm:p-5">
                {tipoInforme === "iql" ? (
                  <InformeIQL
                    mes={mes}
                    clasesParaClub={clasesParaClub}
                    clasesPropiasIQL={clasesPropiasIQL}
                    totalClub={totalClub}
                    totalAlquiler={totalAlquiler}
                    saldoIQL={saldoIQL}
                    totalHorasClub={totalHorasClub}
                    totalHorasPropias={totalHorasPropias}
                  />
                ) : tipoInforme === "economico" ? (
                  <InformeEconomico
                    clasesRealizadas={clasesRealizadas.length}
                    totalHoras={totalHoras}
                    ingresosGenerados={ingresosGenerados}
                    totalPendiente={totalPendiente}
                    ingresosClubGeneral={ingresosClubGeneral}
                    gastosPistaGeneral={gastosPistaGeneral}
                  />
                ) : (
                  <InformePendientes
                    pagosPendientes={pagosPendientes}
                    totalPendiente={totalPendiente}
                  />
                )}
              </div>
            </section>

            {tipoInforme === "economico" && (
              <>
                <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09A9A3]">Indicadores</p>
                    <h2 className="mt-1 text-lg font-bold text-[#17324D]">Radiografía del mes</h2>
                  </div>
                  <PanelEstadisticas
                    ingresos={ingresosGenerados}
                    gastos={gastosPistaGeneral}
                    resultado={resultadoPeriodo}
                    clases={clasesRealizadas.length}
                    horas={totalHoras}
                    ingresoMedio={ingresoMedio}
                    alumnosDistintos={alumnosDistintos}
                    mediaAlumnosClase={mediaAlumnosClase}
                    clasesClub={numeroClasesClub}
                    clasesPropiasPago={numeroClasesPropiasPago}
                    clasesPrivadas={numeroClasesPrivadas}
                    ingresoMedioHora={ingresoMedioHora}
                    variacionIngresos={variacionIngresos}
                    variacionGastos={variacionGastos}
                    variacionResultado={variacionResultado}
                    variacionClases={variacionClases}
                    variacionHoras={variacionHoras}
                  />
                </section>

                <section className="rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,39,66,0.05)]">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09A9A3]">Comprobación económica</p>
                    <h2 className="mt-1 text-lg font-bold text-[#17324D]">Origen de ingresos y resultado</h2>
                  </div>
                  <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Clases para club", ingresosClasesClub, "text-orange-600"],
                      ["Propias · pista de pago", ingresosClasesPropiasPago, "text-[#078B86]"],
                      ["Propias · pista privada", ingresosClasesPrivadas, "text-teal-600"],
                      ["Ingresos extra", ingresosExtraGeneral, "text-violet-700"],
                    ].map(([etiqueta, valor, color]) => (
                      <div key={String(etiqueta)} className="bg-white p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{etiqueta as string}</p>
                        <p className={`mt-2 text-2xl font-bold ${color as string}`}>{Number(valor).toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 border-t border-slate-100 p-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm font-bold text-[#17324D]">Ingresos propios</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Pago normal</span><strong className="text-[#17324D]">{ingresosPagoNormalGenerado.toFixed(2)} €</strong></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Bonos consumidos</span><strong className="text-[#17324D]">{ingresosPorBonoConsumido.toFixed(2)} €</strong></div>
                        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3"><span className="font-bold text-slate-700">Total clases propias</span><strong className="text-[#078B86]">{(ingresosClasesPropiasPago + ingresosClasesPrivadas).toFixed(2)} €</strong></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm font-bold text-[#17324D]">Resultado del periodo</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Ingresos generados</span><strong className="text-emerald-700">{ingresosGenerados.toFixed(2)} €</strong></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Costes de pista</span><strong className="text-rose-600">- {gastosPistaGeneral.toFixed(2)} €</strong></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Pendiente de cobro</span><strong className="text-amber-700">{totalPendiente.toFixed(2)} €</strong></div>
                        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3"><span className="font-bold text-[#17324D]">Resultado neto</span><strong className={resultadoPeriodo >= 0 ? "text-lg text-emerald-700" : "text-lg text-rose-600"}>{resultadoPeriodo.toFixed(2)} €</strong></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,39,66,0.05)]">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09A9A3]">Evolución del mes</p>
                    <h2 className="mt-1 text-lg font-bold text-[#17324D]">Acumulado diario</h2>
                  </div>
                  {acumuladoDiario.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-slate-500">No hay clases realizadas ni canceladas en este mes.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1500px]">
                        <thead className="bg-[#F7F9FB]">
                          <tr className="text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            <th className="px-5 py-4">Día</th><th className="px-3 py-4 text-center">Realizadas</th><th className="px-3 py-4 text-center">Canceladas</th><th className="px-3 py-4 text-center">Horas</th><th className="px-3 py-4 text-center">Ingresos</th><th className="px-3 py-4 text-center">Club generado</th><th className="px-3 py-4 text-center">Pistas pagadas</th><th className="px-3 py-4 text-center">Saldo club</th><th className="px-3 py-4 text-center">Club cobrado</th><th className="px-3 py-4 text-center">Extra</th><th className="px-3 py-4 text-center">Gastos</th><th className="px-3 py-4 text-center">Resultado</th><th className="px-5 py-4 text-center">Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {acumuladoDiario.map((dia) => {
                            const [anio, numeroMes, numeroDia] = dia.fecha.split("-");
                            return (
                              <tr key={dia.fecha} className="text-sm text-slate-600 transition hover:bg-slate-50/70">
                                <td className="px-5 py-4 font-bold text-[#17324D]">{numeroDia}/{numeroMes}/{anio}</td>
                                <td className="px-3 py-4 text-center">{dia.clases}</td>
                                <td className="px-3 py-4 text-center font-semibold text-rose-600">{dia.canceladas}</td>
                                <td className="px-3 py-4 text-center">{dia.horas.toFixed(1)}</td>
                                <td className="px-3 py-4 text-center font-semibold text-[#17324D]">{dia.ingresos.toFixed(2)} €</td>
                                <td className="px-3 py-4 text-center font-semibold text-blue-700">{dia.clubGenerado.toFixed(2)} €</td>
                                <td className="px-3 py-4 text-center font-semibold text-rose-600">{dia.pistasPagadasClub.toFixed(2)} €</td>
                                <td className={dia.saldoClub >= 0 ? "px-3 py-4 text-center font-bold text-[#078B86]" : "px-3 py-4 text-center font-bold text-rose-600"}>{dia.saldoClub.toFixed(2)} €</td>
                                <td className="px-3 py-4 text-center font-semibold text-emerald-700">{dia.clubCobrado.toFixed(2)} €</td>
                                <td className="px-3 py-4 text-center font-semibold text-violet-700">{dia.ingresoExtra.toFixed(2)} €</td>
                                <td className="px-3 py-4 text-center text-rose-600">{dia.gastos.toFixed(2)} €</td>
                                <td className={dia.resultado >= 0 ? "px-3 py-4 text-center font-bold text-emerald-700" : "px-3 py-4 text-center font-bold text-rose-600"}>{dia.resultado.toFixed(2)} €</td>
                                <td className={dia.acumulado >= 0 ? "px-5 py-4 text-center font-bold text-[#09A9A3]" : "px-5 py-4 text-center font-bold text-rose-600"}>{dia.acumulado.toFixed(2)} €</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-[#F7F9FB]">
                          <tr className="font-bold text-[#17324D]">
                            <td className="px-5 py-4">TOTAL MES</td><td className="px-3 py-4 text-center">{clasesRealizadas.length}</td><td className="px-3 py-4 text-center text-rose-600">{totalCanceladas}</td><td className="px-3 py-4 text-center">{totalHoras.toFixed(1)}</td><td className="px-3 py-4 text-center">{ingresosGenerados.toFixed(2)} €</td><td className="px-3 py-4 text-center text-blue-700">{totalClubGenerado.toFixed(2)} €</td><td className="px-3 py-4 text-center text-rose-600">{totalPistasPagadasClub.toFixed(2)} €</td><td className={totalSaldoClub >= 0 ? "px-3 py-4 text-center text-[#078B86]" : "px-3 py-4 text-center text-rose-600"}>{totalSaldoClub.toFixed(2)} €</td><td className="px-3 py-4 text-center text-emerald-700">{totalClubCobrado.toFixed(2)} €</td><td className="px-3 py-4 text-center text-violet-700">{ingresosExtraGeneral.toFixed(2)} €</td><td className="px-3 py-4 text-center">{gastosPistaGeneral.toFixed(2)} €</td><td className="px-3 py-4 text-center">{resultadoPeriodo.toFixed(2)} €</td><td className="px-5 py-4 text-center text-[#09A9A3]">{resultadoPeriodo.toFixed(2)} €</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </section>

                <div className="grid gap-5 xl:grid-cols-2">
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5"><GraficoEvolucion datos={evolucionMensual} /></section>
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5"><GraficoActividad datos={evolucionMensual} /></section>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5"><ResumenAlumnos datos={datosResumenAlumnos} /></section>
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,66,0.05)] sm:p-5"><RankingAlumnos datos={datosResumenAlumnos} /></section>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
