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

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto max-w-7xl">

        <h1 className="text-4xl font-bold text-slate-900">
          Ubicaciones
        </h1>

        <p className="mt-2 text-slate-600">
          Clubes, pistas de pago y pistas privadas
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-slate-500">
              Ubicaciones activas
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                ubicacionesActivas
              }
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm text-slate-500">
              Ubicaciones inactivas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {
                ubicacionesInactivas
              }
            </p>

          </div>

        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-bold">
              {ubicacionEditandoId
                ? "Editar ubicación"
                : "Nueva ubicación"}
            </h2>

            <form
              onSubmit={
                guardarUbicacion
              }
              className="mt-6 space-y-4"
            >

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nombre
                </label>

                <input
                  type="text"
                  placeholder="Ej. IQL"
                  value={
                    nombre
                  }
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo de ubicación
                </label>

                <select
                  value={
                    tipo
                  }
                  onChange={(e) => {
                    const nuevoTipo =
                      e.target.value;

                    setTipo(
                      nuevoTipo
                    );

                    if (
                      nuevoTipo ===
                      "privada"
                    ) {
                      setCostePista(
                        "0"
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >

                  <option value="club">
                    Club / centro deportivo
                  </option>

                  <option value="pago">
                    Pista de pago
                  </option>

                  <option value="privada">
                    Pista privada / urbanización
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Dirección
                </label>

                <input
                  type="text"
                  placeholder="Dirección"
                  value={
                    direccion
                  }
                  onChange={(e) =>
                    setDireccion(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Coste habitual de pista
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={
                      costePista
                    }
                    onChange={(e) =>
                      setCostePista(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                    €
                  </span>

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Se utilizará como valor por defecto al crear una clase. Podrás cambiarlo en cada clase sin modificar este importe habitual.
                </p>

              </div>

              {ubicacionEditandoId && (

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Estado
                  </label>

                  <select
                    value={
                      activa
                        ? "activa"
                        : "inactiva"
                    }
                    onChange={(e) =>
                      setActiva(
                        e.target.value ===
                          "activa"
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >

                    <option value="activa">
                      Activa
                    </option>

                    <option value="inactiva">
                      Inactiva
                    </option>

                  </select>

                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
              >
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
          <div className="rounded-2xl bg-white p-6 shadow">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  Ubicaciones registradas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {ubicacionesFiltradas.length}{" "}
                  {ubicacionesFiltradas.length === 1
                    ? "ubicación mostrada"
                    : "ubicaciones mostradas"}
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <input
                type="text"
                placeholder="Buscar nombre o dirección..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />

              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="todos">
                  Todos los tipos
                </option>

                <option value="club">
                  Club / centro deportivo
                </option>

                <option value="pago">
                  Pista de pago
                </option>

                <option value="privada">
                  Pista privada / urbanización
                </option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="todas">
                  Todas
                </option>

                <option value="activas">
                  Activas
                </option>

                <option value="inactivas">
                  Inactivas
                </option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipo(
                    "todos"
                  );
                  setFiltroEstado(
                    "todas"
                  );
                }}
                className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
              >
                Limpiar filtros
              </button>

            </div>

            <div className="mt-6 space-y-5">

              {ubicacionesFiltradas.length === 0 && (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">

                  <p className="font-semibold text-slate-600">
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

                  return (
                    <div
                      key={ubicacion.id}
                      className={
                        ubicacion.activa
                          ? "rounded-2xl border border-slate-200 bg-white p-5"
                          : "rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-70"
                      }
                    >

                      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">

                        <div className="min-w-0">

                          <p className="text-lg font-bold text-slate-900">
                            {ubicacion.nombre}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {textoTipoUbicacion(
                                ubicacion.tipo
                              )}
                            </span>

                            <span
                              className={
                                ubicacion.activa
                                  ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                                  : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                              }
                            >
                              {ubicacion.activa
                                ? "Activa"
                                : "Inactiva"}
                            </span>

                          </div>

                          {ubicacion.direccion && (
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              {ubicacion.direccion}
                            </p>
                          )}

                          <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">

                            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                              Coste habitual de pista
                            </p>

                            <p className="mt-1 text-xl font-bold text-teal-700">
                              {Number(
                                ubicacion.coste_pista ||
                                  0
                              ).toFixed(2)}{" "}
                              €
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Valor por defecto. Podrás modificarlo en cada clase.
                            </p>

                          </div>

                        </div>

                        <div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

                            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">

                              <p className="flex h-[36px] items-center justify-center text-xs text-slate-500">
                                Próxima clase
                              </p>

                              {resumen.proximaClase ? (
                                <>
                                  <p className="mt-1 font-bold leading-none text-slate-900">
                                    {formatearFecha(
                                      resumen.proximaClase.fecha
                                    )}
                                  </p>

                                  <p className="mt-3 whitespace-nowrap text-sm font-semibold leading-none text-slate-800">
                                    {calcularHorario(
                                      resumen.proximaClase.hora_inicio,
                                      resumen.proximaClase.duracion_minutos
                                    )}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 font-bold leading-none text-slate-500">
                                    —
                                  </p>

                                  <p className="mt-3 text-sm leading-none text-slate-500">
                                    —
                                  </p>
                                </>
                              )}

                            </div>

                            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">

                              <p className="flex h-[36px] items-center justify-center text-xs text-slate-500">
                                Última clase realizada
                              </p>

                              {resumen.ultimaClase ? (
                                <>
                                  <p className="mt-1 font-bold leading-none text-slate-900">
                                    {formatearFecha(
                                      resumen.ultimaClase.fecha
                                    )}
                                  </p>

                                  <p className="mt-3 whitespace-nowrap text-sm font-semibold leading-none text-slate-800">
                                    {calcularHorario(
                                      resumen.ultimaClase.hora_inicio,
                                      resumen.ultimaClase.duracion_minutos
                                    )}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 font-bold leading-none text-slate-500">
                                    —
                                  </p>

                                  <p className="mt-3 text-sm leading-none text-slate-500">
                                    —
                                  </p>
                                </>
                              )}

                            </div>

                            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">

                              <p className="flex h-[36px] items-center justify-center text-xs text-slate-500">
                                Clases realizadas
                              </p>

                              <p className="mt-3 text-2xl font-bold text-slate-900">
                                {resumen.totalRealizadas}
                              </p>

                            </div>

                            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">

                              <p className="flex h-[36px] items-center justify-center text-xs text-slate-500">
                                Gastos de pista
                              </p>

                              <p className="mt-3 text-xl font-bold text-red-600">
                                {resumen.gastosPista.toFixed(
                                  2
                                )}{" "}
                                €
                              </p>

                            </div>

                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

                            <div className="flex min-h-[95px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center xl:col-start-1">

                              <p className="text-xs text-slate-500">
                                Ingresos del club
                              </p>

                              <p className="mt-2 text-xl font-bold text-green-600">
                                {resumen.ingresosClub.toFixed(
                                  2
                                )}{" "}
                                €
                              </p>

                            </div>

                            <div className="flex min-h-[95px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center xl:col-start-2">

                              <p className="text-xs text-slate-500">
                                Saldo club / pista
                              </p>

                              <p
                                className={
                                  resumen.saldo > 0
                                    ? "mt-2 text-xl font-bold text-green-600"
                                    : resumen.saldo < 0
                                    ? "mt-2 text-xl font-bold text-red-600"
                                    : "mt-2 text-xl font-bold text-slate-900"
                                }
                              >
                                {resumen.saldo.toFixed(
                                  2
                                )}{" "}
                                €
                              </p>

                            </div>

                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                cambiarHistorial(
                                  ubicacion.id
                                )
                              }
                              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                            >
                              {historialAbierto
                                ? "Ocultar historial"
                                : "Ver historial"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                editarUbicacion(
                                  ubicacion
                                )
                              }
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstadoUbicacion(
                                  ubicacion
                                )
                              }
                              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
                            >
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
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Borrar
                            </button>

                          </div>

                        </div>

                      </div>

                      {historialAbierto && (

                        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">

                          <div className="flex flex-wrap items-center justify-between gap-3">

                            <div>

                              <h3 className="text-lg font-bold text-slate-900">
                                Historial de clases
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                Clases registradas en {ubicacion.nombre}
                              </p>

                            </div>

                            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {clasesUbicacion.length}{" "}
                              {clasesUbicacion.length === 1
                                ? "clase"
                                : "clases"}
                            </span>

                          </div>

                          {clasesUbicacion.length === 0 ? (

                            <p className="mt-4 text-sm text-slate-500">
                              Esta ubicación todavía no tiene clases registradas.
                            </p>

                          ) : (

                            <div className="mt-4 space-y-2">

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
                                  (clase) => {
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
                                        className="rounded-xl border border-slate-200 bg-white p-4"
                                      >

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                          <div>

                                            <div className="flex flex-wrap items-center gap-2">

                                              <p className="font-semibold text-slate-900">
                                                {formatearFecha(
                                                  clase.fecha
                                                )}
                                              </p>

                                              <span
                                                className={
                                                  clase.estado ===
                                                  "realizada"
                                                    ? "rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700"
                                                    : clase.estado ===
                                                      "cancelada"
                                                    ? "rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700"
                                                    : "rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700"
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

                                            <p className="mt-2 whitespace-nowrap text-sm font-medium text-slate-700">
                                              {calcularHorario(
                                                clase.hora_inicio,
                                                clase.duracion_minutos
                                              )}
                                            </p>

                                            <p className="mt-2 text-sm text-slate-600">
                                              {nombres ||
                                                "Sin alumnos"}
                                            </p>

                                          </div>

                                          <div className="sm:text-right">

                                            {Number(
                                              clase.importe_club ||
                                                0
                                            ) > 0 && (
                                              <p className="text-sm text-slate-600">
                                                Pago del club:{" "}
                                                <span className="font-semibold text-green-700">
                                                  {Number(
                                                    clase.importe_club
                                                  ).toFixed(
                                                    2
                                                  )}{" "}
                                                  €
                                                </span>
                                              </p>
                                            )}

                                            {Number(
                                              clase.coste_pista ||
                                                0
                                            ) > 0 && (
                                              <p className="mt-1 text-sm text-slate-600">
                                                Coste de pista:{" "}
                                                <span className="font-semibold text-red-600">
                                                  {Number(
                                                    clase.coste_pista
                                                  ).toFixed(
                                                    2
                                                  )}{" "}
                                                  €
                                                </span>
                                              </p>
                                            )}

                                            {Number(
                                              clase.importe_club ||
                                                0
                                            ) === 0 &&
                                              Number(
                                                clase.coste_pista ||
                                                  0
                                              ) === 0 && (
                                                <p className="text-sm text-slate-400">
                                                  Sin movimientos de club/pista
                                                </p>
                                              )}

                                            {(Number(
                                              clase.importe_club ||
                                                0
                                            ) > 0 ||
                                              Number(
                                                clase.coste_pista ||
                                                  0
                                              ) > 0) && (
                                              <p
                                                className={
                                                  saldoClase > 0
                                                    ? "mt-2 text-sm font-semibold text-green-600"
                                                    : saldoClase < 0
                                                    ? "mt-2 text-sm font-semibold text-red-600"
                                                    : "mt-2 text-sm font-semibold text-slate-700"
                                                }
                                              >
                                                Saldo:{" "}
                                                {saldoClase.toFixed(
                                                  2
                                                )}{" "}
                                                €
                                              </p>
                                            )}

                                          </div>

                                        </div>

                                      </div>
                                    );
                                  }
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