"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  borrarClaseDeGoogleCalendar,
  sincronizarClaseConGoogleCalendar,
} from "../../lib/googleCalendarClient";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  apodo: string | null;
  precio_habitual: number | null;
  ubicacion_habitual_id: string | null;
  procedencia: string | null;
  tipo_clase_habitual: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
  coste_pista: number | null;
};

type Grupo = {
  id: string;
  nombre: string;
  grupo_alumnos: {
    alumno_id: string;
  }[];
};

type Bono = {
  id: string;
  alumno_id: string;
  grupo_id: string | null;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  activo: boolean;
};

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
};

type ParticipanteClase = {
  alumno_id: string;
  importe: number;
  pagado: boolean;
  usa_bono: boolean;
  bono_id: string | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

type Clase = {
  id: string;
  serie_id: string | null;
  google_calendar_event_id: string | null;
  google_calendar_synced_at: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  ubicacion_id: string | null;
  grupo_id: string | null;
  importe_club: number;
  coste_pista: number;
  ingreso_extra: number;
  modo_cobro: "por_alumno" | "total" | string | null;
  importe_total: number | null;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  motivo_cancelacion: string | null;
  observaciones: string | null;

  ubicaciones: {
    nombre: string;
  } | null;

  clase_alumnos: ParticipanteClase[];
};

type PagoClase = {
  id: string;
  clase_id: string | null;
  alumno_id: string | null;
  importe: number;
  metodo: string;
  estado: string;
};

type Tarifa = {
  id: string;
  ubicacion_id: string | null;
  concepto: string;
  duracion_minutos: number;
  numero_alumnos: number;
  importe: number;
  activa: boolean;
  ubicaciones?: {
    nombre: string;
  } | null;
};

function estadoEconomicoClase(
  clase: Clase,
  pagos: PagoClase[]
) {
  if (clase.facturable === false) {
    return "no_facturable" as const;
  }

  if (clase.tipo === "club") {
    return clase.cobrada
      ? "cobrada" as const
      : "pendiente" as const;
  }

  if (clase.clase_alumnos.length === 0) {
    return "pendiente" as const;
  }

  const pagosNormales =
    clase.clase_alumnos.filter(
      (participante) =>
        !participante.usa_bono
    );

  if (
    clase.modo_cobro ===
      "total"
  ) {
    if (pagosNormales.length === 0) {
      return "cobrada" as const;
    }

    const pagoTotal =
      pagos.find(
        (item) =>
          item.clase_id === clase.id &&
          item.alumno_id === null
      );

    const totalPagado =
      pagoTotal?.estado === "pagado" ||
      pagosNormales.every(
        (participante) =>
          participante.pagado === true
      );

    return totalPagado
      ? "cobrada" as const
      : "pendiente" as const;
  }

  if (pagosNormales.length === 0) {
    return "cobrada" as const;
  }

  const todosPagados =
    pagosNormales.every(
      (participante) => {
        const pago =
          pagos.find(
            (item) =>
              item.clase_id === clase.id &&
              item.alumno_id === participante.alumno_id
          );

        return (
          pago?.estado === "pagado" ||
          participante.pagado === true
        );
      }
    );

  return todosPagados
    ? "cobrada" as const
    : "pendiente" as const;
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function IconoPersonas() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
      />
      <path d="M3 20c0-4 2.5-7 6-7s6 3 6 7" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14c2.5.5 4 2.5 4 5" />
    </svg>
  );
}

function IconoAlumno() {
  return (
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
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
    </svg>
  );
}

function IconoClase() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
      <path d="M8 21h8M8 8h8M8 12h5" />
    </svg>
  );
}


function IconoNota() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.75h8.5L19 8.25V20.25H6Z" />
      <path d="M14.5 3.75v4.5H19" />
      <path d="M9 12h6M9 15.5h4.5" />
    </svg>
  );
}

function formatearFechaControl(
  valor: string
) {
  if (!valor) {
    return "Seleccionar fecha";
  }

  const [anio, mes, dia] =
    valor.split("-").map(Number);

  const fecha =
    new Date(
      anio,
      mes - 1,
      dia
    );

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(fecha);
}

function formatearMesControl(
  valor: string
) {
  if (!valor) {
    return "Todos los meses";
  }

  const [anio, mes] =
    valor.split("-").map(Number);

  const fecha =
    new Date(
      anio,
      mes - 1,
      1
    );

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      month: "long",
      year: "numeric",
    }
  ).format(fecha);
}

