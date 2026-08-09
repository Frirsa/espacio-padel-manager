"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  created_at: string;
};

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function NoDisponibilidadPage() {
  const [periodos, setPeriodos] =
    useState<NoDisponibilidad[]>([]);

  const [fechaInicio, setFechaInicio] =
    useState("");

  const [fechaFin, setFechaFin] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [
    periodoEditandoId,
    setPeriodoEditandoId,
  ] = useState<string | null>(null);

  useEffect(() => {
    cargarPeriodos();
  }, []);

  async function cargarPeriodos() {
    const { data, error } =
      await supabase
        .from("no_disponibilidades")
        .select("*")
        .order("fecha_inicio", {
          ascending: true,
        });

    if (error) {
      setMensaje(
        "❌ No se pudieron cargar los periodos."
      );
      return;
    }

    setPeriodos(
      (data || []) as NoDisponibilidad[]
    );
  }

  async function guardarPeriodo(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setMensaje("");

    if (!fechaInicio) {
      setMensaje(
        "❌ Indica la fecha de inicio."
      );
      return;
    }

    const final =
      fechaFin || fechaInicio;

    if (final < fechaInicio) {
      setMensaje(
        "❌ La fecha final no puede ser anterior a la inicial."
      );
      return;
    }

    setGuardando(true);

    let error;

    if (periodoEditandoId) {
      const resultado =
        await supabase
          .from("no_disponibilidades")
          .update({
            fecha_inicio: fechaInicio,
            fecha_fin: final,
            motivo:
              motivo.trim() || null,
          })
          .eq(
            "id",
            periodoEditandoId
          );

      error =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from("no_disponibilidades")
          .insert({
            fecha_inicio: fechaInicio,
            fecha_fin: final,
            motivo:
              motivo.trim() || null,
          });

      error =
        resultado.error;
    }

    setGuardando(false);

    if (error) {
      setMensaje(
        "❌ No se pudo guardar: " +
          error.message
      );
      return;
    }

    setFechaInicio("");
    setFechaFin("");
    setMotivo("");
    setPeriodoEditandoId(
      null
    );

    setMensaje(
      periodoEditandoId
        ? "✅ Periodo actualizado correctamente"
        : "✅ Periodo guardado correctamente"
    );

    await cargarPeriodos();
  }

  function editarPeriodo(
    periodo: NoDisponibilidad
  ) {
    setPeriodoEditandoId(
      periodo.id
    );

    setFechaInicio(
      periodo.fecha_inicio
    );

    setFechaFin(
      periodo.fecha_fin
    );

    setMotivo(
      periodo.motivo || ""
    );

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicion() {
    setPeriodoEditandoId(
      null
    );

    setFechaInicio("");
    setFechaFin("");
    setMotivo("");
    setMensaje("");
  }

  async function borrarPeriodo(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que quieres eliminar este periodo de no disponibilidad?"
      );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("no_disponibilidades")
        .delete()
        .eq("id", id);

    if (error) {
      setMensaje(
        "❌ No se pudo eliminar."
      );
      return;
    }

    setMensaje(
      "✅ Periodo eliminado"
    );

    await cargarPeriodos();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            No disponibilidad
          </h1>

          <p className="mt-2 text-slate-600">
            Vacaciones, viajes o días en los que no puedes impartir clases
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              {periodoEditandoId
                ? "Editar periodo"
                : "Nuevo periodo"}
            </h2>

            <form
              onSubmit={guardarPeriodo}
              className="mt-6 space-y-4"
            >

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha inicio
                </label>

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(
                      e.target.value
                    );

                    if (!fechaFin) {
                      setFechaFin(
                        e.target.value
                      );
                    }
                  }}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha final
                </label>

                <input
                  type="date"
                  min={fechaInicio}
                  value={fechaFin}
                  onChange={(e) =>
                    setFechaFin(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Motivo
                </label>

                <input
                  type="text"
                  value={motivo}
                  onChange={(e) =>
                    setMotivo(
                      e.target.value
                    )
                  }
                  placeholder="Ej. Vacaciones"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-xl bg-[#09a9a3] px-5 py-3 font-semibold text-white transition hover:bg-[#078b86] disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : periodoEditandoId
                  ? "Guardar cambios"
                  : "Guardar periodo"}
              </button>

              {periodoEditandoId && (
                <button
                  type="button"
                  onClick={
                    cancelarEdicion
                  }
                  className="w-full rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
                >
                  Cancelar edición
                </button>
              )}

            </form>

            {mensaje && (
              <p className="mt-4 text-sm font-medium">
                {mensaje}
              </p>
            )}

          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Periodos registrados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {periodos.length} periodo(s)
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">

              {periodos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-slate-500">
                  No tienes periodos de no disponibilidad.
                </div>
              )}

              {periodos.map(
                (periodo) => (
                  <div
                    key={periodo.id}
                    className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>
                      <p className="font-bold text-slate-900">
                        {periodo.fecha_inicio ===
                        periodo.fecha_fin
                          ? formatearFecha(
                              periodo.fecha_inicio
                            )
                          : `${formatearFecha(
                              periodo.fecha_inicio
                            )} → ${formatearFecha(
                              periodo.fecha_fin
                            )}`}
                      </p>

                      <p className="mt-1 text-sm font-medium text-red-700">
                        {periodo.motivo ||
                          "No disponible"}
                      </p>
                    </div>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          editarPeriodo(
                            periodo
                          )
                        }
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          borrarPeriodo(
                            periodo.id
                          )
                        }
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Borrar
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}
