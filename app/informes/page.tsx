"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";


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

function formatearFechaInforme(
  valor: string
) {
  if (!valor) {
    return "—";
  }

  const [anio, mes, dia] =
    valor.split("-");

  return `${dia}/${mes}/${anio}`;
}

function fechaLocalISOInforme(
  fecha: Date
) {
  const anio =
    fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearMesInforme(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
  }

  const [anio, mes] =
    valor
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      anio,
      mes - 1,
      1
    )
  );
}

function textoMetodoInforme(
  valor: string
) {
  const textos:
    Record<string, string> = {
      efectivo: "Efectivo",
      bizum: "Bizum",
      transferencia:
        "Transferencia",
      tarjeta: "Tarjeta",
    };

  return textos[valor] ||
    valor ||
    "Sin método";
}

function SelectorMesInformes({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const [
    anioSelector,
    setAnioSelector,
  ] = useState(
    valor
      ? Number(
          valor.slice(0, 4)
        )
      : new Date().getFullYear()
  );

  const meses = [
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

  const mesActivo =
    valor
      ? Number(
          valor.slice(5, 7)
        )
      : 0;

  return (
    <div className="relative">
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
        Mes
      </label>

      <button
        type="button"
        onClick={() => {
          if (valor) {
            setAnioSelector(
              Number(
                valor.slice(
                  0,
                  4
                )
              )
            );
          }

          setAbierto(
            (actual) =>
              !actual
          );
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold capitalize text-white transition hover:bg-white/15"
      >
        <span className="truncate">
          {formatearMesInforme(
            valor
          )}
        </span>

        <span className="text-white/45">
          ⌄
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de mes"
            onClick={() =>
              setAbierto(false)
            }
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-[62px] z-50 w-[310px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setAnioSelector(
                    (anio) =>
                      anio - 1
                  )
                }
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
              >
                ‹
              </button>

              <p className="text-sm font-bold text-[#17324D]">
                {anioSelector}
              </p>

              <button
                type="button"
                onClick={() =>
                  setAnioSelector(
                    (anio) =>
                      anio + 1
                  )
                }
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {meses.map(
                (
                  nombreMes,
                  indice
                ) => {
                  const numeroMes =
                    indice + 1;

                  const seleccionado =
                    Number(
                      valor.slice(
                        0,
                        4
                      )
                    ) ===
                      anioSelector &&
                    mesActivo ===
                      numeroMes;

                  return (
                    <button
                      key={
                        nombreMes
                      }
                      type="button"
                      onClick={() => {
                        onChange(
                          `${anioSelector}-${String(
                            numeroMes
                          ).padStart(
                            2,
                            "0"
                          )}`
                        );

                        setAbierto(
                          false
                        );
                      }}
                      className={
                        seleccionado
                          ? "h-9 rounded-lg bg-[#17324D] px-2 text-[11px] font-bold text-white"
                          : "h-9 rounded-lg px-2 text-[11px] font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                      }
                    >
                      {nombreMes.slice(
                        0,
                        3
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IconoInforme({
  nombre,
  className = "h-5 w-5",
}: {
  nombre:
    | "informe"
    | "pdf"
    | "economia"
    | "actividad"
    | "club"
    | "pendiente"
    | "alumnos"
    | "evolucion";
  className?: string;
}) {
  const comunes = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (nombre === "pdf") {
    return (
      <svg {...comunes}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    );
  }

  if (nombre === "economia") {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="8" />
        <path d="M14.7 8.4c-.7-.6-1.6-.9-2.6-.9-1.6 0-2.8.8-2.8 2s1.1 1.7 2.8 2c1.8.3 2.9.9 2.9 2.2 0 1.2-1.2 2.1-2.9 2.1-1.1 0-2.2-.4-3-1.1M12 5.8v12.4" />
      </svg>
    );
  }

  if (nombre === "actividad") {
    return (
      <svg {...comunes}>
        <path d="M4 18.5V12M9.5 18.5V7M15 18.5V10M20 18.5V4.5" />
        <path d="M3 18.5h18" />
      </svg>
    );
  }

  if (nombre === "club") {
    return (
      <svg {...comunes}>
        <path d="M4 8h16l-2-4H6L4 8Z" />
        <path d="M5 8v11h14V8M9 19v-6h6v6" />
      </svg>
    );
  }

  if (nombre === "pendiente") {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5v5l3 1.8" />
      </svg>
    );
  }

  if (nombre === "alumnos") {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
      </svg>
    );
  }

  if (nombre === "evolucion") {
    return (
      <svg {...comunes}>
        <path d="M4 18V6M4 18h16" />
        <path d="m7 14 4-4 3 2 5-6" />
      </svg>
    );
  }

  return (
    <svg {...comunes}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

type ClaseEconomicaNoClub = {
  modo_cobro?: "por_alumno" | "total" | string | null;
  importe_total?: number | null;
  clase_alumnos?: {
    importe?: number | null;
  }[];
};

function ingresoClaseNoClub(
  clase: ClaseEconomicaNoClub
) {
  if (
    clase.modo_cobro ===
    "total"
  ) {
    return Number(
      clase.importe_total || 0
    );
  }

  return (
    clase.clase_alumnos || []
  ).reduce(
    (subtotal, participante) =>
      subtotal +
      Number(
        participante.importe || 0
      ),
    0
  );
}

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
      "economico"
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
          facturable,
          cobrada,
          importe_club,
          coste_pista,
          ingreso_extra,
          modo_cobro,
          importe_total,

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

          clases (
            id,
            fecha,
            hora_inicio,
            modo_cobro,
            importe_total,
            clase_alumnos (
              alumnos (
                nombre,
                apellidos
              )
            )
          ),

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
      modo_cobro,
      importe_total,

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
      modo_cobro,
      importe_total,

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
          ingresoClaseNoClub(
            clase
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
        ingresoClaseNoClub(
          clase
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
          ingresoClaseNoClub(
            clase
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
        ingresoClaseNoClub(
          clase
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
        ingresoClaseNoClub(
          clase
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
    (total, clase) => {
      if (clase.tipo === "club") {
        return total;
      }

      if (
        clase.modo_cobro ===
        "total"
      ) {
        return (
          total +
          Number(
            clase.importe_total || 0
          )
        );
      }

      return (
        total +
        (
          clase.clase_alumnos ||
          []
        )
          .filter(
            (participante) =>
              !participante.usa_bono
          )
          .reduce(
            (subtotal, participante) =>
              subtotal +
              Number(
                participante.importe || 0
              ),
            0
          )
      );
    },
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
              clase.tipo !== "club" &&
              clase.modo_cobro !==
                "total"
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
const hoyLocalInforme =
  fechaLocalISOInforme(
    new Date()
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
        (
          clase.estado === "realizada" ||
          clase.estado === "cancelada"
        ) &&
        clase.fecha <=
          hoyLocalInforme
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
          : ingresoClaseNoClub(
              clase
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
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA V2 */}
        <section className="overflow-visible rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,1fr)_minmax(690px,1.3fr)] xl:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Análisis
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Informes
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
                Analiza actividad, economía, relación con IQL y cobros pendientes del periodo seleccionado.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Ingresos
                </p>
                <p className="mt-1 whitespace-nowrap text-lg font-bold text-white sm:text-xl">
                  {ingresosGenerados.toFixed(2)} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Generados
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200/80">
                  Resultado
                </p>
                <p className="mt-1 whitespace-nowrap text-lg font-bold text-white sm:text-xl">
                  {resultadoPeriodo.toFixed(2)} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Neto generado
                </p>
              </div>

              <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80">
                  Pendiente
                </p>
                <p className="mt-1 whitespace-nowrap text-lg font-bold text-white sm:text-xl">
                  {totalPendiente.toFixed(2)} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Por cobrar
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Actividad
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-xl">
                  {clasesRealizadas.length}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Clases · {totalHoras.toFixed(1)} h
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 xl:grid-cols-[minmax(520px,1fr)_230px_190px] xl:items-end">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                Informe
              </label>

              <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTipoInforme("economico");
                    setMensaje("");
                  }}
                  className={
                    tipoInforme === "economico"
                      ? "h-10 rounded-lg bg-[#00A79C] px-3 text-[11px] font-bold text-white shadow-sm"
                      : "h-10 rounded-lg px-3 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  <span className="sm:hidden">
                    Mensual
                  </span>
                  <span className="hidden sm:inline">
                    Mensual completo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoInforme("iql");
                    setMensaje("");
                  }}
                  className={
                    tipoInforme === "iql"
                      ? "h-10 rounded-lg bg-[#00A79C] px-3 text-[11px] font-bold text-white shadow-sm"
                      : "h-10 rounded-lg px-3 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  IQL
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoInforme("pendientes");
                    setMensaje("");
                  }}
                  className={
                    tipoInforme === "pendientes"
                      ? "h-10 rounded-lg bg-[#00A79C] px-3 text-[11px] font-bold text-white shadow-sm"
                      : "h-10 rounded-lg px-3 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  Pendientes
                </button>
              </div>
            </div>

            <SelectorMesInformes
              valor={mes}
              onChange={(valor) => {
                setMes(valor);
                setMensaje("");
              }}
            />

            <button
              type="button"
              onClick={generarPDF}
              disabled={
                cargando ||
                generando
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-50 xl:h-10 xl:w-auto"
            >
              <IconoInforme
                nombre="pdf"
                className="h-4 w-4"
              />
              {generando
                ? "Generando..."
                : "Generar PDF"}
            </button>
          </div>
        </section>

        {mensaje && (
          <section
            className={
              mensaje.startsWith("✅")
                ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                : "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {mensaje}
          </section>
        )}

        {cargando ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <p className="text-sm font-semibold text-slate-500">
              Cargando informe...
            </p>
          </section>
        ) : tipoInforme === "iql" ? (
          <>
            {/* IQL */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="bg-[#0F2742] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <IconoInforme nombre="club" />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                      Liquidación mensual
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold">
                      IQL · {formatearMesInforme(mes)}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-white/55">
                      Clases impartidas para el club y pistas utilizadas para clases propias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
                <div className="bg-white p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    IQL debe abonar
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#008F86]">
                    {totalClub.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {clasesParaClub.length} clases · {totalHorasClub.toFixed(1)} h
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Pistas a pagar
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {totalAlquiler.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {clasesPropiasIQL.length} clases · {totalHorasPropias.toFixed(1)} h
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Saldo IQL
                  </p>
                  <p
                    className={
                      saldoIQL >= 0
                        ? "mt-2 text-2xl font-bold text-[#008F86]"
                        : "mt-2 text-2xl font-bold text-red-600"
                    }
                  >
                    {saldoIQL.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Abonos - costes de pista
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Club cobrado
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {totalClubCobrado.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Según estado de cobro
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#00A79C]">
                      Ingreso
                    </p>
                    <h3 className="mt-0.5 font-bold text-[#17324D]">
                      Clases para IQL
                    </h3>
                  </div>

                  <span className="rounded-full bg-[#E8F7F5] px-3 py-1.5 text-xs font-bold text-[#008F86]">
                    {totalClub.toFixed(2)} €
                  </span>
                </div>

                {clasesParaClub.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No hay clases para IQL en este mes.
                  </div>
                ) : (
                  <>
                    {/* MÓVIL · FICHAS */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {clasesParaClub.map(
                        (clase) => (
                          <article
                            key={clase.id}
                            className="flex items-center justify-between gap-3 px-4 py-3.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#17324D]">
                                {formatearFechaInforme(clase.fecha)}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                {clase.hora_inicio.slice(0, 5)} · {clase.duracion_minutos} min
                              </p>
                            </div>

                            <strong className="shrink-0 text-sm text-[#008F86]">
                              {Number(clase.importe_club || 0).toFixed(2)} €
                            </strong>
                          </article>
                        )
                      )}
                    </div>

                    {/* TABLET / PC · TABLA APROBADA */}
                    <div className="hidden max-h-[480px] overflow-auto md:block">
                      <table className="w-full">
                      <thead className="sticky top-0 bg-[#0F2742] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Horario
                          </th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Importe
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {clasesParaClub.map(
                          (clase) => (
                            <tr
                              key={clase.id}
                              className="text-sm"
                            >
                              <td className="px-4 py-3 font-semibold text-[#17324D]">
                                {formatearFechaInforme(clase.fecha)}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {clase.hora_inicio.slice(0, 5)} · {clase.duracion_minutos} min
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-[#008F86]">
                                {Number(clase.importe_club || 0).toFixed(2)} €
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-500">
                      Coste
                    </p>
                    <h3 className="mt-0.5 font-bold text-[#17324D]">
                      Clases propias en IQL
                    </h3>
                  </div>

                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                    {totalAlquiler.toFixed(2)} €
                  </span>
                </div>

                {clasesPropiasIQL.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No hay clases propias en IQL en este mes.
                  </div>
                ) : (
                  <>
                    {/* MÓVIL · FICHAS */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {clasesPropiasIQL.map(
                        (clase) => (
                          <article
                            key={clase.id}
                            className="flex items-center justify-between gap-3 px-4 py-3.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#17324D]">
                                {formatearFechaInforme(clase.fecha)}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                {clase.hora_inicio.slice(0, 5)} · {clase.duracion_minutos} min
                              </p>
                            </div>

                            <strong className="shrink-0 text-sm text-red-600">
                              {Number(clase.coste_pista || 0).toFixed(2)} €
                            </strong>
                          </article>
                        )
                      )}
                    </div>

                    {/* TABLET / PC · TABLA APROBADA */}
                    <div className="hidden max-h-[480px] overflow-auto md:block">
                      <table className="w-full">
                      <thead className="sticky top-0 bg-[#0F2742] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Horario
                          </th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Pista
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {clasesPropiasIQL.map(
                          (clase) => (
                            <tr
                              key={clase.id}
                              className="text-sm"
                            >
                              <td className="px-4 py-3 font-semibold text-[#17324D]">
                                {formatearFechaInforme(clase.fecha)}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {clase.hora_inicio.slice(0, 5)} · {clase.duracion_minutos} min
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-red-600">
                                {Number(clase.coste_pista || 0).toFixed(2)} €
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        ) : tipoInforme === "economico" ? (
          <>
            {/* INFORME MENSUAL COMPLETO */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="bg-[#0F2742] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <IconoInforme nombre="economia" />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                      Economía
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold">
                      Resumen mensual · {formatearMesInforme(mes)}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-white/55">
                      Actividad realizada y resultado económico generado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Clases realizadas", String(clasesRealizadas.length), `${variacionClases >= 0 ? "+" : ""}${variacionClases.toFixed(1)}% vs mes anterior`],
                  ["Horas", totalHoras.toFixed(1), `${variacionHoras >= 0 ? "+" : ""}${variacionHoras.toFixed(1)}% vs mes anterior`],
                  ["Ingresos", `${ingresosGenerados.toFixed(2)} €`, `${variacionIngresos >= 0 ? "+" : ""}${variacionIngresos.toFixed(1)}% vs mes anterior`],
                  ["Gastos", `${gastosPistaGeneral.toFixed(2)} €`, `${variacionGastos >= 0 ? "+" : ""}${variacionGastos.toFixed(1)}% vs mes anterior`],
                  ["Resultado", `${resultadoPeriodo.toFixed(2)} €`, `${variacionResultado >= 0 ? "+" : ""}${variacionResultado.toFixed(1)}% vs mes anterior`],
                  ["Ingreso / hora", `${ingresoMedioHora.toFixed(2)} €`, `${ingresoMedio.toFixed(2)} € / clase`],
                ].map(
                  ([titulo, valor, detalle]) => (
                    <div
                      key={titulo}
                      className="bg-white p-4"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        {titulo}
                      </p>
                      <p className="mt-1.5 text-xl font-bold text-[#17324D]">
                        {valor}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        {detalle}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="bg-[#0F2742] px-5 py-4 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Desglose
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold">
                    Cómo se generan los ingresos
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-200">
                  <div className="bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Clases para club
                    </p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                      {ingresosClasesClub.toFixed(2)} €
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Propias · pista de pago
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#008F86]">
                      {ingresosClasesPropiasPago.toFixed(2)} €
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Propias · pista privada
                    </p>
                    <p className="mt-2 text-2xl font-bold text-violet-600">
                      {ingresosClasesPrivadas.toFixed(2)} €
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Ingresos extra
                    </p>
                    <p className="mt-2 text-2xl font-bold text-purple-700">
                      {ingresosExtraGeneral.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 sm:gap-4 sm:p-5">
                  <div className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Pago normal generado
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#17324D]">
                      {ingresosPagoNormalGenerado.toFixed(2)} €
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-[#FBFCFD] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Valor consumido de bonos
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#17324D]">
                      {ingresosPorBonoConsumido.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div
                  className={
                    Math.abs(diferenciaComprobacion) < 0.01
                      ? "border-t border-emerald-200 bg-emerald-50 px-5 py-3"
                      : "border-t border-red-200 bg-red-50 px-5 py-3"
                  }
                >
                  <p
                    className={
                      Math.abs(diferenciaComprobacion) < 0.01
                        ? "text-xs font-bold text-emerald-700"
                        : "text-xs font-bold text-red-700"
                    }
                  >
                    {Math.abs(diferenciaComprobacion) < 0.01
                      ? "✓ El desglose coincide con el total de ingresos generados."
                      : `⚠️ Diferencia interna de ${diferenciaComprobacion.toFixed(2)} €.`}
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="bg-[#0F2742] px-5 py-4 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Relación con club
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold">
                    IQL en el periodo
                  </h3>
                </div>

                <div className="space-y-3 p-5">
                  {[
                    ["Club generado", totalClubGenerado, "text-sky-700"],
                    ["Pistas pagadas", totalPistasPagadasClub, "text-red-600"],
                    ["Saldo club", totalSaldoClub, totalSaldoClub >= 0 ? "text-[#008F86]" : "text-red-600"],
                    ["Club cobrado", totalClubCobrado, "text-emerald-700"],
                    ["Pendiente total", totalPendiente, "text-red-600"],
                  ].map(
                    ([titulo, valor, clase]) => (
                      <div
                        key={String(titulo)}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#FBFCFD] px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-slate-500">
                          {String(titulo)}
                        </span>
                        <strong className={`text-base ${String(clase)}`}>
                          {Number(valor).toFixed(2)} €
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            {/* ACUMULADO DIARIO */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="flex flex-col gap-3 bg-[#0F2742] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <IconoInforme nombre="evolucion" />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                      Evolución del mes
                    </p>
                    <h3 className="mt-0.5 text-lg font-bold">
                      Acumulado diario
                    </h3>
                  </div>
                </div>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                  {acumuladoDiario.length} días con actividad
                </span>
              </div>

              {acumuladoDiario.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No hay clases realizadas ni canceladas en este mes.
                </div>
              ) : (
                <>
                  {/* MÓVIL · RESUMEN DIARIO EN FICHAS */}
                  <div className="space-y-2.5 p-3 md:hidden">
                    {acumuladoDiario.map(
                      (dia) => (
                        <article
                          key={dia.fecha}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-3.5 py-3">
                            <div>
                              <p className="text-sm font-bold text-[#17324D]">
                                {formatearFechaInforme(dia.fecha)}
                              </p>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {dia.clases} realizadas · {dia.canceladas} canceladas · {dia.horas.toFixed(1)} h
                              </p>
                            </div>

                            <div className="text-right">
                              <p
                                className={
                                  dia.resultado >= 0
                                    ? "text-sm font-bold text-emerald-700"
                                    : "text-sm font-bold text-red-600"
                                }
                              >
                                {dia.resultado.toFixed(2)} €
                              </p>
                              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                resultado
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-px bg-slate-100">
                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Ingresos
                              </p>
                              <p className="mt-1 text-xs font-bold text-[#17324D]">
                                {dia.ingresos.toFixed(2)} €
                              </p>
                            </div>

                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Gastos
                              </p>
                              <p className="mt-1 text-xs font-bold text-red-600">
                                {dia.gastos.toFixed(2)} €
                              </p>
                            </div>

                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Saldo club
                              </p>
                              <p
                                className={
                                  dia.saldoClub >= 0
                                    ? "mt-1 text-xs font-bold text-[#008F86]"
                                    : "mt-1 text-xs font-bold text-red-600"
                                }
                              >
                                {dia.saldoClub.toFixed(2)} €
                              </p>
                            </div>

                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Acumulado
                              </p>
                              <p
                                className={
                                  dia.acumulado >= 0
                                    ? "mt-1 text-xs font-bold text-[#008F86]"
                                    : "mt-1 text-xs font-bold text-red-600"
                                }
                              >
                                {dia.acumulado.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </article>
                      )
                    )}

                    <div className="rounded-xl bg-[#0F2742] px-3.5 py-3 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#4DD4CA]">
                            Total mes
                          </p>
                          <p className="mt-1 text-xs text-white/55">
                            {clasesRealizadas.length} clases · {totalHoras.toFixed(1)} h
                          </p>
                        </div>

                        <strong
                          className={
                            resultadoPeriodo >= 0
                              ? "text-base text-[#85E6DF]"
                              : "text-base text-red-200"
                          }
                        >
                          {resultadoPeriodo.toFixed(2)} €
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* TABLET / PC · TABLA APROBADA */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1180px] table-fixed">
                    <thead className="bg-[#FBFCFD]">
                      <tr className="text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-3">Día</th>
                        <th className="px-2 py-3 text-center">Realizadas</th>
                        <th className="px-2 py-3 text-center">Canceladas</th>
                        <th className="px-2 py-3 text-center">Horas</th>
                        <th className="px-2 py-3 text-center">Ingresos</th>
                        <th className="px-2 py-3 text-center">Club generado</th>
                        <th className="px-2 py-3 text-center">Pistas</th>
                        <th className="px-2 py-3 text-center">Saldo club</th>
                        <th className="px-2 py-3 text-center">Club cobrado</th>
                        <th className="px-2 py-3 text-center">Extra</th>
                        <th className="px-2 py-3 text-center">Gastos</th>
                        <th className="px-2 py-3 text-center">Resultado</th>
                        <th className="px-3 py-3 text-center">Acumulado</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {acumuladoDiario.map(
                        (dia) => (
                          <tr
                            key={dia.fecha}
                            className="text-[11px] text-slate-600"
                          >
                            <td className="px-3 py-3 font-bold text-[#17324D]">
                              {formatearFechaInforme(dia.fecha)}
                            </td>
                            <td className="px-2 py-3 text-center">{dia.clases}</td>
                            <td className="px-2 py-3 text-center">
                              <span className="font-bold text-red-600">
                                {dia.canceladas}
                              </span>
                              {dia.canceladas > 0 && (
                                <span className="ml-1 text-[9px] text-slate-400">
                                  ({dia.canceladasFacturables} fact.)
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-center">{dia.horas.toFixed(1)}</td>
                            <td className="px-2 py-3 text-center font-semibold text-[#17324D]">{dia.ingresos.toFixed(2)} €</td>
                            <td className="px-2 py-3 text-center font-semibold text-sky-700">{dia.clubGenerado.toFixed(2)} €</td>
                            <td className="px-2 py-3 text-center font-semibold text-red-600">{dia.pistasPagadasClub.toFixed(2)} €</td>
                            <td className={dia.saldoClub >= 0 ? "px-2 py-3 text-center font-bold text-[#008F86]" : "px-2 py-3 text-center font-bold text-red-600"}>{dia.saldoClub.toFixed(2)} €</td>
                            <td className="px-2 py-3 text-center font-semibold text-emerald-700">{dia.clubCobrado.toFixed(2)} €</td>
                            <td className="px-2 py-3 text-center font-semibold text-violet-700">{dia.ingresoExtra.toFixed(2)} €</td>
                            <td className="px-2 py-3 text-center text-red-600">{dia.gastos.toFixed(2)} €</td>
                            <td className={dia.resultado >= 0 ? "px-2 py-3 text-center font-bold text-emerald-700" : "px-2 py-3 text-center font-bold text-red-600"}>{dia.resultado.toFixed(2)} €</td>
                            <td className={dia.acumulado >= 0 ? "px-3 py-3 text-center text-sm font-bold text-[#008F86]" : "px-3 py-3 text-center text-sm font-bold text-red-600"}>{dia.acumulado.toFixed(2)} €</td>
                          </tr>
                        )
                      )}
                    </tbody>

                    <tfoot className="border-t-2 border-slate-200 bg-[#F8FAFC]">
                      <tr className="text-[11px] font-bold text-[#17324D]">
                        <td className="px-3 py-3">TOTAL MES</td>
                        <td className="px-2 py-3 text-center">{clasesRealizadas.length}</td>
                        <td className="px-2 py-3 text-center text-red-600">
                          {totalCanceladas}
                          {totalCanceladas > 0 && (
                            <span className="ml-1 text-[9px] text-slate-400">
                              ({totalCanceladasFacturables} fact.)
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">{totalHoras.toFixed(1)}</td>
                        <td className="px-2 py-3 text-center">{ingresosGenerados.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center text-sky-700">{totalClubGenerado.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center text-red-600">{totalPistasPagadasClub.toFixed(2)} €</td>
                        <td className={totalSaldoClub >= 0 ? "px-2 py-3 text-center text-[#008F86]" : "px-2 py-3 text-center text-red-600"}>{totalSaldoClub.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center text-emerald-700">{totalClubCobrado.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center text-violet-700">{ingresosExtraGeneral.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center">{gastosPistaGeneral.toFixed(2)} €</td>
                        <td className="px-2 py-3 text-center">{resultadoPeriodo.toFixed(2)} €</td>
                        <td className={resultadoPeriodo >= 0 ? "px-3 py-3 text-center text-[#008F86]" : "px-3 py-3 text-center text-red-600"}>{resultadoPeriodo.toFixed(2)} €</td>
                      </tr>
                    </tfoot>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* EVOLUCIÓN 6 MESES */}
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="bg-[#0F2742] px-5 py-4 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Tendencia
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold">
                    Evolución económica · 6 meses
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {evolucionMensual.map(
                    (dato) => {
                      const maximo = Math.max(
                        1,
                        ...evolucionMensual.map(
                          (item) =>
                            Math.max(
                              item.ingresos,
                              Math.abs(item.resultado)
                            )
                        )
                      );

                      return (
                        <div
                          key={dato.mes}
                          className="grid grid-cols-[78px_minmax(0,1fr)_92px] items-center gap-2.5 px-4 py-3 sm:grid-cols-[100px_minmax(0,1fr)_110px] sm:gap-3 sm:px-5"
                        >
                          <p className="text-xs font-bold capitalize text-[#17324D]">
                            {dato.mes}
                          </p>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#00A79C]"
                              style={{
                                width: `${Math.max(
                                  4,
                                  (dato.ingresos / maximo) * 100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-[#17324D]">
                              {dato.ingresos.toFixed(2)} €
                            </p>
                            <p className={dato.resultado >= 0 ? "mt-0.5 text-[10px] font-semibold text-emerald-700" : "mt-0.5 text-[10px] font-semibold text-red-600"}>
                              {dato.resultado.toFixed(2)} € neto
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="bg-[#0F2742] px-5 py-4 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Actividad
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold">
                    Clases y horas · 6 meses
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {evolucionMensual.map(
                    (dato) => (
                      <div
                        key={dato.mes}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-6 px-5 py-3"
                      >
                        <p className="text-xs font-bold capitalize text-[#17324D]">
                          {dato.mes}
                        </p>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#17324D]">
                            {dato.clases}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            clases
                          </p>
                        </div>
                        <div className="min-w-[70px] text-right">
                          <p className="text-xs font-bold text-[#17324D]">
                            {dato.horas.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            horas
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            {/* ALUMNOS */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex flex-col gap-3 bg-[#0F2742] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                      <IconoInforme nombre="alumnos" />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                        Alumnos
                      </p>
                      <h3 className="mt-0.5 text-lg font-bold">
                        Actividad por alumno
                      </h3>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                    {alumnosDistintos} alumnos
                  </span>
                </div>

                {datosResumenAlumnos.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No hay datos de alumnos para este mes.
                  </div>
                ) : (
                  <>
                    {/* MÓVIL · FICHAS DE ALUMNOS */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {datosResumenAlumnos
                        .slice()
                        .sort(
                          (a, b) =>
                            b.clases -
                            a.clases
                        )
                        .map(
                          (alumno) => (
                            <article
                              key={alumno.alumnoId}
                              className="px-4 py-3.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="min-w-0 truncate text-sm font-bold text-[#17324D]">
                                  {alumno.nombre}
                                </p>

                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-bold text-[#17324D]">
                                    {alumno.clases} clases
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                    {alumno.horas.toFixed(1)} h
                                  </p>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                    </div>

                    {/* TABLET / PC · TABLA APROBADA */}
                    <table className="hidden w-full md:table">
                      <thead className="bg-[#FBFCFD]">
                      <tr className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3 text-left">Alumno</th>
                        <th className="px-4 py-3 text-center">Clases</th>
                        <th className="px-4 py-3 text-center">Horas</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {datosResumenAlumnos
                        .slice()
                        .sort(
                          (a, b) =>
                            b.clases -
                            a.clases
                        )
                        .map(
                          (alumno) => (
                            <tr
                              key={alumno.alumnoId}
                              className="text-xs"
                            >
                              <td className="px-4 py-3 font-bold text-[#17324D]">
                                {alumno.nombre}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">
                                {alumno.clases}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">
                                {alumno.horas.toFixed(1)}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                    </table>
                  </>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="bg-[#0F2742] px-5 py-4 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Ranking
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold">
                    Más activos
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {datosResumenAlumnos
                    .slice()
                    .sort(
                      (a, b) =>
                        b.clases -
                        a.clases
                    )
                    .slice(0, 8)
                    .map(
                      (
                        alumno,
                        indice
                      ) => (
                        <div
                          key={alumno.alumnoId}
                          className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
                        >
                          <span className={indice < 3 ? "flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F7F5] text-xs font-bold text-[#008F86]" : "flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-400"}>
                            {indice + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#17324D]">
                              {alumno.nombre}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {alumno.horas.toFixed(1)} h
                            </p>
                          </div>

                          <strong className="text-sm text-[#17324D]">
                            {alumno.clases}
                          </strong>
                        </div>
                      )
                    )}

                  {datosResumenAlumnos.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      Sin datos.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <>
            {/* PENDIENTES */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="bg-[#0F2742] px-5 py-4 text-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-200">
                      <IconoInforme nombre="pendiente" />
                    </span>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                        Cobros
                      </p>
                      <h2 className="mt-0.5 text-lg font-bold">
                        Pendientes · {formatearMesInforme(mes)}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-white/55">
                        Pagos de alumnos y clases de club que siguen pendientes.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100">
                    {totalPendiente.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3">
                <div className="bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Alumnos
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {totalPendienteNormal.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pagosPendientes.length} cobros pendientes
                  </p>
                </div>

                <div className="bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Clubs
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {totalPendienteClub.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {clasesClubPendientes.length} clases pendientes
                  </p>
                </div>

                <div className="col-span-2 bg-white p-4 sm:col-span-1 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Total pendiente
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#17324D]">
                    {totalPendiente.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Total del periodo
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-500">
                      Alumnos
                    </p>
                    <h3 className="mt-0.5 font-bold text-[#17324D]">
                      Pagos pendientes
                    </h3>
                  </div>

                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                    {pagosPendientes.length}
                  </span>
                </div>

                {pagosPendientes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm font-semibold text-emerald-700">
                    ✓ No hay pagos de alumnos pendientes.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pagosPendientes.map(
                      (pago) => {
                        const nombre =
                          pago.alumnos
                            ? `${pago.alumnos.nombre || ""} ${pago.alumnos.apellidos || ""}`.trim()
                            : "Sin alumno";

                        return (
                          <article
                            key={pago.id}
                            className="flex items-center justify-between gap-4 px-5 py-3.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#17324D]">
                                {nombre}
                              </p>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {formatearFechaInforme(pago.fecha_pago)} · {textoMetodoInforme(pago.metodo)}
                              </p>
                            </div>

                            <strong className="shrink-0 text-sm text-red-600">
                              {Number(pago.importe || 0).toFixed(2)} €
                            </strong>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex items-center justify-between gap-3 bg-[#FBFCFD] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-500">
                      Clubs
                    </p>
                    <h3 className="mt-0.5 font-bold text-[#17324D]">
                      Clases pendientes de liquidación
                    </h3>
                  </div>

                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                    {clasesClubPendientes.length}
                  </span>
                </div>

                {clasesClubPendientes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm font-semibold text-emerald-700">
                    ✓ No hay clases de club pendientes.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {clasesClubPendientes.map(
                      (clase) => (
                        <article
                          key={clase.id}
                          className="flex items-center justify-between gap-4 px-5 py-3.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#17324D]">
                              {formatearFechaInforme(clase.fecha)} · {clase.hora_inicio.slice(0, 5)}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                              {clase.ubicaciones?.nombre || "Club"} · {clase.estado === "cancelada" ? "Cancelada facturable" : "Realizada"}
                            </p>
                          </div>

                          <strong className="shrink-0 text-sm text-red-600">
                            {Number(clase.importe_club || 0).toFixed(2)} €
                          </strong>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