function CampoFechaAgenda({
  etiqueta,
  valor,
  onChange,
  min,
  required = false,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  min?: string;
  required?: boolean;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  function abrirSelectorFecha() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <div className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {etiqueta}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={abrirSelectorFecha}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold capitalize text-[#17324D] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/10"
          aria-label={`Elegir ${etiqueta.toLowerCase()}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-[#00A79C]">
              <IconoCalendario />
            </span>
            <span className="truncate">
              {formatearFechaControl(
                valor
              )}
            </span>
          </span>

          <span className="shrink-0 text-xs text-slate-400">
            ⌄
          </span>
        </button>

        <input
          ref={inputRef}
          type="date"
          value={valor}
          min={min}
          required={required}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="pointer-events-none absolute h-px w-px opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function IconoBuscar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconoRestablecer() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4v6h6" />
      <path d="M5.5 15a8 8 0 1 0 1.8-8.3L4 10" />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function IconoBorrar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function IconoEuro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 7.5A6.5 6.5 0 1 0 18 16.5" />
      <path d="M5 10h9M5 14h8" />
    </svg>
  );
}

function formatearFechaFiltro(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
  }

  const [anio, mes, dia] =
    valor.split("-");

  if (!anio || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${anio}`;
}

function CampoFechaFiltro({
  etiqueta,
  valor,
  onChange,
  min,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  min?: string;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  function abrirSelectorFecha() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <div className="block w-full min-w-0 sm:w-[140px] sm:shrink-0">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        {etiqueta}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={abrirSelectorFecha}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/25"
          aria-label={`Elegir fecha ${etiqueta.toLowerCase()}`}
        >
          <span className={valor ? "text-white" : "text-white/55"}>
            {formatearFechaFiltro(
              valor
            )}
          </span>
          <span className="shrink-0 text-[#4DD4CA]">
            <IconoCalendario />
          </span>
        </button>

        <input
          ref={inputRef}
          type="date"
          value={valor}
          min={min}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="pointer-events-none absolute h-px w-px opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function CampoMesAgenda({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const ahora = new Date();
  const [abierto, setAbierto] =
    useState(false);
  const [anioSelector, setAnioSelector] =
    useState(
      valor
        ? Number(valor.slice(0, 4))
        : ahora.getFullYear()
    );

  useEffect(() => {
    if (valor) {
      setAnioSelector(
        Number(valor.slice(0, 4))
      );
    }
  }, [valor]);

  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const mesActivo = valor
    ? Number(valor.slice(5, 7))
    : null;

  function abrirSelector() {
    setAnioSelector(
      valor
        ? Number(valor.slice(0, 4))
        : new Date().getFullYear()
    );
    setAbierto(true);
  }

  function seleccionarMes(
    numeroMes: number
  ) {
    onChange(
      `${anioSelector}-${String(
        numeroMes
      ).padStart(2, "0")}`
    );
    setAbierto(false);
  }

  return (
    <div className="relative w-full min-w-0 sm:w-[205px] sm:shrink-0">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        Mes
      </span>

      <button
        type="button"
        onClick={abrirSelector}
        className={
          abierto
            ? "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#4DD4CA]/40 bg-white/15 px-3 text-sm font-bold capitalize text-white transition"
            : "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold capitalize text-white transition hover:bg-white/15"
        }
        aria-label="Elegir mes"
        aria-expanded={abierto}
      >
        <span className="text-[#4DD4CA]">
          <IconoCalendario />
        </span>
        <span className="min-w-0 flex-1 truncate text-center">
          {formatearMesControl(valor)}
        </span>
        <span className="text-xs text-white/45">
          ⌄
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar selector de mes"
          />

          <div className="absolute left-1/2 top-[58px] z-50 w-[310px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:left-auto sm:right-0 sm:w-[320px] sm:translate-x-0 sm:p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setAnioSelector(
                    (anio) => anio - 1
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                aria-label="Año anterior"
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
                    (anio) => anio + 1
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                aria-label="Año siguiente"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {meses.map(
                (nombreMes, indice) => {
                  const numeroMes =
                    indice + 1;
                  const seleccionado =
                    anioSelector ===
                      Number(
                        valor.slice(0, 4)
                      ) &&
                    mesActivo ===
                      numeroMes;

                  return (
                    <button
                      key={nombreMes}
                      type="button"
                      onClick={() =>
                        seleccionarMes(
                          numeroMes
                        )
                      }
                      className={
                        seleccionado
                          ? "h-9 rounded-lg bg-[#00A79C] text-xs font-bold text-white"
                          : "h-9 rounded-lg border border-slate-100 bg-[#FBFCFD] text-xs font-semibold text-slate-600 transition hover:border-[#00A79C]/30 hover:bg-[#E8F7F5] hover:text-[#008C83]"
                      }
                    >
                      {nombreMes}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onChange("");
                setAbierto(false);
              }}
              className="mt-3 h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-[#17324D]"
            >
              Todos los meses
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function CampoEstadoClases({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const opciones = [
    {
      valor: "todas",
      etiqueta: "Todos",
    },
    {
      valor: "programada",
      etiqueta: "Programadas",
    },
    {
      valor: "realizada",
      etiqueta: "Realizadas",
    },
    {
      valor: "cancelada",
      etiqueta: "Canceladas",
    },
  ];

  const etiquetaActual =
    opciones.find(
      (opcion) =>
        opcion.valor === valor
    )?.etiqueta || "Todos";

  return (
    <div className="relative w-full min-w-0 sm:w-[158px] sm:shrink-0">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        Estado
      </span>

      <button
        type="button"
        onClick={() =>
          setAbierto(
            (actual) => !actual
          )
        }
        className={
          abierto
            ? "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#4DD4CA]/40 bg-white/15 px-3 text-xs font-semibold text-white transition"
            : "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
        }
        aria-label="Filtrar por estado"
        aria-expanded={abierto}
      >
        <span className="truncate">
          {etiquetaActual}
        </span>

        <span className="shrink-0 text-[10px] text-white/45">
          ⌄
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            onClick={() =>
              setAbierto(false)
            }
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar selector de estado"
          />

          <div className="absolute left-0 top-[58px] z-50 w-full min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
            {opciones.map(
              (opcion) => {
                const seleccionada =
                  opcion.valor ===
                  valor;

                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => {
                      onChange(
                        opcion.valor
                      );
                      setAbierto(
                        false
                      );
                    }}
                    className={
                      seleccionada
                        ? "flex h-9 w-full items-center rounded-lg bg-[#17324D] px-3 text-left text-xs font-bold text-white"
                        : "flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                    }
                  >
                    {opcion.etiqueta}
                  </button>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ClasesPage() {
  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [ubicaciones, setUbicaciones] =
    useState<Ubicacion[]>([]);

  const [grupos, setGrupos] =
    useState<Grupo[]>([]);

  const [bonos, setBonos] =
    useState<Bono[]>([]);

  const [
    relacionesBonoAlumno,
    setRelacionesBonoAlumno,
  ] =
    useState<RelacionBonoAlumno[]>([]);

  const [clases, setClases] =
    useState<Clase[]>([]);

  const [pagosClase, setPagosClase] =
    useState<PagoClase[]>([]);

  const [tarifas, setTarifas] =
    useState<Tarifa[]>([]);

  const [fecha, setFecha] =
    useState("");

  const [hora, setHora] =
    useState("");

  const [duracion, setDuracion] =
    useState("60");

  const [ubicacionId, setUbicacionId] =
    useState("");

  const [tipo, setTipo] =
    useState("club");

  const [grupoId, setGrupoId] =
    useState("");

  const [estado, setEstado] =
    useState("programada");

  const [
    facturableCancelacion,
    setFacturableCancelacion,
  ] = useState<boolean | null>(null);

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] =
    useState("");

  const [
    observaciones,
    setObservaciones,
  ] =
    useState("");

  const [
    alumnosSeleccionados,
    setAlumnosSeleccionados,
  ] =
    useState<string[]>([]);

  const [
    importesAlumnos,
    setImportesAlumnos,
  ] =
    useState<Record<string, string>>({});

  const [
    modoCobroClase,
    setModoCobroClase,
  ] = useState<
    "por_alumno" | "total"
  >("por_alumno");

  const [
    modoCobroManual,
    setModoCobroManual,
  ] = useState(false);

  const [
    importeTotalClase,
    setImporteTotalClase,
  ] = useState("");

  const [
    importeTotalManual,
    setImporteTotalManual,
  ] = useState(false);

  const [
    importePorAlumnoManual,
    setImportePorAlumnoManual,
  ] = useState(false);

  const [
    estadoPagoTotal,
    setEstadoPagoTotal,
  ] = useState<
    "pagado" | "pendiente"
  >("pendiente");

  const [
    metodoPagoTotal,
    setMetodoPagoTotal,
  ] = useState("efectivo");

  const [
    modoPagoAlumnos,
    setModoPagoAlumnos,
  ] =
    useState<
      Record<
        string,
        "normal" | "bono"
      >
    >({});

  const [
    bonosSeleccionados,
    setBonosSeleccionados,
  ] =
    useState<Record<string, string>>({});

  const [
    estadoPagoAlumnos,
    setEstadoPagoAlumnos,
  ] =
    useState<
      Record<
        string,
        "pagado" | "pendiente"
      >
    >({});

  const [
    metodoPagoAlumnos,
    setMetodoPagoAlumnos,
  ] =
    useState<Record<string, string>>({});

  const [
    importeClub,
    setImporteClub,
  ] =
    useState("");

  const [
    costePista,
    setCostePista,
  ] =
    useState("");

  const [
    ingresoExtra,
    setIngresoExtra,
  ] =
    useState("");

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] =
    useState("");

  const [
    busquedaGrupo,
    setBusquedaGrupo,
  ] =
    useState("");

  const [
    listaGruposAbierta,
    setListaGruposAbierta,
  ] = useState(false);

  const [
    mostrarTodosGrupos,
    setMostrarTodosGrupos,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [
    claseEditandoId,
    setClaseEditandoId,
  ] =
    useState<string | null>(null);

  const [
    busquedaClases,
    setBusquedaClases,
  ] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState("todas");

  const [
    filtroMes,
    setFiltroMes,
  ] =
    useState("");

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] = useState(false);

  const [
    filtroFechaDesde,
    setFiltroFechaDesde,
  ] = useState("");

  const [
    filtroFechaHasta,
    setFiltroFechaHasta,
  ] = useState("");

  const [
    modoCreacion,
    setModoCreacion,
  ] = useState<"individual" | "serie">("individual");

  const [
    fechaFinSerie,
    setFechaFinSerie,
  ] = useState("");

  const [
    diasSerie,
    setDiasSerie,
  ] = useState<number[]>([]);

  const [
    clasePendienteBorrar,
    setClasePendienteBorrar,
  ] = useState<Clase | null>(null);

  const [
    clasePendienteEditar,
    setClasePendienteEditar,
  ] = useState<Clase | null>(null);

  const alcanceEdicionSerieRef =
    useRef<
      "una" |
      "siguientes" |
      "serie" |
      null
    >(null);

  const [
    borrandoSerie,
    setBorrandoSerie,
  ] = useState(false);

  const [
    creandoSerie,
    setCreandoSerie,
  ] = useState(false);

  const volverAgendaRef =
    useRef<string | null>(null);

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    volverAgendaRef.current =
      parametros.get("volver");

    cargarDatos();
  }, []);

  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const fechaDesdeAgenda =
      parametros.get("fecha");

    const horaDesdeAgenda =
      parametros.get("hora");

    const modoDesdeAgenda =
      parametros.get("modo");

    if (
      fechaDesdeAgenda &&
      !claseEditandoId
    ) {
      setFecha(
        fechaDesdeAgenda
      );

      if (
        horaDesdeAgenda
      ) {
        setHora(
          horaDesdeAgenda
        );
      }

      if (modoDesdeAgenda === "serie") {
        setModoCreacion("serie");

        const fechaInicio =
          new Date(
            `${fechaDesdeAgenda}T12:00:00`
          );

        setDiasSerie([
          fechaInicio.getDay(),
        ]);
      } else {
        setModoCreacion("individual");
      }

      setFormularioAbierto(
        true
      );

      const url =
        new URL(
          window.location.href
        );

      url.searchParams.delete(
        "fecha"
      );

      url.searchParams.delete(
        "hora"
      );

      url.searchParams.delete(
        "modo"
      );

      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, [claseEditandoId]);

  useEffect(() => {
    if (
      clases.length ===
      0
    ) {
      return;
    }

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const claseId =
      parametros.get("editar");

    if (!claseId) {
      return;
    }

    const claseEncontrada =
      clases.find(
        (clase) =>
          clase.id ===
          claseId
      );

    if (
      !claseEncontrada
    ) {
      return;
    }

    editarClase(
      claseEncontrada
    );

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "editar"
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [clases]);

  function volverAlOrigenSiExiste() {
    const volver =
      volverAgendaRef.current;

    if (!volver) {
      return false;
    }

    window.location.href =
      volver;

    return true;
  }

  async function cargarDatos() {
    const {
      data: alumnosData,
    } =
      await supabase
        .from("alumnos")
        .select(
          "id,nombre,apellidos,apodo,precio_habitual,ubicacion_habitual_id,procedencia,tipo_clase_habitual"
        )
        .eq(
          "activo",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: ubicacionesData,
    } =
      await supabase
        .from("ubicaciones")
        .select(
          "id,nombre,tipo,coste_pista"
        )
        .eq(
          "activa",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: gruposData,
    } =
      await supabase
        .from("grupos")
        .select(`
          id,
          nombre,
          grupo_alumnos (
            alumno_id
          )
        `)
        .eq(
          "activo",
          true
        )
        .order(
          "nombre"
        );

    const {
      data: bonosData,
    } =
      await supabase
        .from("bonos")
        .select(
          "id,alumno_id,grupo_id,numero_clases,clases_restantes,importe_pagado,activo"
        )
        .order(
          "fecha_compra",
          {
            ascending: true,
          }
        );

    const {
      data: relacionesBonoData,
    } =
      await supabase
        .from(
          "bono_alumnos"
        )
        .select(
          "bono_id,alumno_id"
        );

    const {
      data: clasesData,
    } =
      await supabase
        .from("clases")
        .select(`
          id,
          serie_id,
          google_calendar_event_id,
          google_calendar_synced_at,
          fecha,
          hora_inicio,
          duracion_minutos,
          ubicacion_id,
          grupo_id,
          tipo,
          estado,
          facturable,
          cobrada,
          motivo_cancelacion,
          observaciones,
          importe_club,
          coste_pista,
          ingreso_extra,
          modo_cobro,
          importe_total,
          ubicaciones (
            nombre
          ),
          clase_alumnos (
            alumno_id,
            importe,
            pagado,
            usa_bono,
            bono_id,
            alumnos (
              nombre,
              apellidos
            )
          )
        `)
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

    const {
      data: pagosData,
    } =
      await supabase
        .from("pagos")
        .select(`
          id,
          clase_id,
          alumno_id,
          importe,
          metodo,
          estado
        `)
        .not(
          "clase_id",
          "is",
          null
        );

    const {
      data: tarifasData,
    } =
      await supabase
        .from("tarifas")
        .select(`
          id,
          ubicacion_id,
          concepto,
          duracion_minutos,
          numero_alumnos,
          importe,
          activa,
          ubicaciones (
            nombre
          )
        `)
        .eq(
          "activa",
          true
        );

    setAlumnos(
      alumnosData ||
        []
    );

    setUbicaciones(
      ubicacionesData ||
        []
    );

    setGrupos(
      (gruposData ||
        []) as Grupo[]
    );

    setBonos(
      (bonosData ||
        []) as Bono[]
    );

    setRelacionesBonoAlumno(
      (relacionesBonoData ||
        []) as RelacionBonoAlumno[]
    );

    const tarifasCargadas =
      (tarifasData ||
        []) as unknown as Tarifa[];

    const clasesCargadas =
      (clasesData ||
        []) as unknown as Clase[];

    const clasesNormalizadas =
      clasesCargadas.map(
        (clase) => {
          if (
            clase.tipo !==
              "club" ||
            Number(
              clase.importe_club ||
                0
            ) > 0 ||
            !clase.ubicacion_id
          ) {
            return clase;
          }

          const tarifaClub =
            buscarTarifaEnLista(
              tarifasCargadas,
              "club_paga",
              clase.ubicacion_id,
              clase.duracion_minutos,
              clase.clase_alumnos.length,
              clase.ubicaciones?.nombre
            );

          if (!tarifaClub) {
            return clase;
          }

          return {
            ...clase,
            importe_club:
              Number(
                tarifaClub.importe ||
                  0
              ),
          };
        }
      );

    const clasesParaActualizar =
      clasesNormalizadas.filter(
        (claseNormalizada) => {
          const original =
            clasesCargadas.find(
              (clase) =>
                clase.id ===
                claseNormalizada.id
            );

          return (
            original?.tipo ===
              "club" &&
            Number(
              original.importe_club ||
                0
            ) === 0 &&
            Number(
              claseNormalizada.importe_club ||
                0
            ) > 0
          );
        }
      );

    if (
      clasesParaActualizar.length >
      0
    ) {
      await Promise.all(
        clasesParaActualizar.map(
          (clase) =>
            supabase
              .from("clases")
              .update({
                importe_club:
                  Number(
                    clase.importe_club ||
                      0
                  ),
              })
              .eq(
                "id",
                clase.id
              )
        )
      );
    }

    setClases(
      clasesNormalizadas
    );

    setPagosClase(
      (pagosData ||
        []) as PagoClase[]
    );

    setTarifas(
      tarifasCargadas
    );
  }

  function limpiarFormulario() {
    setClaseEditandoId(
      null
    );

    setFecha("");
    setHora("");
    setDuracion("60");
    setUbicacionId("");
    setTipo("club");
    setGrupoId("");
    setEstado("programada");
    setFacturableCancelacion(null);
    setMotivoCancelacion("");
    setObservaciones("");

    setAlumnosSeleccionados(
      []
    );

    setImportesAlumnos(
      {}
    );

    setModoCobroClase(
      "por_alumno"
    );
    setModoCobroManual(
      false
    );
    setImporteTotalClase(
      ""
    );
    setImporteTotalManual(
      false
    );
    setImportePorAlumnoManual(
      false
    );
    setEstadoPagoTotal(
      "pendiente"
    );
    setMetodoPagoTotal(
      "efectivo"
    );

    setModoPagoAlumnos(
      {}
    );

    setBonosSeleccionados(
      {}
    );

    setEstadoPagoAlumnos(
      {}
    );

    setMetodoPagoAlumnos(
      {}
    );

    setImporteClub("");
    setCostePista("");
    setIngresoExtra("");
    setBusquedaAlumno("");
    setBusquedaGrupo("");
    setListaGruposAbierta(false);
    setMostrarTodosGrupos(false);
    setFechaFinSerie("");
    setDiasSerie([]);
    setModoCreacion("individual");
  }

  function normalizarTextoTarifa(
    valor: string | null | undefined
  ) {
    return (valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function buscarTarifaEnLista(
    listaTarifas: Tarifa[],
    conceptoBuscado: string,
    ubicacionBuscada: string,
    duracionBuscada: number,
    numeroAlumnosBuscado: number,
    ubicacionNombreBuscada?: string | null
  ) {
    const conceptoNormalizado =
      normalizarTextoTarifa(
        conceptoBuscado
      );

    const candidatas =
      listaTarifas.filter(
        (tarifa) =>
          tarifa.activa !== false &&
          normalizarTextoTarifa(
            tarifa.concepto
          ) === conceptoNormalizado &&
          Number(
            tarifa.duracion_minutos
          ) ===
            Number(
              duracionBuscada
            ) &&
          Number(
            tarifa.numero_alumnos
          ) ===
            Number(
              numeroAlumnosBuscado
            )
      );

    const coincidenciaId =
      candidatas.find(
        (tarifa) =>
          String(
            tarifa.ubicacion_id ||
              ""
          ) ===
          String(
            ubicacionBuscada ||
              ""
          )
      );

    if (coincidenciaId) {
      return coincidenciaId;
    }

    const nombreNormalizado =
      normalizarTextoTarifa(
        ubicacionNombreBuscada
      );

    if (nombreNormalizado) {
      const coincidenciasNombre =
        candidatas.filter(
          (tarifa) =>
            normalizarTextoTarifa(
              tarifa.ubicaciones
                ?.nombre
            ) === nombreNormalizado
        );

      if (
        coincidenciasNombre.length ===
        1
      ) {
        return coincidenciasNombre[0];
      }
    }

    return undefined;
  }

  function buscarTarifa(
    conceptoBuscado: string,
    ubicacionBuscada: string,
    duracionBuscada: number,
    numeroAlumnosBuscado: number
  ) {
    const nombreUbicacion =
      ubicaciones.find(
        (ubicacion) =>
          String(ubicacion.id) ===
          String(ubicacionBuscada)
      )?.nombre;

    return buscarTarifaEnLista(
      tarifas,
      conceptoBuscado,
      ubicacionBuscada,
      duracionBuscada,
      numeroAlumnosBuscado,
      nombreUbicacion
    );
  }

  function buscarTarifaClaseSuelta(
    numeroAlumnos: number
  ) {
    return tarifas.find(
      (tarifa) =>
        tarifa.activa !== false &&
        tarifa.ubicacion_id === null &&
        normalizarTextoTarifa(
          tarifa.concepto
        ) === "clase_suelta" &&
        Number(
          tarifa.duracion_minutos
        ) === 60 &&
        Number(
          tarifa.numero_alumnos
        ) === Number(numeroAlumnos)
    );
  }

  function calcularPrecioTotalAutomatico(
    numeroAlumnos: number,
    duracionMinutos: number
  ) {
    if (
      numeroAlumnos <= 0 ||
      duracionMinutos <= 0
    ) {
      return "";
    }

    const tarifa =
      buscarTarifaClaseSuelta(
        numeroAlumnos
      );

    if (!tarifa) {
      return "";
    }

    const total =
      Math.floor(
        Number(tarifa.importe || 0) *
          (duracionMinutos / 60)
      );

    return String(total);
  }

  function actualizarImportesAutomaticos(
    tipoClase: string,
    nuevaUbicacionId: string,
    nuevaDuracion = Number(duracion),
    nuevoNumeroAlumnos =
      alumnosSeleccionados.length
  ) {
    if (
      !nuevaUbicacionId ||
      nuevoNumeroAlumnos <= 0
    ) {
      if (tipoClase === "club") {
        setImporteClub("");
      }

      if (tipoClase === "propia") {
        setCostePista("");
      }

      return;
    }

    if (tipoClase === "club") {
      const tarifaClub =
        buscarTarifa(
          "club_paga",
          nuevaUbicacionId,
          nuevaDuracion,
          nuevoNumeroAlumnos
        );

      setImporteClub(
        tarifaClub
          ? String(
              tarifaClub.importe
            )
          : ""
      );

      setCostePista("0");
      return;
    }

    setImporteClub("");

    if (tipoClase === "privada") {
      setCostePista("0");
      return;
    }

    const tarifaPista =
      buscarTarifa(
        "coste_pista",
        nuevaUbicacionId,
        nuevaDuracion,
        nuevoNumeroAlumnos
      );

    if (tarifaPista) {
      setCostePista(
        String(
          tarifaPista.importe
        )
      );
      return;
    }

    const ubicacion =
      ubicaciones.find(
        (item) =>
          item.id ===
          nuevaUbicacionId
      );

    if (
      !ubicacion ||
      ubicacion.tipo ===
        "privada" ||
      ubicacion.tipo ===
        "urbanizacion"
    ) {
      setCostePista("0");
      return;
    }

    setCostePista(
      String(
        ubicacion.coste_pista ||
          0
      )
    );
  }

  function actualizarCostePistaAutomatico(
    tipoClase: string,
    nuevaUbicacionId: string
  ) {
    actualizarImportesAutomaticos(
      tipoClase,
      nuevaUbicacionId
    );
  }


  const hayBonoSeleccionado =
    alumnosSeleccionados.some(
      (alumnoId) =>
        modoPagoAlumnos[alumnoId] ===
        "bono"
    );

  useEffect(() => {
    if (
      tipo === "club" ||
      hayBonoSeleccionado
    ) {
      if (
        modoCobroClase !==
        "por_alumno"
      ) {
        setModoCobroClase(
          "por_alumno"
        );
      }
      return;
    }

    if (
      claseEditandoId ||
      modoCobroManual
    ) {
      return;
    }

    const modoAutomatico =
      alumnosSeleccionados.length >= 2
        ? "total"
        : "por_alumno";

    if (
      modoCobroClase !==
      modoAutomatico
    ) {
      setModoCobroClase(
        modoAutomatico
      );
    }
  }, [
    tipo,
    hayBonoSeleccionado,
    alumnosSeleccionados.length,
    claseEditandoId,
    modoCobroManual,
    modoCobroClase,
  ]);

  useEffect(() => {
    if (
      modoCobroClase !== "total" ||
      importeTotalManual
    ) {
      return;
    }

    setImporteTotalClase(
      calcularPrecioTotalAutomatico(
        alumnosSeleccionados.length,
        Number(duracion)
      )
    );
  }, [
    modoCobroClase,
    importeTotalManual,
    alumnosSeleccionados.length,
    duracion,
    tarifas,
  ]);

  useEffect(() => {
    if (
      claseEditandoId ||
      modoCobroClase !== "por_alumno" ||
      importePorAlumnoManual ||
      alumnosSeleccionados.length !== 1
    ) {
      return;
    }

    const alumnoId =
      alumnosSeleccionados[0];

    if (
      modoPagoAlumnos[alumnoId] ===
      "bono"
    ) {
      return;
    }

    const alumno =
      alumnos.find(
        (item) =>
          item.id === alumnoId
      );

    const precioBase60 =
      alumno?.precio_habitual !== null &&
      alumno?.precio_habitual !== undefined
        ? Number(
            alumno.precio_habitual
          )
        : (() => {
            const tarifa =
              buscarTarifaClaseSuelta(1);

            return tarifa
              ? Number(
                  tarifa.importe || 0
                )
              : null;
          })();

    if (
      precioBase60 === null ||
      !Number.isFinite(
        precioBase60
      )
    ) {
      return;
    }

    const importeAutomatico =
      Math.floor(
        precioBase60 *
          (Number(duracion) / 60)
      );

    setImportesAlumnos(
      (actuales) => ({
        ...actuales,
        [alumnoId]: String(
          importeAutomatico
        ),
      })
    );
  }, [
    claseEditandoId,
    modoCobroClase,
    importePorAlumnoManual,
    alumnosSeleccionados,
    modoPagoAlumnos,
    duracion,
    tarifas,
  ]);

  useEffect(() => {
    if (
      claseEditandoId ||
      alumnosSeleccionados.length === 0
    ) {
      return;
    }

    actualizarImportesAutomaticos(
      tipo,
      ubicacionId,
      Number(duracion),
      alumnosSeleccionados.length
    );
  }, [
    tipo,
    ubicacionId,
    duracion,
    alumnosSeleccionados.length,
    tarifas,
  ]);

  function seleccionarGrupoRapido(
    nuevoGrupoId: string
  ) {
    setModoCobroManual(false);
    setImporteTotalManual(false);
    setImportePorAlumnoManual(false);

    setGrupoId(
      nuevoGrupoId
    );

    if (!nuevoGrupoId) {
      setAlumnosSeleccionados(
        []
      );

      setImportesAlumnos(
        {}
      );

      setModoPagoAlumnos(
        {}
      );

      setBonosSeleccionados(
        {}
      );

      setEstadoPagoAlumnos(
        {}
      );

      setMetodoPagoAlumnos(
        {}
      );

      return;
    }

    const grupo =
      grupos.find(
        (item) =>
          item.id ===
          nuevoGrupoId
      );

    if (!grupo) {
      return;
    }

    const idsGrupo =
      grupo.grupo_alumnos.map(
        (item) =>
          item.alumno_id
      );

    const alumnosGrupo =
      idsGrupo
        .map((id) =>
          alumnos.find(
            (item) =>
              item.id === id
          )
        )
        .filter(Boolean);

    const primerAlumno =
      alumnosGrupo[0];

    const nuevaUbicacionId =
      primerAlumno
        ?.ubicacion_habitual_id ||
      ubicacionId;

    const nuevoTipo =
      primerAlumno
        ?.tipo_clase_habitual ||
      tipo;

    if (
      primerAlumno
        ?.ubicacion_habitual_id
    ) {
      setUbicacionId(
        primerAlumno
          .ubicacion_habitual_id
      );
    }

    if (
      primerAlumno
        ?.tipo_clase_habitual
    ) {
      setTipo(
        primerAlumno
          .tipo_clase_habitual
      );
    }

    setAlumnosSeleccionados(
      idsGrupo
    );

    const nuevosImportes:
      Record<string, string> =
        {};

    const nuevosModos:
      Record<
        string,
        "normal" | "bono"
      > = {};

    const nuevosBonos:
      Record<string, string> =
        {};

    const nuevosEstados:
      Record<
        string,
        "pagado" | "pendiente"
      > = {};

    const nuevosMetodos:
      Record<string, string> =
        {};

    idsGrupo.forEach(
      (alumnoId) => {
        const alumno =
          alumnos.find(
            (item) =>
              item.id ===
              alumnoId
          );

        nuevosImportes[
          alumnoId
        ] =
          alumno
            ?.precio_habitual !==
          null &&
          alumno
            ?.precio_habitual !==
          undefined
            ? String(
                alumno
                  .precio_habitual
              )
            : "";

        const bonosAlumno =
          bonosDelAlumno(
            alumnoId
          );

        const tieneBono =
          bonosAlumno.length >
          0;

        nuevosModos[
          alumnoId
        ] =
          tieneBono
            ? "bono"
            : "normal";

        nuevosEstados[
          alumnoId
        ] =
          "pendiente";

        nuevosMetodos[
          alumnoId
        ] =
          "efectivo";

        if (tieneBono) {
          nuevosBonos[
            alumnoId
          ] =
            bonosAlumno[0].id;
        }
      }
    );

    setImportesAlumnos(
      nuevosImportes
    );

    setModoPagoAlumnos(
      nuevosModos
    );

    setBonosSeleccionados(
      nuevosBonos
    );

    setEstadoPagoAlumnos(
      nuevosEstados
    );

    setMetodoPagoAlumnos(
      nuevosMetodos
    );

    actualizarImportesAutomaticos(
      nuevoTipo,
      nuevaUbicacionId,
      Number(duracion),
      idsGrupo.length
    );
  }

  function bonosDelAlumno(
    alumnoId: string
  ) {
    const bonosAutorizados =
      new Set(
        relacionesBonoAlumno
          .filter(
            (
              relacion
            ) =>
              relacion.alumno_id ===
              alumnoId
          )
          .map(
            (
              relacion
            ) =>
              relacion.bono_id
          )
      );

    return bonos.filter(
      (bono) =>
        bono.activo &&
        bono.clases_restantes >
          0 &&
        (
          bono.alumno_id ===
            alumnoId ||
          bonosAutorizados.has(
            bono.id
          )
        )
    );
  }

  function textoBono(
    bono: Bono,
    alumnoId: string
  ) {
    const esPropio =
      bono.alumno_id ===
      alumnoId;

    if (esPropio) {
      return `Bono propio · ${bono.numero_clases} clases · ${bono.clases_restantes} restantes`;
    }

    const titular =
      alumnos.find(
        (alumno) =>
          alumno.id ===
          bono.alumno_id
      );

    const nombreTitular =
      titular
        ? `${titular.nombre} ${
            titular.apellidos ||
            ""
          }`.trim()
        : "otro alumno";

    return `Bono de ${nombreTitular} · ${bono.numero_clases} clases · ${bono.clases_restantes} restantes`;
  }
  function cambiarAlumno(
    alumno: Alumno
  ) {
    setImportePorAlumnoManual(
      false
    );

    const seleccionado =
      alumnosSeleccionados.includes(
        alumno.id
      );

    if (seleccionado) {
      setAlumnosSeleccionados(
        (
          actuales
        ) =>
          actuales.filter(
            (id) =>
              id !==
              alumno.id
          )
      );

      setImportesAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setModoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setBonosSeleccionados(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setEstadoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      setMetodoPagoAlumnos(
        (
          actuales
        ) => {
          const copia = {
            ...actuales,
          };

          delete copia[
            alumno.id
          ];

          return copia;
        }
      );

      return;
    }

    if (
      alumnosSeleccionados.length === 0
    ) {
      const tipoHabitual =
        alumno.tipo_clase_habitual ||
        tipo;

      if (alumno.tipo_clase_habitual) {
        setTipo(
          alumno.tipo_clase_habitual
        );
      }

      if (
        alumno.ubicacion_habitual_id
      ) {
        setUbicacionId(
          alumno.ubicacion_habitual_id
        );

        actualizarImportesAutomaticos(
          tipoHabitual,
          alumno.ubicacion_habitual_id,
          Number(duracion),
          1
        );
      }

      const grupoHabitual =
        grupos.find(
          (grupo) =>
            grupo.grupo_alumnos.some(
              (relacion) =>
                relacion.alumno_id ===
                alumno.id
            )
        );

      setGrupoId(
        grupoHabitual?.id ||
          ""
      );
    }

    const bonosAlumno =
      bonosDelAlumno(
        alumno.id
      );

    const tieneBono =
      bonosAlumno.length >
      0;

    setAlumnosSeleccionados(
      (
        actuales
      ) => [
        ...actuales,
        alumno.id,
      ]
    );

    setImportesAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          alumno.precio_habitual !==
          null
            ? String(
                alumno.precio_habitual
              )
            : "",
      })
    );

    setModoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          tieneBono
            ? "bono"
            : "normal",
      })
    );

    setEstadoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          "pendiente",
      })
    );

    setMetodoPagoAlumnos(
      (
        actuales
      ) => ({
        ...actuales,

        [alumno.id]:
          "efectivo",
      })
    );

    if (tieneBono) {
      setBonosSeleccionados(
        (
          actuales
        ) => ({
          ...actuales,

          [alumno.id]:
            bonosAlumno[0]
              .id,
        })
      );
    }
  }

  function contarUsoBonos(
    participantes: {
      usa_bono: boolean;
      bono_id:
        | string
        | null;
    }[],
    estadoClase: string,
    facturableClase = true
  ) {
    const resultado:
      Record<
        string,
        number
      > =
      {};

    const consumeBono =
      estadoClase === "realizada" ||
      (
        estadoClase === "cancelada" &&
        facturableClase
      );

    if (!consumeBono) {
      return resultado;
    }

    participantes.forEach(
      (
        participante
      ) => {
        if (
          participante.usa_bono &&
          participante.bono_id
        ) {
          const bono =
            bonos.find(
              (item) =>
                item.id ===
                participante.bono_id
            );

          if (bono?.grupo_id) {
            // Un bono de grupo representa clases del grupo completo:
            // aunque varios integrantes usen el mismo bono en la clase,
            // solo se descuenta una clase del bono.
            resultado[
              participante.bono_id
            ] = 1;
          } else {
            // Bonos individuales/compartidos mantienen la lógica histórica:
            // cada participante que usa el bono consume una clase.
            resultado[
              participante.bono_id
            ] =
              (
                resultado[
                  participante
                    .bono_id
                ] || 0
              ) + 1;
          }
        }
      }
    );

    return resultado;
  }

  function editarClase(
    clase: Clase
  ) {
    setClaseEditandoId(
      clase.id
    );

    setModoCreacion(
      "individual"
    );

    setFormularioAbierto(
      true
    );

    setFecha(
      clase.fecha
    );

    setHora(
      clase.hora_inicio.slice(
        0,
        5
      )
    );

    setDuracion(
      String(
        clase.duracion_minutos
      )
    );

    setUbicacionId(
      clase.ubicacion_id ||
        ""
    );

    setGrupoId(
      clase.grupo_id ||
        ""
    );

    setTipo(
      clase.tipo
    );

    setEstado(
      clase.estado
    );

    setFacturableCancelacion(
      clase.estado === "cancelada"
        ? clase.facturable
        : null
    );

    const motivoLegacy =
      clase.estado === "cancelada" &&
      !clase.motivo_cancelacion
        ? clase.observaciones || ""
        : "";

    setMotivoCancelacion(
      clase.motivo_cancelacion ||
        motivoLegacy
    );

    setObservaciones(
      clase.estado === "cancelada" &&
      !clase.motivo_cancelacion
        ? ""
        : clase.observaciones ||
            ""
    );

    setImporteClub(
      String(
        clase.importe_club ||
          ""
      )
    );

    setCostePista(
      String(
        clase.coste_pista ||
          ""
      )
    );

    setIngresoExtra(
      clase.ingreso_extra
        ? String(
            clase.ingreso_extra
          )
        : ""
    );

    const modoCobroGuardado =
      clase.tipo !== "club" &&
      clase.modo_cobro === "total"
        ? "total"
        : "por_alumno";

    setModoCobroClase(
      modoCobroGuardado
    );
    setModoCobroManual(true);
    setImporteTotalClase(
      modoCobroGuardado === "total"
        ? String(
            clase.importe_total ?? ""
          )
        : ""
    );
    setImporteTotalManual(
      modoCobroGuardado === "total"
    );
    setImportePorAlumnoManual(
      modoCobroGuardado ===
        "por_alumno"
    );

    const pagoTotalClase =
      pagosClase.find(
        (item) =>
          item.clase_id === clase.id &&
          item.alumno_id === null
      );

    const participantesNormalesClase =
      clase.clase_alumnos.filter(
        (participante) =>
          !participante.usa_bono
      );

    setEstadoPagoTotal(
      pagoTotalClase?.estado === "pagado" ||
      (
        participantesNormalesClase.length > 0 &&
        participantesNormalesClase.every(
          (participante) =>
            participante.pagado
        )
      )
        ? "pagado"
        : "pendiente"
    );
    setMetodoPagoTotal(
      pagoTotalClase?.metodo ||
      "efectivo"
    );

    setBusquedaAlumno(
      ""
    );

    setAlumnosSeleccionados(
      clase.clase_alumnos.map(
        (
          participante
        ) =>
          participante.alumno_id
      )
    );

    const importes:
      Record<
        string,
        string
      > =
      {};

    const modos:
      Record<
        string,
        "normal" | "bono"
      > =
      {};

    const bonosElegidos:
      Record<
        string,
        string
      > =
      {};

    const estadosPago:
      Record<
        string,
        "pagado" | "pendiente"
      > =
      {};

    const metodosPago:
      Record<
        string,
        string
      > =
      {};

    clase.clase_alumnos.forEach(
      (
        participante
      ) => {
        importes[
          participante.alumno_id
        ] =
          String(
            participante.importe ||
              ""
          );

        modos[
          participante.alumno_id
        ] =
          participante.usa_bono
            ? "bono"
            : "normal";

        if (
          participante.usa_bono &&
          participante.bono_id
        ) {
          bonosElegidos[
            participante.alumno_id
          ] =
            participante.bono_id;
        }

        const pago =
          pagosClase.find(
            (item) =>
              item.clase_id ===
                clase.id &&
              item.alumno_id ===
                participante.alumno_id
          );

        estadosPago[
          participante.alumno_id
        ] =
          pago?.estado ===
            "pagado" ||
          participante.pagado ===
            true
            ? "pagado"
            : "pendiente";

        metodosPago[
          participante.alumno_id
        ] =
          pago?.metodo ||
          "efectivo";
      }
    );

    setImportesAlumnos(
      importes
    );

    setModoPagoAlumnos(
      modos
    );

    setBonosSeleccionados(
      bonosElegidos
    );

    setEstadoPagoAlumnos(
      estadosPago
    );

    setMetodoPagoAlumnos(
      metodosPago
    );

    setMensaje(
      "Editando clase"
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  function cambiarDiaSerie(
    dia: number
  ) {
    setDiasSerie(
      (actuales) =>
        actuales.includes(dia)
          ? actuales.filter(
              (item) =>
                item !== dia
            )
          : [
              ...actuales,
              dia,
            ]
    );
  }

  function fechasDeSerie() {
    if (
      !fecha ||
      !fechaFinSerie ||
      diasSerie.length === 0
    ) {
      return [];
    }

    const inicio =
      new Date(
        `${fecha}T12:00:00`
      );

    const fin =
      new Date(
        `${fechaFinSerie}T12:00:00`
      );

    if (
      fin < inicio
    ) {
      return [];
    }

    const fechas:
      string[] = [];

    const actual =
      new Date(inicio);

    while (
      actual <= fin
    ) {
      if (
        diasSerie.includes(
          actual.getDay()
        )
      ) {
        const anio =
          actual.getFullYear();

        const mes =
          String(
            actual.getMonth() + 1
          ).padStart(2, "0");

        const dia =
          String(
            actual.getDate()
          ).padStart(2, "0");

        fechas.push(
          `${anio}-${mes}-${dia}`
        );
      }

      actual.setDate(
        actual.getDate() + 1
      );
    }

    return fechas;
  }

  async function obtenerNoDisponibilidad(
    fechaComprobar: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("no_disponibilidades")
      .select("id,fecha_inicio,fecha_fin,motivo")
      .lte("fecha_inicio", fechaComprobar)
      .gte("fecha_fin", fechaComprobar)
      .limit(1);

    if (error) {
      return null;
    }

    return data?.[0] || null;
  }

  async function obtenerNoDisponibilidadesSerie(
    fechasSerie: string[]
  ) {
    if (fechasSerie.length === 0) {
      return [];
    }

    const primeraFecha =
      fechasSerie[0];

    const ultimaFecha =
      fechasSerie[
        fechasSerie.length - 1
      ];

    const {
      data,
      error,
    } = await supabase
      .from("no_disponibilidades")
      .select("id,fecha_inicio,fecha_fin,motivo")
      .lte(
        "fecha_inicio",
        ultimaFecha
      )
      .gte(
        "fecha_fin",
        primeraFecha
      );

    if (error) {
      return [];
    }

    return fechasSerie.flatMap(
      (fechaSerie) => {
        const bloqueo =
          (data || []).find(
            (item) =>
              fechaSerie >=
                item.fecha_inicio &&
              fechaSerie <=
                item.fecha_fin
          );

        if (!bloqueo) {
          return [];
        }

        return [
          {
            ...bloqueo,
            fechaCoincidente:
              fechaSerie,
          },
        ];
      }
    );
  }

  function nombresCompactosAlumnos(
    alumnosEntrada: Array<
      | {
          nombre: string;
          apellidos: string | null;
          apodo: string | null;
        }
      | null
      | undefined
    >
  ) {
    const alumnosValidos =
      alumnosEntrada.filter(
        Boolean
      ) as {
        nombre: string;
        apellidos: string | null;
        apodo: string | null;
      }[];

    const nombresCompletos =
      alumnosValidos.map(
        (alumno) => {
          const apodo =
            (
              alumno.apodo ||
              ""
            ).trim();

          if (apodo) {
            return apodo;
          }

          return `${alumno.nombre || ""} ${
            alumno.apellidos || ""
          }`.trim();
        }
      );

    const textoCompleto =
      nombresCompletos.join(
        " · "
      );

    // Mantiene nombre + apellido mientras el conjunto cabe
    // cómodamente en una tarjeta de Agenda.
    const LIMITE_TEXTO =
      34;

    if (
      textoCompleto.length <=
      LIMITE_TEXTO
    ) {
      return nombresCompletos;
    }

    return alumnosValidos.map(
      (alumno) => {
        const apodo =
          (
            alumno.apodo ||
            ""
          ).trim();

        if (apodo) {
          return apodo;
        }

        return (
          alumno.nombre || ""
        ).trim();
      }
    );
  }

  function datosGoogleDesdeFormulario(
    claseId: string,
    googleEventId: string | null | undefined,
    fechaClase: string,
    estadoClase: string
  ) {
    const nombres =
      nombresCompactosAlumnos(
        alumnosSeleccionados.map(
          (alumnoId) =>
            alumnos.find(
              (item) =>
                item.id ===
                alumnoId
            )
        )
      );

    const ubicacion =
      ubicaciones.find(
        (item) => item.id === ubicacionId
      )?.nombre || null;

    const motivoGoogle =
      estadoClase === "cancelada"
        ? motivoCancelacion.trim()
        : "";

    const observacionesGoogle =
      observaciones.trim();

    const detalleGoogle =
      estadoClase === "cancelada"
        ? [
            motivoGoogle
              ? `Motivo de cancelación: ${motivoGoogle}`
              : "",
            observacionesGoogle
              ? `Observaciones: ${observacionesGoogle}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        : observacionesGoogle;

    return {
      id: claseId,
      google_calendar_event_id: googleEventId || null,
      fecha: fechaClase,
      hora_inicio: hora,
      duracion_minutos: Number(duracion),
      tipo,
      estado: estadoClase,
      observaciones:
        detalleGoogle || null,
      ubicacion,
      alumnos: nombres,
    };
  }

  async function guardarSerie() {
    if (creandoSerie) {
      return;
    }

    if (
      !fecha ||
      !fechaFinSerie
    ) {
      setMensaje(
        "❌ Indica la fecha de inicio y la fecha final de la serie."
      );
      return;
    }

    if (
      diasSerie.length === 0
    ) {
      setMensaje(
        "❌ Selecciona al menos un día de la semana."
      );
      return;
    }

    const fechas =
      fechasDeSerie();

    if (
      fechas.length === 0
    ) {
      setMensaje(
        "❌ No hay fechas que coincidan con los días seleccionados."
      );
      return;
    }

    setCreandoSerie(true);

    const bloqueosSerie =
      await obtenerNoDisponibilidadesSerie(
        fechas
      );

    const fechasBloqueadas =
      new Set(
        bloqueosSerie.map(
          (bloqueo) =>
            bloqueo.fechaCoincidente
        )
      );

    const fechasDisponibles =
      fechas.filter(
        (fechaSerie) =>
          !fechasBloqueadas.has(
            fechaSerie
          )
      );

    const detalleFechasOmitidas =
      bloqueosSerie
        .map((bloqueo) => {
          const [
            anio,
            mes,
            dia,
          ] =
            bloqueo.fechaCoincidente.split(
              "-"
            );

          return `${dia}/${mes}/${anio}${
            bloqueo.motivo
              ? ` (${bloqueo.motivo})`
              : ""
          }`;
        })
        .join(", ");

    const avisoFechasOmitidas =
      bloqueosSerie.length > 0
        ? ` · ⚠️ ${
            bloqueosSerie.length === 1
              ? "Se omitió 1 fecha no disponible"
              : `Se omitieron ${bloqueosSerie.length} fechas no disponibles`
          }: ${detalleFechasOmitidas}`
        : "";

    if (
      fechasDisponibles.length ===
      0
    ) {
      setCreandoSerie(false);
      setMensaje(
        `❌ No se puede crear la serie porque todas sus fechas están marcadas como no disponibles${
          detalleFechasOmitidas
            ? `: ${detalleFechasOmitidas}`
            : "."
        }`
      );
      return;
    }

    setMensaje(
      bloqueosSerie.length > 0
        ? `Creando serie de ${fechasDisponibles.length} clase(s). Se omitirán ${bloqueosSerie.length} fecha(s) no disponible(s)...`
        : `Creando serie de ${fechasDisponibles.length} clase(s)...`
    );

    const modoCobroFinalSerie:
      "por_alumno" | "total" =
      tipo !== "club" &&
      !hayBonoSeleccionado &&
      modoCobroClase === "total"
        ? "total"
        : "por_alumno";

    const importeTotalFinalSerie =
      modoCobroFinalSerie === "total"
        ? Math.floor(
            Number(importeTotalClase)
          )
        : null;

    if (
      modoCobroFinalSerie === "total" &&
      (
        importeTotalClase.trim() === "" ||
        !Number.isFinite(
          importeTotalFinalSerie
        ) ||
        Number(importeTotalFinalSerie) < 0
      )
    ) {
      setCreandoSerie(false);
      setMensaje(
        "❌ No hay un precio total válido. Revisa la tarifa de Clase suelta o introduce el importe manualmente."
      );
      return;
    }

    const participantes =
      tipo === "club"
        ? alumnosSeleccionados.map(
            (alumnoId) => ({
              alumno_id:
                alumnoId,
              importe: 0,
              pagado: true,
              usa_bono: false,
              bono_id: null,
              asistio: true,
            })
          )
        : alumnosSeleccionados.map(
            (alumnoId) => {
              const usaBono =
                modoPagoAlumnos[
                  alumnoId
                ] === "bono";

              return {
                alumno_id:
                  alumnoId,

                importe:
                  usaBono
                    ? (() => {
                        const bono =
                          bonos.find(
                            (item) =>
                              item.id ===
                              bonosSeleccionados[
                                alumnoId
                              ]
                          );

                        if (
                          !bono ||
                          !bono.numero_clases
                        ) {
                          return 0;
                        }

                        const importeClaseBono =
                          Number(
                            bono.importe_pagado ||
                              0
                          ) /
                          Number(
                            bono.numero_clases
                          );

                        if (!bono.grupo_id) {
                          return importeClaseBono;
                        }

                        const usuariosMismoBonoGrupo =
                          alumnosSeleccionados.filter(
                            (id) =>
                              modoPagoAlumnos[
                                id
                              ] === "bono" &&
                              bonosSeleccionados[
                                id
                              ] === bono.id
                          ).length;

                        return usuariosMismoBonoGrupo >
                          0
                          ? importeClaseBono /
                              usuariosMismoBonoGrupo
                          : importeClaseBono;
                      })()
                    : modoCobroFinalSerie ===
                      "total"
                    ? 0
                    : importesAlumnos[
                        alumnoId
                      ]
                    ? Number(
                        importesAlumnos[
                          alumnoId
                        ]
                      )
                    : 0,

                pagado:
                  usaBono
                    ? true
                    : modoCobroFinalSerie ===
                      "total"
                    ? estadoPagoTotal ===
                      "pagado"
                    : estadoPagoAlumnos[
                        alumnoId
                      ] ===
                      "pagado",

                usa_bono:
                  usaBono,

                bono_id:
                  usaBono
                    ? bonosSeleccionados[
                        alumnoId
                      ]
                    : null,

                asistio: true,
              };
            }
          );

    const tarifaClubSerie =
      tipo === "club"
        ? buscarTarifa(
            "club_paga",
            ubicacionId,
            Number(duracion),
            alumnosSeleccionados.length
          )
        : undefined;

    if (
      tipo === "club" &&
      !tarifaClubSerie
    ) {
      const nombreUbicacion =
        ubicaciones.find(
          (item) =>
            item.id === ubicacionId
        )?.nombre ||
        "esta ubicación";

      setCreandoSerie(false);
      setMensaje(
        `❌ No hay una tarifa de club configurada para ${nombreUbicacion}, ${duracion} minutos y ${alumnosSeleccionados.length} alumno${
          alumnosSeleccionados.length ===
          1
            ? ""
            : "s"
        }.`
      );
      return;
    }

    const importeClubSerie =
      tipo === "club"
        ? Number(
            tarifaClubSerie?.importe ||
              0
          )
        : 0;

    const {
      data:
        serieCreada,
      error:
        errorSerie,
    } =
      await supabase
        .from(
          "series_clases"
        )
        .insert({
          fecha_inicio:
            fecha,
          fecha_fin:
            fechaFinSerie,
          dias_semana:
            diasSerie,
          hora_inicio:
            hora,
          duracion_minutos:
            Number(duracion),
          ubicacion_id:
            ubicacionId || null,
          grupo_id:
            grupoId || null,
          tipo,
          observaciones:
            observaciones.trim() ||
            null,
        })
        .select("id")
        .single();

    if (
      errorSerie ||
      !serieCreada
    ) {
      setCreandoSerie(false);
      setMensaje(
        "❌ No se pudo crear la serie: " +
          (
            errorSerie?.message ||
            ""
          )
      );
      return;
    }

    const registrosClases =
      fechasDisponibles.map(
        (fechaClase) => ({
          serie_id:
            serieCreada.id,
          fecha:
            fechaClase,
          hora_inicio:
            hora,
          duracion_minutos:
            Number(duracion),
          ubicacion_id:
            ubicacionId || null,
          grupo_id:
            grupoId || null,
          tipo,
          importe_club:
            importeClubSerie,
          coste_pista:
            tipo === "club"
              ? 0
              : costePista
              ? Number(costePista)
              : 0,
          ingreso_extra:
            ingresoExtra
              ? Number(ingresoExtra)
              : 0,
          modo_cobro:
            modoCobroFinalSerie,
          importe_total:
            importeTotalFinalSerie,
          estado:
            "programada",
          observaciones:
            observaciones.trim() ||
            null,
        })
      );

    const {
      data:
        clasesCreadas,
      error:
        errorClases,
    } =
      await supabase
        .from("clases")
        .insert(
          registrosClases
        )
        .select("id");

    if (
      errorClases ||
      !clasesCreadas
    ) {
      await supabase
        .from(
          "series_clases"
        )
        .delete()
        .eq(
          "id",
          serieCreada.id
        );

      setCreandoSerie(false);
      setMensaje(
        "❌ No se pudieron crear las clases de la serie: " +
          (
            errorClases?.message ||
            ""
          )
      );
      return;
    }

    if (
      participantes.length > 0
    ) {
      const relaciones =
        clasesCreadas.flatMap(
          (claseCreada) =>
            participantes.map(
              (participante) => ({
                clase_id:
                  claseCreada.id,
                ...participante,
              })
            )
        );

      const {
        error:
          errorParticipantes,
      } =
        await supabase
          .from(
            "clase_alumnos"
          )
          .insert(
            relaciones
          );

      if (
        errorParticipantes
      ) {
        setCreandoSerie(false);
        setMensaje(
          `⚠️ La serie se creó, pero hubo un problema al añadir los alumnos.${avisoFechasOmitidas}`
        );

        limpiarFormulario();
        setFormularioAbierto(
          false
        );
        await cargarDatos();
        return;
      }
    }

    const datosGoogleSerie =
      clasesCreadas.map(
        (
          claseCreada,
          indice
        ) =>
          datosGoogleDesdeFormulario(
            claseCreada.id,
            null,
            fechasDisponibles[indice],
            "programada"
          )
      );

    limpiarFormulario();
    setFormularioAbierto(
      false
    );
    setCreandoSerie(false);
    setMensaje(
      `✅ Serie creada: ${fechasDisponibles.length} clase(s)${avisoFechasOmitidas}. Sincronizando con Google Calendar...`
    );

    const sincronizarEnLotes =
      async () => {
        let falloGoogleSerie =
          false;

        const TAMANO_LOTE =
          8;

        for (
          let inicio = 0;
          inicio <
          datosGoogleSerie.length;
          inicio +=
            TAMANO_LOTE
        ) {
          const lote =
            datosGoogleSerie.slice(
              inicio,
              inicio +
                TAMANO_LOTE
            );

          const resultados =
            await Promise.allSettled(
              lote.map(
                (datosGoogle) =>
                  sincronizarClaseConGoogleCalendar(
                    datosGoogle
                  )
              )
            );

          if (
            resultados.some(
              (resultado) =>
                resultado.status ===
                "rejected"
            )
          ) {
            falloGoogleSerie =
              true;
          }
        }

        setMensaje(
          `✅ Serie creada correctamente: ${fechasDisponibles.length} clase(s) programada(s)${avisoFechasOmitidas}${
            falloGoogleSerie
              ? " · ⚠️ Alguna clase no pudo sincronizarse con Google Calendar."
              : " · Google Calendar sincronizado."
          }`
        );

        if (
          volverAlOrigenSiExiste()
        ) {
          return;
        }

        await cargarDatos();
      };

    void sincronizarEnLotes();
  }

  async function ejecutarBorrado(
    clase: Clase,
    alcance:
      | "una"
      | "siguientes"
      | "serie"
  ) {
    setBorrandoSerie(
      true
    );

    try {
      let clasesABorrar:
        Clase[] = [
          clase,
        ];

      if (
        clase.serie_id
      ) {
        const clasesSerie =
          clases.filter(
            (item) =>
              item.serie_id ===
              clase.serie_id
          );

        if (
          alcance ===
          "serie"
        ) {
          clasesABorrar =
            clasesSerie;
        }

        if (
          alcance ===
          "siguientes"
        ) {
          const referencia =
            `${clase.fecha} ${clase.hora_inicio}`;

          clasesABorrar =
            clasesSerie.filter(
              (item) =>
                `${item.fecha} ${item.hora_inicio}` >=
                referencia
            );
        }
      }

      const ids =
        clasesABorrar.map(
          (item) =>
            item.id
        );

      if (
        ids.length > 0
      ) {
        const {
          error:
            errorBorrado,
        } =
          await supabase.rpc(
            "borrar_clases_atomico",
            {
              p_clase_ids:
                ids,
              p_serie_id:
                alcance === "serie" &&
                clase.serie_id
                  ? clase.serie_id
                  : null,
            }
          );

        if (
          errorBorrado
        ) {
          throw new Error(
            errorBorrado.message ||
              "No se pudo borrar la clase de forma segura."
          );
        }
      }

      let falloGoogle = false;

      for (
        const claseABorrar of
        clasesABorrar
      ) {
        try {
          await borrarClaseDeGoogleCalendar({
            id: claseABorrar.id,
            google_calendar_event_id:
              claseABorrar.google_calendar_event_id,
          });
        } catch {
          falloGoogle = true;
        }
      }

      if (
        claseEditandoId &&
        ids.includes(
          claseEditandoId
        )
      ) {
        limpiarFormulario();
        setFormularioAbierto(
          false
        );
      }

      setClasePendienteBorrar(
        null
      );

      const mensajeBorrado =
        alcance === "una"
          ? "✅ Clase borrada correctamente"
          : alcance ===
            "siguientes"
          ? "✅ Esta clase y las siguientes se han borrado correctamente"
          : "✅ Serie completa borrada correctamente";

      setMensaje(
        mensajeBorrado +
          (falloGoogle
            ? " · ⚠️ Algún evento no pudo borrarse de Google Calendar."
            : "")
      );

      await cargarDatos();
    } catch (
      error
    ) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ " + texto
      );
    } finally {
      setBorrandoSerie(
        false
      );
    }
  }

  async function borrarClase(
    clase: Clase
  ) {
    if (
      clase.serie_id
    ) {
      setClasePendienteBorrar(
        clase
      );
      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar esta clase?"
      );

    if (
      !confirmar
    ) {
      return;
    }

    await ejecutarBorrado(
      clase,
      "una"
    );
  }

  function sumarDiasAFecha(
    fechaBase: string,
    dias: number
  ) {
    const [
      anio,
      mes,
      dia,
    ] =
      fechaBase
        .split("-")
        .map(Number);

    const fechaLocal =
      new Date(
        anio,
        mes - 1,
        dia,
        12,
        0,
        0
      );

    fechaLocal.setDate(
      fechaLocal.getDate() +
        dias
    );

    return `${fechaLocal.getFullYear()}-${String(
      fechaLocal.getMonth() + 1
    ).padStart(2, "0")}-${String(
      fechaLocal.getDate()
    ).padStart(2, "0")}`;
  }

  function diferenciaDias(
    fechaOrigen: string,
    fechaDestino: string
  ) {
    const origen =
      new Date(
        `${fechaOrigen}T12:00:00`
      );

    const destino =
      new Date(
        `${fechaDestino}T12:00:00`
      );

    return Math.round(
      (
        destino.getTime() -
        origen.getTime()
      ) /
      (
        24 *
        60 *
        60 *
        1000
      )
    );
  }

  function continuarEdicionSerie(
    alcance:
      | "una"
      | "siguientes"
      | "serie"
  ) {
    alcanceEdicionSerieRef.current =
      alcance;

    setClasePendienteEditar(
      null
    );

    setTimeout(
      () => {
        const formulario =
          document.getElementById(
            "formulario-clase"
          ) as HTMLFormElement | null;

        formulario?.requestSubmit();
      },
      0
    );
  }

  async function guardarClase(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (
      modoCreacion ===
        "serie" &&
      !claseEditandoId
    ) {
      await guardarSerie();
      return;
    }

    if (!claseEditandoId) {
      const bloqueo =
        await obtenerNoDisponibilidad(
          fecha
        );

      if (bloqueo) {
        setMensaje(
          `❌ No puedes crear una clase ese día. Está marcado como no disponible${
            bloqueo.motivo
              ? `: ${bloqueo.motivo}`
              : "."
          }`
        );
        return;
      }
    }

    if (
      tipo !==
      "club"
    ) {
      for (
        const alumnoId of
        alumnosSeleccionados
      ) {
        if (
          modoPagoAlumnos[
            alumnoId
          ] ===
            "bono" &&
          !bonosSeleccionados[
            alumnoId
          ]
        ) {
          setMensaje(
            "❌ Hay un alumno marcado con bono pero no tiene bono seleccionado."
          );

          return;
        }
      }
    }

    if (
      estado === "cancelada" &&
      facturableCancelacion === null
    ) {
      setMensaje(
        "❌ Elige si la clase cancelada se cobra o no se cobra."
      );
      return;
    }

    if (
      estado === "cancelada" &&
      motivoCancelacion.trim().length === 0
    ) {
      setMensaje(
        "❌ Indica el motivo de la cancelación."
      );
      return;
    }

    const claseAnterior =
      claseEditandoId
        ? clases.find(
            (clase) =>
              clase.id ===
              claseEditandoId
          )
        : null;

    if (
      claseAnterior?.serie_id &&
      alcanceEdicionSerieRef.current ===
        null
    ) {
      setClasePendienteEditar(
        claseAnterior
      );

      return;
    }

    const usoAnterior =
      claseAnterior
        ? contarUsoBonos(
            claseAnterior
              .clase_alumnos,
            claseAnterior
              .estado,
            claseAnterior
              .facturable ?? true
          )
        : {};

    const facturableNueva =
      estado === "cancelada"
        ? facturableCancelacion === true
        : true;

    const modoCobroFinal:
      "por_alumno" | "total" =
      tipo !== "club" &&
      !hayBonoSeleccionado &&
      modoCobroClase === "total"
        ? "total"
        : "por_alumno";

    const importeTotalFinal =
      modoCobroFinal === "total"
        ? Math.floor(
            Number(importeTotalClase)
          )
        : null;

    if (
      modoCobroFinal === "total" &&
      (
        importeTotalClase.trim() === "" ||
        !Number.isFinite(
          importeTotalFinal
        ) ||
        Number(importeTotalFinal) < 0
      )
    ) {
      setMensaje(
        "❌ No hay un precio total válido. Revisa la tarifa de Clase suelta o introduce el importe manualmente."
      );
      return;
    }

    const participantesNuevos =
      tipo ===
      "club"
        ? alumnosSeleccionados.map(
            (
              alumnoId
            ) => ({
              alumno_id:
                alumnoId,

              importe:
                0,

              pagado:
                true,

              usa_bono:
                false,

              bono_id:
                null,

              asistio:
                true,
            })
          )
        : alumnosSeleccionados.map(
            (
              alumnoId
            ) => {
              const usaBono =
                modoPagoAlumnos[
                  alumnoId
                ] ===
                "bono";

              return {
                alumno_id:
                  alumnoId,

                importe:
                  usaBono
                    ? (() => {
                        const bono =
                          bonos.find(
                            (item) =>
                              item.id ===
                              bonosSeleccionados[
                                alumnoId
                              ]
                          );

                        if (
                          !bono ||
                          !bono.numero_clases
                        ) {
                          return 0;
                        }

                        const importeClaseBono =
                          Number(
                            bono.importe_pagado ||
                              0
                          ) /
                          Number(
                            bono.numero_clases
                          );

                        if (!bono.grupo_id) {
                          return importeClaseBono;
                        }

                        const usuariosMismoBonoGrupo =
                          alumnosSeleccionados.filter(
                            (id) =>
                              modoPagoAlumnos[
                                id
                              ] === "bono" &&
                              bonosSeleccionados[
                                id
                              ] === bono.id
                          ).length;

                        return usuariosMismoBonoGrupo >
                          0
                          ? importeClaseBono /
                              usuariosMismoBonoGrupo
                          : importeClaseBono;
                      })()
                    : modoCobroFinal ===
                      "total"
                    ? 0
                    : importesAlumnos[
                        alumnoId
                      ]
                    ? Number(
                        importesAlumnos[
                          alumnoId
                        ]
                      )
                    : 0,

                pagado:
                  usaBono
                    ? true
                    : estado === "cancelada" &&
                      !facturableNueva
                    ? false
                    : modoCobroFinal ===
                      "total"
                    ? estadoPagoTotal ===
                      "pagado"
                    : estadoPagoAlumnos[
                        alumnoId
                      ] ===
                      "pagado",

                usa_bono:
                  usaBono,

                bono_id:
                  usaBono
                    ? bonosSeleccionados[
                        alumnoId
                      ]
                    : null,

                asistio:
                  true,
              };
            }
          );

    const tarifaClubClase =
      tipo === "club"
        ? buscarTarifa(
            "club_paga",
            ubicacionId,
            Number(duracion),
            alumnosSeleccionados.length
          )
        : undefined;

    if (
      tipo === "club" &&
      !tarifaClubClase
    ) {
      const nombreUbicacion =
        ubicaciones.find(
          (item) =>
            item.id === ubicacionId
        )?.nombre ||
        "esta ubicación";

      setMensaje(
        `❌ No hay una tarifa de club configurada para ${nombreUbicacion}, ${duracion} minutos y ${alumnosSeleccionados.length} alumno${
          alumnosSeleccionados.length ===
          1
            ? ""
            : "s"
        }.`
      );
      return;
    }

    const importeClubFinal =
      tipo === "club"
        ? Number(
            tarifaClubClase?.importe ||
              0
          )
        : 0;

    const usoNuevo =
      contarUsoBonos(
        participantesNuevos,
        estado,
        facturableNueva
      );

    const datosClase = {
      fecha,

      hora_inicio:
        hora,

      duracion_minutos:
        Number(
          duracion
        ),

      ubicacion_id:
        ubicacionId ||
        null,

      grupo_id:
        grupoId ||
        null,

      tipo,

      importe_club:
        importeClubFinal,

      coste_pista:
        tipo ===
        "club"
          ? 0
          : costePista
          ? Number(
              costePista
            )
          : 0,

      ingreso_extra:
        ingresoExtra
          ? Number(
              ingresoExtra
            )
          : 0,

      modo_cobro:
        modoCobroFinal,

      importe_total:
        importeTotalFinal,

      estado,

      facturable:
        facturableNueva,

      cobrada:
        tipo === "club"
          ? (
              estado === "cancelada" &&
              !facturableNueva
                ? false
                : claseAnterior?.cobrada ?? false
            )
          : false,

      motivo_cancelacion:
        estado === "cancelada"
          ? motivoCancelacion.trim() ||
            null
          : null,

      observaciones:
        observaciones.trim() ||
        null,
    };

    const alcanceEdicionSerie =
      alcanceEdicionSerieRef.current;

    if (
      claseEditandoId &&
      claseAnterior?.serie_id &&
      alcanceEdicionSerie &&
      alcanceEdicionSerie !==
        "una"
    ) {
      const referencia =
        `${claseAnterior.fecha} ${claseAnterior.hora_inicio}`;

      const clasesSerie =
        clases
          .filter(
            (item) =>
              item.serie_id ===
              claseAnterior.serie_id
          )
          .filter(
            (item) =>
              alcanceEdicionSerie ===
                "serie" ||
              `${item.fecha} ${item.hora_inicio}` >=
                referencia
          )
          .sort(
            (a, b) =>
              `${a.fecha} ${a.hora_inicio}`.localeCompare(
                `${b.fecha} ${b.hora_inicio}`
              )
          );

      const desplazamiento =
        diferenciaDias(
          claseAnterior.fecha,
          fecha
        );

      try {
        for (
          const claseObjetivo of
          clasesSerie
        ) {
          const fechaObjetivo =
            sumarDiasAFecha(
              claseObjetivo.fecha,
              desplazamiento
            );

          const usoAnteriorObjetivo =
            contarUsoBonos(
              claseObjetivo.clase_alumnos,
              claseObjetivo.estado,
              claseObjetivo.facturable ?? true
            );

          const usoNuevoObjetivo =
            contarUsoBonos(
              participantesNuevos,
              estado,
              facturableNueva
            );

          const {
            data:
              claseGuardadaId,
            error:
              errorGuardarClase,
          } =
            await supabase.rpc(
              "guardar_clase_atomica",
              {
                p_clase_id:
                  claseObjetivo.id,
                p_datos_clase: {
                  ...datosClase,
                  fecha:
                    fechaObjetivo,
                },
                p_participantes:
                  participantesNuevos,
                p_uso_anterior:
                  usoAnteriorObjetivo,
                p_uso_nuevo:
                  usoNuevoObjetivo,
                p_metodos_pago:
                  metodoPagoAlumnos,
                p_metodo_pago_total:
                  metodoPagoTotal ||
                  null,
              }
            );

          if (
            errorGuardarClase ||
            !claseGuardadaId
          ) {
            throw new Error(
              errorGuardarClase?.message ||
                "No se pudo actualizar una de las clases de forma segura."
            );
          }

          try {
            await sincronizarClaseConGoogleCalendar(
              datosGoogleDesdeFormulario(
                claseObjetivo.id,
                claseObjetivo.google_calendar_event_id,
                fechaObjetivo,
                estado
              )
            );
          } catch {
            // La clase queda guardada en Manager aunque Google falle.
          }
        }

        alcanceEdicionSerieRef.current =
          null;

        setMensaje(
          alcanceEdicionSerie ===
            "siguientes"
            ? "✅ Esta clase y las siguientes se han actualizado correctamente"
            : "✅ Toda la serie se ha actualizado correctamente"
        );

        if (
          volverAlOrigenSiExiste()
        ) {
          return;
        }

        limpiarFormulario();

        setFormularioAbierto(
          false
        );

        await cargarDatos();

        return;
      } catch (
        error
      ) {
        alcanceEdicionSerieRef.current =
          null;

        const texto =
          error instanceof Error
            ? error.message
            : "Error desconocido";

        setMensaje(
          "❌ No se pudo actualizar la serie: " +
            texto
        );

        return;
      }
    }

    const {
      data:
        claseGuardadaId,
      error:
        errorClase,
    } =
      await supabase.rpc(
        "guardar_clase_atomica",
        {
          p_clase_id:
            claseEditandoId ||
            null,
          p_datos_clase:
            datosClase,
          p_participantes:
            participantesNuevos,
          p_uso_anterior:
            usoAnterior,
          p_uso_nuevo:
            usoNuevo,
          p_metodos_pago:
            metodoPagoAlumnos,
          p_metodo_pago_total:
            metodoPagoTotal ||
            null,
        }
      );

    if (
      errorClase ||
      !claseGuardadaId
    ) {
      setMensaje(
        "❌ Error al guardar la clase de forma segura: " +
          (
            errorClase?.message ||
            "Error desconocido"
          )
      );

      return;
    }

    const claseGuardada = {
      id: String(
        claseGuardadaId
      ),
      google_calendar_event_id:
        claseAnterior?.google_calendar_event_id ||
        null,
    };

    let falloGoogle = false;

    try {
      await sincronizarClaseConGoogleCalendar(
        datosGoogleDesdeFormulario(
          claseGuardada.id,
          claseGuardada.google_calendar_event_id ||
            claseAnterior?.google_calendar_event_id ||
            null,
          fecha,
          estado
        )
      );
    } catch {
      falloGoogle = true;
    }

    alcanceEdicionSerieRef.current =
      null;

    setMensaje(
      "✅ Clase guardada correctamente" +
        (falloGoogle
          ? " · ⚠️ No se pudo sincronizar con Google Calendar."
          : "")
    );

    if (
      volverAlOrigenSiExiste()
    ) {
      return;
    }

    limpiarFormulario();
    setFormularioAbierto(
      false
    );

    cargarDatos();
  }

  const alumnosGrupoSeleccionado =
    grupoId
      ? (
          grupos.find(
            (grupo) =>
              grupo.id ===
              grupoId
          )?.grupo_alumnos ||
          []
        )
          .map((item) =>
            alumnos.find(
              (alumno) =>
                alumno.id ===
                item.alumno_id
            )
          )
          .filter(Boolean)
      : [];

  const normalizarBusqueda = (valor: string) =>
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const terminoGrupo =
    normalizarBusqueda(busquedaGrupo);

  const gruposFiltradosBusqueda =
    terminoGrupo
      ? grupos.filter((grupo) =>
          normalizarBusqueda(
            grupo.nombre
          ).includes(terminoGrupo)
        )
      : [];

  const resultadosGrupo =
    mostrarTodosGrupos
      ? gruposFiltradosBusqueda
      : gruposFiltradosBusqueda.slice(0, 4);

  const alumnosFiltrados =
    alumnos.filter(
      (alumno) => {
        const texto =
          `${alumno.nombre} ${
            alumno.apellidos ||
            ""
          }`.toLowerCase();

        return texto.includes(
          busquedaAlumno.toLowerCase()
        );
      }
    );

  const alumnosElegidos =
    alumnos.filter(
      (alumno) =>
        alumnosSeleccionados.includes(
          alumno.id
        )
    );

  const ahoraOrdenClases =
    new Date();

  const hoyOrdenClases =
    `${ahoraOrdenClases.getFullYear()}-${String(
      ahoraOrdenClases.getMonth() + 1
    ).padStart(2, "0")}-${String(
      ahoraOrdenClases.getDate()
    ).padStart(2, "0")}`;

  const clasesFiltradas =
    clases
      .filter(
      (clase) => {
        const nombres =
          clase.clase_alumnos
            .map(
              (item) =>
                item.alumnos
            )
            .filter(
              Boolean
            )
            .map(
              (alumno) =>
                `${
                  alumno?.nombre ||
                  ""
                } ${
                  alumno?.apellidos ||
                  ""
                }`.trim()
            )
            .join(" ")
            .toLowerCase();

        const ubicacion =
          (
            clase
              .ubicaciones
              ?.nombre ||
            ""
          ).toLowerCase();

        const texto =
          busquedaClases.toLowerCase();

        return (
          (
            nombres.includes(
              texto
            ) ||
            ubicacion.includes(
              texto
            )
          ) &&
          (
            filtroEstado ===
              "todas" ||
            clase.estado ===
              filtroEstado
          ) &&
          (
            !filtroMes ||
            clase.fecha.startsWith(
              filtroMes
            )
          ) &&
          (
            !filtroFechaDesde ||
            clase.fecha >=
              filtroFechaDesde
          ) &&
          (
            !filtroFechaHasta ||
            clase.fecha <=
              filtroFechaHasta
          )
        );
      }
    )
      .sort((a, b) => {
        const aEsHoyOFutura =
          a.fecha >= hoyOrdenClases;
        const bEsHoyOFutura =
          b.fecha >= hoyOrdenClases;

        if (
          aEsHoyOFutura !==
          bEsHoyOFutura
        ) {
          return aEsHoyOFutura
            ? -1
            : 1;
        }

        const claveA =
          `${a.fecha} ${a.hora_inicio}`;
        const claveB =
          `${b.fecha} ${b.hora_inicio}`;

        return aEsHoyOFutura
          ? claveA.localeCompare(
              claveB
            )
          : claveB.localeCompare(
              claveA
            );
      });

  const clasesMostradas =
    claseEditandoId
      ? clasesFiltradas.filter(
          (
            clase
          ) =>
            clase.id ===
            claseEditandoId
        )
      : clasesFiltradas;

  const hayFiltrosClases =
    Boolean(busquedaClases) ||
    filtroEstado !== "todas" ||
    Boolean(filtroMes) ||
    Boolean(filtroFechaDesde) ||
    Boolean(filtroFechaHasta);
  function calcularHorario(
    clase: Clase
  ) {
    const [
      horas,
      minutos,
    ] =
      clase.hora_inicio
        .split(":")
        .map(Number);

    const inicio =
      new Date();

    inicio.setHours(
      horas,
      minutos,
      0,
      0
    );

    const fin =
      new Date(
        inicio.getTime() +
          clase.duracion_minutos *
            60 *
            1000
      );

    const horaInicio =
      `${String(
        inicio.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        inicio.getMinutes()
      ).padStart(
        2,
        "0"
      )}`;

    const horaFin =
      `${String(
        fin.getHours()
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        fin.getMinutes()
      ).padStart(
        2,
        "0"
      )}`;

    return {
      horaInicio,
      horaFin,
    };
  }

  function textoTipo(
    tipoClase: string
  ) {
    if (
      tipoClase ===
      "club"
    ) {
      return "Clase para club";
    }

    if (
      tipoClase ===
      "propia"
    ) {
      return "Clase propia";
    }

    if (
      tipoClase ===
      "privada"
    ) {
      return "Pista privada";
    }

    return tipoClase;
  }

  function nombreCompletoAlumno(
    alumno:
      | {
          nombre: string;
          apellidos:
            | string
            | null;
        }
      | null
  ) {
    if (!alumno) {
      return "Sin alumno";
    }

    return `${alumno.nombre} ${
      alumno.apellidos ||
      ""
    }`.trim();
  }

  function pagoDeAlumno(
    claseId: string,
    alumnoId: string
  ) {
    return pagosClase.find(
      (pago) =>
        pago.clase_id ===
          claseId &&
        pago.alumno_id ===
          alumnoId
    );
  }

  const clasesProgramadas =
    clases.filter(
      (clase) =>
        clase.estado ===
        "programada"
    ).length;

  const clasesRealizadas =
    clases.filter(
      (clase) =>
        clase.estado ===
        "realizada"
    ).length;

  const clasesCanceladas =
    clases.filter(
      (clase) =>
        clase.estado ===
        "cancelada"
    ).length;

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">

      <div className="mx-auto w-full max-w-[1540px]">

        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,1fr)_minmax(560px,1.25fr)] xl:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Clases
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Programa, edita y controla alumnos, cobros y series desde un único espacio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                  Total
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {clases.length}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Registradas
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                  Programadas
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {clasesProgramadas}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Pendientes
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8BE7DF]">
                  Realizadas
                </p>
                <p className="mt-1 text-2xl font-bold text-[#8BE7DF]">
                  {clasesRealizadas}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Completadas
                </p>
              </div>

              <div className="rounded-xl border border-red-300/15 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-200">
                  Canceladas
                </p>
                <p className="mt-1 text-2xl font-bold text-red-200">
                  {clasesCanceladas}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Histórico
                </p>
              </div>
            </div>
          </div>

          {!formularioAbierto && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:mt-5 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  limpiarFormulario();
                  setMensaje("");
                  setModoCreacion(
                    "serie"
                  );
                  setFormularioAbierto(
                    true
                  );
                }}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/15 sm:w-auto sm:px-5 sm:text-sm"
              >
                + Nueva serie
              </button>

              <button
                type="button"
                onClick={() => {
                  limpiarFormulario();
                  setMensaje("");
                  setModoCreacion(
                    "individual"
                  );
                  setFormularioAbierto(
                    true
                  );
                }}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#00A79C] px-3 text-xs font-bold text-white transition hover:bg-[#008C83] sm:w-auto sm:px-5 sm:text-sm"
              >
                + Nueva clase
              </button>
            </div>
          )}
        </section>

        {formularioAbierto && (
        <form
          id="formulario-clase"
          onSubmit={
            guardarClase
          }
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:mt-5 sm:p-4 lg:p-5"
        >

          <div className="rounded-2xl bg-[#0F2742] p-3.5 text-white sm:flex sm:items-center sm:justify-between sm:gap-3 sm:p-5">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                <IconoClase />
              </div>

              <div>

                <h2 className="text-xl font-bold text-white">
                  {claseEditandoId
                    ? "Editar clase"
                    : modoCreacion ===
                      "serie"
                    ? "Nueva serie de clases"
                    : "Nueva clase"}
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  {claseEditandoId
                    ? "Modifica los datos de la clase"
                    : modoCreacion ===
                      "serie"
                    ? "Programa automáticamente clases recurrentes"
                    : "Datos y gestión de la clase"}
                </p>

              </div>

            </div>

            {claseEditandoId && (

              <button
                type="button"
                onClick={() => {
                  if (
                    volverAlOrigenSiExiste()
                  ) {
                    return;
                  }

                  limpiarFormulario();
                  setMensaje("");
                  setFormularioAbierto(
                    false
                  );
                }}
                className="mt-3 rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 sm:mt-0"
              >
                Cancelar edición
              </button>

            )}

          </div>

          {!claseEditandoId && (
            <section className="relative z-10 mt-4 overflow-visible rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.025)]">

              <div className="-mx-4 -mt-4 mb-4 flex flex-col gap-2 rounded-t-2xl bg-[#0F2742] px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    1. Participantes
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    Selecciona un grupo o los alumnos de esta clase.
                  </p>
                </div>

                {alumnosSeleccionados.length > 0 && (
                  <span className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                    {alumnosSeleccionados.length} seleccionado{alumnosSeleccionados.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Grupo
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <IconoBuscar />
                    </span>

                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Buscar grupo..."
                      value={busquedaGrupo}
                      onChange={(e) => {
                        setBusquedaGrupo(
                          e.target.value
                        );
                        setMostrarTodosGrupos(
                          false
                        );
                        setListaGruposAbierta(
                          false
                        );
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />

                    {terminoGrupo && (
                      <div className="absolute left-0 right-0 top-[48px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                        {gruposFiltradosBusqueda.length === 0 ? (
                          <div className="px-4 py-4 text-xs text-slate-400">
                            No hay grupos que coincidan con “{busquedaGrupo}”.
                          </div>
                        ) : (
                          <>
                            <div
                              className={
                                mostrarTodosGrupos
                                  ? "max-h-[260px] overflow-y-auto p-1.5"
                                  : "p-1.5"
                              }
                            >
                              {resultadosGrupo.map(
                                (grupo) => (
                                  <button
                                    key={grupo.id}
                                    type="button"
                                    onClick={() => {
                                      seleccionarGrupoRapido(
                                        grupo.id
                                      );
                                      setBusquedaGrupo(
                                        ""
                                      );
                                      setMostrarTodosGrupos(
                                        false
                                      );
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#EEF7F6]"
                                  >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7F5] text-[#00A79C]">
                                      <IconoPersonas />
                                    </span>

                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-[#17324D]">
                                        {grupo.nombre}
                                      </p>
                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                        Seleccionar grupo
                                      </p>
                                    </div>
                                  </button>
                                )
                              )}
                            </div>

                            {gruposFiltradosBusqueda.length > 4 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMostrarTodosGrupos(
                                    (actual) =>
                                      !actual
                                  )
                                }
                                className="flex h-10 w-full items-center justify-center border-t border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-[#17324D] transition hover:bg-slate-100"
                              >
                                {mostrarTodosGrupos
                                  ? "Mostrar menos"
                                  : `Ver las ${gruposFiltradosBusqueda.length} coincidencias`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaGrupo("");
                        setMostrarTodosGrupos(false);
                        setListaGruposAbierta(
                          (actual) => !actual
                        );
                      }}
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-[#17324D] transition hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-2">
                        <IconoPersonas />
                        Seleccionar de la lista
                      </span>
                      <span className="text-slate-400">
                        ⌄
                      </span>
                    </button>

                    {listaGruposAbierta && (
                      <>
                        <button
                          type="button"
                          aria-label="Cerrar lista de grupos"
                          onClick={() =>
                            setListaGruposAbierta(
                              false
                            )
                          }
                          className="fixed inset-0 z-20 cursor-default"
                        />

                        <div className="absolute left-0 right-0 top-[44px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                          <div className="border-b border-slate-100 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Todos los grupos
                            </p>
                          </div>

                          <div className="max-h-[280px] overflow-y-auto p-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                seleccionarGrupoRapido(
                                  ""
                                );
                                setListaGruposAbierta(
                                  false
                                );
                              }}
                              className={
                                !grupoId
                                  ? "flex w-full items-center gap-3 rounded-lg bg-[#E8F7F5] px-3 py-2.5 text-left"
                                  : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                              }
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <IconoPersonas />
                              </span>
                              <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#17324D]">
                                Sin grupo / elegir alumnos
                              </p>
                              {!grupoId && (
                                <span className="text-sm font-bold text-[#00A79C]">
                                  ✓
                                </span>
                              )}
                            </button>

                            {grupos.map((grupo) => (
                              <button
                                key={grupo.id}
                                type="button"
                                onClick={() => {
                                  seleccionarGrupoRapido(
                                    grupo.id
                                  );
                                  setListaGruposAbierta(
                                    false
                                  );
                                }}
                                className={
                                  grupo.id === grupoId
                                    ? "flex w-full items-center gap-3 rounded-lg bg-[#E8F7F5] px-3 py-2.5 text-left"
                                    : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                                }
                              >
                                <span
                                  className={
                                    grupo.id === grupoId
                                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#00A79C]"
                                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"
                                  }
                                >
                                  <IconoPersonas />
                                </span>

                                <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#17324D]">
                                  {grupo.nombre}
                                </p>

                                {grupo.id === grupoId && (
                                  <span className="text-sm font-bold text-[#00A79C]">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {grupoId &&
                    alumnosGrupoSeleccionado.length > 0 && (
                    <div className="mt-2 rounded-xl border border-teal-200 bg-white px-3 py-2.5">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Alumnos del grupo
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">
                        {alumnosGrupoSeleccionado
                          .map(
                            (alumno) =>
                              `${alumno?.nombre || ""} ${alumno?.apellidos || ""}`.trim()
                          )
                          .join(", ")}
                      </p>

                    </div>
                  )}

                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Alumno
                  </label>

                  <input
                    id="buscador-alumno-principal"
                    type="text"
                    placeholder="Buscar alumno..."
                    value={busquedaAlumno}
                    onChange={(e) =>
                      setBusquedaAlumno(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />

                  <div className="mt-2 grid max-h-[125px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">

                    {alumnosFiltrados.map(
                      (alumno) => {
                        const seleccionado =
                          alumnosSeleccionados.includes(
                            alumno.id
                          );

                        return (
                          <label
                            key={alumno.id}
                            className={
                              seleccionado
                                ? "flex cursor-pointer items-center gap-2 rounded-lg border border-teal-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800"
                                : "flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 transition hover:border-teal-200"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() =>
                                cambiarAlumno(
                                  alumno
                                )
                              }
                              className="h-3.5 w-3.5 accent-[#00A79C]"
                            />

                            <span className="min-w-0 truncate">
                              {alumno.nombre} {alumno.apellidos}
                            </span>
                          </label>
                        );
                      }
                    )}

                  </div>
                </div>

              </div>

            </section>
          )}

          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.025)]">
            <div className="border-b border-slate-100 bg-[#0F2742]/[0.035] px-4 py-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#17324D]">
                2. Datos de la clase
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Fecha, horario, duración, ubicación y tipo.
              </p>
            </div>

            <div className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

            <CampoFechaAgenda
              etiqueta={
                modoCreacion === "serie"
                  ? "Fecha inicio"
                  : "Fecha"
              }
              valor={fecha}
              onChange={setFecha}
              required
            />

            {modoCreacion ===
              "serie" && (

              <CampoFechaAgenda
                etiqueta="Fecha final"
                valor={fechaFinSerie}
                min={fecha}
                onChange={setFechaFinSerie}
                required
              />

            )}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Hora
              </label>

              <input
                type="time"
                value={hora}
                onChange={(e) =>
                  setHora(
                    e.target.value
                  )
                }
                required
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Duración
              </label>

              <select
                value={
                  duracion
                }
                onChange={(e) => {
                  const nuevaDuracion =
                    e.target.value;

                  setDuracion(
                    nuevaDuracion
                  );

                  if (
                    !claseEditandoId &&
                    alumnosSeleccionados.length >
                      0
                  ) {
                    actualizarImportesAutomaticos(
                      tipo,
                      ubicacionId,
                      Number(
                        nuevaDuracion
                      ),
                      alumnosSeleccionados.length
                    );
                  }
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              >
                <option value="30">
                  30 minutos
                </option>

                <option value="45">
                  45 minutos
                </option>

                <option value="60">
                  60 minutos
                </option>

                <option value="75">
                  75 minutos
                </option>

                <option value="90">
                  90 minutos
                </option>

                <option value="120">
                  120 minutos
                </option>
              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ubicación
              </label>

              <select
                value={
                  ubicacionId
                }
                onChange={(e) => {
                  const nuevaUbicacionId =
                    e.target.value;

                  setUbicacionId(
                    nuevaUbicacionId
                  );

                  actualizarCostePistaAutomatico(
                    tipo,
                    nuevaUbicacionId
                  );
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              >
                <option value="">
                  Seleccionar ubicación
                </option>

                {ubicaciones.map(
                  (
                    ubicacion
                  ) => (
                    <option
                      key={
                        ubicacion.id
                      }
                      value={
                        ubicacion.id
                      }
                    >
                      {
                        ubicacion.nombre
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="hidden">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Grupo
              </label>

              <select
                value={
                  grupoId
                }
                onChange={(e) => {
                  const nuevoGrupoId =
                    e.target.value;

                  setGrupoId(
                    nuevoGrupoId
                  );

                  if (
                    !nuevoGrupoId
                  ) {
                    return;
                  }

                  const grupo =
                    grupos.find(
                      (
                        item
                      ) =>
                        item.id ===
                        nuevoGrupoId
                    );

                  if (!grupo) {
                    return;
                  }

                  const idsGrupo =
                    grupo.grupo_alumnos.map(
                      (
                        item
                      ) =>
                        item.alumno_id
                    );

                  if (!ubicacionId) {
                    const primerAlumnoConUbicacion =
                      idsGrupo
                        .map((id) =>
                          alumnos.find(
                            (item) =>
                              item.id === id
                          )
                        )
                        .find(
                          (alumno) =>
                            alumno?.ubicacion_habitual_id
                        );

                    if (
                      primerAlumnoConUbicacion
                        ?.ubicacion_habitual_id
                    ) {
                      setUbicacionId(
                        primerAlumnoConUbicacion
                          .ubicacion_habitual_id
                      );

                      actualizarCostePistaAutomatico(
                        tipo,
                        primerAlumnoConUbicacion
                          .ubicacion_habitual_id
                      );
                    }
                  }

                  setAlumnosSeleccionados(
                    idsGrupo
                  );

                  const nuevosImportes:
                    Record<
                      string,
                      string
                    > =
                    {};

                  const nuevosModos:
                    Record<
                      string,
                      "normal" | "bono"
                    > =
                    {};

                  const nuevosBonos:
                    Record<
                      string,
                      string
                    > =
                    {};

                  const nuevosEstados:
                    Record<
                      string,
                      "pagado" | "pendiente"
                    > =
                    {};

                  const nuevosMetodos:
                    Record<
                      string,
                      string
                    > =
                    {};

                  idsGrupo.forEach(
                    (
                      alumnoId
                    ) => {
                      const alumno =
                        alumnos.find(
                          (
                            item
                          ) =>
                            item.id ===
                            alumnoId
                        );

                      nuevosImportes[
                        alumnoId
                      ] =
                        alumno
                          ?.precio_habitual !==
                        null &&
                        alumno
                          ?.precio_habitual !==
                        undefined
                          ? String(
                              alumno.precio_habitual
                            )
                          : "";

                      const bonosAlumno =
                        bonosDelAlumno(
                          alumnoId
                        );

                      const tieneBono =
                        bonosAlumno.length >
                        0;

                      nuevosModos[
                        alumnoId
                      ] =
                        tieneBono
                          ? "bono"
                          : "normal";

                      nuevosEstados[
                        alumnoId
                      ] =
                        "pendiente";

                      nuevosMetodos[
                        alumnoId
                      ] =
                        "efectivo";

                      if (
                        tieneBono
                      ) {
                        nuevosBonos[
                          alumnoId
                        ] =
                          bonosAlumno[0]
                            .id;
                      }
                    }
                  );

                  setImportesAlumnos(
                    nuevosImportes
                  );

                  setModoPagoAlumnos(
                    nuevosModos
                  );

                  setBonosSeleccionados(
                    nuevosBonos
                  );

                  setEstadoPagoAlumnos(
                    nuevosEstados
                  );

                  setMetodoPagoAlumnos(
                    nuevosMetodos
                  );
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              >

                <option value="">
                  Sin grupo
                </option>

                {grupos.map(
                  (
                    grupo
                  ) => (
                    <option
                      key={
                        grupo.id
                      }
                      value={
                        grupo.id
                      }
                    >
                      {
                        grupo.nombre
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Tipo de clase
              </label>

              <select
                value={tipo}
                onChange={(e) => {
                  const nuevoTipo =
                    e.target.value;

                  setTipo(
                    nuevoTipo
                  );

                  actualizarImportesAutomaticos(
                    nuevoTipo,
                    ubicacionId,
                    Number(duracion),
                    alumnosSeleccionados.length
                  );

                  if (
                    nuevoTipo !==
                    "club"
                  ) {
                    setImporteClub(
                      ""
                    );
                  }

                  if (
                    nuevoTipo ===
                    "club"
                  ) {
                    setCostePista(
                      "0"
                    );
                  }
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              >
                <option value="club">
                  Clase para club
                </option>

                <option value="propia">
                  Clase propia en club / pista de pago
                </option>

                <option value="privada">
                  Clase propia en pista privada
                </option>
              </select>

            </div>

          </div>
            </div>
          </section>

          {modoCreacion ===
            "serie" && (

            <div className="mt-4 rounded-2xl border border-[#00A79C]/20 bg-[#E8F7F5] p-5">

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#008C83]">
                Días de repetición
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Selecciona uno o varios días de la semana.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                {[
                  [1, "Lunes"],
                  [2, "Martes"],
                  [3, "Miércoles"],
                  [4, "Jueves"],
                  [5, "Viernes"],
                  [6, "Sábado"],
                  [0, "Domingo"],
                ].map(
                  ([
                    numero,
                    nombre,
                  ]) => {

                    const activo =
                      diasSerie.includes(
                        Number(
                          numero
                        )
                      );

                    return (

                      <button
                        key={
                          String(
                            numero
                          )
                        }
                        type="button"
                        onClick={() =>
                          cambiarDiaSerie(
                            Number(
                              numero
                            )
                          )
                        }
                        className={
                          activo
                            ? "rounded-xl bg-[#00A79C] px-4 py-2.5 text-sm font-semibold text-white"
                            : "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {nombre}
                      </button>

                    );
                  }
                )}

              </div>

              {fecha &&
                fechaFinSerie &&
                diasSerie.length >
                  0 && (

                <p className="mt-4 text-sm font-semibold text-[#008C83]">
                  Se crearán{" "}
                  {
                    fechasDeSerie()
                      .length
                  }{" "}
                  clase(s).
                </p>

              )}

            </div>

          )}

          <div
            className={
              tipo ===
              "club"
                ? "mt-4"
                : "mt-4"
            }
          >

            <div className="hidden">

              <div className="flex items-center gap-3">

                <div className="text-[#00A79C]">
                  <IconoPersonas />
                </div>

                <div>

                  <h3 className="font-bold text-[#17324D]">
                    Alumnos
                  </h3>

                  <p className="text-xs text-slate-500">
                    Selecciona los alumnos de esta clase
                  </p>

                </div>

              </div>

              <input
                type="text"
                placeholder="Buscar alumno..."
                value={
                  busquedaAlumno
                }
                onChange={(e) =>
                  setBusquedaAlumno(
                    e.target.value
                  )
                }
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              />

              <div className="mt-3 grid max-h-[230px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">

                {alumnosFiltrados.map(
                  (
                    alumno
                  ) => {
                    const seleccionado =
                      alumnosSeleccionados.includes(
                        alumno.id
                      );

                    return (
                      <label
                        key={
                          alumno.id
                        }
                        className={
                          seleccionado
                            ? "flex cursor-pointer items-center gap-3 rounded-xl border border-teal-300 bg-teal-50 px-3 py-2.5 text-sm font-medium text-slate-800"
                            : "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/40"
                        }
                      >

                        <input
                          type="checkbox"
                          checked={
                            seleccionado
                          }
                          onChange={() =>
                            cambiarAlumno(
                              alumno
                            )
                          }
                          className="h-4 w-4 accent-[#00A79C]"
                        />

                        <span className="min-w-0 truncate">
                          {
                            alumno.nombre
                          }{" "}
                          {
                            alumno.apellidos
                          }
                        </span>

                      </label>
                    );
                  }
                )}

              </div>

            </div>

            {tipo !==
              "club" && (

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="font-bold text-[#17324D]">
                      Precio y forma de pago
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Elige si el precio corresponde a cada alumno o a la clase completa
                    </p>

                  </div>

                  {alumnosElegidos.length > 0 && (
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModoCobroClase(
                            "por_alumno"
                          );
                          setModoCobroManual(true);
                          setImportePorAlumnoManual(
                            alumnosElegidos.length !== 1
                          );
                          setImportesAlumnos(
                            (actuales) => {
                              const siguientes = {
                                ...actuales,
                              };

                              alumnosElegidos.forEach(
                                (alumno) => {
                                  if (
                                    siguientes[alumno.id]
                                  ) {
                                    return;
                                  }

                                  siguientes[alumno.id] =
                                    alumno.precio_habitual !== null
                                      ? String(
                                          alumno.precio_habitual
                                        )
                                      : "";
                                }
                              );

                              return siguientes;
                            }
                          );
                        }}
                        className={
                          modoCobroClase ===
                          "por_alumno"
                            ? "rounded-lg bg-[#17324D] px-3 py-2 text-xs font-bold text-white"
                            : "rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        }
                      >
                        Por alumno
                      </button>

                      <button
                        type="button"
                        disabled={
                          hayBonoSeleccionado
                        }
                        onClick={() => {
                          if (hayBonoSeleccionado) {
                            return;
                          }

                          setModoCobroClase(
                            "total"
                          );
                          setModoCobroManual(true);
                          setImporteTotalManual(false);
                          setImporteTotalClase(
                            calcularPrecioTotalAutomatico(
                              alumnosSeleccionados.length,
                              Number(duracion)
                            )
                          );
                        }}
                        className={
                          hayBonoSeleccionado
                            ? "cursor-not-allowed rounded-lg px-3 py-2 text-xs font-bold text-slate-300"
                            : modoCobroClase ===
                              "total"
                            ? "rounded-lg bg-[#00A79C] px-3 py-2 text-xs font-bold text-white"
                            : "rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        }
                        title={
                          hayBonoSeleccionado
                            ? "Las clases con bono mantienen su gestión por alumno/bono"
                            : "Precio único para toda la clase"
                        }
                      >
                        Precio total
                      </button>
                    </div>
                  )}

                  {modoCobroClase ===
                    "por_alumno" &&
                    alumnosElegidos.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEstadoPagoAlumnos(
                          (actuales) => {
                            const siguientes = {
                              ...actuales,
                            };

                            alumnosElegidos.forEach(
                              (alumno) => {
                                const modo =
                                  modoPagoAlumnos[
                                    alumno.id
                                  ] ||
                                  "normal";

                                if (
                                  modo ===
                                  "normal"
                                ) {
                                  siguientes[
                                    alumno.id
                                  ] =
                                    "pagado";
                                }
                              }
                            );

                            return siguientes;
                          }
                        )
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition hover:border-green-300 hover:bg-green-100"
                    >
                      Marcar todos como pagados
                    </button>
                  )}

                </div>

                {alumnosElegidos.length ===
                0 ? (

                  <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 px-5 text-center">

                    <p className="text-sm text-slate-400">
                      Selecciona al menos un alumno para configurar el pago.
                    </p>

                  </div>

                ) : (

                  <div className="mt-3 space-y-3">

                    {modoCobroClase === "total" &&
                      !hayBonoSeleccionado && (
                      <div className="rounded-xl border border-[#BDE7DA] bg-[#F6FCFB] p-3.5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#008C83]">
                              Precio total de la clase
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                importeTotalClase
                              }
                              onChange={(e) => {
                                setImporteTotalClase(
                                  e.target.value
                                );
                                setImporteTotalManual(true);
                              }}
                              placeholder="0"
                              className="w-full rounded-lg border border-[#A8E1DC] bg-white px-3 py-2.5 text-sm font-bold text-[#17324D] outline-none focus:border-[#00A79C]"
                            />
                            <p className="mt-1.5 text-[11px] text-slate-500">
                              Calculado desde Tarifas · Clase suelta · 60 min · {alumnosSeleccionados.length} alumno{alumnosSeleccionados.length === 1 ? "" : "s"}, ajustado a {duracion} min y redondeado hacia abajo. Puedes modificarlo manualmente.
                            </p>
                          </div>

                          <div className="grid flex-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                Estado
                              </label>
                              <select
                                value={
                                  estadoPagoTotal
                                }
                                onChange={(e) =>
                                  setEstadoPagoTotal(
                                    e.target.value as
                                      | "pagado"
                                      | "pendiente"
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                              >
                                <option value="pendiente">
                                  Pendiente
                                </option>
                                <option value="pagado">
                                  Pagado
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                Método
                              </label>
                              <select
                                value={
                                  metodoPagoTotal
                                }
                                onChange={(e) =>
                                  setMetodoPagoTotal(
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                              >
                                <option value="efectivo">
                                  Efectivo
                                </option>
                                <option value="bizum">
                                  Bizum
                                </option>
                                <option value="transferencia">
                                  Transferencia
                                </option>
                                <option value="tarjeta">
                                  Tarjeta
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2 xl:grid-cols-2">
                    {alumnosElegidos.map(
                      (
                        alumno
                      ) => {
                        const bonosAlumno =
                          bonosDelAlumno(
                            alumno.id
                          );

                        const modo =
                          modoPagoAlumnos[
                            alumno.id
                          ] ||
                          "normal";

                        return (
                          <div
                            key={
                              alumno.id
                            }
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                              <p className="font-bold text-[#17324D]">
                                {
                                  alumno.nombre
                                }{" "}
                                {
                                  alumno.apellidos
                                }
                              </p>

                              <div className="flex flex-wrap items-center gap-2">

                                {alumnosElegidos.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      cambiarAlumno(
                                        alumno
                                      )
                                    }
                                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                                    title="Quitar este alumno de la clase"
                                  >
                                    Quitar alumno
                                  </button>
                                )}

                                <div className="flex rounded-lg bg-slate-100 p-1">

                                <button
                                  type="button"
                                  onClick={() => {
                                    setModoPagoAlumnos(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          "normal",
                                      })
                                    );
                                  }}
                                  className={
                                    modo ===
                                    "normal"
                                      ? "rounded-md bg-white px-3 py-1.5 text-xs font-bold text-[#17324D] shadow-sm"
                                      : "rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500"
                                  }
                                >
                                  Pago normal
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    bonosAlumno.length ===
                                    0
                                  }
                                  onClick={() => {
                                    if (
                                      bonosAlumno.length ===
                                      0
                                    ) {
                                      return;
                                    }

                                    setModoPagoAlumnos(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          "bono",
                                      })
                                    );
                                    setModoCobroClase(
                                      "por_alumno"
                                    );
                                    setImporteTotalManual(false);

                                    if (
                                      !bonosSeleccionados[
                                        alumno.id
                                      ]
                                    ) {
                                      setBonosSeleccionados(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            bonosAlumno[0]
                                              .id,
                                        })
                                      );
                                    }
                                  }}
                                  className={
                                    modo ===
                                    "bono"
                                      ? "rounded-md bg-white px-3 py-1.5 text-xs font-bold text-[#008C83] shadow-sm"
                                      : bonosAlumno.length ===
                                        0
                                      ? "cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300"
                                      : "rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500"
                                  }
                                >
                                  Bono
                                </button>

                                </div>

                              </div>

                            </div>

                            {modo ===
                            "bono" ? (

                              <div className="mt-3">

                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                  Bono
                                </label>

                                <select
                                  value={
                                    bonosSeleccionados[
                                      alumno.id
                                    ] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setBonosSeleccionados(
                                      (
                                        actuales
                                      ) => ({
                                        ...actuales,
                                        [alumno.id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                >

                                  {bonosAlumno.map(
                                    (
                                      bono
                                    ) => (
                                      <option
                                        key={
                                          bono.id
                                        }
                                        value={
                                          bono.id
                                        }
                                      >
                                        {textoBono(
                                          bono,
                                          alumno.id
                                        )}
                                      </option>
                                    )
                                  )}

                                </select>

                              </div>

                            ) : modoCobroClase ===
                              "total" ? (

                              <div className="mt-3 rounded-lg border border-[#BDE7DA] bg-[#F6FCFB] px-3 py-2.5 text-sm font-semibold text-[#008C83]">
                                Incluido en el precio total de la clase
                              </div>

                            ) : (

                              <div className="mt-3 grid gap-3 sm:grid-cols-3">

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Importe
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      importesAlumnos[
                                        alumno.id
                                      ] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      setImportePorAlumnoManual(
                                        true
                                      );
                                      setImportesAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target.value,
                                        })
                                      );
                                    }}
                                    placeholder="0,00"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                                  />

                                </div>

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Estado
                                  </label>

                                  <select
                                    value={
                                      estadoPagoAlumnos[
                                        alumno.id
                                      ] ||
                                      "pendiente"
                                    }
                                    onChange={(e) =>
                                      setEstadoPagoAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target
                                              .value as
                                              | "pagado"
                                              | "pendiente",
                                        })
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                  >
                                    <option value="pendiente">
                                      Pendiente
                                    </option>

                                    <option value="pagado">
                                      Pagado
                                    </option>
                                  </select>

                                </div>

                                <div>

                                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Método
                                  </label>

                                  <select
                                    value={
                                      metodoPagoAlumnos[
                                        alumno.id
                                      ] ||
                                      "efectivo"
                                    }
                                    onChange={(e) =>
                                      setMetodoPagoAlumnos(
                                        (
                                          actuales
                                        ) => ({
                                          ...actuales,
                                          [alumno.id]:
                                            e.target.value,
                                        })
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                  >
                                    <option value="efectivo">
                                      Efectivo
                                    </option>

                                    <option value="bizum">
                                      Bizum
                                    </option>

                                    <option value="transferencia">
                                      Transferencia
                                    </option>

                                    <option value="tarjeta">
                                      Tarjeta
                                    </option>
                                  </select>

                                </div>

                              </div>

                            )}

                          </div>
                        );
                      }
                    )}
                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.025)]">
            <div className="border-b border-slate-100 bg-[#0F2742]/[0.035] px-4 py-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#17324D]">
                3. Economía y estado
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Importes, coste de pista, ingresos adicionales y estado operativo.
              </p>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">

            {tipo ===
              "club" && (

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Importe que paga el club
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      importeClub
                    }
                    onChange={(e) =>
                      setImporteClub(
                        e.target.value
                      )
                    }
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    €
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Se busca automáticamente en Tarifas según ubicación, duración y número de alumnos. Puedes cambiarlo manualmente para esta clase.
                </p>

              </div>

            )}

            {tipo ===
              "propia" && (

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Coste de pista
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      costePista
                    }
                    onChange={(e) =>
                      setCostePista(
                        e.target.value
                      )
                    }
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    €
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Se busca primero en Tarifas según ubicación, duración y número de alumnos. Si no existe, usa el coste habitual de la ubicación. Puedes cambiarlo manualmente para esta clase.
                </p>

              </div>

            )}

            {tipo ===
              "privada" && (

              <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">

                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Pista privada
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  No hay coste de pista. El cobro se gestiona directamente con los alumnos.
                </p>

              </div>

            )}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ingreso extra
              </label>

              <div className="relative">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    ingresoExtra
                  }
                  onChange={(e) =>
                    setIngresoExtra(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  €
                </span>

              </div>

              <p className="mt-2 text-xs text-slate-500">
                Opcional. Para propinas u otros ingresos excepcionales de esta clase.
              </p>

            </div>

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Estado
              </label>

              <select
                value={
                  estado
                }
                onChange={(e) => {
                  const nuevoEstado =
                    e.target.value;

                  if (
                    nuevoEstado === "cancelada" &&
                    estado !== "cancelada"
                  ) {
                    setFacturableCancelacion(
                      null
                    );
                  }

                  if (
                    nuevoEstado !== "cancelada"
                  ) {
                    setFacturableCancelacion(
                      null
                    );
                  }

                  setEstado(
                    nuevoEstado
                  );
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
              >
                <option value="programada">
                  Programada
                </option>

                <option value="realizada">
                  Realizada
                </option>

                <option value="cancelada">
                  Cancelada
                </option>
              </select>

            </div>

            </div>
          </section>

          {estado === "cancelada" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
                ¿Esta cancelación se cobra?
              </p>

              <div className="grid max-w-md grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFacturableCancelacion(
                      true
                    )
                  }
                  className={
                    facturableCancelacion === true
                      ? "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
                      : "rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
                  }
                >
                  Se cobra
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFacturableCancelacion(
                      false
                    )
                  }
                  className={
                    facturableCancelacion === false
                      ? "rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  }
                >
                  No se cobra
                </button>
              </div>

              <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-red-700">
                Motivo de cancelación
              </label>

              <textarea
                value={
                  motivoCancelacion
                }
                onChange={(e) =>
                  setMotivoCancelacion(
                    e.target.value
                  )
                }
                rows={2}
                placeholder="Indica el motivo de la cancelación..."
                className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-red-300"
              />
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.025)]">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
              Anotación
            </label>

            <textarea
              value={
                observaciones
              }
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              rows={2}
              placeholder="Añade una anotación sobre esta clase..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#00A79C]/60"
            />

            <p className="mt-2 text-xs text-slate-500">
              Opcional. Es independiente del motivo de cancelación.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              {mensaje && (
                <p
                  className={
                    mensaje.startsWith(
                      "❌"
                    )
                      ? "text-sm font-semibold text-red-600"
                      : mensaje.startsWith(
                          "⚠️"
                        )
                      ? "text-sm font-semibold text-amber-600"
                      : mensaje ===
                        "Editando clase"
                      ? "text-sm font-semibold text-blue-600"
                      : "text-sm font-semibold text-green-600"
                  }
                >
                  {mensaje}
                </p>
              )}

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => {
                  if (
                    volverAlOrigenSiExiste()
                  ) {
                    return;
                  }

                  limpiarFormulario();
                  setMensaje("");
                  setFormularioAbierto(
                    false
                  );
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#17324D] transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  modoCreacion ===
                    "serie" &&
                  creandoSerie
                }
                className="h-11 min-w-[180px] rounded-xl bg-[#00A79C] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.12)] transition hover:bg-[#008C83] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claseEditandoId
                  ? "Guardar cambios"
                  : modoCreacion ===
                    "serie"
                  ? creandoSerie
                    ? "Creando serie..."
                    : "Crear serie"
                  : "Guardar clase"}
              </button>

            </div>

          </div>

        </form>
        )}

        {!formularioAbierto && mensaje && (
          <div
            className={
              mensaje.startsWith("❌")
                ? "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mt-5"
                : mensaje.startsWith("⚠️") || mensaje.includes("⚠️")
                ? "mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 sm:mt-5"
                : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 sm:mt-5"
            }
          >
            {mensaje}
          </div>
        )}

        <section className="relative mt-4 rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:mt-5 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                <IconoCalendario />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                  Gestión
                </p>

                <h2 className="mt-0.5 text-xl font-bold text-white">
                  {claseEditandoId
                    ? "Clase que estás editando"
                    : "Clases registradas"}
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  {claseEditandoId
                    ? "Solo se muestra la clase seleccionada"
                    : "Consulta, filtra y gestiona las clases por orden cronológico"}
                </p>
              </div>

            </div>

            {!claseEditandoId && (
              <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                {clasesFiltradas.length}{" "}
                {clasesFiltradas.length === 1
                  ? "clase"
                  : "clases"}
              </div>
            )}

          </div>

          {!claseEditandoId && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">

                <div className="col-span-2 min-w-0 sm:min-w-[280px] sm:flex-1">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                    Buscar
                  </span>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4DD4CA]">
                      <IconoBuscar />
                    </span>

                    <input
                      type="text"
                      placeholder="Alumno o ubicación..."
                      value={busquedaClases}
                      onChange={(e) =>
                        setBusquedaClases(
                          e.target.value
                        )
                      }
                      className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 hover:bg-white/15 focus:border-[#4DD4CA]/45 focus:ring-2 focus:ring-[#00A79C]/15"
                    />
                  </div>
                </div>

                <CampoEstadoClases
                  valor={filtroEstado}
                  onChange={
                    setFiltroEstado
                  }
                />

                <CampoMesAgenda
                  valor={filtroMes}
                  onChange={(valor) => {
                    setFiltroMes(valor);
                    if (valor) {
                      setFiltroFechaDesde(
                        ""
                      );
                      setFiltroFechaHasta(
                        ""
                      );
                    }
                  }}
                />

                <CampoFechaFiltro
                  etiqueta="Desde"
                  valor={filtroFechaDesde}
                  onChange={(valor) => {
                    setFiltroFechaDesde(
                      valor
                    );
                    if (valor) {
                      setFiltroMes(
                        ""
                      );
                    }
                  }}
                />

                <CampoFechaFiltro
                  etiqueta="Hasta"
                  valor={filtroFechaHasta}
                  min={
                    filtroFechaDesde ||
                    undefined
                  }
                  onChange={(valor) => {
                    setFiltroFechaHasta(
                      valor
                    );
                    if (valor) {
                      setFiltroMes(
                        ""
                      );
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={!hayFiltrosClases}
                  onClick={() => {
                    setBusquedaClases(
                      ""
                    );
                    setFiltroEstado(
                      "todas"
                    );
                    setFiltroMes(
                      ""
                    );
                    setFiltroFechaDesde(
                      ""
                    );
                    setFiltroFechaHasta(
                      ""
                    );
                  }}
                  className="col-span-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 sm:col-span-1 sm:w-auto sm:shrink-0"
                >
                  <IconoRestablecer />
                  Limpiar
                </button>

              </div>
            </div>
          )}

        </section>

          <div className="mt-3 space-y-3 sm:mt-4">

            {clasesMostradas.length === 0 && (

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">

                <p className="font-semibold text-slate-600">
                  No hay clases para mostrar
                </p>

              </div>

            )}

            {clasesMostradas.map(
              (clase) => {
                const {
                  horaInicio,
                  horaFin,
                } = calcularHorario(
                  clase
                );

                const [
                  anio,
                  mes,
                  dia,
                ] = clase.fecha.split(
                  "-"
                );

                const importeTotalAlumnos =
                  clase.modo_cobro ===
                    "total"
                    ? Number(
                        clase.importe_total ||
                          0
                      )
                    : clase.clase_alumnos.reduce(
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

                const tarifaClubVisual =
                  clase.tipo === "club" &&
                  clase.ubicacion_id
                    ? buscarTarifaEnLista(
                        tarifas,
                        "club_paga",
                        clase.ubicacion_id,
                        clase.duracion_minutos,
                        clase.clase_alumnos.length,
                        clase.ubicaciones?.nombre
                      )
                    : undefined;

                const importeBase =
                  clase.tipo === "club"
                    ? Number(
                        Number(
                          clase.importe_club ||
                            0
                        ) > 0
                          ? clase.importe_club
                          : tarifaClubVisual
                              ?.importe || 0
                      )
                    : importeTotalAlumnos;

                const costePistaClase =
                  Number(
                    clase.coste_pista ||
                      0
                  );

                const ingresoExtraClase =
                  Number(
                    clase.ingreso_extra ||
                      0
                  );

                const resultadoClase =
                  clase.estado ===
                    "cancelada" &&
                  clase.facturable === false
                    ? 0
                    : (clase.tipo ===
                      "club"
                        ? importeBase
                        : importeBase -
                          costePistaClase) +
                      ingresoExtraClase;

                const textoEstado =
                  clase.estado ===
                  "cancelada"
                    ? "Cancelada"
                    : clase.estado ===
                      "realizada"
                    ? "Realizada"
                    : "Programada";

                const estadoEconomico =
                  estadoEconomicoClase(
                    clase,
                    pagosClase
                  );

                const textoEstadoEconomico =
                  estadoEconomico ===
                  "cobrada"
                    ? "Cobrada"
                    : estadoEconomico ===
                      "no_facturable"
                    ? "No facturable"
                    : "Pendiente";

                return (
                  <article
                    key={clase.id}
                    className={
                      clase.estado ===
                      "cancelada"
                        ? "overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                        : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-slate-300"
                    }
                  >
                    {/* CABECERA DE LA CLASE */}
                    <div
                      className={
                        clase.estado ===
                        "cancelada"
                          ? "flex flex-col gap-3 border-b border-red-100 bg-red-50/60 px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                          : "flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                      }
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A79C]/10 text-[#00A79C]">
                          <IconoCalendario />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm font-bold text-[#17324D]">
                              {dia}/{mes}/{anio}
                            </p>
                            <span className="text-slate-300">
                              •
                            </span>
                            <p className="text-sm font-bold text-[#17324D]">
                              {horaInicio} h a {horaFin} h
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              {clase.duracion_minutos} min
                            </span>
                          </div>

                          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                            <IconoUbicacion />
                            <span className="truncate">
                              {clase.ubicaciones?.nombre ||
                                "Sin ubicación"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:justify-end">
                        {clase.serie_id && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                            Serie
                          </span>
                        )}

                        {clase.observaciones?.trim() &&
                          (
                            clase.estado !== "cancelada" ||
                            Boolean(
                              clase.motivo_cancelacion?.trim()
                            )
                          ) && (
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-500 bg-amber-500 text-white"
                            title="Esta clase tiene una anotación"
                            aria-label="Esta clase tiene una anotación"
                          >
                            <IconoNota />
                          </span>
                        )}

                        <span
                          className={
                            clase.estado ===
                            "cancelada"
                              ? "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                              : clase.estado ===
                                "realizada"
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                              : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
                          }
                        >
                          {textoEstado}
                        </span>

                        {clase.estado === "cancelada" && (
                          <span
                            className={
                              clase.facturable === false
                                ? "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                                : "rounded-full border border-[#00A79C]/25 bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008C83]"
                            }
                            title={
                              clase.facturable === false
                                ? "Esta cancelación no se cobra"
                                : "Esta cancelación se cobra"
                            }
                          >
                            {clase.facturable === false
                              ? "No se cobra"
                              : "Se cobra"}
                          </span>
                        )}

                        <span
                          className={
                            estadoEconomico === "cobrada"
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                              : estadoEconomico === "no_facturable"
                              ? "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500"
                              : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                          }
                          title={`Cobro: ${textoEstadoEconomico}`}
                        >
                          <span className="mr-1 text-[11px] font-black">
                            €
                          </span>
                          {textoEstadoEconomico}
                        </span>

                      </div>
                    </div>

                    {/* CONTENIDO: misma jerarquía visual que las fichas de Alumnos */}
                    <div className="grid xl:grid-cols-[1.4fr_0.9fr_1.05fr]">
                      {/* ALUMNOS */}
                      <section className="p-3.5 sm:p-4 xl:border-r xl:border-slate-100">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                          <span className="text-[#00A79C]">
                            <IconoAlumno />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-[#17324D]">
                              Alumnos
                            </h3>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Participantes y situación de cobro
                            </p>
                          </div>
                        </div>

                        {clase.clase_alumnos.length >
                        0 ? (
                          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-[#FBFCFD]">
                            {clase.clase_alumnos.map(
                              (
                                participante
                              ) => {
                                const pago =
                                  pagoDeAlumno(
                                    clase.id,
                                    participante.alumno_id
                                  );

                                return (
                                  <div
                                    key={
                                      participante.alumno_id
                                    }
                                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                                  >
                                    <span className="text-xs font-semibold text-[#17324D]">
                                      {nombreCompletoAlumno(
                                        participante.alumnos
                                      )}
                                    </span>

                                    {clase.tipo ===
                                    "club" ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00A79C]/20 bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008C83] [&_svg]:h-3.5 [&_svg]:w-3.5">
                                        <IconoAlumno />
                                        Alumno club
                                      </span>
                                    ) : participante.usa_bono ? (
                                      <span className="rounded-full bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008C83]">
                                        Bono
                                      </span>
                                    ) : clase.estado !==
                                      "realizada" ? (
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                        {Number(
                                          participante.importe ||
                                            0
                                        ).toFixed(2)} €
                                      </span>
                                    ) : pago?.estado ===
                                      "pagado" ? (
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                        Pagado · {Number(
                                          participante.importe ||
                                            0
                                        ).toFixed(2)} €
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                                        Pendiente · {Number(
                                          participante.importe ||
                                            0
                                        ).toFixed(2)} €
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs font-medium text-slate-400">
                            Sin alumnos asignados.
                          </p>
                        )}
                      </section>

                      {/* DATOS DE LA CLASE */}
                      <section className="p-4 xl:border-r xl:border-slate-100">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                          <span className="text-[#00A79C]">
                            <IconoClase />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-[#17324D]">
                              Detalles
                            </h3>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Configuración de la clase
                            </p>
                          </div>
                        </div>

                        <div className="mt-1 divide-y divide-slate-100">
                          <div className="flex items-start gap-3 py-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
                              <IconoClase />
                            </span>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                Tipo
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                {textoTipo(
                                  clase.tipo
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 py-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
                              <IconoReloj />
                            </span>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                Duración
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                {clase.duracion_minutos} minutos
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 py-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
                              <IconoCalendario />
                            </span>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                Programación
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                {clase.serie_id
                                  ? "Serie recurrente"
                                  : "Clase individual"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* ECONOMÍA */}
                      <section className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                          <span className="text-[#00A79C]">
                            <IconoEuro />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-[#17324D]">
                              Economía
                            </h3>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Ingresos, costes y resultado
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#FBFCFD] px-3 py-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {clase.tipo ===
                              "club"
                                ? "A cobrar al club"
                                : clase.modo_cobro === "total"
                                ? "Precio total"
                                : "Valor alumnos"}
                            </span>
                            <span className="text-sm font-bold text-[#17324D]">
                              {importeBase.toFixed(
                                2
                              )} €
                              {clase.tipo === "club" &&
                                importeBase === 0 && (
                                  <span className="ml-2 text-[9px] font-bold text-amber-600">
                                    Sin tarifa coincidente
                                  </span>
                                )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#FBFCFD] px-3 py-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Pista
                            </span>
                            <span
                              className={
                                costePistaClase >
                                0
                                  ? "text-sm font-bold text-red-600"
                                  : "text-sm font-semibold text-slate-500"
                              }
                            >
                              {costePistaClase > 0
                                ? `-${costePistaClase.toFixed(
                                    2
                                  )} €`
                                : "Sin coste"}
                            </span>
                          </div>

                          {ingresoExtraClase >
                            0 && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#FBFCFD] px-3 py-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Extra
                              </span>
                              <span className="text-sm font-bold text-violet-700">
                                +{ingresoExtraClase.toFixed(
                                  2
                                )} €
                              </span>
                            </div>
                          )}

                          <div
                            className={
                              resultadoClase > 0
                                ? "flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3"
                                : resultadoClase < 0
                                ? "flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3"
                                : "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                            }
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              Resultado
                            </span>
                            <span
                              className={
                                resultadoClase > 0
                                  ? "text-lg font-bold text-emerald-700"
                                  : resultadoClase < 0
                                  ? "text-lg font-bold text-red-600"
                                  : "text-lg font-bold text-slate-700"
                              }
                            >
                              {resultadoClase.toFixed(
                                2
                              )} €
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>

                    {clase.estado === "cancelada" &&
                      (
                        clase.motivo_cancelacion?.trim() ||
                        (
                          !clase.motivo_cancelacion &&
                          clase.observaciones?.trim()
                        )
                      ) && (
                      <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-red-600">
                          Motivo de cancelación
                        </p>
                        <p className="mt-1 text-xs text-red-900">
                          {clase.motivo_cancelacion ||
                            clase.observaciones}
                        </p>
                      </div>
                    )}

                    {clase.observaciones?.trim() &&
                      (
                        clase.estado !== "cancelada" ||
                        Boolean(
                          clase.motivo_cancelacion?.trim()
                        )
                      ) && (
                      <div className="border-t border-slate-100 bg-[#FBFCFD] px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Anotación
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {clase.observaciones}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-slate-100 bg-[#0F2742] px-3 py-3 sm:px-4">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                        {!claseEditandoId && (
                          <button
                            type="button"
                            onClick={() =>
                              editarClase(
                                clase
                              )
                            }
                            className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 sm:w-auto"
                          >
                            <IconoEditar />
                            <span className="truncate">
                              Editar
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            borrarClase(
                              clase
                            )
                          }
                          className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20 sm:w-auto"
                        >
                          <IconoBorrar />
                          <span className="truncate">
                            Borrar
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}

          </div>


      </div>


      {clasePendienteEditar && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-[#17324D]">
              Guardar cambios de una serie
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta clase pertenece a una serie recurrente. Elige a qué clases quieres aplicar los cambios.
            </p>

            <div className="mt-6 grid gap-3">

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "una"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-left font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Solo esta clase
              </button>

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "siguientes"
                  )
                }
                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-left font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Esta clase y las siguientes
              </button>

              <button
                type="button"
                onClick={() =>
                  continuarEdicionSerie(
                    "serie"
                  )
                }
                className="rounded-xl bg-[#00A79C] px-5 py-3 text-left font-semibold text-white transition hover:bg-[#008C83]"
              >
                Toda la serie
              </button>

            </div>

            <button
              type="button"
              onClick={() => {
                alcanceEdicionSerieRef.current =
                  null;

                setClasePendienteEditar(
                  null
                );
              }}
              className="mt-5 w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800"
            >
              Cancelar
            </button>

          </div>

        </div>

      )}

      {clasePendienteBorrar && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-[#17324D]">
              Borrar clase de una serie
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta clase pertenece a una serie recurrente. Elige qué quieres borrar.
            </p>

            <div className="mt-6 grid gap-3">

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "una"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-left font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Solo esta clase
              </button>

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "siguientes"
                  )
                }
                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-left font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Esta clase y las siguientes
              </button>

              <button
                type="button"
                disabled={
                  borrandoSerie
                }
                onClick={() =>
                  ejecutarBorrado(
                    clasePendienteBorrar,
                    "serie"
                  )
                }
                className="rounded-xl bg-red-600 px-5 py-3 text-left font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Toda la serie
              </button>

            </div>

            <button
              type="button"
              disabled={
                borrandoSerie
              }
              onClick={() =>
                setClasePendienteBorrar(
                  null
                )
              }
              className="mt-5 w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>

          </div>

        </div>

      )}

    </main>
  );
}                