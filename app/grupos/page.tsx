"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
  apodo: string | null;
};

type Grupo = {
  id: string;
  nombre: string;
  activo: boolean;
  grupo_alumnos: {
    alumno_id: string;
    alumnos: {
      nombre: string;
      apellidos: string | null;
      apodo: string | null;
    } | null;
  }[];
};

type ClaseGrupo = {
  id: string;
  grupo_id: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  estado: string;
  ubicaciones: {
    nombre: string;
  } | null;
};

function nombreAlumnoGrupo(
  alumno:
    | {
        nombre: string;
        apellidos: string | null;
        apodo: string | null;
      }
    | null
    | undefined
) {
  if (!alumno) {
    return "";
  }

  const apodo =
    (alumno.apodo || "").trim();

  if (apodo) {
    return apodo;
  }

  return `${alumno.nombre || ""} ${
    alumno.apellidos || ""
  }`.trim();
}


function Icono({
  nombre,
  className = "h-4 w-4",
}: {
  nombre:
    | "grupo"
    | "buscar"
    | "alumnos"
    | "calendario"
    | "historial"
    | "editar"
    | "estado"
    | "borrar"
    | "limpiar"
    | "check";
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

  if (nombre === "grupo") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3.5 19c.7-3.2 2.8-5 5.5-5s4.8 1.8 5.5 5" />
        <path d="M14.5 15.5c2.9 0 4.8 1.3 5.5 3.5" />
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

  if (nombre === "alumnos") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20c.55-4 2.9-6 7-6s6.45 2 7 6" />
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

  if (nombre === "historial") {
    return (
      <svg {...props}>
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" />
        <path d="M4 4v4.5h4.5M12 8v5l3 2" />
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
        <path d="M12 7v5l3 2" />
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

  if (nombre === "limpiar") {
    return (
      <svg {...props}>
        <path d="M4 7h16M7 12h10M10 17h4" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}


function CampoEstadoGrupos({
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
      valor: "todos",
      etiqueta: "Todos",
    },
    {
      valor: "activos",
      etiqueta: "Activos",
    },
    {
      valor: "inactivos",
      etiqueta: "Inactivos",
    },
  ];

  const etiquetaActual =
    opciones.find(
      (opcion) =>
        opcion.valor === valor
    )?.etiqueta || "Todos";

  return (
    <div className="relative w-full min-w-0 sm:w-[155px] sm:shrink-0">
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

          <div className="absolute right-0 top-[58px] z-50 w-full min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
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

export default function GruposPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [clases, setClases] = useState<ClaseGrupo[]>([]);

  const [nombreGrupo, setNombreGrupo] = useState("");
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [alumnosSeleccionados, setAlumnosSeleccionados] =
    useState<string[]>([]);
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [grupoEditandoId, setGrupoEditandoId] =
    useState<string | null>(null);

  const [busquedaGrupos, setBusquedaGrupos] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [historialesAbiertos, setHistorialesAbiertos] =
    useState<string[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("id,nombre,apellidos,apodo")
      .eq("activo", true)
      .order("nombre");

    const { data: gruposData } = await supabase
      .from("grupos")
      .select(`
        id,
        nombre,
        activo,
        grupo_alumnos (
          alumno_id,
          alumnos (
            nombre,
            apellidos,
            apodo
          )
        )
      `)
      .order("nombre");

    const { data: clasesData } = await supabase
      .from("clases")
      .select(`
        id,
        grupo_id,
        fecha,
        hora_inicio,
        duracion_minutos,
        estado,
        ubicaciones (
          nombre
        )
      `)
      .not("grupo_id", "is", null)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    setAlumnos(alumnosData || []);
    setGrupos((gruposData || []) as unknown as Grupo[]);
    setClases((clasesData || []) as unknown as ClaseGrupo[]);
  }

  function cambiarAlumno(id: string) {
    setAlumnosSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter(
            (alumnoId) => alumnoId !== id
          )
        : [...actuales, id]
    );
  }

  function limpiarFormulario() {
    setNombreGrupo("");
    setBusquedaAlumno("");
    setAlumnosSeleccionados([]);
    setActivo(true);
    setGrupoEditandoId(null);
  }

  async function guardarGrupo(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setMensaje("");

    let grupoId = grupoEditandoId;

    if (grupoEditandoId) {
      const { error } = await supabase
        .from("grupos")
        .update({
          nombre: nombreGrupo,
          activo,
        })
        .eq("id", grupoEditandoId);

      if (error) {
        setMensaje(
          "❌ Error al actualizar grupo: " +
            error.message
        );
        return;
      }

      const { error: errorBorrarRelaciones } =
        await supabase
          .from("grupo_alumnos")
          .delete()
          .eq("grupo_id", grupoEditandoId);

      if (errorBorrarRelaciones) {
        setMensaje(
          "❌ Error al actualizar los alumnos del grupo"
        );
        return;
      }
    } else {
      const { data: grupoCreado, error } =
        await supabase
          .from("grupos")
          .insert({
            nombre: nombreGrupo,
            activo: true,
          })
          .select()
          .single();

      if (error || !grupoCreado) {
        setMensaje(
          "❌ Error al crear grupo"
        );
        return;
      }

      grupoId = grupoCreado.id;
    }

    if (
      grupoId &&
      alumnosSeleccionados.length > 0
    ) {
      const relaciones =
        alumnosSeleccionados.map(
          (alumnoId) => ({
            grupo_id: grupoId,
            alumno_id: alumnoId,
          })
        );

      const { error } = await supabase
        .from("grupo_alumnos")
        .insert(relaciones);

      if (error) {
        setMensaje(
          "⚠️ Error al guardar los alumnos del grupo"
        );
        return;
      }
    }

    setMensaje(
      grupoEditandoId
        ? "✅ Grupo actualizado correctamente"
        : "✅ Grupo creado correctamente"
    );

    limpiarFormulario();
    cargarDatos();
  }

  function editarGrupo(grupo: Grupo) {
    setGrupoEditandoId(grupo.id);
    setNombreGrupo(grupo.nombre);
    setBusquedaAlumno("");
    setActivo(grupo.activo);

    setAlumnosSeleccionados(
      grupo.grupo_alumnos.map(
        (item) => item.alumno_id
      )
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function borrarGrupo(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar este grupo?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("grupos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(
        "❌ Error al borrar grupo: " +
          error.message
      );
      return;
    }

    if (grupoEditandoId === id) {
      limpiarFormulario();
    }

    setMensaje(
      "✅ Grupo borrado correctamente"
    );

    cargarDatos();
  }

  async function cambiarEstadoGrupo(
    grupo: Grupo
  ) {
    const { error } = await supabase
      .from("grupos")
      .update({
        activo: !grupo.activo,
      })
      .eq("id", grupo.id);

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
    grupoId: string
  ) {
    setHistorialesAbiertos((actuales) =>
      actuales.includes(grupoId)
        ? actuales.filter(
            (id) => id !== grupoId
          )
        : [...actuales, grupoId]
    );
  }

  function formatearFecha(fecha: string) {
    const [anio, mes, dia] =
      fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  function calcularHorario(
    horaInicio: string,
    duracionMinutos: number
  ) {
    const [hora, minuto] =
      horaInicio.split(":").map(Number);

    const inicio = new Date();

    inicio.setHours(
      hora,
      minuto,
      0,
      0
    );

    const fin = new Date(
      inicio.getTime() +
        duracionMinutos * 60 * 1000
    );

    const inicioTexto =
      `${String(
        inicio.getHours()
      ).padStart(2, "0")}:` +
      `${String(
        inicio.getMinutes()
      ).padStart(2, "0")} h`;

    const finTexto =
      `${String(
        fin.getHours()
      ).padStart(2, "0")}:` +
      `${String(
        fin.getMinutes()
      ).padStart(2, "0")} h`;

    return `${inicioTexto} a ${finTexto}`;
  }

  function clasesDelGrupo(
    grupoId: string
  ) {
    return clases.filter(
      (clase) =>
        clase.grupo_id === grupoId
    );
  }

  function obtenerResumenGrupo(
    grupoId: string
  ) {
    const clasesGrupo =
      clasesDelGrupo(grupoId);

    const realizadas =
      clasesGrupo.filter(
        (clase) =>
          clase.estado === "realizada"
      );

    const hoy =
      new Date()
        .toISOString()
        .slice(0, 10);

    const ahora =
      new Date()
        .toTimeString()
        .slice(0, 8);

    const proximas =
      clasesGrupo
        .filter((clase) => {
          if (
            clase.estado === "cancelada"
          ) {
            return false;
          }

          if (clase.fecha > hoy) {
            return true;
          }

          if (
            clase.fecha === hoy &&
            clase.hora_inicio >= ahora
          ) {
            return true;
          }

          return false;
        })
        .sort((a, b) => {
          const textoA =
            `${a.fecha} ${a.hora_inicio}`;
          const textoB =
            `${b.fecha} ${b.hora_inicio}`;

          return textoA.localeCompare(
            textoB
          );
        });

    const realizadasOrdenadas =
      [...realizadas].sort(
        (a, b) => {
          const textoA =
            `${a.fecha} ${a.hora_inicio}`;
          const textoB =
            `${b.fecha} ${b.hora_inicio}`;

          return textoB.localeCompare(
            textoA
          );
        }
      );

    return {
      totalRealizadas:
        realizadas.length,
      proximaClase:
        proximas.length > 0
          ? proximas[0]
          : null,
      ultimaClase:
        realizadasOrdenadas.length > 0
          ? realizadasOrdenadas[0]
          : null,
    };
  }

  const alumnosFiltrados =
    alumnos.filter((alumno) => {
      const nombreCompleto =
        `${alumno.nombre} ${
          alumno.apellidos || ""
        } ${
          alumno.apodo || ""
        }`.toLowerCase();

      return nombreCompleto.includes(
        busquedaAlumno.toLowerCase()
      );
    });

  const gruposFiltrados =
    grupos.filter((grupo) => {
      const nombresAlumnos =
        grupo.grupo_alumnos
          .map((item) => item.alumnos)
          .filter(Boolean)
          .map(
            (alumno) =>
              `${alumno?.nombre || ""} ${
                alumno?.apellidos || ""
              } ${
                alumno?.apodo || ""
              }`.trim()
          )
          .join(" ")
          .toLowerCase();

      const texto =
        `${grupo.nombre} ${nombresAlumnos}`.toLowerCase();

      const coincideBusqueda =
        texto.includes(
          busquedaGrupos.toLowerCase()
        );

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" &&
          grupo.activo) ||
        (filtroEstado === "inactivos" &&
          !grupo.activo);

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });

  const gruposActivos =
    grupos.filter(
      (grupo) => grupo.activo
    ).length;

  const gruposInactivos =
    grupos.filter(
      (grupo) => !grupo.activo
    ).length;

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA PRINCIPAL */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,1fr)_minmax(500px,1fr)] xl:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Grupos
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Organiza alumnos habituales y consulta la actividad de cada grupo desde un único espacio.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                  Total
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {grupos.length}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Registrados
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8BE7DF]">
                  Activos
                </p>
                <p className="mt-1 text-2xl font-bold text-[#8BE7DF]">
                  {gruposActivos}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Disponibles
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                  Inactivos
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {gruposInactivos}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  Histórico
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">

          {/* NUEVO / EDITAR GRUPO */}
          <aside className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.045)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                  <Icono
                    nombre="grupo"
                    className="h-5 w-5"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4DD4CA]">
                    Gestión
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    {grupoEditandoId
                      ? "Editar grupo"
                      : "Nuevo grupo"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/55">
                    Nombre, alumnos y estado
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={guardarGrupo}
              className="p-4 sm:p-5"
            >
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Nombre del grupo
                </span>

                <input
                  type="text"
                  placeholder="Ej. Martes 18:00"
                  value={nombreGrupo}
                  onChange={(e) =>
                    setNombreGrupo(
                      e.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                />
              </label>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#00A79C]">
                        <Icono nombre="alumnos" />
                      </span>
                      <p className="text-sm font-bold text-[#17324D]">
                        Alumnos
                      </p>
                    </div>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Selecciona los miembros habituales
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-[#00A79C]/20 bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008C83]">
                    {alumnosSeleccionados.length} seleccionados
                  </span>
                </div>

                <div className="relative mt-3">
                  <Icono
                    nombre="buscar"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={busquedaAlumno}
                    onChange={(e) =>
                      setBusquedaAlumno(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C]/60 focus:bg-white focus:ring-2 focus:ring-[#00A79C]/10"
                  />
                </div>

                <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1 sm:max-h-[330px]">
                  {alumnosFiltrados.length === 0 && (
                    <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                      No se han encontrado alumnos.
                    </p>
                  )}

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
                              ? "flex cursor-pointer items-center gap-3 rounded-xl border border-[#00A79C]/35 bg-[#E8F7F5] px-3 py-2.5 transition"
                              : "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={
                              seleccionado
                            }
                            onChange={() =>
                              cambiarAlumno(
                                alumno.id
                              )
                            }
                            className="h-4 w-4 accent-[#00A79C]"
                          />

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00A79C]/10 text-[#00A79C]">
                            <Icono
                              nombre="alumnos"
                              className="h-4 w-4"
                            />
                          </div>

                          <span className="min-w-0 truncate text-sm font-semibold text-[#17324D]">
                            {nombreAlumnoGrupo(
                              alumno
                            )}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              {grupoEditandoId && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Estado
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActivo(true)
                      }
                      className={
                        activo
                          ? "h-10 rounded-xl bg-[#17324D] px-3 text-xs font-bold text-white"
                          : "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
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
                          ? "h-10 rounded-xl bg-[#17324D] px-3 text-xs font-bold text-white"
                          : "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                      }
                    >
                      Inactivo
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86]"
                >
                  <Icono nombre="check" />
                  {grupoEditandoId
                    ? "Guardar cambios"
                    : "Guardar grupo"}
                </button>

                {grupoEditandoId && (
                  <button
                    type="button"
                    onClick={() => {
                      limpiarFormulario();
                      setMensaje("");
                    }}
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#17324D] transition hover:bg-slate-50"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              {mensaje && (
                <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                  {mensaje}
                </p>
              )}
            </form>
          </aside>

          <div className="min-w-0">

            {/* BLOQUE INDEPENDIENTE DE FILTROS */}
            <section className="relative rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
                    <Icono
                      nombre="grupo"
                      className="h-5 w-5"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                      Gestión
                    </p>

                    <h2 className="mt-0.5 text-xl font-bold text-white">
                      Grupos registrados
                    </h2>

                    <p className="mt-1 text-sm text-white/55">
                      Consulta, filtra y gestiona tus grupos habituales
                    </p>
                  </div>
                </div>

                <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                  {gruposFiltrados.length}{" "}
                  {gruposFiltrados.length === 1
                    ? "grupo"
                    : "grupos"}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4 sm:mt-5">
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">
                  <div className="col-span-2 min-w-0 sm:min-w-[280px] sm:flex-1">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                      Buscar
                    </span>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4DD4CA]">
                        <Icono nombre="buscar" />
                      </span>

                      <input
                        type="text"
                        placeholder="Grupo o alumno..."
                        value={busquedaGrupos}
                        onChange={(e) =>
                          setBusquedaGrupos(
                            e.target.value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 hover:bg-white/15 focus:border-[#4DD4CA]/45 focus:ring-2 focus:ring-[#00A79C]/15"
                      />
                    </div>
                  </div>

                  <CampoEstadoGrupos
                    valor={filtroEstado}
                    onChange={
                      setFiltroEstado
                    }
                  />

                  <button
                    type="button"
                    disabled={
                      !busquedaGrupos &&
                      filtroEstado === "todos"
                    }
                    onClick={() => {
                      setBusquedaGrupos("");
                      setFiltroEstado(
                        "todos"
                      );
                    }}
                    className="inline-flex h-10 w-full self-end items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:shrink-0"
                  >
                    <Icono nombre="limpiar" />
                    Limpiar
                  </button>
                </div>
              </div>
            </section>

            {/* TARJETAS DE GRUPOS */}
            <div className="mt-3 space-y-3 sm:mt-4">
              {gruposFiltrados.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <Icono
                      nombre="grupo"
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

              {gruposFiltrados.map(
                (grupo) => {
                  const nombres =
                    grupo.grupo_alumnos
                      .map(
                        (item) =>
                          item.alumnos
                      )
                      .filter(Boolean)
                      .map((alumno) =>
                        nombreAlumnoGrupo(
                          alumno
                        )
                      )
                      .filter(Boolean)
                      .join(" · ");

                  const resumen =
                    obtenerResumenGrupo(
                      grupo.id
                    );

                  const clasesGrupo =
                    clasesDelGrupo(
                      grupo.id
                    );

                  const historialAbierto =
                    historialesAbiertos.includes(
                      grupo.id
                    );

                  return (
                    <article
                      key={grupo.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                    >
                      {/* CABECERA */}
                      <div
                        className={
                          grupo.activo
                            ? "flex flex-col gap-3 border-b border-slate-100 bg-[#FBFCFD] px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                            : "flex flex-col gap-3 border-b border-slate-200 bg-slate-100/70 px-3 py-3.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between"
                        }
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={
                              grupo.activo
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00A79C]/10 text-[#00A79C]"
                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500"
                            }
                          >
                            <Icono
                              nombre="grupo"
                              className="h-5 w-5"
                            />
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-bold text-[#17324D]">
                                {grupo.nombre}
                              </h3>

                              <span
                                className={
                                  grupo.activo
                                    ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                    : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                                }
                              >
                                {grupo.activo
                                  ? "Activo"
                                  : "Inactivo"}
                              </span>
                            </div>

                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                              {grupo.grupo_alumnos.length}{" "}
                              {grupo.grupo_alumnos.length === 1
                                ? "alumno"
                                : "alumnos"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            {resumen.totalRealizadas} realizadas
                          </span>

                          {resumen.proximaClase && (
                            <span className="rounded-full border border-[#00A79C]/20 bg-[#E8F7F5] px-2.5 py-1 text-[10px] font-bold text-[#008C83]">
                              Próxima · {formatearFecha(
                                resumen.proximaClase.fecha
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* INFORMACIÓN */}
                      <div className="grid grid-cols-2 divide-y divide-slate-100 lg:grid-cols-[1.25fr_1fr_1fr] lg:divide-x lg:divide-y-0">
                        <section className="col-span-2 p-3.5 sm:p-4 lg:col-span-1">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="alumnos"
                                className="h-5 w-5"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Alumnos
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Miembros habituales del grupo
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#17324D]">
                            {nombres ||
                              "Sin alumnos asignados"}
                          </p>
                        </section>

                        <section className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="calendario"
                                className="h-5 w-5"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Próxima clase
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Siguiente cita del grupo
                              </p>
                            </div>
                          </div>

                          {resumen.proximaClase ? (
                            <>
                              <p className="mt-3 text-sm font-bold text-[#17324D]">
                                {formatearFecha(
                                  resumen.proximaClase.fecha
                                )}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {calcularHorario(
                                  resumen.proximaClase.hora_inicio,
                                  resumen.proximaClase.duracion_minutos
                                )}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {resumen.proximaClase.ubicaciones?.nombre ||
                                  "Sin ubicación"}
                              </p>
                            </>
                          ) : (
                            <p className="mt-3 text-sm font-semibold text-slate-400">
                              Sin próximas clases
                            </p>
                          )}
                        </section>

                        <section className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                            <span className="text-[#00A79C]">
                              <Icono
                                nombre="historial"
                                className="h-5 w-5"
                              />
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-[#17324D]">
                                Última clase
                              </h4>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Actividad más reciente
                              </p>
                            </div>
                          </div>

                          {resumen.ultimaClase ? (
                            <>
                              <p className="mt-3 text-sm font-bold text-[#17324D]">
                                {formatearFecha(
                                  resumen.ultimaClase.fecha
                                )}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {calcularHorario(
                                  resumen.ultimaClase.hora_inicio,
                                  resumen.ultimaClase.duracion_minutos
                                )}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {resumen.ultimaClase.ubicaciones?.nombre ||
                                  "Sin ubicación"}
                              </p>
                            </>
                          ) : (
                            <p className="mt-3 text-sm font-semibold text-slate-400">
                              Sin clases realizadas
                            </p>
                          )}
                        </section>
                      </div>

                      {/* ACCIONES - MISMO LENGUAJE QUE FICHA DE ALUMNOS */}
                      <div className="bg-[#0F2742] px-3 py-3 sm:px-4">
                        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:grid-cols-4">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarHistorial(
                                grupo.id
                              )
                            }
                            className={
                              historialAbierto
                                ? "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#00A79C] bg-[#00A79C] px-3 text-[11px] font-bold text-white transition hover:bg-[#008F86]"
                                : "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                            }
                          >
                            <Icono nombre="historial" />
                            <span className="truncate">
                              {historialAbierto
                                ? "Ocultar historial"
                                : "Ver historial"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editarGrupo(
                                grupo
                              )
                            }
                            className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                          >
                            <Icono nombre="editar" />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstadoGrupo(
                                grupo
                              )
                            }
                            className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-bold text-white transition hover:bg-white/15"
                          >
                            <Icono nombre="estado" />
                            <span className="truncate">
                              {grupo.activo
                                ? "Desactivar"
                                : "Activar"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              borrarGrupo(
                                grupo.id
                              )
                            }
                            className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-red-300/40 bg-red-400/10 px-3 text-[11px] font-bold text-red-200 transition hover:bg-red-400/20"
                          >
                            <Icono nombre="borrar" />
                            Borrar
                          </button>
                        </div>
                      </div>

                      {historialAbierto && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                            <div>
                              <h4 className="font-bold text-[#17324D]">
                                Historial de clases
                              </h4>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Actividad asociada a este grupo
                              </p>
                            </div>

                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                              {clasesGrupo.length} clases
                            </span>
                          </div>

                          {clasesGrupo.length ===
                          0 ? (
                            <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                              Este grupo todavía no tiene clases registradas.
                            </p>
                          ) : (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {clasesGrupo
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
                                  ) => (
                                    <div
                                      key={
                                        clase.id
                                      }
                                      className={
                                        indice ===
                                        0
                                          ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3.5 sm:px-4 lg:grid-cols-[140px_minmax(0,1fr)_130px] lg:gap-4"
                                          : "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-slate-100 px-3 py-3.5 sm:px-4 lg:grid-cols-[140px_minmax(0,1fr)_130px] lg:gap-4"
                                      }
                                    >
                                      <div>
                                        <p className="text-sm font-bold text-[#17324D]">
                                          {formatearFecha(
                                            clase.fecha
                                          )}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                          {calcularHorario(
                                            clase.hora_inicio,
                                            clase.duracion_minutos
                                          )}
                                        </p>
                                      </div>

                                      <p className="col-span-2 truncate text-sm text-slate-600 lg:col-span-1">
                                        {clase.ubicaciones?.nombre ||
                                          "Sin ubicación"}
                                      </p>

                                      <div className="flex justify-end lg:col-auto">
                                        <span
                                          className={
                                            clase.estado ===
                                            "realizada"
                                              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                              : clase.estado ===
                                                "cancelada"
                                              ? "rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600"
                                              : "rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
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
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                        </div>
                      )}
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
