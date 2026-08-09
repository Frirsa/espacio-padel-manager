"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Alumno = {
  id: string;
  nombre: string;
  apellidos: string | null;
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
      .select("id,nombre,apellidos")
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
            apellidos
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
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-bold text-slate-900">
          Grupos
        </h1>

        <p className="mt-2 text-slate-600">
          Crea grupos habituales de alumnos
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Grupos activos
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {gruposActivos}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">
              Grupos inactivos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {gruposInactivos}
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-bold">
              {grupoEditandoId
                ? "Editar grupo"
                : "Nuevo grupo"}
            </h2>

            <form
              onSubmit={guardarGrupo}
              className="mt-6 space-y-4"
            >
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={nombreGrupo}
                onChange={(e) =>
                  setNombreGrupo(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <div>
                <p className="mb-3 text-sm font-medium">
                  Alumnos
                </p>

                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={busquedaAlumno}
                  onChange={(e) =>
                    setBusquedaAlumno(
                      e.target.value
                    )
                  }
                  className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3"
                />

                <p className="mb-3 text-sm text-slate-500">
                  {alumnosSeleccionados.length} alumno(s) seleccionado(s)
                </p>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">

                  {alumnosFiltrados.length ===
                    0 && (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                      No se han encontrado alumnos.
                    </p>
                  )}

                  {alumnosFiltrados.map(
                    (alumno) => (
                      <label
                        key={alumno.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={alumnosSeleccionados.includes(
                            alumno.id
                          )}
                          onChange={() =>
                            cambiarAlumno(
                              alumno.id
                            )
                          }
                        />

                        <span>
                          {alumno.nombre}{" "}
                          {alumno.apellidos ||
                            ""}
                        </span>
                      </label>
                    )
                  )}

                </div>
              </div>

              {grupoEditandoId && (
                <select
                  value={
                    activo
                      ? "activo"
                      : "inactivo"
                  }
                  onChange={(e) =>
                    setActivo(
                      e.target.value ===
                        "activo"
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="activo">
                    Activo
                  </option>

                  <option value="inactivo">
                    Inactivo
                  </option>
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
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
                  className="w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800"
                >
                  Cancelar edición
                </button>
              )}

            </form>

            {mensaje && (
              <p className="mt-4 text-sm">
                {mensaje}
              </p>
            )}

          </div>

          <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">

            <h2 className="text-xl font-bold">
              Grupos registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {gruposFiltrados.length} grupo(s) mostrado(s)
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">

              <input
                type="text"
                placeholder="Buscar grupo o alumno..."
                value={busquedaGrupos}
                onChange={(e) =>
                  setBusquedaGrupos(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />

              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="todos">
                  Todos
                </option>

                <option value="activos">
                  Activos
                </option>

                <option value="inactivos">
                  Inactivos
                </option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setBusquedaGrupos("");
                  setFiltroEstado("todos");
                }}
                className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-800"
              >
                Limpiar filtros
              </button>

            </div>

            <div className="mt-6 space-y-4">

              {gruposFiltrados.length ===
                0 && (
                <p className="text-slate-500">
                  No hay grupos que coincidan con los filtros.
                </p>
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
                      .map(
                        (alumno) =>
                          `${alumno?.nombre || ""} ${
                            alumno?.apellidos ||
                            ""
                          }`.trim()
                      )
                      .join(", ");

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
                    <div
                      key={grupo.id}
                      className={
                        grupo.activo
                          ? "rounded-xl border border-slate-200 bg-white p-4"
                          : "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70"
                      }
                    >
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">

                        <div className="min-w-0">

                          <p className="font-semibold">
                            {grupo.nombre}
                          </p>

                          <p
                            className={
                              grupo.activo
                                ? "mt-1 text-sm font-semibold text-green-600"
                                : "mt-1 text-sm font-semibold text-red-600"
                            }
                          >
                            {grupo.activo
                              ? "Activo"
                              : "Inactivo"}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            {nombres ||
                              "Sin alumnos"}
                          </p>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">

                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">
                                Próxima clase
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {resumen.proximaClase
                                  ? `${formatearFecha(
                                      resumen
                                        .proximaClase
                                        .fecha
                                    )} · ${calcularHorario(
                                      resumen
                                        .proximaClase
                                        .hora_inicio,
                                      resumen
                                        .proximaClase
                                        .duracion_minutos
                                    )}`
                                  : "Sin próximas clases"}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">
                                Última clase realizada
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {resumen.ultimaClase
                                  ? `${formatearFecha(
                                      resumen
                                        .ultimaClase
                                        .fecha
                                    )} · ${calcularHorario(
                                      resumen
                                        .ultimaClase
                                        .hora_inicio,
                                      resumen
                                        .ultimaClase
                                        .duracion_minutos
                                    )}`
                                  : "Sin clases realizadas"}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                              <p className="text-xs text-slate-500">
                                Clases realizadas
                              </p>

                              <p className="mt-1 text-2xl font-bold text-teal-700">
                                {resumen.totalRealizadas}
                              </p>
                            </div>

                          </div>

                        </div>

                        <div className="lg:border-l lg:border-slate-200 lg:pl-6">

                          <p className="mb-3 text-sm text-slate-500">
                            {grupo.grupo_alumnos.length} alumno(s)
                          </p>

                          <div className="flex flex-wrap gap-2">

                            <button
                              onClick={() =>
                                cambiarHistorial(
                                  grupo.id
                                )
                              }
                              className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white"
                            >
                              {historialAbierto
                                ? "Ocultar historial"
                                : "Ver historial"}
                            </button>

                            <button
                              onClick={() =>
                                editarGrupo(
                                  grupo
                                )
                              }
                              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() =>
                                cambiarEstadoGrupo(
                                  grupo
                                )
                              }
                              className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
                            >
                              {grupo.activo
                                ? "Desactivar"
                                : "Activar"}
                            </button>

                            <button
                              onClick={() =>
                                borrarGrupo(
                                  grupo.id
                                )
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Borrar
                            </button>

                          </div>
                        </div>

                      </div>

                      {historialAbierto && (
                        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">

                          <h3 className="text-lg font-bold text-slate-900">
                            Historial de clases
                          </h3>

                          {clasesGrupo.length ===
                          0 ? (
                            <p className="mt-3 text-sm text-slate-500">
                              Este grupo todavía no tiene clases registradas.
                            </p>
                          ) : (
                            <div className="mt-4 space-y-2">

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
                                  (clase) => (
                                    <div
                                      key={
                                        clase.id
                                      }
                                      className="rounded-xl bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                        <div>
                                          <p className="font-semibold">
                                            {formatearFecha(
                                              clase.fecha
                                            )}
                                          </p>

                                          <p className="mt-1 font-medium">
                                            {calcularHorario(
                                              clase.hora_inicio,
                                              clase.duracion_minutos
                                            )}
                                          </p>

                                          <p className="mt-1 text-sm text-slate-600">
                                            {clase
                                              .ubicaciones
                                              ?.nombre ||
                                              "Sin ubicación"}
                                          </p>
                                        </div>

                                        <p
                                          className={
                                            clase.estado ===
                                            "realizada"
                                              ? "text-sm font-semibold text-green-600"
                                              : clase.estado ===
                                                "cancelada"
                                              ? "text-sm font-semibold text-red-600"
                                              : "text-sm font-semibold text-blue-600"
                                          }
                                        >
                                          {clase.estado ===
                                          "realizada"
                                            ? "Realizada"
                                            : clase.estado ===
                                              "cancelada"
                                            ? "Cancelada"
                                            : "Programada"}
                                        </p>

                                      </div>
                                    </div>
                                  )
                                )}

                            </div>
                          )}

                        </div>
                      )}

                    </div>
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