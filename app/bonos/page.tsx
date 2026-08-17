"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

import { generarImagenBono } from "../../components/bonos/generarImagenBono";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Grupo = {
  id: string;
  nombre: string;
  grupo_alumnos: {
    alumno_id: string;
  }[];
};

type UsoBono = {
  bono_id: string | null;
  alumno_id: string;
  usa_bono: boolean;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;

  clases: {
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    estado: string;

    ubicaciones: {
      nombre: string;
    } | null;
  } | null;
};

type Bono = {
  id: string;
  alumno_id: string;
  grupo_id: string | null;
  numero_clases: number;
  clases_restantes: number;
  importe_pagado: number;
  fecha_compra: string;
  activo: boolean;
  estado_cobro: "pagado" | "pendiente" | null;
  metodo_cobro: string | null;
  fecha_cobro: string | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;

  grupos: {
    nombre: string;
  } | null;

  clase_alumnos: UsoBono[];
};

type RelacionBonoAlumno = {
  bono_id: string;
  alumno_id: string;
};

type TarifaBono = {
  id: string;
  ubicacion_id: string | null;
  concepto: string;
  duracion_minutos: number;
  numero_alumnos: number;
  importe: number;
  activa: boolean;
};


function IconoBono({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7.25h16v9.5H4z" />
      <path d="M8 7.25v9.5M16 7.25v9.5" />
      <path d="M4 10.25a2 2 0 0 1 0 4M20 10.25a2 2 0 0 0 0 4" />
    </svg>
  );
}

