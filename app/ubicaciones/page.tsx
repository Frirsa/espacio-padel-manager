"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string | null;
  coste_pista: number | null;
  activa: boolean;
};

type ClaseUbicacion = {
  id: string;
  ubicacion_id: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  importe_club: number;
  coste_pista: number;

  clase_alumnos: {
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};


type IconoNombre =
  | "ubicacion"
  | "calendario"
  | "historial"
  | "euro"
  | "editar"
  | "estado"
  | "borrar"
  | "buscar"
  | "limpiar"
  | "pista";

function Icono({
  nombre,
  className = "h-4 w-4",
}: {
  nombre: IconoNombre;
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

  if (nombre === "ubicacion") {
    return (
      <svg {...props}>
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }

  if (nombre === "calendario") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  }

  if (nombre === "historial") {
    return (
      <svg {...props}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
    );
  }

  if (nombre === "euro") {
    return (
      <svg {...props}>
        <path d="M18 7.5A6.5 6.5 0 1 0 18 16.5" />
        <path d="M5 10h9M5 14h8" />
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

  if (nombre === "estado") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8M12 8v8" />
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

  if (nombre === "buscar") {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>
    );
  }

  if (nombre === "limpiar") {
    return (
      <svg {...props}>
        <path d="M4 7h16M7 12h10M10 17h4" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 8h16l-2-4H6L4 8Z" />
      <path d="M5 8v11h14V8M9 19v-6h6v6" />
    </svg>
  );
}

function SelectorCorporativo({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  opciones: {
    valor: string;
    etiqueta: string;
  }[];
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  const texto =
    opciones.find(
      (opcion) =>
        opcion.valor === valor
    )?.etiqueta || "";

  return (
    <div className="relative min-w-0">
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
        {etiqueta}
      </label>

      <button
        type="button"
        onClick={() =>
          setAbierto(
            (actual) => !actual
          )
        }
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-left text-xs font-bold text-white transition hover:bg-white/15"
      >
        <span className="truncate">
          {texto}
        </span>

        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 transition ${
            abierto
              ? "rotate-180"
              : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label={`Cerrar selector ${etiqueta}`}
            onClick={() =>
              setAbierto(false)
            }
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute left-0 top-[62px] z-50 w-full min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
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

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] =
    useState<Ubicacion[]>([]);

  const [clases, setClases] =
    useState<ClaseUbicacion[]>([]);

  const [nombre, setNombre] =
    useState("");

  const [tipo, setTipo] =
    useState("club");

  const [direccion, setDireccion] =
    useState("");

  const [costePista, setCostePista] =
    useState("");

  const [activa, setActiva] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [
    ubicacionEditandoId,
    setUbicacionEditandoId,
  ] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] =
    useState("todos");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState("todas");

  const [
    historialesAbiertos,
    setHistorialesAbiertos,
  ] =
    useState<string[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const {
      data: ubicacionesData,
      error: errorUbicaciones,
    } =
      await supabase
        .from("ubicaciones")
        .select("*")
        .order("nombre");

    if (errorUbicaciones) {
      setMensaje(
        "❌ Error al cargar ubicaciones: " +
          errorUbicaciones.message
      );

      return;
    }

    const {
      data: clasesData,
      error: errorClases,
    } =
      await supabase
        .from("clases")
        .select(`
          id,
          ubicacion_id,
          fecha,
          hora_inicio,
          duracion_minutos,
          tipo,
          estado,
          importe_club,
          coste_pista,
          clase_alumnos (
            alumnos (
              nombre,
              apellidos
            )
          )
        `)
        .not(
          "ubicacion_id",
          "is",
          null
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

    if (errorClases) {
      setMensaje(
        "❌ Error al cargar las clases: " +
          errorClases.message
      );

      return;
    }

    setUbicaciones(
      ubicacionesData ||
        []
    );

    setClases(
      (clasesData ||
        []) as unknown as ClaseUbicacion[]
    );
  }

  function tipoNormalizado(
    tipoUbicacion: string
  ) {
    if (
      tipoUbicacion ===
      "urbanizacion"
    ) {
      return "privada";
    }

    return tipoUbicacion;
  }

  function textoTipoUbicacion(
    tipoUbicacion: string
  ) {
    const normalizado =
      tipoNormalizado(
        tipoUbicacion
      );

    if (
      normalizado ===
      "club"
    ) {
      return "Club / centro deportivo";
    }

    if (
      normalizado ===
      "pago"
    ) {
      return "Pista de pago";
    }

    if (
      normalizado ===
      "privada"
    ) {
      return "Pista privada / urbanización";
    }

    return "Otro";
  }

  function limpiarFormulario() {
    setNombre("");
    setTipo("club");
    setDireccion("");
    setCostePista("");
    setActiva(true);

    setUbicacionEditandoId(
      null
    );
  }

  async function guardarUbicacion(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    const datos = {
      nombre,
      tipo,
      direccion:
        direccion ||
        null,

      coste_pista:
        costePista
          ? Number(
              costePista
            )
          : 0,

      activa,
    };

    let error;

    if (
      ubicacionEditandoId
    ) {
      const resultado =
        await supabase
          .from(
            "ubicaciones"
          )
          .update(
            datos
          )
          .eq(
            "id",
            ubicacionEditandoId
          );

      error =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from(
            "ubicaciones"
          )
          .insert(
            datos
          );

      error =
        resultado.error;
    }

    if (error) {
      setMensaje(
        "❌ Error al guardar ubicación: " +
          error.message
      );

      return;
    }

    setMensaje(
      ubicacionEditandoId
        ? "✅ Ubicación actualizada correctamente"
        : "✅ Ubicación creada correctamente"
    );

    limpiarFormulario();
    cargarDatos();
  }

  function editarUbicacion(
    ubicacion: Ubicacion
  ) {
    setUbicacionEditandoId(
      ubicacion.id
    );

    setNombre(
      ubicacion.nombre
    );

    setTipo(
      tipoNormalizado(
        ubicacion.tipo
      )
    );

    setDireccion(
      ubicacion.direccion ||
        ""
    );

    setCostePista(
      String(
        ubicacion.coste_pista ||
          ""
      )
    );

    setActiva(
      ubicacion.activa
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarUbicacion(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres borrar esta ubicación?"
      );

    if (!confirmar) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from("ubicaciones")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      setMensaje(
        "❌ Error al borrar ubicación: " +
          error.message
      );

      return;
    }

    if (
      ubicacionEditandoId ===
      id
    ) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Ubicación borrada correctamente"
    );

    cargarDatos();
  }

  async function cambiarEstadoUbicacion(
    ubicacion: Ubicacion
  ) {
    const {
      error,
    } =
      await supabase
        .from("ubicaciones")
        .update({
          activa:
            !ubicacion.activa,
        })
        .eq(
          "id",
          ubicacion.id
        );

    if (error) {
      setMensaje(
        "❌ Error al cambiar el estado: " +
          error.message
      );

      return;
    }

    cargarDatos();
  }

  function cambiarHistorial(
    ubicacionId: string
  ) {
    setHistorialesAbiertos(
      (actuales) =>
        actuales.includes(
          ubicacionId
        )
          ? actuales.filter(
              (id) =>
                id !==
                ubicacionId
            )
          : [
              ...actuales,
              ubicacionId,
            ]
    );
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

  function clasesDeUbicacion(
    ubicacionId: string
  ) {
    return clases.filter(
      (clase) =>
        clase.ubicacion_id ===
        ubicacionId
    );
  }

  function obtenerResumenUbicacion(
    ubicacionId: string
  ) {
    const clasesUbicacion =
      clasesDeUbicacion(
        ubicacionId
      );

    const realizadas =
      clasesUbicacion.filter(
        (clase) =>
          clase.estado ===
          "realizada"
      );

    const hoy =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    const ahora =
      new Date()
        .toTimeString()
        .slice(
          0,
          8
        );

    const proximas =
      clasesUbicacion
        .filter(
          (clase) => {
            if (
              clase.estado ===
              "cancelada"
            ) {
              return false;
            }

            if (
              clase.fecha >
              hoy
            ) {
              return true;
            }

            if (
              clase.fecha ===
                hoy &&
              clase.hora_inicio >=
                ahora
            ) {
              return true;
            }

            return false;
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const textoA =
              `${a.fecha} ${a.hora_inicio}`;

            const textoB =
              `${b.fecha} ${b.hora_inicio}`;

            return textoA.localeCompare(
              textoB
            );
          }
        );

    const realizadasOrdenadas =
      [...realizadas].sort(
        (
          a,
          b
        ) => {
          const textoA =
            `${a.fecha} ${a.hora_inicio}`;

          const textoB =
            `${b.fecha} ${b.hora_inicio}`;

          return textoB.localeCompare(
            textoA
          );
        }
      );

    const gastosPista =
      realizadas.reduce(
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

    const ingresosClub =
      realizadas.reduce(
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

    const saldo =
      ingresosClub -
      gastosPista;

    return {
      totalRealizadas:
        realizadas.length,

      proximaClase:
        proximas.length >
        0
          ? proximas[0]
          : null,

      ultimaClase:
        realizadasOrdenadas.length >
        0
          ? realizadasOrdenadas[0]
          : null,

      gastosPista,
      ingresosClub,
      saldo,
    };
  }

  const ubicacionesActivas =
    ubicaciones.filter(
      (ubicacion) =>
        ubicacion.activa
    ).length;

  const ubicacionesInactivas =
    ubicaciones.filter(
      (ubicacion) =>
        !ubicacion.activa
    ).length;

  const ubicacionesFiltradas =
    ubicaciones.filter(
      (ubicacion) => {
        const texto =
          `${ubicacion.nombre} ${
            ubicacion.direccion ||
            ""
          }`.toLowerCase();

        const coincideBusqueda =
          texto.includes(
            busqueda.toLowerCase()
          );

        const tipoUbicacion =
          tipoNormalizado(
            ubicacion.tipo
          );

        const coincideTipo =
          filtroTipo ===
            "todos" ||
          tipoUbicacion ===
            filtroTipo;

        const coincideEstado =
          filtroEstado ===
            "todas" ||
          (
            filtroEstado ===
              "activas" &&
            ubicacion.activa
          ) ||
          (
            filtroEstado ===
              "inactivas" &&
            !ubicacion.activa
          );

        return (
          coincideBusqueda &&
          coincideTipo &&
          coincideEstado
        );
      }
    );

  const totalUbicaciones =
    ubicaciones.length;

  const clubes =
    ubicaciones.filter(
      (ubicacion) =>
        tipoNormalizado(
          ubicacion.tipo
        ) === "club"
    ).length;

  const pistasPago =
    ubicaciones.filter(
      (ubicacion) =>
        tipoNormalizado(
          ubicacion.tipo
        ) === "pago"
    ).length;

  const pistasPrivadas =
    ubicaciones.filter(
      (ubicacion) =>
        tipoNormalizado(
          ubicacion.tipo
        ) === "privada"
    ).length;

  const hayFiltros =
    busqueda.trim() !== "" ||
    filtroTipo !== "todos" ||
    filtroEstado !== "todas";

  function claseTipoUbicacion(
    tipoUbicacion: string
  ) {
    const normalizado =
      tipoNormalizado(
        tipoUbicacion
      );

    if (
      normalizado === "club"
    ) {
      return "border-amber-300 bg-amber-50 text-amber-800";
    }

    if (
      normalizado === "pago"
    ) {
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }

    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA DE GESTIÓN */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Ubicaciones
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Clubes, pistas de pago y pistas privadas donde impartes tus clases.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:min-w-[430px]">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Total
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {totalUbicaciones}
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Activas
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {ubicacionesActivas}
                </p>
              </div>

              <div className="rounded-xl border border-red-300/15 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80">
                  Inactivas
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {ubicacionesInactivas}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">

          {/* FORMULARIO */}
          <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] xl:sticky xl:top-5">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    {ubicacionEditandoId
                      ? "Edición"
                      : "Alta"}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-white">
                    {ubicacionEditandoId
                      ? "Editar ubicación"
                      : "Nueva ubicación"}
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Define los datos habituales que se utilizarán al crear clases.
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#4DD4CA]">
                  <Icono
                    nombre="ubicacion"
                    className="h-5 w-5"
                  />
                </span>
              </div>
            </div>

            <form
              onSubmit={
                guardarUbicacion
              }
              className="space-y-4 p-4 sm:p-5"
            >
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Nombre
                </label>

                <input
                  type="text"
                  placeholder="Ej. IQL"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Tipo de ubicación
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      valor: "club",
                      etiqueta: "Club",
                    },
                    {
                      valor: "pago",
                      etiqueta: "De pago",
                    },
                    {
                      valor: "privada",
                      etiqueta: "Privada",
                    },
                  ].map(
                    (opcion) => {
                      const seleccionada =
                        tipo ===
                        opcion.valor;

                      return (
                        <button
                          key={opcion.valor}
                          type="button"
                          onClick={() => {
                            setTipo(
                              opcion.valor
                            );

                            if (
                              opcion.valor ===
                              "privada"
                            ) {
                              setCostePista(
                                "0"
                              );
                            }
                          }}
                          className={
                            seleccionada
                              ? opcion.valor === "club"
                                ? "flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-2 text-[11px] font-bold text-amber-800"
                                : opcion.valor === "pago"
                                ? "flex h-10 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700"
                                : "flex h-10 items-center justify-center rounded-xl border border-violet-300 bg-violet-50 px-2 text-[11px] font-bold text-violet-700"
                              : "flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                          }
                        >
                          {opcion.etiqueta}
                        </button>
                      );
                    }
                  )}
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {textoTipoUbicacion(
                    tipo
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Dirección
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350">
                    <Icono
                      nombre="ubicacion"
                    />
                  </span>

                  <input
                    type="text"
                    placeholder="Dirección"
                    value={direccion}
                    onChange={(e) =>
                      setDireccion(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-medium text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                  />
                </div>
              </div>

              {tipo === "privada" ? (
                <div className="rounded-xl border border-[#00A79C]/15 bg-[#E8F7F5]/70 p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#00A79C]">
                      <Icono
                        nombre="pista"
                      />
                    </span>

                    <div>
                      <p className="text-xs font-bold text-[#008C83]">
                        Sin coste habitual de pista
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Las pistas privadas / urbanizaciones se guardan con coste habitual 0 €.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Coste habitual de pista
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={costePista}
                      onChange={(e) =>
                        setCostePista(
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      €
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Valor por defecto al crear una clase. Podrás cambiarlo en una clase concreta sin modificar este importe habitual.
                  </p>
                </div>
              )}

              {ubicacionEditandoId && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Estado
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiva(true)
                      }
                      className={
                        activa
                          ? "h-10 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700"
                          : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                      }
                    >
                      Activa
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiva(false)
                      }
                      className={
                        !activa
                          ? "h-10 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700"
                          : "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                      }
                    >
                      Inactiva
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86]"
                >
                  <Icono
                    nombre="ubicacion"
                  />
                  {ubicacionEditandoId
                    ? "Guardar cambios"
                    : "Guardar ubicación"}
                </button>

                {ubicacionEditandoId && (
                  <button
                    type="button"
                    onClick={() => {
                      limpiarFormulario();
                      setMensaje("");
                    }}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
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
            <section className="relative rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    Directorio
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Ubicaciones registradas
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    Clubes {clubes} · De pago {pistasPago} · Privadas {pistasPrivadas}
                  </p>
                </div>

                <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                  {ubicacionesFiltradas.length} de {ubicaciones.length}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[minmax(260px,1fr)_190px_150px_auto] sm:items-end">
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                      Buscar
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45">
                        <Icono
                          nombre="buscar"
                        />
                      </span>

                      <input
                        type="text"
                        placeholder="Nombre o dirección..."
                        value={busqueda}
                        onChange={(e) =>
                          setBusqueda(
                            e.target.value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-xs font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-[#4DD4CA]/50 focus:bg-white/[0.12]"
                      />
                    </div>
                  </div>

                  <SelectorCorporativo
                    etiqueta="Tipo"
                    valor={filtroTipo}
                    opciones={[
                      {
                        valor: "todos",
                        etiqueta: "Todos los tipos",
                      },
                      {
                        valor: "club",
                        etiqueta: "Club / centro",
                      },
                      {
                        valor: "pago",
                        etiqueta: "Pista de pago",
                      },
                      {
                        valor: "privada",
                        etiqueta: "Pista privada",
                      },
                    ]}
                    onChange={
                      setFiltroTipo
                    }
                  />

                  <SelectorCorporativo
                    etiqueta="Estado"
                    valor={filtroEstado}
                    opciones={[
                      {
                        valor: "todas",
                        etiqueta: "Todas",
                      },
                      {
                        valor: "activas",
                        etiqueta: "Activas",
                      },
                      {
                        valor: "inactivas",
                        etiqueta: "Inactivas",
                      },
                    ]}
                    onChange={
                      setFiltroEstado
                    }
                  />

                  <button
                    type="button"
                    disabled={!hayFiltros}
                    onClick={() => {
                      setBusqueda("");
                      setFiltroTipo(
                        "todos"
                      );
                      setFiltroEstado(
                        "todas"
                      );
                    }}
                    className="col-span-2 inline-flex h-10 w-full self-end items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 sm:col-span-1 sm:w-auto"
                  >
                    <Icono
                      nombre="limpiar"
                    />
                    Limpiar
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-3 space-y-3 sm:mt-4">
              {ubicacionesFiltradas.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                  <p className="font-semibold text-slate-500">
                    No hay ubicaciones que coincidan con los filtros.
                  </p>
                </div>
              )}

              {ubicacionesFiltradas.map(
                (ubicacion) => {
                  const resumen =
                    obtenerResumenUbicacion(
                      ubicacion.id
                    );

                  const clasesUbicacion =
                    clasesDeUbicacion(
                      ubicacion.id
                    );

                  const historialAbierto =
                    historialesAbiertos.includes(
                      ubicacion.id
                    );

                  const tipoUbicacion =
                    tipoNormalizado(
                      ubicacion.tipo
                    );

                  return (
                    <article
                      key={ubicacion.id}
                      className={
                        ubicacion.activa
                          ? "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.025)]"
                      }
                    >
                      <header
                        className={
                          ubicacion.activa
                            ? "flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                            : "flex flex-col gap-3 border-b border-slate-200 bg-slate-100/70 px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                        }
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-[#17324D] sm:text-lg">
                              {ubicacion.nombre}
                            </h3>

                            {!ubicacion.activa && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            )}
                          </div>

                          <p className="mt-1 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-slate-400">
                            <Icono
                              nombre="ubicacion"
                              className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            />
                            <span>
                              {ubicacion.direccion ||
                                "Sin dirección registrada"}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:justify-end">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${claseTipoUbicacion(
                              ubicacion.tipo
                            )}`}
                          >
                            {textoTipoUbicacion(
                              ubicacion.tipo
                            )}
                          </span>

                          <span
                            className={
                              ubicacion.activa
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                            }
                          >
                            {ubicacion.activa
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </div>
                      </header>


                      {/* RESUMEN COMPACTO MÓVIL */}
                      <div className="border-b border-slate-100 bg-white p-3 md:hidden">
                        <div className="grid grid-cols-2 gap-2">

                          {/* COSTE HABITUAL */}
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Coste habitual
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#17324D]">
                              {tipoUbicacion ===
                              "privada"
                                ? "Sin coste"
                                : `${Number(
                                    ubicacion.coste_pista ||
                                      0
                                  ).toFixed(
                                    2
                                  )} €`}
                            </p>
                          </div>

                          {/* CLASES REALIZADAS */}
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Clases realizadas
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#17324D]">
                              {resumen.totalRealizadas}
                            </p>
                          </div>

                          {/* PRÓXIMA CLASE */}
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Próxima clase
                            </p>

                            {resumen.proximaClase ? (
                              <>
                                <p className="mt-1 text-xs font-bold text-[#17324D]">
                                  {formatearFecha(
                                    resumen.proximaClase.fecha
                                  )}
                                </p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                  {calcularHorario(
                                    resumen.proximaClase.hora_inicio,
                                    resumen.proximaClase.duracion_minutos
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                Sin próxima clase
                              </p>
                            )}
                          </div>

                          {/* ÚLTIMA CLASE */}
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Última clase
                            </p>

                            {resumen.ultimaClase ? (
                              <>
                                <p className="mt-1 text-xs font-bold text-[#17324D]">
                                  {formatearFecha(
                                    resumen.ultimaClase.fecha
                                  )}
                                </p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                  {calcularHorario(
                                    resumen.ultimaClase.hora_inicio,
                                    resumen.ultimaClase.duracion_minutos
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                Sin clases realizadas
                              </p>
                            )}
                          </div>

                          {/* RESUMEN ECONÓMICO */}
                          <div className="col-span-2 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-slate-100 bg-white px-2.5 py-2.5">
                              <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Gastos pista
                              </p>
                              <p className="mt-0.5 text-[11px] font-bold text-red-600">
                                {resumen.gastosPista.toFixed(
                                  2
                                )} €
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-white px-2.5 py-2.5">
                              <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Ingresos club
                              </p>
                              <p className="mt-0.5 text-[11px] font-bold text-emerald-700">
                                {resumen.ingresosClub.toFixed(
                                  2
                                )} €
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-white px-2.5 py-2.5">
                              <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                                Saldo
                              </p>
                              <p
                                className={
                                  resumen.saldo > 0
                                    ? "mt-0.5 text-[11px] font-bold text-emerald-700"
                                    : resumen.saldo < 0
                                    ? "mt-0.5 text-[11px] font-bold text-red-600"
                                    : "mt-0.5 text-[11px] font-bold text-[#17324D]"
                                }
                              >
                                {resumen.saldo.toFixed(
                                  2
                                )} €
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="hidden grid-cols-1 divide-y divide-slate-100 md:grid md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-[1.05fr_1fr_1fr]">
                        {/* DATOS */}
                        <section className="p-3.5 sm:p-4 md:col-span-2 xl:col-span-1">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="ubicacion"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Datos
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Configuración habitual
                              </p>
                            </div>
                          </div>

                          <div className="mt-1 divide-y divide-slate-100">
                            <div className="flex items-start gap-3 py-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
                                <Icono
                                  nombre="pista"
                                />
                              </span>

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                  Tipo
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                  {textoTipoUbicacion(
                                    ubicacion.tipo
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 py-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A79C]/10 text-[#00A79C]">
                                <Icono
                                  nombre="euro"
                                />
                              </span>

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                  Coste habitual
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-[#17324D]">
                                  {tipoUbicacion ===
                                  "privada"
                                    ? "Sin coste"
                                    : `${Number(
                                        ubicacion.coste_pista ||
                                          0
                                      ).toFixed(
                                        2
                                      )} €`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* ACTIVIDAD */}
                        <section className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="calendario"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Actividad
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Uso de esta ubicación
                              </p>
                            </div>
                          </div>

                          <div className="mt-1 divide-y divide-slate-100">
                            <div className="py-3">
                              <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                Próxima clase
                              </p>
                              {resumen.proximaClase ? (
                                <>
                                  <p className="mt-1 text-xs font-bold text-[#17324D]">
                                    {formatearFecha(
                                      resumen.proximaClase.fecha
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                    {calcularHorario(
                                      resumen.proximaClase.hora_inicio,
                                      resumen.proximaClase.duracion_minutos
                                    )}
                                  </p>
                                </>
                              ) : (
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  Sin próxima clase
                                </p>
                              )}
                            </div>

                            <div className="py-3">
                              <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                Última clase
                              </p>
                              {resumen.ultimaClase ? (
                                <>
                                  <p className="mt-1 text-xs font-bold text-[#17324D]">
                                    {formatearFecha(
                                      resumen.ultimaClase.fecha
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                    {calcularHorario(
                                      resumen.ultimaClase.hora_inicio,
                                      resumen.ultimaClase.duracion_minutos
                                    )}
                                  </p>
                                </>
                              ) : (
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  Sin clases realizadas
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Clases realizadas
                              </p>
                              <span className="rounded-full bg-[#EEF3F8] px-2.5 py-1 text-xs font-bold text-[#17324D]">
                                {resumen.totalRealizadas}
                              </span>
                            </div>
                          </div>
                        </section>

                        {/* ECONOMÍA */}
                        <section className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="euro"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Economía
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Histórico realizado
                              </p>
                            </div>
                          </div>

                          <div className="mt-1 divide-y divide-slate-100">
                            <div className="flex items-center justify-between gap-3 py-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Gastos de pista
                              </p>
                              <p className="text-xs font-bold text-red-600">
                                {resumen.gastosPista.toFixed(
                                  2
                                )} €
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Ingresos club
                              </p>
                              <p className="text-xs font-bold text-emerald-700">
                                {resumen.ingresosClub.toFixed(
                                  2
                                )} €
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                              <p className="text-xs font-bold text-[#17324D]">
                                Saldo
                              </p>
                              <p
                                className={
                                  resumen.saldo > 0
                                    ? "text-sm font-bold text-emerald-700"
                                    : resumen.saldo < 0
                                    ? "text-sm font-bold text-red-600"
                                    : "text-sm font-bold text-[#17324D]"
                                }
                              >
                                {resumen.saldo.toFixed(
                                  2
                                )} €
                              </p>
                            </div>
                          </div>
                        </section>
                      </div>

                      {/* HISTORIAL */}
                      {historialAbierto && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Historial de clases
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Clases registradas en {ubicacion.nombre}
                              </p>
                            </div>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">
                              {clasesUbicacion.length}{" "}
                              {clasesUbicacion.length ===
                              1
                                ? "clase"
                                : "clases"}
                            </span>
                          </div>

                          {clasesUbicacion.length ===
                          0 ? (
                            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-xs font-medium text-slate-400">
                              Esta ubicación todavía no tiene clases registradas.
                            </div>
                          ) : (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {[...clasesUbicacion]
                                .sort(
                                  (a, b) => {
                                    const textoA =
                                      `${a.fecha} ${a.hora_inicio}`;

                                    const textoB =
                                      `${b.fecha} ${b.hora_inicio}`;

                                    return textoB.localeCompare(
                                      textoA
                                    );
                                  }
                                )
                                .map(
                                  (
                                    clase,
                                    indice
                                  ) => {
                                    const nombres =
                                      clase.clase_alumnos
                                        .map(
                                          (participante) =>
                                            participante.alumnos
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
                                        .join(
                                          ", "
                                        );

                                    const saldoClase =
                                      Number(
                                        clase.importe_club ||
                                          0
                                      ) -
                                      Number(
                                        clase.coste_pista ||
                                          0
                                      );

                                    return (
                                      <div
                                        key={clase.id}
                                        className={
                                          indice === 0
                                            ? "relative grid gap-3 px-3 py-3.5 sm:px-4 lg:grid-cols-[145px_minmax(0,1fr)_220px]"
                                            : "relative grid gap-3 border-t border-slate-100 px-3 py-3.5 sm:px-4 lg:grid-cols-[145px_minmax(0,1fr)_220px]"
                                        }
                                      >
                                        {clase.estado ===
                                          "cancelada" && (
                                          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-500" />
                                        )}

                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-bold text-[#17324D]">
                                              {formatearFecha(
                                                clase.fecha
                                              )}
                                            </p>

                                            <span
                                              className={
                                                clase.estado ===
                                                "realizada"
                                                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700"
                                                  : clase.estado ===
                                                    "cancelada"
                                                  ? "rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700"
                                                  : "rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600"
                                              }
                                            >
                                              {clase.estado ===
                                              "realizada"
                                                ? "Realizada"
                                                : clase.estado ===
                                                  "cancelada"
                                                ? "Cancelada"
                                                : "Programada"}
                                            </span>
                                          </div>

                                          <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                            {calcularHorario(
                                              clase.hora_inicio,
                                              clase.duracion_minutos
                                            )}
                                          </p>
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400">
                                            Alumnos
                                          </p>
                                          <p className="mt-1 break-words text-xs font-semibold text-[#17324D]">
                                            {nombres ||
                                              "Sin alumnos"}
                                          </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs lg:block lg:text-right">
                                          <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400 lg:hidden">
                                              Club
                                            </p>
                                            <p className="mt-1 font-semibold text-emerald-700 lg:mt-0">
                                              {Number(
                                                clase.importe_club ||
                                                  0
                                              ).toFixed(
                                                2
                                              )} €
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-slate-400 lg:hidden">
                                              Pista
                                            </p>
                                            <p className="mt-1 font-semibold text-red-600 lg:mt-1">
                                              {Number(
                                                clase.coste_pista ||
                                                  0
                                              ).toFixed(
                                                2
                                              )} €
                                            </p>
                                          </div>

                                          <p
                                            className={
                                              saldoClase > 0
                                                ? "col-span-2 mt-1 font-bold text-emerald-700"
                                                : saldoClase < 0
                                                ? "col-span-2 mt-1 font-bold text-red-600"
                                                : "col-span-2 mt-1 font-bold text-[#17324D]"
                                            }
                                          >
                                            Saldo {saldoClase.toFixed(
                                              2
                                            )} €
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ACCIONES */}
                      <div className="border-t border-slate-100 bg-[#0F2742] px-3 py-3 sm:px-4">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarHistorial(
                                ubicacion.id
                              )
                            }
                            className={
                              historialAbierto
                                ? "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#4DD4CA]/35 bg-[#00A79C]/20 px-3 text-[11px] font-bold text-[#85E6DF] transition hover:bg-[#00A79C]/30 sm:w-auto"
                                : "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 sm:w-auto"
                            }
                          >
                            <Icono
                              nombre="historial"
                            />
                            {historialAbierto
                              ? "Ocultar historial"
                              : "Historial"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editarUbicacion(
                                ubicacion
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 sm:w-auto"
                          >
                            <Icono
                              nombre="editar"
                            />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstadoUbicacion(
                                ubicacion
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 sm:w-auto"
                          >
                            <Icono
                              nombre="estado"
                            />
                            {ubicacion.activa
                              ? "Desactivar"
                              : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              borrarUbicacion(
                                ubicacion.id
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20 sm:w-auto"
                          >
                            <Icono
                              nombre="borrar"
                            />
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
