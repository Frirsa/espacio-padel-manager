"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

import CobrosClub from "../../components/pagos/CobrosClub";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
};

type Pago = {
  id: string;
  alumno_id: string | null;
  importe: number;
  metodo: string;
  estado: string;
  fecha_pago: string;
  notas: string | null;

  clases: {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
    tipo: string;
    ubicaciones: {
      nombre: string;
    } | null;
  } | null;

  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
};


type IconoNombrePago =
  | "pago"
  | "buscar"
  | "editar"
  | "borrar"
  | "calendario"
  | "metodo"
  | "origen"
  | "pendiente"
  | "limpiar";

function IconoPago({
  nombre,
  className = "h-4 w-4",
}: {
  nombre: IconoNombrePago;
  className?: string;
}) {
  const props = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (nombre === "pago") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.25" />
        <path d="M14.75 8.25c-.65-.55-1.55-.85-2.55-.85-1.6 0-2.85.8-2.85 2s1.15 1.7 2.85 2c1.75.3 2.9.85 2.9 2.2 0 1.25-1.2 2.1-2.9 2.1-1.15 0-2.2-.35-2.95-1.05M12 5.8v12.4" />
      </svg>
    );
  }

  if (nombre === "buscar") {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (nombre === "editar") {
    return (
      <svg {...props}>
        <path d="m4 16.5-.5 4 4-.5L18.7 8.8l-3.5-3.5L4 16.5Z" />
        <path d="m13.8 6.7 3.5 3.5" />
      </svg>
    );
  }

  if (nombre === "borrar") {
    return (
      <svg {...props}>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </svg>
    );
  }

  if (nombre === "calendario") {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (nombre === "metodo") {
    return (
      <svg {...props}>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17M7 14h3" />
      </svg>
    );
  }

  if (nombre === "origen") {
    return (
      <svg {...props}>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </svg>
    );
  }

  if (nombre === "pendiente") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5v5l3 1.8" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}


function formatearFechaControlPago(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
  }

  const [anio, mes, dia] =
    valor.split("-").map(Number);

  const fecha = new Date(
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

function formatearMesControlPago(
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

function CampoFechaPago({
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
              <IconoPago
                nombre="calendario"
                className="h-4 w-4"
              />
            </span>
            <span className="truncate">
              {formatearFechaControlPago(
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

function SelectorFiltroPago({
  etiqueta,
  valor,
  onChange,
  opciones,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  opciones: Array<{
    valor: string;
    etiqueta: string;
  }>;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const etiquetaActual =
    opciones.find(
      (opcion) =>
        opcion.valor === valor
    )?.etiqueta || opciones[0]?.etiqueta || "";

  return (
    <div className="relative w-full min-w-0">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        {etiqueta}
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
            aria-label={`Cerrar selector de ${etiqueta.toLowerCase()}`}
          />

          <div className="absolute right-0 top-[58px] z-50 w-full min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
            {opciones.map(
              (opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => {
                    onChange(
                      opcion.valor
                    );
                    setAbierto(false);
                  }}
                  className={
                    opcion.valor === valor
                      ? "flex h-9 w-full items-center rounded-lg bg-[#17324D] px-3 text-left text-xs font-bold text-white"
                      : "flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                  }
                >
                  {opcion.etiqueta}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SelectorMesPagos({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] =
    useState(false);

  const anioActual = valor
    ? Number(valor.slice(0, 4))
    : new Date().getFullYear();

  const [anioSelector, setAnioSelector] =
    useState(anioActual);

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

  const mesActivo = valor
    ? Number(valor.slice(5, 7))
    : 0;

  return (
    <div className="relative">
      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        Mes
      </label>

      <button
        type="button"
        onClick={() => {
          if (valor) {
            setAnioSelector(
              Number(valor.slice(0, 4))
            );
          }
          setAbierto(
            (actual) => !actual
          );
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold capitalize text-white transition hover:bg-white/15"
      >
        <span className="truncate">
          {formatearMesControlPago(
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

          <div className="absolute left-1/2 top-[58px] z-50 w-[310px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:left-auto sm:right-0 sm:translate-x-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() =>
                  setAnioSelector(
                    (anio) => anio - 1
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
                    (anio) => anio + 1
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
                (nombreMes, indice) => {
                  const numeroMes = indice + 1;
                  const seleccionado =
                    valor &&
                    Number(valor.slice(0, 4)) === anioSelector &&
                    mesActivo === numeroMes;

                  return (
                    <button
                      key={nombreMes}
                      type="button"
                      onClick={() => {
                        onChange(
                          `${anioSelector}-${String(numeroMes).padStart(2, "0")}`
                        );
                        setAbierto(false);
                      }}
                      className={
                        seleccionado
                          ? "h-9 rounded-lg bg-[#17324D] text-[11px] font-bold text-white"
                          : "h-9 rounded-lg border border-slate-200 text-[11px] font-semibold text-[#17324D] hover:bg-slate-50"
                      }
                    >
                      {nombreMes.slice(0, 3)}
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

export default function PagosPage() {
  const searchParams =
    useSearchParams();

  const alumnoDesdeFicha =
    searchParams.get("alumno");
  const filtroDesdeDashboard =
    searchParams.get("filtro");

  const seccionDesdeDashboard =
    searchParams.get("seccion");

  const [alumnos, setAlumnos] =
    useState<Alumno[]>([]);

  const [pagos, setPagos] =
    useState<Pago[]>([]);

  const [alumnoId, setAlumnoId] =
    useState("");

  const [
    busquedaAlumno,
    setBusquedaAlumno,
  ] = useState("");

  const [
    mostrarTodosAlumnoPago,
    setMostrarTodosAlumnoPago,
  ] = useState(false);

  const [
    listaAlumnosPagoAbierta,
    setListaAlumnosPagoAbierta,
  ] = useState(false);

  const [importe, setImporte] =
    useState("");

  const [metodo, setMetodo] =
    useState("efectivo");

  const [estado, setEstado] =
    useState("pagado");

  const [
    fechaPago,
    setFechaPago,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [notas, setNotas] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    pagoEditandoId,
    setPagoEditandoId,
  ] =
    useState<string | null>(null);

  const [
    formularioMovilAbierto,
    setFormularioMovilAbierto,
  ] = useState(false);

  const [
    busquedaPagos,
    setBusquedaPagos,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    filtroMetodo,
    setFiltroMetodo,
  ] = useState("todos");

  const [
    filtroMes,
    setFiltroMes,
  ] = useState("");

  const [
    seccionActiva,
    setSeccionActiva,
  ] = useState<"pagos" | "clubs">(
    seccionDesdeDashboard === "clubs"
      ? "clubs"
      : "pagos"
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (filtroDesdeDashboard === "pendientes") {
      setFiltroEstado("pendiente");
    }
  }, [filtroDesdeDashboard]);

  useEffect(() => {
    if (seccionDesdeDashboard === "clubs") {
      setSeccionActiva("clubs");
    }
  }, [seccionDesdeDashboard]);

  useEffect(() => {
    if (alumnoDesdeFicha) {
      setAlumnoId(
        alumnoDesdeFicha
      );

      setBusquedaAlumno("");
      setFormularioMovilAbierto(true);
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
      data: pagosData,
      error,
    } = await supabase
      .from("pagos")
      .select(`
        id,
        alumno_id,
        importe,
        metodo,
        estado,
        fecha_pago,
        notas,
        clases (
          id,
          fecha,
          hora_inicio,
          duracion_minutos,
          tipo,
          ubicaciones (
            nombre
          )
        ),
        alumnos (
          nombre,
          apellidos
        )
      `)
      .order(
        "fecha_pago",
        {
          ascending: false,
        }
      );

    if (error) {
      setMensaje(
        "❌ Error al cargar los pagos: " +
          error.message
      );

      return;
    }

    setAlumnos(
      (alumnosData ||
        []) as Alumno[]
    );

    setPagos(
      (pagosData ||
        []) as unknown as Pago[]
    );
  }

  function limpiarFormulario() {
    setAlumnoId("");
    setBusquedaAlumno("");
    setMostrarTodosAlumnoPago(false);
    setListaAlumnosPagoAbierta(false);
    setImporte("");
    setMetodo("efectivo");
    setEstado("pagado");

    setFechaPago(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setNotas("");
    setPagoEditandoId(null);
  }

  async function guardarPago(
    e: FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (!importe) {
      setMensaje(
        "❌ Introduce un importe"
      );

      return;
    }

    const datos = {
      alumno_id:
        alumnoId || null,
      importe:
        Number(importe),
      metodo,
      estado,
      fecha_pago:
        fechaPago,
      notas:
        notas || null,
    };

    let error;

    if (pagoEditandoId) {
      const resultado =
        await supabase
          .from("pagos")
          .update(datos)
          .eq(
            "id",
            pagoEditandoId
          );

      error =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from("pagos")
          .insert(datos);

      error =
        resultado.error;
    }

    if (error) {
      setMensaje(
        "❌ Error al guardar el pago: " +
          error.message
      );

      return;
    }

    setMensaje(
      pagoEditandoId
        ? "✅ Pago actualizado correctamente"
        : "✅ Pago registrado correctamente"
    );

    limpiarFormulario();
    setFormularioMovilAbierto(false);

    await cargarDatos();
  }

  function editarPago(
    pago: Pago
  ) {
    setPagoEditandoId(
      pago.id
    );

    setAlumnoId(
      pago.alumno_id || ""
    );

    setBusquedaAlumno("");

    setImporte(
      String(pago.importe)
    );

    setMetodo(
      pago.metodo
    );

    setEstado(
      pago.estado
    );

    setFechaPago(
      pago.fecha_pago
    );

    setNotas(
      pago.notas || ""
    );

    setMensaje("");
    setFormularioMovilAbierto(true);

    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1280
    ) {
      requestAnimationFrame(() => {
        document
          .getElementById(
            "formulario-pago"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  async function cobrarRapido(
    pago: Pago,
    metodoCobro: string
  ) {
    setMensaje("");

    const {
      error,
    } = await supabase
      .from("pagos")
      .update({
        estado: "pagado",
        metodo: metodoCobro,
        fecha_pago:
          new Date()
            .toISOString()
            .slice(0, 10),
      })
      .eq(
        "id",
        pago.id
      );

    if (error) {
      setMensaje(
        "❌ No se pudo registrar el cobro: " +
          error.message
      );
      return;
    }

    setMensaje(
      "✅ Cobro registrado correctamente"
    );

    await cargarDatos();
  }

  async function borrarPago(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar este pago?"
      );

    if (!confirmar) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("pagos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(
        "❌ Error al borrar el pago: " +
          error.message
      );

      return;
    }

    if (
      pagoEditandoId === id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Pago borrado correctamente"
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

  function textoMetodo(
    metodoPago: string
  ) {
    if (
      metodoPago ===
      "efectivo"
    ) {
      return "Efectivo";
    }

    if (
      metodoPago ===
      "bizum"
    ) {
      return "Bizum";
    }

    if (
      metodoPago ===
      "transferencia"
    ) {
      return "Transferencia";
    }

    if (
      metodoPago ===
      "tarjeta"
    ) {
      return "Tarjeta";
    }

    return metodoPago;
  }

  const pagosFiltrados =
    pagos.filter((pago) => {
      const nombreAlumno =
        pago.alumnos
          ? `${pago.alumnos.nombre} ${
              pago.alumnos
                .apellidos || ""
            }`.toLowerCase()
          : "sin alumno";

      const coincideBusqueda =
        nombreAlumno.includes(
          busquedaPagos.toLowerCase()
        );

      const coincideEstado =
        filtroEstado ===
          "todos" ||
        pago.estado ===
          filtroEstado;

      const coincideMetodo =
        filtroMetodo ===
          "todos" ||
        pago.metodo ===
          filtroMetodo;

      const coincideMes =
        !filtroMes ||
        pago.fecha_pago.startsWith(
          filtroMes
        );

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideMetodo &&
        coincideMes
      );
    });

  const pagosPendientesRapidos =
    pagos
      .filter(
        (pago) =>
          pago.estado ===
          "pendiente"
      )
      .sort(
        (a, b) =>
          a.fecha_pago.localeCompare(
            b.fecha_pago
          )
      );

  const totalPendienteRapido =
    pagosPendientesRapidos.reduce(
      (total, pago) =>
        total +
        Number(
          pago.importe || 0
        ),
      0
    );

  const pendientesPorAlumno =
    Object.values(
      pagosPendientesRapidos.reduce(
        (
          acumulado,
          pago
        ) => {
          const clave =
            pago.alumno_id ||
            "sin-alumno";

          const nombre =
            pago.alumnos
              ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`.trim()
              : "Sin alumno";

          if (
            !acumulado[
              clave
            ]
          ) {
            acumulado[
              clave
            ] = {
              nombre,
              total: 0,
              cantidad: 0,
            };
          }

          acumulado[
            clave
          ].total +=
            Number(
              pago.importe ||
                0
            );

          acumulado[
            clave
          ].cantidad += 1;

          return acumulado;
        },
        {} as Record<
          string,
          {
            nombre: string;
            total: number;
            cantidad: number;
          }
        >
      )
    ).sort(
      (a, b) =>
        b.total -
        a.total
    );

  function textoTipoClase(
    tipo: string
  ) {
    if (tipo === "club") {
      return "Clase para club";
    }

    if (tipo === "propia") {
      return "Clase propia";
    }

    if (tipo === "privada") {
      return "Clase propia · pista privada";
    }

    return tipo;
  }

  const totalCobrado =
    pagosFiltrados
      .filter(
        (pago) =>
          pago.estado ===
          "pagado"
      )
      .reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe || 0
          ),
        0
      );

  const totalPendiente =
    pagosFiltrados
      .filter(
        (pago) =>
          pago.estado ===
          "pendiente"
      )
      .reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe || 0
          ),
        0
      );

  const totalPrevisto =
    totalCobrado +
    totalPendiente;

  const numeroPagos =
    pagosFiltrados.length;

  const terminoAlumnoPago =
    busquedaAlumno
      .trim()
      .toLowerCase();

  const alumnosFiltrados =
    terminoAlumnoPago
      ? alumnos.filter(
          (alumno) =>
            `${alumno.nombre} ${alumno.apellidos || ""}`
              .toLowerCase()
              .includes(
                terminoAlumnoPago
              )
        )
      : [];

  const resultadosAlumnoPago =
    mostrarTodosAlumnoPago
      ? alumnosFiltrados
      : alumnosFiltrados.slice(
          0,
          4
        );

  const alumnoSeleccionadoPago =
    alumnos.find(
      (alumno) =>
        alumno.id === alumnoId
    ) || null;

  const filtrosActivos =
    Boolean(busquedaPagos) ||
    filtroEstado !== "todos" ||
    filtroMetodo !== "todos" ||
    Boolean(filtroMes);

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA PRINCIPAL · MISMO PATRÓN V2 */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(360px,1fr)_minmax(650px,1.25fr)] xl:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Pagos
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Controla cobros de alumnos, pendientes y liquidaciones mensuales de clubs.
              </p>

              <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva(
                      "pagos"
                    )
                  }
                  className={
                    seccionActiva ===
                    "pagos"
                      ? "h-9 rounded-lg bg-[#00A79C] px-4 text-[11px] font-bold text-white shadow-sm"
                      : "h-9 rounded-lg px-4 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  Pagos de alumnos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva(
                      "clubs"
                    )
                  }
                  className={
                    seccionActiva ===
                    "clubs"
                      ? "h-9 rounded-lg bg-[#00A79C] px-4 text-[11px] font-bold text-white shadow-sm"
                      : "h-9 rounded-lg px-4 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  Cobros de clubs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Movimientos
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {numeroPagos}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Mostrados
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200/80">
                  Cobrado
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-bold text-white">
                  {totalCobrado.toFixed(
                    2
                  )} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Confirmado
                </p>
              </div>

              <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80">
                  Pendiente
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-bold text-white">
                  {totalPendiente.toFixed(
                    2
                  )} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Por cobrar
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Previsto
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-bold text-[#85E6DF]">
                  {totalPrevisto.toFixed(
                    2
                  )} €
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Total filtrado
                </p>
              </div>
            </div>
          </div>
        </section>

        {seccionActiva ===
        "clubs" ? (
          <div className="mt-4 sm:mt-5">
            <CobrosClub />
          </div>
        ) : (
          <>
            {filtroDesdeDashboard ===
              "pendientes" && (
              <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <p className="font-bold text-red-800">
                    Pagos pendientes de cobro
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    Se muestran únicamente los pagos pendientes enviados desde el Dashboard.
                  </p>
                </div>

                <a
                  href="/pagos"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 shadow-sm"
                >
                  Quitar filtro
                </a>
              </section>
            )}

            {/* COBRO RÁPIDO */}
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:mt-5">
              <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        pagosPendientesRapidos.length >
                        0
                          ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-200"
                          : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A79C]/20 text-[#85E6DF]"
                      }
                    >
                      <IconoPago
                        nombre="pendiente"
                        className="h-5 w-5"
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                        Atención
                      </p>
                      <h2 className="mt-0.5 text-lg font-bold">
                        Cobros pendientes
                      </h2>
                      <p className="mt-0.5 text-[11px] text-white/55">
                        Registra el cobro de una clase sin entrar en la edición completa.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pagosPendientesRapidos.length >
                    0 ? (
                      <>
                        <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-100">
                          {pagosPendientesRapidos.length}{" "}
                          {pagosPendientesRapidos.length ===
                          1
                            ? "cobro"
                            : "cobros"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                          {totalPendienteRapido.toFixed(
                            2
                          )} €
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-1.5 text-xs font-bold text-[#85E6DF]">
                        ✓ Todo cobrado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {pagosPendientesRapidos.length >
              0 ? (
                <div className="p-4 sm:p-5">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {pendientesPorAlumno.map(
                      (item) => (
                        <div
                          key={
                            item.nombre
                          }
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#FBFCFD] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#17324D]">
                              {item.nombre}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {item.cantidad}{" "}
                              {item.cantidad ===
                              1
                                ? "pendiente"
                                : "pendientes"}
                            </p>
                          </div>

                          <strong className="shrink-0 text-xs text-red-600">
                            {item.total.toFixed(
                              2
                            )} €
                          </strong>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 2xl:grid-cols-2">
                    {pagosPendientesRapidos.map(
                      (pago) => {
                        const nombre =
                          pago.alumnos
                            ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`.trim()
                            : "Sin alumno";

                        return (
                          <article
                            key={
                              pago.id
                            }
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                          >
                            <div className="flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-[#17324D]">
                                    {
                                      nombre
                                    }
                                  </p>

                                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                                    Pendiente
                                  </span>
                                </div>

                                {pago.clases ? (
                                  <p className="mt-1 text-xs font-medium text-slate-400">
                                    {formatearFecha(
                                      pago
                                        .clases
                                        .fecha
                                    )}{" "}
                                    ·{" "}
                                    {pago.clases.hora_inicio.slice(
                                      0,
                                      5
                                    )}{" "}
                                    ·{" "}
                                    {pago.clases
                                      .ubicaciones
                                      ?.nombre ||
                                      "Sin ubicación"}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-xs font-medium text-slate-400">
                                    Pendiente desde{" "}
                                    {formatearFecha(
                                      pago.fecha_pago
                                    )}
                                  </p>
                                )}
                              </div>

                              <p className="shrink-0 text-lg font-bold text-red-600">
                                {Number(
                                  pago.importe ||
                                    0
                                ).toFixed(
                                  2
                                )} €
                              </p>
                            </div>

                            <div className="bg-[#0F2742] px-3 py-3 sm:px-4">
                              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    cobrarRapido(
                                      pago,
                                      "efectivo"
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#00A79C] px-3 text-[11px] font-bold text-white transition hover:bg-[#008F86]"
                                >
                                  Efectivo
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cobrarRapido(
                                      pago,
                                      "bizum"
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                                >
                                  Bizum
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cobrarRapido(
                                      pago,
                                      "transferencia"
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                                >
                                  Transferencia
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editarPago(
                                      pago
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                                >
                                  <IconoPago nombre="editar" />
                                  Editar
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-5">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    ✓ No tienes cobros pendientes.
                  </div>
                </div>
              )}
            </section>

            <div className="mt-4 xl:hidden">
              <button
                type="button"
                onClick={() => {
                  if (
                    formularioMovilAbierto
                  ) {
                    if (
                      pagoEditandoId
                    ) {
                      limpiarFormulario();
                    }

                    setMensaje("");
                    setFormularioMovilAbierto(
                      false
                    );
                    return;
                  }

                  limpiarFormulario();
                  setMensaje("");
                  setFormularioMovilAbierto(
                    true
                  );
                }}
                className={
                  formularioMovilAbierto
                    ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#17324D] shadow-sm"
                    : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#00A79C] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.20)] transition hover:bg-[#008F86]"
                }
              >
                {formularioMovilAbierto ? (
                  <>
                    <span className="text-lg leading-none">
                      ×
                    </span>
                    Cerrar formulario
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none">
                      +
                    </span>
                    Nuevo pago
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">

              {/* ALTA / EDICIÓN */}
              <aside
                id="formulario-pago"
                className={`${
                  formularioMovilAbierto
                    ? "block"
                    : "hidden"
                } self-start scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.045)] xl:sticky xl:top-5 xl:block`}
              >
                <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                      <IconoPago
                        nombre="pago"
                        className="h-5 w-5"
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                        {pagoEditandoId
                          ? "Edición"
                          : "Alta"}
                      </p>
                      <h2 className="mt-0.5 text-lg font-bold">
                        {pagoEditandoId
                          ? "Editar pago"
                          : "Nuevo pago"}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-white/55">
                        Alumno, importe, método y estado
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={
                    guardarPago
                  }
                  className="space-y-4 p-4 sm:p-5"
                >
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Alumno
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconoPago
                          nombre="buscar"
                          className="h-4 w-4"
                        />
                      </span>

                      <input
                        type="text"
                        autoComplete="off"
                        placeholder={
                          alumnoSeleccionadoPago
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
                          setMostrarTodosAlumnoPago(
                            false
                          );
                        }}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                      />

                      {terminoAlumnoPago && (
                        <div className="absolute left-0 right-0 top-[48px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                          {alumnosFiltrados.length === 0 ? (
                            <div className="px-4 py-4 text-xs text-slate-400">
                              No hay alumnos que coincidan con “{busquedaAlumno}”.
                            </div>
                          ) : (
                            <>
                              <div
                                className={
                                  mostrarTodosAlumnoPago
                                    ? "max-h-[260px] overflow-y-auto p-1.5"
                                    : "p-1.5"
                                }
                              >
                                {resultadosAlumnoPago.map(
                                  (alumno) => (
                                    <button
                                      key={alumno.id}
                                      type="button"
                                      onClick={() => {
                                        setAlumnoId(
                                          alumno.id
                                        );
                                        setBusquedaAlumno(
                                          ""
                                        );
                                        setMostrarTodosAlumnoPago(
                                          false
                                        );
                                      }}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#EEF7F6]"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7F5] text-[#00A79C]">
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
                                          <circle cx="12" cy="8" r="3.25" />
                                          <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
                                        </svg>
                                      </span>

                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-[#17324D]">
                                          {alumno.nombre}{" "}
                                          {alumno.apellidos || ""}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                          Seleccionar alumno
                                        </p>
                                      </div>
                                    </button>
                                  )
                                )}
                              </div>

                              {alumnosFiltrados.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMostrarTodosAlumnoPago(
                                      (actual) => !actual
                                    )
                                  }
                                  className="flex h-10 w-full items-center justify-center border-t border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-[#17324D] transition hover:bg-slate-100"
                                >
                                  {mostrarTodosAlumnoPago
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
                          setListaAlumnosPagoAbierta(
                            (actual) => !actual
                          )
                        }
                        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-[#17324D] transition hover:bg-slate-100"
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 text-[#00A79C]"
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
                          Seleccionar de la lista
                        </span>
                        <span className="text-slate-400">⌄</span>
                      </button>

                      {listaAlumnosPagoAbierta && (
                        <>
                          <button
                            type="button"
                            aria-label="Cerrar lista de alumnos"
                            onClick={() =>
                              setListaAlumnosPagoAbierta(
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
                              <button
                                type="button"
                                onClick={() => {
                                  setAlumnoId("");
                                  setBusquedaAlumno("");
                                  setListaAlumnosPagoAbierta(false);
                                }}
                                className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                              >
                                Sin alumno
                              </button>

                              {alumnos.map(
                                (alumno) => (
                                  <button
                                    key={alumno.id}
                                    type="button"
                                    onClick={() => {
                                      setAlumnoId(
                                        alumno.id
                                      );
                                      setBusquedaAlumno(
                                        ""
                                      );
                                      setListaAlumnosPagoAbierta(
                                        false
                                      );
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#EEF7F6]"
                                  >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7F5] text-[#00A79C]">
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
                                        <circle cx="12" cy="8" r="3.25" />
                                        <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
                                      </svg>
                                    </span>
                                    <span className="truncate text-xs font-bold text-[#17324D]">
                                      {alumno.nombre}{" "}
                                      {alumno.apellidos || ""}
                                    </span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {alumnoSeleccionadoPago ? (
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#00A79C]/20 bg-[#E8F7F5]/70 px-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#00A79C] shadow-sm">
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
                            <circle cx="12" cy="8" r="3.25" />
                            <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
                          </svg>
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-[#17324D]">
                            {alumnoSeleccionadoPago.nombre}{" "}
                            {alumnoSeleccionadoPago.apellidos || ""}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-[#008C83]">
                            Alumno seleccionado
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAlumnoId("");
                            setBusquedaAlumno("");
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

                  <div className="grid grid-cols-2 gap-3">
                    <CampoFechaPago
                      etiqueta="Fecha"
                      valor={fechaPago}
                      onChange={setFechaPago}
                    />

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Importe
                      </span>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={
                            importe
                          }
                          onChange={(e) =>
                            setImporte(
                              e.target
                                .value
                            )
                          }
                          required
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-bold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                        />

                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          €
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Estado
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEstado(
                            "pagado"
                          )
                        }
                        className={
                          estado ===
                          "pagado"
                            ? "h-10 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
                            : "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        }
                      >
                        Pagado
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEstado(
                            "pendiente"
                          )
                        }
                        className={
                          estado ===
                          "pendiente"
                            ? "h-10 rounded-xl border border-red-300 bg-red-50 px-3 text-xs font-bold text-red-700"
                            : "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        }
                      >
                        Pendiente
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Método de pago
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["efectivo", "Efectivo"],
                        ["bizum", "Bizum"],
                        ["transferencia", "Transferencia"],
                        ["tarjeta", "Tarjeta"],
                      ].map(([id, etiqueta]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setMetodo(id)
                          }
                          className={
                            metodo === id
                              ? "h-10 rounded-xl border border-[#00A79C] bg-[#E8F7F5] px-3 text-xs font-bold text-[#008C83]"
                              : "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                          }
                        >
                          {etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Notas
                    </span>

                    <textarea
                      rows={3}
                      placeholder="Observaciones opcionales..."
                      value={
                        notas
                      }
                      onChange={(e) =>
                        setNotas(
                          e.target
                            .value
                        )
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />
                  </label>

                  <div className="border-t border-slate-100 pt-4">
                    <button
                      type="submit"
                      className="h-11 w-full rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86]"
                    >
                      {pagoEditandoId
                        ? "Guardar cambios"
                        : "Guardar pago"}
                    </button>

                    {pagoEditandoId && (
                      <button
                        type="button"
                        onClick={() => {
                          limpiarFormulario();
                          setMensaje(
                            ""
                          );
                        }}
                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#17324D] transition hover:bg-slate-50"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>

                  {mensaje && (
                    <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                      {
                        mensaje
                      }
                    </p>
                  )}
                </form>
              </aside>

              {/* LISTADO */}
              <div className="min-w-0">
                <section className="relative rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                        <IconoPago
                          nombre="pago"
                          className="h-5 w-5"
                        />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                          Gestión
                        </p>

                        <h2 className="mt-0.5 text-xl font-bold text-white">
                          Pagos registrados
                        </h2>

                        <p className="mt-1 text-sm text-white/55">
                          Consulta, filtra y gestiona el historial de cobros
                        </p>
                      </div>
                    </div>

                    <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                      {pagosFiltrados.length}{" "}
                      {pagosFiltrados.length ===
                      1
                        ? "pago"
                        : "pagos"}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4 sm:mt-5">
                    <div className="grid grid-cols-2 gap-2.5 2xl:grid-cols-[minmax(260px,1fr)_150px_170px_170px_auto] 2xl:items-end">
                      <div className="col-span-2 min-w-0 2xl:col-span-1">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                          Buscar
                        </span>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4DD4CA]">
                            <IconoPago nombre="buscar" />
                          </span>

                          <input
                            type="text"
                            placeholder="Alumno..."
                            value={
                              busquedaPagos
                            }
                            onChange={(e) =>
                              setBusquedaPagos(
                                e.target
                                  .value
                              )
                            }
                            className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 hover:bg-white/15 focus:border-[#4DD4CA]/45 focus:ring-2 focus:ring-[#00A79C]/15"
                          />
                        </div>
                      </div>

                      <SelectorFiltroPago
                        etiqueta="Estado"
                        valor={filtroEstado}
                        onChange={setFiltroEstado}
                        opciones={[
                          { valor: "todos", etiqueta: "Todos" },
                          { valor: "pagado", etiqueta: "Pagados" },
                          { valor: "pendiente", etiqueta: "Pendientes" },
                        ]}
                      />

                      <SelectorFiltroPago
                        etiqueta="Método"
                        valor={filtroMetodo}
                        onChange={setFiltroMetodo}
                        opciones={[
                          { valor: "todos", etiqueta: "Todos" },
                          { valor: "efectivo", etiqueta: "Efectivo" },
                          { valor: "bizum", etiqueta: "Bizum" },
                          { valor: "transferencia", etiqueta: "Transferencia" },
                          { valor: "tarjeta", etiqueta: "Tarjeta" },
                        ]}
                      />

                      <SelectorMesPagos
                        valor={filtroMes}
                        onChange={setFiltroMes}
                      />

                      <button
                        type="button"
                        disabled={
                          !filtrosActivos
                        }
                        onClick={() => {
                          setBusquedaPagos(
                            ""
                          );
                          setFiltroEstado(
                            "todos"
                          );
                          setFiltroMetodo(
                            "todos"
                          );
                          setFiltroMes(
                            ""
                          );
                        }}
                        className="inline-flex h-10 w-full self-end items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 2xl:w-auto"
                      >
                        <IconoPago nombre="limpiar" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </section>

                <div className="mt-3 space-y-3 sm:mt-4">
                  {pagosFiltrados.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                        <IconoPago
                          nombre="pago"
                          className="h-5 w-5"
                        />
                      </div>

                      <p className="mt-3 font-bold text-[#17324D]">
                        No hay resultados
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Prueba a cambiar la búsqueda o los filtros.
                      </p>
                    </div>
                  )}

                  {pagosFiltrados.map(
                    (pago) => {
                      const nombre =
                        pago.alumnos
                          ? `${pago.alumnos.nombre} ${pago.alumnos.apellidos || ""}`.trim()
                          : "Sin alumno";

                      return (
                        <article
                          key={
                            pago.id
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                        >
                          <div className="flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={
                                  pago.estado ===
                                  "pagado"
                                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                }
                              >
                                <IconoPago
                                  nombre="pago"
                                  className="h-5 w-5"
                                />
                              </span>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-base font-bold text-[#17324D]">
                                    {
                                      nombre
                                    }
                                  </h3>

                                  <span
                                    className={
                                      pago.estado ===
                                      "pagado"
                                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                        : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                                    }
                                  >
                                    {pago.estado ===
                                    "pagado"
                                      ? "Pagado"
                                      : "Pendiente"}
                                  </span>
                                </div>

                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                  {pago.clases
                                    ? "Pago vinculado a una clase"
                                    : "Registro manual"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-[#17324D]">
                                {Number(
                                  pago.importe ||
                                    0
                                ).toFixed(
                                  2
                                )} €
                              </span>
                            </div>
                          </div>

                          <div className="grid divide-y divide-slate-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                            <section className="p-3.5 sm:p-4">
                              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <span className="text-[#00A79C]">
                                  <IconoPago
                                    nombre="calendario"
                                    className="h-5 w-5"
                                  />
                                </span>

                                <div>
                                  <h4 className="text-sm font-bold text-[#17324D]">
                                    Fecha
                                  </h4>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Fecha registrada
                                  </p>
                                </div>
                              </div>

                              <p className="mt-3 text-sm font-bold text-[#17324D]">
                                {formatearFecha(
                                  pago.fecha_pago
                                )}
                              </p>
                            </section>

                            <section className="p-3.5 sm:p-4">
                              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <span className="text-[#00A79C]">
                                  <IconoPago
                                    nombre="metodo"
                                    className="h-5 w-5"
                                  />
                                </span>

                                <div>
                                  <h4 className="text-sm font-bold text-[#17324D]">
                                    Método
                                  </h4>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Forma de cobro
                                  </p>
                                </div>
                              </div>

                              <p className="mt-3 text-sm font-bold text-[#17324D]">
                                {textoMetodo(
                                  pago.metodo
                                )}
                              </p>
                            </section>

                            <section className="p-3.5 sm:p-4">
                              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <span className="text-[#00A79C]">
                                  <IconoPago
                                    nombre="origen"
                                    className="h-5 w-5"
                                  />
                                </span>

                                <div>
                                  <h4 className="text-sm font-bold text-[#17324D]">
                                    Origen
                                  </h4>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Procedencia del pago
                                  </p>
                                </div>
                              </div>

                              {pago.clases ? (
                                <>
                                  <p className="mt-3 text-sm font-bold text-[#17324D]">
                                    Clase{" "}
                                    {formatearFecha(
                                      pago
                                        .clases
                                        .fecha
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {pago.clases.hora_inicio.slice(
                                      0,
                                      5
                                    )}{" "}
                                    ·{" "}
                                    {pago.clases
                                      .duracion_minutos}{" "}
                                    min
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-400">
                                    {pago.clases
                                      .ubicaciones
                                      ?.nombre ||
                                      "Sin ubicación"}
                                  </p>
                                </>
                              ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-400">
                                  Alta manual
                                </p>
                              )}
                            </section>
                          </div>

                          {pago.notas &&
                            pago.notas !==
                              "Generado automáticamente desde Clases" && (
                              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Notas
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {
                                    pago.notas
                                  }
                                </p>
                              </div>
                            )}

                          <div className="bg-[#0F2742] px-3 py-3 sm:px-4">
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  editarPago(
                                    pago
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                              >
                                <IconoPago nombre="editar" />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  borrarPago(
                                    pago.id
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20"
                              >
                                <IconoPago nombre="borrar" />
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
          </>
        )}
      </div>
    </main>
  );
}