function IconoAlumno({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
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

function IconoCalendario({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconoBuscar() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

function IconoHistorial() {
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
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
}

function IconoImagen() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m5 17 4.5-4.5 3 3 2-2L19 18" />
    </svg>
  );
}

function formatearFechaControl(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
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

function CampoFechaBono({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  function abrir() {
    const input =
      inputRef.current;

    if (!input) return;

    try {
      if (
        typeof input.showPicker ===
        "function"
      ) {
        input.showPicker();
        return;
      }
    } catch {}

    input.focus();
    input.click();
  }

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {etiqueta}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={abrir}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold capitalize text-[#17324D] transition hover:bg-slate-50 focus:border-[#00A79C]/60 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/10"
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
          <span className="text-xs text-slate-400">
            ⌄
          </span>
        </button>

        <input
          ref={inputRef}
          type="date"
          value={valor}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          required
          className="pointer-events-none absolute h-px w-px opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function SelectorEstadoBonos({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const opciones = [
    ["todos", "Todos"],
    ["activos", "Activos"],
    ["finalizados", "Finalizados"],
    ["inactivos", "Inactivos"],
    ["pendientes_cobro", "Pendientes cobro"],
  ];

  const etiqueta =
    opciones.find(
      ([id]) => id === valor
    )?.[1] || "Todos";

  return (
    <div className="relative">
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
        Estado
      </label>

      <button
        type="button"
        onClick={() =>
          setAbierto(
            (actual) => !actual
          )
        }
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/15"
      >
        <span>{etiqueta}</span>
        <span className="text-white/45">
          ⌄
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de estado"
            onClick={() =>
              setAbierto(false)
            }
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 top-[62px] z-50 w-full min-w-[165px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
            {opciones.map(
              ([id, texto]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(id);
                    setAbierto(false);
                  }}
                  className={
                    valor === id
                      ? "flex h-9 w-full items-center rounded-lg bg-[#17324D] px-3 text-left text-xs font-bold text-white"
                      : "flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                  }
                >
                  {texto}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SelectorMesBonos({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const anioActual =
    valor
      ? Number(
          valor.slice(0, 4)
        )
      : new Date().getFullYear();

  const [
    anioSelector,
    setAnioSelector,
  ] = useState(anioActual);

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
                valor.slice(0, 4)
              )
            );
          }
          setAbierto(
            (actual) => !actual
          );
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold capitalize text-white transition hover:bg-white/15"
      >
        <span className="truncate">
          {formatearMesControl(
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

          <div className="absolute left-1/2 top-[62px] z-50 w-[310px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:left-auto sm:right-0 sm:translate-x-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setAnioSelector(
                    (anio) =>
                      anio - 1
                  )
                }
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] hover:bg-slate-50"
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
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] hover:bg-slate-50"
              >
                ›
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange("");
                setAbierto(false);
              }}
              className={
                !valor
                  ? "mt-3 h-9 w-full rounded-lg bg-[#17324D] text-xs font-bold text-white"
                  : "mt-3 h-9 w-full rounded-lg border border-slate-200 text-xs font-bold text-[#17324D] hover:bg-slate-50"
              }
            >
              Todos los meses
            </button>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {meses.map(
                (
                  nombreMes,
                  indice
                ) => {
                  const numeroMes =
                    indice + 1;

                  const seleccionado =
                    valor &&
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
                      key={nombreMes}
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
                          : "h-9 rounded-lg px-2 text-[11px] font-semibold text-[#17324D] hover:bg-[#17324D] hover:text-white"
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

export default function BonosPage() {
  const searchParams =
    useSearchParams();

  const alumnoDesdeFicha =
    searchParams.get("alumno");
  const filtroDesdeDashboard =
    searchParams.get("filtro");

  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [bonos, setBonos] =
    useState<Bono[]>([]);

  const [tarifasBonos, setTarifasBonos] =
    useState<TarifaBono[]>([]);

  const [grupos, setGrupos] =
    useState<Grupo[]>([]);

  const [
    relacionesBonoAlumno,
    setRelacionesBonoAlumno,
  ] =
    useState<RelacionBonoAlumno[]>([]);

  const [alumnoId, setAlumnoId] =
    useState("");

  const [
    tipoComprador,
    setTipoComprador,
  ] = useState<
    "alumno" | "grupo"
  >("alumno");

  const [grupoId, setGrupoId] =
    useState("");

  const [
    alumnosAutorizados,
    setAlumnosAutorizados,
  ] =
    useState<string[]>([]);

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] = useState("");

  const [
    numeroClases,
    setNumeroClases,
  ] = useState("5");

  const [
    clasesRestantes,
    setClasesRestantes,
  ] = useState("5");

  const [importe, setImporte] =
    useState("");

  const [
    estadoCobro,
    setEstadoCobro,
  ] = useState<
    "pagado" | "pendiente"
  >("pagado");

  const [
    metodoCobro,
    setMetodoCobro,
  ] = useState("efectivo");

  const [
    fechaCobro,
    setFechaCobro,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    fechaCompra,
    setFechaCompra,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [activo, setActivo] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [
    bonoEditandoId,
    setBonoEditandoId,
  ] =
    useState<string | null>(null);

  const [
    formularioMovilAbierto,
    setFormularioMovilAbierto,
  ] = useState(false);

  const [
    busquedaBonos,
    setBusquedaBonos,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    filtroMes,
    setFiltroMes,
  ] = useState("");


  const [
    generandoImagenBono,
    setGenerandoImagenBono,
  ] = useState(false);

  const [
    historialesAbiertos,
    setHistorialesAbiertos,
  ] = useState<string[]>([]);

  const [
    busquedaCompartidos,
    setBusquedaCompartidos,
  ] = useState("");

  const [
    mostrarTodosTitular,
    setMostrarTodosTitular,
  ] = useState(false);

  const [
    mostrarTodosCompartidos,
    setMostrarTodosCompartidos,
  ] = useState(false);

  const [
    listaTitularesAbierta,
    setListaTitularesAbierta,
  ] = useState(false);

  const [
    listaCompartidosAbierta,
    setListaCompartidosAbierta,
  ] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (alumnoDesdeFicha) {
      setAlumnoId(
        alumnoDesdeFicha
      );

      setBusquedaAlumno("");
    }
  }, [alumnoDesdeFicha]);

  async function cargarDatos() {
    const {
      data: alumnosData,
    } = await supabase
      .from("alumnos")
      .select(
        "id,nombre,apellidos"
      )
      .eq("activo", true)
      .order("nombre");

    const {
      data: gruposData,
      error: errorGrupos,
    } = await supabase
      .from("grupos")
      .select(`
        id,
        nombre,
        grupo_alumnos (
          alumno_id
        )
      `)
      .eq("activo", true)
      .order("nombre");

    if (errorGrupos) {
      setMensaje(
        "❌ Error al cargar los grupos: " +
          errorGrupos.message
      );

      return;
    }

    const {
      data: bonosData,
      error: errorBonos,
    } = await supabase
      .from("bonos")
      .select(`
        id,
        alumno_id,
        grupo_id,
        numero_clases,
        clases_restantes,
        importe_pagado,
        fecha_compra,
        activo,
        estado_cobro,
        metodo_cobro,
        fecha_cobro,

        alumnos (
          nombre,
          apellidos
        ),

        grupos (
          nombre
        ),

        clase_alumnos (
          bono_id,
          alumno_id,
          usa_bono,

          alumnos (
            nombre,
            apellidos
          ),

          clases (
            fecha,
            hora_inicio,
            duracion_minutos,
            estado,

            ubicaciones (
              nombre
            )
          )
        )
      `)
      .order(
        "fecha_compra",
        {
          ascending: false,
        }
      );

    if (errorBonos) {
      setMensaje(
        "❌ Error al cargar los bonos: " +
          errorBonos.message
      );

      return;
    }

    const {
      data: tarifasBonosData,
      error: errorTarifasBonos,
    } = await supabase
      .from("tarifas")
      .select(
        "id,ubicacion_id,concepto,duracion_minutos,numero_alumnos,importe,activa"
      )
      .is("ubicacion_id", null)
      .eq("activa", true);

    if (errorTarifasBonos) {
      setMensaje(
        "❌ Error al cargar las tarifas de bonos: " +
          errorTarifasBonos.message
      );

      return;
    }

    const {
      data: relacionesData,
      error: errorRelaciones,
    } = await supabase
      .from("bono_alumnos")
      .select(
        "bono_id,alumno_id"
      );

    if (errorRelaciones) {
      setMensaje(
        "❌ Error al cargar los alumnos autorizados: " +
          errorRelaciones.message
      );

      return;
    }

    setAlumnos(
      (alumnosData ||
        []) as Alumno[]
    );

    setGrupos(
      (gruposData ||
        []) as unknown as Grupo[]
    );

    setBonos(
      (bonosData ||
        []) as unknown as Bono[]
    );

    setTarifasBonos(
      (tarifasBonosData || [])
        .filter((tarifa) =>
          String(tarifa.concepto || "").startsWith("bono_")
        ) as TarifaBono[]
    );

    setRelacionesBonoAlumno(
      (relacionesData ||
        []) as RelacionBonoAlumno[]
    );
  }

  function limpiarFormulario() {
    setAlumnoId("");
    setTipoComprador("alumno");
    setGrupoId("");
    setAlumnosAutorizados([]);
    setBusquedaAlumno("");
    setBusquedaCompartidos("");
    setMostrarTodosTitular(false);
    setMostrarTodosCompartidos(false);
    setListaTitularesAbierta(false);
    setListaCompartidosAbierta(false);
    setNumeroClases("5");
    setClasesRestantes("5");
    setImporte("");
    setEstadoCobro("pagado");
    setMetodoCobro("efectivo");
    setFechaCobro(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setFechaCompra(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setActivo(true);
    setBonoEditandoId(null);
  }

  function seleccionarGrupo(
    nuevoGrupoId: string
  ) {
    setGrupoId(
      nuevoGrupoId
    );

    const grupo =
      grupos.find(
        (item) =>
          item.id ===
          nuevoGrupoId
      );

    const miembros =
      grupo?.grupo_alumnos.map(
        (relacion) =>
          relacion.alumno_id
      ) || [];

    setAlumnosAutorizados(
      miembros
    );

    if (
      miembros.length === 0
    ) {
      setAlumnoId("");
      return;
    }

    if (
      !miembros.includes(
        alumnoId
      )
    ) {
      setAlumnoId(
        miembros[0]
      );
    }
  }

  const grupoSeleccionado =
    grupos.find(
      (grupo) =>
        grupo.id ===
        grupoId
    ) || null;

  const miembrosGrupo =
    grupoSeleccionado
      ? grupoSeleccionado.grupo_alumnos
          .map(
            (relacion) =>
              alumnos.find(
                (alumno) =>
                  alumno.id ===
                  relacion.alumno_id
              )
          )
          .filter(
            (
              alumno
            ): alumno is Alumno =>
              !!alumno
          )
      : [];

  const numeroPersonasBono =
    tipoComprador === "grupo"
      ? miembrosGrupo.length
      : alumnoId
      ? 1 +
        alumnosAutorizados.filter(
          (id) => id !== alumnoId
        ).length
      : 0;

  const totalClasesParaTarifa =
    Number(numeroClases);

  const tarifaAutomatica =
    Number.isInteger(
      totalClasesParaTarifa
    ) &&
    totalClasesParaTarifa > 0 &&
    numeroPersonasBono > 0
      ? tarifasBonos.find(
          (tarifa) =>
            tarifa.activa &&
            tarifa.ubicacion_id === null &&
            tarifa.concepto ===
              `bono_${totalClasesParaTarifa}` &&
            tarifa.duracion_minutos === 60 &&
            tarifa.numero_alumnos ===
              numeroPersonasBono
        ) || null
      : null;

  useEffect(() => {
    // Al editar, conservamos siempre el importe histórico del bono.
    if (bonoEditandoId) {
      return;
    }

    if (
      !Number.isInteger(
        totalClasesParaTarifa
      ) ||
      totalClasesParaTarifa < 1 ||
      numeroPersonasBono < 1
    ) {
      setImporte("");
      return;
    }

    if (tarifaAutomatica) {
      setImporte(
        String(
          Number(
            tarifaAutomatica.importe
          )
        )
      );
      return;
    }

    // Si no existe tarifa para esa combinación, el importe queda manual.
    setImporte("");
  }, [
    bonoEditandoId,
    totalClasesParaTarifa,
    numeroPersonasBono,
    tarifaAutomatica,
  ]);

  async function guardarRelacionesBono(
    bonoId: string,
    titularId: string
  ) {
    const alumnosDelBono =
      Array.from(
        new Set([
          titularId,
          ...alumnosAutorizados,
        ])
      );

    const {
      error: errorBorrar,
    } = await supabase
      .from("bono_alumnos")
      .delete()
      .eq(
        "bono_id",
        bonoId
      );

    if (errorBorrar) {
      throw new Error(
        errorBorrar.message
      );
    }

    const relaciones =
      alumnosDelBono.map(
        (id) => ({
          bono_id: bonoId,
          alumno_id: id,
        })
      );

    const {
      error: errorInsertar,
    } = await supabase
      .from("bono_alumnos")
      .insert(relaciones);

    if (errorInsertar) {
      throw new Error(
        errorInsertar.message
      );
    }
  }

  async function guardarBono(
    e: FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (
      tipoComprador ===
        "grupo" &&
      !grupoId
    ) {
      setMensaje(
        "❌ Selecciona el grupo que compra el bono"
      );

      return;
    }

    if (!alumnoId) {
      setMensaje(
        tipoComprador ===
        "grupo"
          ? "❌ El grupo seleccionado debe tener al menos un integrante"
          : "❌ Selecciona el titular del bono"
      );

      return;
    }

    if (
      tipoComprador ===
        "grupo" &&
      !miembrosGrupo.some(
        (alumno) =>
          alumno.id ===
          alumnoId
      )
    ) {
      setMensaje(
        "❌ El grupo seleccionado no tiene integrantes válidos"
      );

      return;
    }

    const totalClases =
      Number(numeroClases);
    const restantes =
      Number(clasesRestantes);

    if (
      !Number.isInteger(
        totalClases
      ) ||
      totalClases < 1
    ) {
      setMensaje(
        "❌ El número de clases debe ser un número entero mayor que 0"
      );

      return;
    }

    if (
      !Number.isInteger(
        restantes
      ) ||
      restantes < 0 ||
      restantes >
        totalClases
    ) {
      setMensaje(
        "❌ Las clases restantes deben estar entre 0 y el total de clases"
      );

      return;
    }

    const datos = {
      alumno_id:
        alumnoId,

      grupo_id:
        tipoComprador ===
        "grupo"
          ? grupoId
          : null,

      numero_clases:
        totalClases,

      clases_restantes:
        restantes,

      importe_pagado:
        importe
          ? Number(importe)
          : 0,

      fecha_compra:
        fechaCompra,

      estado_cobro:
        estadoCobro,

      metodo_cobro:
        estadoCobro ===
        "pagado"
          ? metodoCobro
          : null,

      fecha_cobro:
        estadoCobro ===
        "pagado"
          ? fechaCobro
          : null,

      activo,
    };

    try {
      let bonoId =
        bonoEditandoId;

      if (bonoEditandoId) {
        const {
          error,
        } = await supabase
          .from("bonos")
          .update(datos)
          .eq(
            "id",
            bonoEditandoId
          );

        if (error) {
          throw new Error(
            error.message
          );
        }
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("bonos")
          .insert(datos)
          .select("id")
          .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        bonoId =
          data.id;
      }

      if (!bonoId) {
        throw new Error(
          "No se ha podido identificar el bono"
        );
      }

      await guardarRelacionesBono(
        bonoId,
        alumnoId
      );

      setMensaje(
        bonoEditandoId
          ? "✅ Bono actualizado correctamente"
          : "✅ Bono creado correctamente"
      );

      limpiarFormulario();
      setFormularioMovilAbierto(false);

      await cargarDatos();
    } catch (error) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ Error al guardar el bono: " +
          mensajeError
      );
    }
  }
  function editarBono(
    bono: Bono
  ) {
    setFormularioMovilAbierto(true);

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      window.setTimeout(() => {
        document
          .getElementById("formulario-bono")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    }

    setBonoEditandoId(
      bono.id
    );

    setAlumnoId(
      bono.alumno_id
    );

    setTipoComprador(
      bono.grupo_id
        ? "grupo"
        : "alumno"
    );

    setGrupoId(
      bono.grupo_id || ""
    );

    const autorizados =
      relacionesBonoAlumno
        .filter(
          (relacion) =>
            relacion.bono_id ===
              bono.id &&
            relacion.alumno_id !==
              bono.alumno_id
        )
        .map(
          (relacion) =>
            relacion.alumno_id
        );

    setAlumnosAutorizados(
      autorizados
    );

    setBusquedaAlumno("");
    setBusquedaCompartidos("");
    setMostrarTodosTitular(false);
    setMostrarTodosCompartidos(false);
    setListaTitularesAbierta(false);
    setListaCompartidosAbierta(false);

    setNumeroClases(
      String(
        bono.numero_clases
      )
    );

    setClasesRestantes(
      String(
        bono.clases_restantes
      )
    );

    setImporte(
      String(
        bono.importe_pagado ||
          ""
      )
    );

    setEstadoCobro(
      bono.estado_cobro ===
      "pendiente"
        ? "pendiente"
        : "pagado"
    );

    setMetodoCobro(
      bono.metodo_cobro ||
        "efectivo"
    );

    setFechaCobro(
      bono.fecha_cobro ||
        bono.fecha_compra
    );

    setFechaCompra(
      bono.fecha_compra
    );

    setActivo(
      bono.activo
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarBono(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar este bono?"
      );

    if (!confirmar) {
      return;
    }

    const bono =
      bonos.find(
        (item) =>
          item.id === id
      );

    const tieneUsos =
      bono?.clase_alumnos.some(
        (uso) =>
          uso.usa_bono &&
          uso.clases?.estado ===
            "realizada"
      );

    if (tieneUsos) {
      const confirmarConHistorial =
        window.confirm(
          "Este bono tiene clases utilizadas registradas. ¿Seguro que quieres borrarlo?"
        );

      if (
        !confirmarConHistorial
      ) {
        return;
      }
    }

    const {
      error,
    } = await supabase
      .from("bonos")
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      setMensaje(
        "❌ Error al borrar el bono: " +
          error.message
      );

      return;
    }

    if (
      bonoEditandoId ===
      id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Bono borrado correctamente"
    );

    await cargarDatos();
  }

  function formatearFecha(
    fecha: string
  ) {
    const [
      anio,
      mes,
      dia,
    ] =
      fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  function calcularHorario(
    horaInicio: string,
    duracionMinutos: number
  ) {
    const [
      hora,
      minuto,
    ] =
      horaInicio
        .split(":")
        .map(Number);

    const inicio =
      new Date();

    inicio.setHours(
      hora,
      minuto,
      0,
      0
    );

    const fin =
      new Date(
        inicio.getTime() +
          duracionMinutos *
            60 *
            1000
      );

    const inicioTexto =
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
      )} h`;

    const finTexto =
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
      )} h`;

    return `${inicioTexto} a ${finTexto}`;
  }

  const bonosFiltrados =
    bonos.filter(
      (bono) => {
        if (
          filtroDesdeDashboard === "pendientes-cobro" &&
          bono.estado_cobro !== "pendiente"
        ) {
          return false;
        }

        if (
          filtroDesdeDashboard === "por-terminar" &&
          !(bono.activo && bono.clases_restantes >= 1 && bono.clases_restantes <= 2)
        ) {
          return false;
        }

        const nombreAlumno =
          bono.alumnos
            ? `${bono.alumnos.nombre} ${
                bono.alumnos
                  .apellidos ||
                ""
              }`.toLowerCase()
            : "";

        const nombreGrupo =
          bono.grupos?.nombre
            ?.toLowerCase() ||
          "";

        const termino =
          busquedaBonos
            .toLowerCase();

        const coincideBusqueda =
          nombreAlumno.includes(
            termino
          ) ||
          nombreGrupo.includes(
            termino
          );

        let coincideEstado =
          true;

        if (
          filtroEstado ===
          "activos"
        ) {
          coincideEstado =
            bono.activo &&
            bono.clases_restantes >
              0;
        }

        if (
          filtroEstado ===
          "finalizados"
        ) {
          coincideEstado =
            bono.clases_restantes <=
            0;
        }

        if (
          filtroEstado ===
          "inactivos"
        ) {
          coincideEstado =
            !bono.activo &&
            bono.clases_restantes >
              0;
        }

        if (
          filtroEstado ===
          "pendientes_cobro"
        ) {
          coincideEstado =
            bono.estado_cobro ===
            "pendiente";
        }

        const coincideMes =
          !filtroMes ||
          bono.fecha_compra.startsWith(
            filtroMes
          );

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideMes
        );
      }
    );

  async function descargarImagenBono(bono: Bono) {
    setGenerandoImagenBono(true);
    setMensaje("");

    try {
      await generarImagenBono(bono);
      setMensaje("✅ Imagen del bono generada correctamente");
    } catch (error) {
      const texto =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudo generar la imagen del bono: " + texto
      );
    } finally {
      setGenerandoImagenBono(false);
    }
  }

  const bonosActivos =
    bonosFiltrados.filter(
      (bono) =>
        bono.activo &&
        bono.clases_restantes >
          0
    ).length;

  const clasesDisponibles =
    bonosFiltrados
      .filter(
        (bono) =>
          bono.activo &&
          bono.clases_restantes >
            0
      )
      .reduce(
        (
          total,
          bono
        ) =>
          total +
          Number(
            bono.clases_restantes ||
              0
          ),
        0
      );

  const bonosFinalizados =
    bonosFiltrados.filter(
      (bono) =>
        bono.clases_restantes <=
        0
    ).length;

  const bonosPendientesCobro =
    bonosFiltrados.filter(
      (bono) =>
        bono.estado_cobro ===
        "pendiente"
    );

  const importePendienteBonos =
    bonosPendientesCobro.reduce(
      (total, bono) =>
        total +
        Number(
          bono.importe_pagado ||
            0
        ),
      0
    );

  const importeBonos =
    bonosFiltrados.reduce(
      (
        total,
        bono
      ) =>
        total +
        Number(
          bono.importe_pagado ||
            0
        ),
      0
    );

  function normalizarBusqueda(
    valor: string
  ) {
    return valor
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }

  const terminoTitular =
    normalizarBusqueda(
      busquedaAlumno
    );

  const alumnosFiltrados =
    alumnos
      .filter(
        (alumno) => {
          if (!terminoTitular) {
            return false;
          }

          const texto =
            normalizarBusqueda(
              `${alumno.nombre} ${
                alumno.apellidos ||
                ""
              }`
            );

          return texto.includes(
            terminoTitular
          );
        }
      )
      .sort(
        (a, b) => {
          const nombreA =
            normalizarBusqueda(
              `${a.nombre} ${
                a.apellidos ||
                ""
              }`
            );
          const nombreB =
            normalizarBusqueda(
              `${b.nombre} ${
                b.apellidos ||
                ""
              }`
            );

          const aEmpieza =
            nombreA.startsWith(
              terminoTitular
            );
          const bEmpieza =
            nombreB.startsWith(
              terminoTitular
            );

          if (
            aEmpieza !==
            bEmpieza
          ) {
            return aEmpieza
              ? -1
              : 1;
          }

          return nombreA.localeCompare(
            nombreB
          );
        }
      );

  const titularSeleccionado =
    alumnos.find(
      (alumno) =>
        alumno.id ===
        alumnoId
    ) || null;

  const resultadosTitular =
    mostrarTodosTitular
      ? alumnosFiltrados
      : alumnosFiltrados.slice(
          0,
          4
        );

  const terminoCompartidos =
    normalizarBusqueda(
      busquedaCompartidos
    );

  const coincidenciasCompartidos =
    terminoCompartidos
      ? alumnos
          .filter(
            (alumno) => {
              if (
                alumno.id ===
                alumnoId
              ) {
                return false;
              }

              const texto =
                normalizarBusqueda(
                  `${alumno.nombre} ${
                    alumno.apellidos ||
                    ""
                  }`
                );

              return texto.includes(
                terminoCompartidos
              );
            }
          )
          .sort(
            (a, b) => {
              const nombreA =
                normalizarBusqueda(
                  `${a.nombre} ${
                    a.apellidos ||
                      ""
                  }`
                );
              const nombreB =
                normalizarBusqueda(
                  `${b.nombre} ${
                    b.apellidos ||
                      ""
                  }`
                );

              const aEmpieza =
                nombreA.startsWith(
                  terminoCompartidos
                );
              const bEmpieza =
                nombreB.startsWith(
                  terminoCompartidos
                );

              if (
                aEmpieza !==
                bEmpieza
              ) {
                return aEmpieza
                  ? -1
                  : 1;
              }

              return nombreA.localeCompare(
                nombreB
              );
            }
          )
      : [];

  const resultadosCompartidos =
    mostrarTodosCompartidos
      ? coincidenciasCompartidos
      : coincidenciasCompartidos.slice(
          0,
          4
        );

  const hayFiltros =
    busquedaBonos.trim() !== "" ||
    filtroEstado !== "todos" ||
    filtroMes !== "";

  const bonosPorTerminar =
    bonos.filter(
      (bono) =>
        bono.activo &&
        bono.clases_restantes >=
          1 &&
        bono.clases_restantes <=
          2
    );

  function cambiarHistorial(
    bonoId: string
  ) {
    setHistorialesAbiertos(
      (actuales) =>
        actuales.includes(
          bonoId
        )
          ? actuales.filter(
              (id) =>
                id !== bonoId
            )
          : [
              ...actuales,
              bonoId,
            ]
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-3.5 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA CORPORATIVA */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Bonos
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Control de bonos, clases disponibles, uso compartido e historial de consumo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[620px]">
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200/80">
                  Activos
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {bonosActivos}
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Disponibles
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {clasesDisponibles}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Finalizados
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {bonosFinalizados}
                </p>
              </div>

              <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80">
                  Pendiente cobro
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-bold text-white">
                  {importePendienteBonos.toFixed(
                    2
                  )} €
                </p>
              </div>
            </div>
          </div>
        </section>

        {filtroDesdeDashboard ===
          "pendientes-cobro" && (
          <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="font-bold text-red-800">
                Bonos pendientes de cobro
              </p>
              <p className="mt-1 text-xs text-red-700">
                Se muestran únicamente los bonos cuyo cobro sigue pendiente.
              </p>
            </div>
            <a
              href="/bonos"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 shadow-sm"
            >
              Quitar filtro
            </a>
          </section>
        )}

        {filtroDesdeDashboard ===
          "por-terminar" && (
          <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="font-bold text-red-800">
                Bonos próximos a agotarse
              </p>
              <p className="mt-1 text-xs text-red-700">
                Se muestran únicamente bonos activos con 1 o 2 clases restantes.
              </p>
            </div>
            <a
              href="/bonos"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 shadow-sm"
            >
              Quitar filtro
            </a>
          </section>
        )}

        {filtroDesdeDashboard !==
          "por-terminar" &&
          filtroDesdeDashboard !==
          "pendientes-cobro" &&
          bonosPorTerminar.length >
            0 && (
            <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-red-700">
                  <IconoBono />
                </span>
                <div>
                  <p className="text-xs font-bold text-red-800">
                    {bonosPorTerminar.length}{" "}
                    {bonosPorTerminar.length ===
                    1
                      ? "bono próximo"
                      : "bonos próximos"}{" "}
                    a agotarse
                  </p>
                  <p className="mt-0.5 text-[11px] text-red-700/80">
                    Quedan 1 o 2 clases disponibles.
                  </p>
                </div>
              </div>
            </section>
          )}

        <div className="mt-4 xl:hidden">
          <button
            type="button"
            onClick={() => {
              if (formularioMovilAbierto) {
                if (bonoEditandoId) {
                  limpiarFormulario();
                }
                setMensaje("");
                setFormularioMovilAbierto(false);
                return;
              }

              limpiarFormulario();
              setMensaje("");
              setFormularioMovilAbierto(true);
            }}
            className={
              formularioMovilAbierto
                ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#17324D] shadow-sm"
                : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#00A79C] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.20)] transition hover:bg-[#008F86]"
            }
          >
            {formularioMovilAbierto ? (
              <>
                <span className="text-lg leading-none">×</span>
                Cerrar formulario
              </>
            ) : (
              <>
                <span className="text-lg leading-none">+</span>
                Nuevo bono
              </>
            )}
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">

          {/* ALTA / EDICIÓN */}
          <section
            id="formulario-bono"
            className={`${
              formularioMovilAbierto ? "block" : "hidden"
            } self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] xl:sticky xl:top-5 xl:block`}
          >
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    {bonoEditandoId
                      ? "Edición"
                      : "Alta"}
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    {bonoEditandoId
                      ? "Editar bono"
                      : "Nuevo bono"}
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Configura titular, usuarios autorizados, clases e importe.
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#4DD4CA]">
                  <IconoBono className="h-5 w-5" />
                </span>
              </div>
            </div>

            <form
              onSubmit={guardarBono}
              className="space-y-4 p-4 sm:p-5"
            >
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Comprador del bono
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoComprador(
                        "alumno"
                      );
                      setGrupoId("");
                    }}
                    className={
                      tipoComprador ===
                      "alumno"
                        ? "h-10 rounded-xl border border-[#00A79C] bg-[#E8F7F5] text-xs font-bold text-[#008C83]"
                        : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
                    }
                  >
                    Alumno
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoComprador(
                        "grupo"
                      );
                      setBusquedaAlumno(
                        ""
                      );
                      setBusquedaCompartidos(
                        ""
                      );
                    }}
                    className={
                      tipoComprador ===
                      "grupo"
                        ? "h-10 rounded-xl border border-violet-300 bg-violet-50 text-xs font-bold text-violet-700"
                        : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
                    }
                  >
                    Grupo
                  </button>
                </div>
              </div>

              {tipoComprador ===
              "alumno" ? (
                <>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Titular
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconoBuscar />
                  </span>

                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={
                      titularSeleccionado
                        ? "Buscar otro alumno..."
                        : "Escribe nombre o apellidos..."
                    }
                    value={
                      busquedaAlumno
                    }
                    onChange={(e) => {
                      setBusquedaAlumno(
                        e.target.value
                      );
                      setMostrarTodosTitular(
                        false
                      );
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />

                  {terminoTitular && (
                    <div className="absolute left-0 right-0 top-[48px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                      {alumnosFiltrados.length ===
                      0 ? (
                        <div className="px-4 py-4 text-xs text-slate-400">
                          No hay alumnos que coincidan con “{busquedaAlumno}”.
                        </div>
                      ) : (
                        <>
                          <div
                            className={
                              mostrarTodosTitular
                                ? "max-h-[260px] overflow-y-auto p-1.5"
                                : "p-1.5"
                            }
                          >
                            {resultadosTitular.map(
                              (
                                alumno
                              ) => (
                                <button
                                  key={
                                    alumno.id
                                  }
                                  type="button"
                                  onClick={() => {
                                    setAlumnoId(
                                      alumno.id
                                    );

                                    setAlumnosAutorizados(
                                      (
                                        actuales
                                      ) =>
                                        actuales.filter(
                                          (
                                            id
                                          ) =>
                                            id !==
                                            alumno.id
                                        )
                                    );

                                    setBusquedaAlumno(
                                      ""
                                    );
                                    setMostrarTodosTitular(
                                      false
                                    );
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#EEF7F6]"
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7F5] text-[#00A79C]">
                                    <IconoAlumno className="h-4 w-4" />
                                  </span>

                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-[#17324D]">
                                      {
                                        alumno.nombre
                                      }{" "}
                                      {alumno.apellidos ||
                                        ""}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                      Seleccionar como titular
                                    </p>
                                  </div>
                                </button>
                              )
                            )}
                          </div>

                          {alumnosFiltrados.length >
                            4 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMostrarTodosTitular(
                                  (
                                    actual
                                  ) =>
                                    !actual
                                )
                              }
                              className="flex h-10 w-full items-center justify-center border-t border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-[#17324D] transition hover:bg-slate-100"
                            >
                              {mostrarTodosTitular
                                ? "Mostrar menos"
                                : `Ver las ${alumnosFiltrados.length} coincidencias`}
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
                    onClick={() =>
                      setListaTitularesAbierta(
                        (actual) =>
                          !actual
                      )
                    }
                    className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-[#17324D] transition hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <IconoAlumno className="h-3.5 w-3.5 text-[#00A79C]" />
                      Seleccionar de la lista
                    </span>
                    <span className="text-slate-400">
                      ⌄
                    </span>
                  </button>

                  {listaTitularesAbierta && (
                    <>
                      <button
                        type="button"
                        aria-label="Cerrar lista de alumnos"
                        onClick={() =>
                          setListaTitularesAbierta(
                            false
                          )
                        }
                        className="fixed inset-0 z-20 cursor-default"
                      />

                      <div className="absolute left-0 right-0 top-[44px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                        <div className="border-b border-slate-100 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            Todos los alumnos
                          </p>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto p-1.5">
                          {alumnos.map(
                            (
                              alumno
                            ) => (
                              <button
                                key={
                                  alumno.id
                                }
                                type="button"
                                onClick={() => {
                                  setAlumnoId(
                                    alumno.id
                                  );

                                  setAlumnosAutorizados(
                                    (
                                      actuales
                                    ) =>
                                      actuales.filter(
                                        (
                                          id
                                        ) =>
                                          id !==
                                          alumno.id
                                      )
                                  );

                                  setBusquedaAlumno(
                                    ""
                                  );
                                  setListaTitularesAbierta(
                                    false
                                  );
                                }}
                                className={
                                  alumno.id ===
                                  alumnoId
                                    ? "flex w-full items-center gap-3 rounded-lg bg-[#E8F7F5] px-3 py-2.5 text-left"
                                    : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                                }
                              >
                                <span
                                  className={
                                    alumno.id ===
                                    alumnoId
                                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#00A79C]"
                                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"
                                  }
                                >
                                  <IconoAlumno className="h-4 w-4" />
                                </span>

                                <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#17324D]">
                                  {
                                    alumno.nombre
                                  }{" "}
                                  {alumno.apellidos ||
                                    ""}
                                </p>

                                {alumno.id ===
                                  alumnoId && (
                                  <span className="text-sm font-bold text-[#00A79C]">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {titularSeleccionado ? (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#00A79C]/20 bg-[#E8F7F5]/70 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#00A79C] shadow-sm">
                      <IconoAlumno className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#17324D]">
                        {
                          titularSeleccionado.nombre
                        }{" "}
                        {titularSeleccionado.apellidos ||
                          ""}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#008C83]">
                        Titular seleccionado
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAlumnoId(
                          ""
                        );
                        setBusquedaAlumno(
                          ""
                        );
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#17324D] hover:bg-white"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] text-slate-400">
                    Empieza a escribir y aparecerán las coincidencias automáticamente.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
                      Bono compartido
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Busca y añade únicamente a los alumnos que podrán utilizar este bono.
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-violet-700 shadow-sm">
                    {
                      alumnosAutorizados.length
                    }
                  </span>
                </div>

                {alumnosAutorizados.length >
                  0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {alumnosAutorizados.map(
                      (id) => {
                        const alumno =
                          alumnos.find(
                            (
                              item
                            ) =>
                              item.id ===
                              id
                          );

                        if (!alumno) {
                          return null;
                        }

                        return (
                          <span
                            key={id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-100 bg-white py-1 pl-2.5 pr-1.5 text-[10px] font-bold text-violet-700 shadow-sm"
                          >
                            <IconoAlumno className="h-3 w-3 shrink-0" />
                            <span className="max-w-[190px] truncate">
                              {
                                alumno.nombre
                              }{" "}
                              {alumno.apellidos ||
                                ""}
                            </span>
                            <button
                              type="button"
                              title="Quitar alumno"
                              onClick={() =>
                                setAlumnosAutorizados(
                                  (
                                    actuales
                                  ) =>
                                    actuales.filter(
                                      (
                                        alumnoId
                                      ) =>
                                        alumnoId !==
                                        id
                                    )
                                )
                              }
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-violet-400 hover:bg-violet-50 hover:text-violet-700"
                            >
                              ×
                            </button>
                          </span>
                        );
                      }
                    )}
                  </div>
                )}

                <div className="relative mt-3">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400">
                    <IconoBuscar />
                  </span>

                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Buscar alumno para compartir..."
                    value={
                      busquedaCompartidos
                    }
                    onChange={(e) => {
                      setBusquedaCompartidos(
                        e.target.value
                      );
                      setMostrarTodosCompartidos(
                        false
                      );
                    }}
                    disabled={!alumnoId}
                    className="h-11 w-full rounded-xl border border-violet-100 bg-white pl-10 pr-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-white/60 disabled:opacity-60"
                  />

                  {terminoCompartidos &&
                    alumnoId && (
                    <div className="absolute left-0 right-0 top-[48px] z-20 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-[0_14px_34px_rgba(76,29,149,0.12)]">
                      {coincidenciasCompartidos.length ===
                      0 ? (
                        <div className="px-4 py-4 text-xs text-slate-400">
                          No hay alumnos que coincidan con “{busquedaCompartidos}”.
                        </div>
                      ) : (
                        <>
                          <div
                            className={
                              mostrarTodosCompartidos
                                ? "max-h-[250px] overflow-y-auto p-1.5"
                                : "p-1.5"
                            }
                          >
                            {resultadosCompartidos.map(
                              (
                                alumno
                              ) => {
                                const seleccionado =
                                  alumnosAutorizados.includes(
                                    alumno.id
                                  );

                                return (
                                  <button
                                    key={
                                      alumno.id
                                    }
                                    type="button"
                                    onClick={() => {
                                      setAlumnosAutorizados(
                                        (
                                          actuales
                                        ) =>
                                          seleccionado
                                            ? actuales.filter(
                                                (
                                                  id
                                                ) =>
                                                  id !==
                                                  alumno.id
                                              )
                                            : [
                                                ...actuales,
                                                alumno.id,
                                              ]
                                      );

                                      setBusquedaCompartidos(
                                        ""
                                      );
                                      setMostrarTodosCompartidos(
                                        false
                                      );
                                    }}
                                    className={
                                      seleccionado
                                        ? "flex w-full items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 text-left"
                                        : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-violet-50"
                                    }
                                  >
                                    <span
                                      className={
                                        seleccionado
                                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"
                                          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"
                                      }
                                    >
                                      <IconoAlumno className="h-4 w-4" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-bold text-[#17324D]">
                                        {
                                          alumno.nombre
                                        }{" "}
                                        {alumno.apellidos ||
                                          ""}
                                      </p>
                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                        {seleccionado
                                          ? "Ya autorizado · pulsa para quitar"
                                          : "Añadir al bono compartido"}
                                      </p>
                                    </div>

                                    {seleccionado && (
                                      <span className="text-sm font-bold text-violet-700">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          {coincidenciasCompartidos.length >
                            4 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMostrarTodosCompartidos(
                                  (
                                    actual
                                  ) =>
                                    !actual
                                )
                              }
                              className="flex h-10 w-full items-center justify-center border-t border-violet-50 bg-violet-50/50 px-3 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50"
                            >
                              {mostrarTodosCompartidos
                                ? "Mostrar menos"
                                : `Ver las ${coincidenciasCompartidos.length} coincidencias`}
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
                    disabled={!alumnoId}
                    onClick={() =>
                      setListaCompartidosAbierta(
                        (actual) =>
                          !actual
                      )
                    }
                    className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <IconoAlumno className="h-3.5 w-3.5" />
                      Seleccionar de la lista
                    </span>
                    <span className="text-violet-300">
                      ⌄
                    </span>
                  </button>

                  {listaCompartidosAbierta &&
                    alumnoId && (
                    <>
                      <button
                        type="button"
                        aria-label="Cerrar lista de alumnos compartidos"
                        onClick={() =>
                          setListaCompartidosAbierta(
                            false
                          )
                        }
                        className="fixed inset-0 z-20 cursor-default"
                      />

                      <div className="absolute left-0 right-0 top-[44px] z-30 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-[0_14px_34px_rgba(76,29,149,0.12)]">
                        <div className="flex items-center justify-between gap-3 border-b border-violet-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-500">
                            Todos los alumnos
                          </p>
                          <p className="text-[10px] font-bold text-violet-700">
                            {
                              alumnosAutorizados.length
                            }{" "}
                            seleccionado(s)
                          </p>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto p-1.5">
                          {alumnos
                            .filter(
                              (
                                alumno
                              ) =>
                                alumno.id !==
                                alumnoId
                            )
                            .map(
                              (
                                alumno
                              ) => {
                                const seleccionado =
                                  alumnosAutorizados.includes(
                                    alumno.id
                                  );

                                return (
                                  <button
                                    key={
                                      alumno.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      setAlumnosAutorizados(
                                        (
                                          actuales
                                        ) =>
                                          seleccionado
                                            ? actuales.filter(
                                                (
                                                  id
                                                ) =>
                                                  id !==
                                                  alumno.id
                                              )
                                            : [
                                                ...actuales,
                                                alumno.id,
                                              ]
                                      )
                                    }
                                    className={
                                      seleccionado
                                        ? "flex w-full items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 text-left"
                                        : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-violet-50/60"
                                    }
                                  >
                                    <span
                                      className={
                                        seleccionado
                                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"
                                          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"
                                      }
                                    >
                                      <IconoAlumno className="h-4 w-4" />
                                    </span>

                                    <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#17324D]">
                                      {
                                        alumno.nombre
                                      }{" "}
                                      {alumno.apellidos ||
                                        ""}
                                    </p>

                                    {seleccionado && (
                                      <span className="text-sm font-bold text-violet-700">
                                        ✓
                                      </span>
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

                {!alumnoId && (
                  <p className="mt-2 text-[10px] font-medium text-violet-500/80">
                    Selecciona primero el titular del bono.
                  </p>
                )}
              </div>


                </>
              ) : (
                <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3.5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
                      Grupo
                    </label>

                    <select
                      value={grupoId}
                      onChange={(e) =>
                        seleccionarGrupo(
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-violet-100 bg-white px-3.5 text-sm font-bold text-[#17324D] outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">
                        Seleccionar grupo
                      </option>

                      {grupos.map(
                        (grupo) => (
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

                  {grupoSeleccionado && (
                    <div className="rounded-2xl border border-violet-200 bg-white px-3.5 py-3.5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
                            Integrantes del grupo
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#17324D]">
                            {
                              grupoSeleccionado.nombre
                            }
                          </p>
                        </div>

                        <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">
                          {
                            miembrosGrupo.length
                          }{" "}
                          integrante(s)
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {miembrosGrupo.map(
                          (
                            alumno
                          ) => (
                            <span
                              key={
                                alumno.id
                              }
                              className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"
                            >
                              <IconoAlumno className="h-3.5 w-3.5" />
                              {
                                alumno.nombre
                              }{" "}
                              {alumno.apellidos ||
                                ""}
                            </span>
                          )
                        )}
                      </div>

                      <p className="mt-3 text-[11px] leading-relaxed text-violet-700/80">
                        Todos los integrantes del grupo podrán utilizar este bono.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Nº de clases
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      numeroClases
                    }
                    onChange={(e) => {
                      const valor =
                        e.target.value;

                      setNumeroClases(
                        valor
                      );

                      if (
                        !bonoEditandoId
                      ) {
                        setClasesRestantes(
                          valor
                        );
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-[#17324D] outline-none focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />

                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {["5", "10"].map(
                      (
                        opcion
                      ) => (
                        <button
                          key={
                            opcion
                          }
                          type="button"
                          onClick={() => {
                            setNumeroClases(
                              opcion
                            );

                            if (
                              !bonoEditandoId
                            ) {
                              setClasesRestantes(
                                opcion
                              );
                            }
                          }}
                          className={
                            numeroClases ===
                            opcion
                              ? "h-8 rounded-lg border border-[#00A79C]/30 bg-[#E8F7F5] text-[10px] font-bold text-[#008C83]"
                              : "h-8 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100"
                          }
                        >
                          {opcion} clases
                        </button>
                      )
                    )}
                  </div>
                </div>

                {bonoEditandoId ? (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Restantes
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={numeroClases}
                      step="1"
                      value={
                        clasesRestantes
                      }
                      onChange={(e) =>
                        setClasesRestantes(
                          e.target
                            .value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-[#17324D] outline-none focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                      Puedes usar cualquier cantidad: 5, 10, 12, etc.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Clases iniciales
                    </label>

                    <div className="flex h-11 items-center rounded-xl border border-slate-100 bg-slate-50 px-3.5 text-sm font-bold text-[#17324D]">
                      {
                        numeroClases ||
                        "—"
                      }
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                      5 y 10 son accesos rápidos, no límites.
                    </p>
                  </div>
                )}
              </div>

              <CampoFechaBono
                etiqueta="Fecha de compra"
                valor={fechaCompra}
                onChange={
                  setFechaCompra
                }
              />

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Importe del bono
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={importe}
                    onChange={(e) =>
                      setImporte(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-bold text-[#17324D] outline-none placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    €
                  </span>
                </div>

                {bonoEditandoId ? (
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                    Importe histórico del bono. Al editarlo no se sustituye por una tarifa actual.
                  </p>
                ) : tarifaAutomatica ? (
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-emerald-700">
                      Tarifa automática · {totalClasesParaTarifa} clases · {numeroPersonasBono} {numeroPersonasBono === 1 ? "alumno" : "alumnos"} · {Number(tarifaAutomatica.importe).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-emerald-700/70">
                      El importe se rellena automáticamente, pero puedes modificarlo manualmente si lo necesitas.
                    </p>
                  </div>
                ) : numeroPersonasBono > 0 && Number.isInteger(totalClasesParaTarifa) && totalClasesParaTarifa > 0 ? (
                  <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-amber-700">
                      Sin tarifa automática para {totalClasesParaTarifa} clases y {numeroPersonasBono} {numeroPersonasBono === 1 ? "alumno" : "alumnos"}.
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-amber-700/70">
                      Introduce el importe manualmente. Si más adelante creas esta tarifa, se aplicará automáticamente a los bonos nuevos.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                    Selecciona primero el titular o el grupo para calcular la tarifa correspondiente.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Cobro del bono
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                      El importe anterior es el precio total contratado, aunque todavía esté pendiente.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEstadoCobro(
                        "pagado"
                      )
                    }
                    className={
                      estadoCobro ===
                      "pagado"
                        ? "h-10 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700"
                        : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
                    }
                  >
                    Pagado
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEstadoCobro(
                        "pendiente"
                      )
                    }
                    className={
                      estadoCobro ===
                      "pendiente"
                        ? "h-10 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700"
                        : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
                    }
                  >
                    Pendiente
                  </button>
                </div>

                {estadoCobro ===
                "pagado" ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                        Método
                      </label>

                      <select
                        value={
                          metodoCobro
                        }
                        onChange={(e) =>
                          setMetodoCobro(
                            e.target
                              .value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#17324D] outline-none focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
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

                    <CampoFechaBono
                      etiqueta="Fecha de cobro"
                      valor={
                        fechaCobro
                      }
                      onChange={
                        setFechaCobro
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-red-700">
                      Este bono aparecerá identificado como pendiente de cobro.
                    </p>
                  </div>
                )}
              </div>

              {bonoEditandoId && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Estado
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActivo(true)
                      }
                      className={
                        activo
                          ? "h-10 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700"
                          : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
                      }
                    >
                      Activo
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivo(false)
                      }
                      className={
                        !activo
                          ? "h-10 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700"
                          : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
                      }
                    >
                      Inactivo
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-2 pt-1 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86]"
                >
                  <IconoBono />
                  {bonoEditandoId
                    ? "Guardar cambios"
                    : "Crear bono"}
                </button>

                {bonoEditandoId && (
                  <button
                    type="button"
                    onClick={() => {
                      limpiarFormulario();
                      setMensaje("");
                      setFormularioMovilAbierto(false);
                    }}
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              {mensaje && (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs font-medium leading-relaxed text-[#17324D]">
                  {mensaje}
                </p>
              )}
            </form>
          </section>

          {/* LISTADO */}
          <div className="min-w-0">
            <section className="rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    Directorio
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Bonos registrados
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    Consulta disponibilidad, uso compartido e historial.
                  </p>
                </div>

                <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                  {
                    bonosFiltrados.length
                  }{" "}
                  de {bonos.length}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[minmax(240px,1fr)_155px_190px_auto] sm:items-end">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                      Buscar
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45">
                        <IconoBuscar />
                      </span>

                      <input
                        type="text"
                        placeholder="Buscar alumno..."
                        value={
                          busquedaBonos
                        }
                        onChange={(e) =>
                          setBusquedaBonos(
                            e.target
                              .value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-xs font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#4DD4CA]/50 focus:bg-white/[0.12]"
                      />
                    </div>
                  </div>

                  <SelectorEstadoBonos
                    valor={
                      filtroEstado
                    }
                    onChange={
                      setFiltroEstado
                    }
                  />

                  <SelectorMesBonos
                    valor={
                      filtroMes
                    }
                    onChange={
                      setFiltroMes
                    }
                  />

                  <button
                    type="button"
                    disabled={
                      !hayFiltros
                    }
                    onClick={() => {
                      setBusquedaBonos(
                        ""
                      );
                      setFiltroEstado(
                        "todos"
                      );
                      setFiltroMes("");
                    }}
                    className="col-span-2 inline-flex h-10 w-full self-end items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 sm:col-span-1 sm:w-auto"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-3 space-y-3 sm:mt-4">
              {bonosFiltrados.length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                  <p className="font-semibold text-slate-500">
                    No hay bonos que coincidan con los filtros.
                  </p>
                </div>
              )}

              {bonosFiltrados.map(
                (bono) => {
                  const estaActivo =
                    bono.activo &&
                    bono.clases_restantes >
                      0;

                  const cobroPendiente =
                    bono.estado_cobro ===
                    "pendiente";

                  const nombreComprador =
                    bono.grupo_id &&
                    bono.grupos?.nombre
                      ? bono.grupos
                          .nombre
                      : `${bono.alumnos?.nombre || "Sin alumno"} ${bono.alumnos?.apellidos || ""}`.trim();

                  const estaFinalizado =
                    bono.clases_restantes <=
                    0;

                  const porTerminar =
                    estaActivo &&
                    bono.clases_restantes <=
                      2;

                  const relaciones =
                    relacionesBonoAlumno.filter(
                      (relacion) =>
                        relacion.bono_id ===
                        bono.id
                    );

                  const autorizados =
                    relaciones
                      .filter(
                        (relacion) =>
                          relacion.alumno_id !==
                          bono.alumno_id
                      )
                      .map(
                        (relacion) =>
                          alumnos.find(
                            (
                              alumno
                            ) =>
                              alumno.id ===
                              relacion.alumno_id
                          )
                      )
                      .filter(
                        (
                          alumno
                        ): alumno is Alumno =>
                          !!alumno
                      );

                  const esCompartido =
                    !bono.grupo_id &&
                    autorizados.length >
                    0;

                  const integrantesGrupoBono =
                    bono.grupo_id
                      ? relaciones
                          .map(
                            (relacion) =>
                              alumnos.find(
                                (
                                  alumno
                                ) =>
                                  alumno.id ===
                                  relacion.alumno_id
                              )
                          )
                          .filter(
                            (
                              alumno
                            ): alumno is Alumno =>
                              !!alumno
                          )
                      : [];

                  const usos =
                    (
                      bono.clase_alumnos ||
                      []
                    )
                      .filter(
                        (uso) =>
                          uso.usa_bono &&
                          uso.bono_id ===
                            bono.id &&
                          uso.clases
                            ?.estado ===
                            "realizada"
                      )
                      .sort(
                        (a, b) =>
                          `${b.clases?.fecha || ""} ${b.clases?.hora_inicio || ""}`.localeCompare(
                            `${a.clases?.fecha || ""} ${a.clases?.hora_inicio || ""}`
                          )
                      );

                  const usadas =
                    usos.length;

                  const porcentaje =
                    bono.numero_clases >
                    0
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            (bono.clases_restantes /
                              bono.numero_clases) *
                              100
                          )
                        )
                      : 0;

                  const historialAbierto =
                    historialesAbiertos.includes(
                      bono.id
                    );

                  return (
                    <article
                      key={bono.id}
                      className={`${
                        bono.grupo_id
                          ? "overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_10px_28px_rgba(109,40,217,0.08)]"
                          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                      } ${
                        estaFinalizado &&
                        filtroEstado === "todos"
                          ? "border-l-[3px] border-l-red-500"
                          : ""
                      }`}
                    >
                      <header className={
                        bono.grupo_id
                          ? "flex flex-col gap-3 border-b border-violet-100 bg-violet-50/55 px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                          : "flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                      }>
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={
                              estaFinalizado
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                                : porTerminar
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-red-700"
                                : estaActivo
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F5] text-[#00A79C]"
                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                            }
                          >
                            <IconoBono />
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-[#17324D] sm:text-lg">
                              {
                                nombreComprador
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              {bono.grupo_id
                                ? "Bono de grupo"
                                : "Titular del bono"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 lg:justify-end">
                          {bono.grupo_id && (
                            <span className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                              Grupo
                            </span>
                          )}

                          {esCompartido && (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                              Compartido ·{" "}
                              {
                                autorizados.length
                              }
                            </span>
                          )}

                          <span
                            className={
                              estaFinalizado
                                ? "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                                : porTerminar
                                ? "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                                : estaActivo
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                            }
                          >
                            {estaFinalizado
                              ? "TERMINADO"
                              : porTerminar
                              ? "Por terminar"
                              : estaActivo
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </div>
                      </header>

                      {/* RESUMEN COMPACTO */}
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2.5 text-center">
                            <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                              Restantes
                            </p>
                            <p
                              className={
                                porTerminar
                                  ? "mt-1 text-lg font-bold text-red-700"
                                  : estaFinalizado
                                  ? "mt-1 text-lg font-bold text-slate-500"
                                  : "mt-1 text-lg font-bold text-[#008C83]"
                              }
                            >
                              {
                                bono.clases_restantes
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2.5 text-center">
                            <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                              Usadas
                            </p>
                            <p className="mt-1 text-lg font-bold text-[#17324D]">
                              {usadas}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2.5 text-center">
                            <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                              Total
                            </p>
                            <p className="mt-1 text-lg font-bold text-[#17324D]">
                              {
                                bono.numero_clases
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={
                              estaFinalizado
                                ? "h-full rounded-full bg-slate-300"
                                : porTerminar
                                ? "h-full rounded-full bg-red-500"
                                : "h-full rounded-full bg-[#00A79C]"
                            }
                            style={{
                              width: `${porcentaje}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="rounded-xl border border-slate-100 bg-white px-2.5 py-2.5">
                            <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                              Compra
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-[#17324D]">
                              {formatearFecha(
                                bono.fecha_compra
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-white px-2.5 py-2.5">
                            <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                              Importe
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-[#17324D]">
                              {Number(
                                bono.importe_pagado ||
                                  0
                              ).toFixed(
                                2
                              )} €
                            </p>
                          </div>

                          <div
                            className={
                              cobroPendiente
                                ? "col-span-2 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2.5 sm:col-span-1"
                                : "col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2.5 sm:col-span-1"
                            }
                          >
                            <p
                              className={
                                cobroPendiente
                                  ? "text-[8px] font-bold uppercase tracking-[0.06em] text-red-500"
                                  : "text-[8px] font-bold uppercase tracking-[0.06em] text-emerald-600"
                              }
                            >
                              Cobro
                            </p>
                            <p
                              className={
                                cobroPendiente
                                  ? "mt-0.5 text-[11px] font-bold text-red-700"
                                  : "mt-0.5 text-[11px] font-bold text-emerald-700"
                              }
                            >
                              {cobroPendiente
                                ? "Pendiente"
                                : "Pagado"}
                            </p>
                          </div>
                        </div>

                        {bono.grupo_id && (
                          <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
                                Integrantes del grupo
                              </p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-violet-700 shadow-sm">
                                {integrantesGrupoBono.length} integrante(s)
                              </span>
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {integrantesGrupoBono.map(
                                (
                                  alumno
                                ) => (
                                  <span
                                    key={
                                      alumno.id
                                    }
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm"
                                  >
                                    <IconoAlumno className="h-3.5 w-3.5" />
                                    {
                                      alumno.nombre
                                    }{" "}
                                    {alumno.apellidos ||
                                      ""}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {esCompartido && (
                          <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
                                Alumnos autorizados
                              </p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-violet-700 shadow-sm">
                                {autorizados.length} alumno(s)
                              </span>
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {autorizados.map(
                                (
                                  alumno
                                ) => (
                                  <span
                                    key={
                                      alumno.id
                                    }
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm"
                                  >
                                    <IconoAlumno className="h-3.5 w-3.5" />
                                    {
                                      alumno.nombre
                                    }{" "}
                                    {alumno.apellidos ||
                                      ""}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {historialAbierto && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                            <div>
                              <p className="text-sm font-bold text-[#17324D]">
                                Historial de uso
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Clases consumidas con este bono
                              </p>
                            </div>

                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                              {usos.length}{" "}
                              {usos.length ===
                              1
                                ? "uso"
                                : "usos"}
                            </span>
                          </div>

                          {usos.length ===
                          0 ? (
                            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-400">
                              Este bono todavía no tiene clases utilizadas.
                            </div>
                          ) : (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {usos.map(
                                (
                                  uso,
                                  indice
                                ) => {
                                  if (
                                    !uso.clases
                                  ) {
                                    return null;
                                  }

                                  const nombreUsuario =
                                    `${uso.alumnos?.nombre || ""} ${uso.alumnos?.apellidos || ""}`.trim();

                                  return (
                                    <div
                                      key={`${bono.id}-${indice}`}
                                      className={
                                        indice ===
                                        0
                                          ? "grid gap-2 px-3 py-3 sm:grid-cols-[90px_150px_minmax(0,1fr)] sm:items-center"
                                          : "grid gap-2 border-t border-slate-100 px-3 py-3 sm:grid-cols-[90px_150px_minmax(0,1fr)] sm:items-center"
                                      }
                                    >
                                      <div className="flex items-center justify-between gap-2 sm:block">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                          Uso
                                        </p>
                                        <p className="text-xs font-bold text-[#00A79C] sm:mt-1">
                                          #
                                          {usos.length -
                                            indice}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                          Fecha
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold text-[#17324D]">
                                          {formatearFecha(
                                            uso.clases
                                              .fecha
                                          )}
                                        </p>
                                      </div>

                                      <div>
                                        {esCompartido && (
                                          <p className="text-[10px] font-bold text-violet-700">
                                            {nombreUsuario ||
                                              "Alumno"}
                                          </p>
                                        )}

                                        <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                          {calcularHorario(
                                            uso.clases
                                              .hora_inicio,
                                            uso.clases
                                              .duracion_minutos
                                          )}
                                        </p>

                                        {uso.clases
                                          .ubicaciones
                                          ?.nombre && (
                                          <p className="mt-0.5 text-[10px] text-slate-400">
                                            {
                                              uso.clases
                                                .ubicaciones
                                                .nombre
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="border-t border-slate-100 bg-[#0F2742] px-3 py-3 sm:px-4">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarHistorial(
                                bono.id
                              )
                            }
                            className={
                              historialAbierto
                                ? "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#4DD4CA]/35 bg-[#00A79C]/20 px-3 text-[11px] font-bold text-[#85E6DF] sm:w-auto"
                                : "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white hover:bg-white/15 sm:w-auto"
                            }
                          >
                            <IconoHistorial />
                            Historial
                          </button>

                          <button
                            type="button"
                            disabled={
                              generandoImagenBono
                            }
                            onClick={() =>
                              descargarImagenBono(
                                bono
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:opacity-40 sm:w-auto"
                          >
                            <IconoImagen />
                            {generandoImagenBono
                              ? "Generando..."
                              : "Imagen"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editarBono(
                                bono
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 sm:w-auto"
                          >
                            <IconoEditar />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              borrarBono(
                                bono.id
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20 sm:w-auto"
                          >
                            <IconoBorrar />
                            Borrar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
