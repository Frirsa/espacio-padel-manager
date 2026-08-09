"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
};

type Tarifa = {
  id: string;
  ubicacion_id: string | null;
  concepto: string;
  duracion_minutos: number;
  numero_alumnos: number;
  importe: number;
  activa: boolean;
};

const DURACIONES = [
  60,
  90,
  120,
];

const ALUMNOS = [
  1,
  2,
  3,
  4,
];

function claveTarifa(
  concepto: string,
  duracion: number,
  alumnos: number
) {
  return `${concepto}-${duracion}-${alumnos}`;
}

export default function TarifasPage() {
  const [
    ubicaciones,
    setUbicaciones,
  ] = useState<Ubicacion[]>([]);

  const [
    tarifas,
    setTarifas,
  ] = useState<Tarifa[]>([]);

  const [
    ubicacionId,
    setUbicacionId,
  ] = useState("");

  const [
    valores,
    setValores,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarValoresUbicacion();
  }, [
    ubicacionId,
    tarifas,
  ]);

  async function cargarDatos() {
    const {
      data:
        ubicacionesData,
      error:
        errorUbicaciones,
    } =
      await supabase
        .from(
          "ubicaciones"
        )
        .select(
          "id,nombre,tipo"
        )
        .eq(
          "activa",
          true
        )
        .order(
          "nombre"
        );

    if (
      errorUbicaciones
    ) {
      setMensaje(
        "❌ No se pudieron cargar las ubicaciones."
      );
      return;
    }

    const {
      data:
        tarifasData,
      error:
        errorTarifas,
    } =
      await supabase
        .from(
          "tarifas"
        )
        .select(
          "id,ubicacion_id,concepto,duracion_minutos,numero_alumnos,importe,activa"
        )
        .order(
          "duracion_minutos"
        )
        .order(
          "numero_alumnos"
        );

    if (
      errorTarifas
    ) {
      setMensaje(
        "❌ No se pudieron cargar las tarifas."
      );
      return;
    }

    const clubs =
      (
        ubicacionesData ||
        []
      ).filter(
        (
          ubicacion
        ) =>
          ubicacion.tipo ===
          "club"
      );

    setUbicaciones(
      clubs
    );

    setTarifas(
      (
        tarifasData ||
        []
      ) as Tarifa[]
    );

    if (
      clubs.length > 0
    ) {
      setUbicacionId(
        (
          actual
        ) =>
          actual ||
          clubs[0].id
      );
    }
  }

  function cargarValoresUbicacion() {
    if (
      !ubicacionId
    ) {
      setValores(
        {}
      );
      return;
    }

    const nuevos:
      Record<
        string,
        string
      > = {};

    tarifas
      .filter(
        (
          tarifa
        ) =>
          tarifa.ubicacion_id ===
            ubicacionId &&
          tarifa.activa
      )
      .forEach(
        (
          tarifa
        ) => {
          nuevos[
            claveTarifa(
              tarifa.concepto,
              tarifa.duracion_minutos,
              tarifa.numero_alumnos
            )
          ] =
            String(
              tarifa.importe
            );
        }
      );

    setValores(
      nuevos
    );
  }

  function cambiarValor(
    concepto: string,
    duracion: number,
    alumnos: number,
    valor: string
  ) {
    setValores(
      (
        actuales
      ) => ({
        ...actuales,
        [
          claveTarifa(
            concepto,
            duracion,
            alumnos
          )
        ]:
          valor,
      })
    );
  }

  async function guardarTarifas() {
    if (
      !ubicacionId
    ) {
      setMensaje(
        "❌ Selecciona un club."
      );
      return;
    }

    setGuardando(
      true
    );

    setMensaje("");

    try {
      const existentes =
        tarifas.filter(
          (
            tarifa
          ) =>
            tarifa.ubicacion_id ===
            ubicacionId
        );

      for (
        const concepto of [
          "club_paga",
          "coste_pista",
        ]
      ) {
        for (
          const duracion of
          DURACIONES
        ) {
          for (
            const alumnos of
            ALUMNOS
          ) {
            const clave =
              claveTarifa(
                concepto,
                duracion,
                alumnos
              );

            const valor =
              (
                valores[
                  clave
                ] ||
                ""
              ).trim();

            const existente =
              existentes.find(
                (
                  tarifa
                ) =>
                  tarifa.concepto ===
                    concepto &&
                  tarifa.duracion_minutos ===
                    duracion &&
                  tarifa.numero_alumnos ===
                    alumnos
              );

            if (
              valor === ""
            ) {
              if (
                existente
              ) {
                const {
                  error,
                } =
                  await supabase
                    .from(
                      "tarifas"
                    )
                    .delete()
                    .eq(
                      "id",
                      existente.id
                    );

                if (
                  error
                ) {
                  throw error;
                }
              }

              continue;
            }

            const importe =
              Number(
                valor
              );

            if (
              Number.isNaN(
                importe
              )
            ) {
              continue;
            }

            if (
              existente
            ) {
              const {
                error,
              } =
                await supabase
                  .from(
                    "tarifas"
                  )
                  .update({
                    importe,
                    activa:
                      true,
                  })
                  .eq(
                    "id",
                    existente.id
                  );

              if (
                error
              ) {
                throw error;
              }
            } else {
              const {
                error,
              } =
                await supabase
                  .from(
                    "tarifas"
                  )
                  .insert({
                    ubicacion_id:
                      ubicacionId,
                    concepto,
                    duracion_minutos:
                      duracion,
                    numero_alumnos:
                      alumnos,
                    importe,
                    activa:
                      true,
                  });

              if (
                error
              ) {
                throw error;
              }
            }
          }
        }
      }

      setMensaje(
        "✅ Tarifas guardadas correctamente"
      );

      await cargarDatos();
    } catch (
      error
    ) {
      const texto =
        error instanceof
        Error
          ? error.message
          : "Error desconocido";

      setMensaje(
        "❌ No se pudieron guardar las tarifas: " +
          texto
      );
    } finally {
      setGuardando(
        false
      );
    }
  }

  function vaciarTabla(
    concepto: string
  ) {
    const confirmar =
      window.confirm(
        concepto ===
          "club_paga"
          ? "¿Quieres vaciar todos los importes de lo que te paga el club?"
          : "¿Quieres vaciar todos los importes de lo que pagas por la pista?"
      );

    if (
      !confirmar
    ) {
      return;
    }

    setValores(
      (
        actuales
      ) => {
        const copia = {
          ...actuales,
        };

        DURACIONES.forEach(
          (
            duracion
          ) => {
            ALUMNOS.forEach(
              (
                alumnos
              ) => {
                delete copia[
                  claveTarifa(
                    concepto,
                    duracion,
                    alumnos
                  )
                ];
              }
            );
          }
        );

        return copia;
      }
    );
  }

  const clubSeleccionado =
    useMemo(
      () =>
        ubicaciones.find(
          (
            ubicacion
          ) =>
            ubicacion.id ===
            ubicacionId
        ) ||
        null,
      [
        ubicaciones,
        ubicacionId,
      ]
    );

  function TablaTarifas({
    concepto,
    titulo,
    descripcion,
    color,
  }: {
    concepto:
      | "club_paga"
      | "coste_pista";
    titulo: string;
    descripcion: string;
    color:
      | "green"
      | "red";
  }) {
    const clasesCabecera =
      color ===
      "green"
        ? "bg-green-50 text-green-800"
        : "bg-red-50 text-red-700";

    return (
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {titulo}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              vaciarTabla(
                concepto
              )
            }
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Vaciar tabla
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px] border-collapse">

            <thead>
              <tr className={clasesCabecera}>
                <th className="border-b border-r border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide">
                  Duración
                </th>

                {ALUMNOS.map(
                  (
                    numero
                  ) => (
                    <th
                      key={
                        numero
                      }
                      className="border-b border-r border-slate-200 px-4 py-4 text-center text-xs font-bold uppercase tracking-wide last:border-r-0"
                    >
                      {numero} alumno{numero === 1 ? "" : "s"}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {DURACIONES.map(
                (
                  duracion
                ) => (
                  <tr
                    key={
                      duracion
                    }
                    className="hover:bg-slate-50/70"
                  >
                    <td className="border-b border-r border-slate-200 px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {duracion} min
                      </p>
                    </td>

                    {ALUMNOS.map(
                      (
                        numero
                      ) => {
                        const clave =
                          claveTarifa(
                            concepto,
                            duracion,
                            numero
                          );

                        return (
                          <td
                            key={
                              clave
                            }
                            className="border-b border-r border-slate-200 p-3 last:border-r-0"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  valores[
                                    clave
                                  ] ||
                                  ""
                                }
                                onChange={(e) =>
                                  cambiarValor(
                                    concepto,
                                    duracion,
                                    numero,
                                    e.target.value
                                  )
                                }
                                placeholder="—"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-8 text-right font-semibold text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                              />

                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                €
                              </span>
                            </div>
                          </td>
                        );
                      }
                    )}
                  </tr>
                )
              )}
            </tbody>

          </table>

        </div>

      </section>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-7 lg:px-9">

      <div className="mx-auto w-full max-w-[1500px]">

        <div className="mb-7">

          <h1 className="text-4xl font-bold text-slate-900">
            Tarifas
          </h1>

          <p className="mt-2 text-slate-600">
            Configura de una sola vez los importes de cada club o centro deportivo.
          </p>

        </div>

        {ubicaciones.length ===
        0 ? (

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">

            <p className="font-bold text-slate-700">
              No hay ubicaciones configuradas como Club.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Crea o edita una ubicación y selecciona el tipo Club / centro deportivo.
            </p>

          </div>

        ) : (

          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div className="w-full max-w-xl">

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Club / centro deportivo
                  </label>

                  <select
                    value={
                      ubicacionId
                    }
                    onChange={(e) => {
                      setUbicacionId(
                        e.target.value
                      );

                      setMensaje(
                        ""
                      );
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-[#09a9a3] focus:ring-2 focus:ring-teal-100"
                  >
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

                  {clubSeleccionado && (
                    <p className="mt-2 text-sm text-slate-500">
                      Editando tarifas de{" "}
                      <strong className="text-slate-800">
                        {clubSeleccionado.nombre}
                      </strong>
                    </p>
                  )}

                </div>

                <button
                  type="button"
                  disabled={
                    guardando
                  }
                  onClick={
                    guardarTarifas
                  }
                  className="rounded-xl bg-[#09a9a3] px-7 py-3 font-bold text-white shadow-sm transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar todas las tarifas"}
                </button>

              </div>

              {mensaje && (
                <p
                  className={
                    mensaje.startsWith(
                      "❌"
                    )
                      ? "mt-4 text-sm font-semibold text-red-600"
                      : "mt-4 text-sm font-semibold text-green-600"
                  }
                >
                  {mensaje}
                </p>
              )}

            </section>

            <div className="mt-7 space-y-7">

              {TablaTarifas({
                concepto: "club_paga",
                titulo: "Lo que me paga el club",
                descripcion:
                  "Importe que el club te paga por la clase según duración y número de alumnos.",
                color: "green",
              })}

              {TablaTarifas({
                concepto: "coste_pista",
                titulo: "Lo que pago por la pista",
                descripcion:
                  "Coste que tú pagas al club por utilizar la pista según duración y número de alumnos.",
                color: "red",
              })}

            </div>

          </>

        )}

      </div>

    </main>
  );
}
