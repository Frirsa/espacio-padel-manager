"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type NoDisponibilidad = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
  created_at: string;
};

type FiltroPeriodo =
  | "todos"
  | "vigentes"
  | "finalizados";

function fechaLocalISO(
  fecha: Date
) {
  const anio =
    fecha.getFullYear();
  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0");
  const dia =
    String(
      fecha.getDate()
    ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(
  fecha: string
) {
  const [anio, mes, dia] =
    fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

function formatearHora(
  hora: string | null
) {
  if (!hora) {
    return "";
  }

  return hora.slice(0, 5);
}

function textoHorario(
  periodo: Pick<
    NoDisponibilidad,
    "fecha_inicio" | "fecha_fin" | "hora_inicio" | "hora_fin"
  >
) {
  if (
    !periodo.hora_inicio ||
    !periodo.hora_fin
  ) {
    return "Todo el día";
  }

  if (periodo.fecha_inicio === periodo.fecha_fin) {
    return `${formatearHora(periodo.hora_inicio)}–${formatearHora(periodo.hora_fin)}`;
  }

  return `Desde ${formatearHora(
    periodo.hora_inicio
  )} del primer día · hasta ${formatearHora(
    periodo.hora_fin
  )} del último`;
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

function diasEntre(
  inicio: string,
  fin: string
) {
  const fechaInicio =
    new Date(
      `${inicio}T12:00:00`
    );

  const fechaFin =
    new Date(
      `${fin}T12:00:00`
    );

  const diferencia =
    fechaFin.getTime() -
    fechaInicio.getTime();

  return (
    Math.floor(
      diferencia /
        (1000 * 60 * 60 * 24)
    ) + 1
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

function IconoBloqueo({
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="m6 6 12 12" />
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

function CampoFecha({
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
    useRef<HTMLInputElement | null>(
      null
    );

  function abrirSelectorFecha() {
    const input =
      inputRef.current;

    if (!input) {
      return;
    }

    try {
      if (
        typeof input.showPicker ===
        "function"
      ) {
        input.showPicker();
        return;
      }
    } catch {
      // Algunos navegadores no permiten showPicker en determinadas circunstancias.
    }

    input.focus();
    input.click();
  }

  return (
    <div className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {etiqueta}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={
            abrirSelectorFecha
          }
          className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold capitalize text-[#17324D] transition hover:bg-slate-50 focus:border-[#00A79C]/60 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/10 sm:px-3.5 sm:text-sm"
          aria-label={`Seleccionar ${etiqueta.toLowerCase()}`}
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

export default function NoDisponibilidadPage() {
  const [periodos, setPeriodos] =
    useState<NoDisponibilidad[]>([]);

  const [fechaInicio, setFechaInicio] =
    useState("");

  const [fechaFin, setFechaFin] =
    useState("");

  const [todoElDia, setTodoElDia] =
    useState(true);

  const [horaInicio, setHoraInicio] =
    useState("");

  const [horaFin, setHoraFin] =
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

  const [
    filtroPeriodo,
    setFiltroPeriodo,
  ] =
    useState<FiltroPeriodo>(
      "vigentes"
    );

  useEffect(() => {
    cargarPeriodos();
  }, []);

  async function cargarPeriodos() {
    const { data, error } =
      await supabase
        .from(
          "no_disponibilidades"
        )
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
      (data ||
        []) as NoDisponibilidad[]
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

    if (!todoElDia) {
      if (!horaInicio || !horaFin) {
        setMensaje(
          "❌ Indica la hora de inicio y la hora final."
        );
        return;
      }

      if (
        final === fechaInicio &&
        horaFin <= horaInicio
      ) {
        setMensaje(
          "❌ Si empieza y termina el mismo día, la hora final debe ser posterior a la hora de inicio."
        );
        return;
      }
    }

    setGuardando(true);

    let error;

    if (periodoEditandoId) {
      const resultado =
        await supabase
          .from(
            "no_disponibilidades"
          )
          .update({
            fecha_inicio:
              fechaInicio,
            fecha_fin: final,
            hora_inicio:
              todoElDia
                ? null
                : horaInicio,
            hora_fin:
              todoElDia
                ? null
                : horaFin,
            motivo:
              motivo.trim() ||
              null,
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
          .from(
            "no_disponibilidades"
          )
          .insert({
            fecha_inicio:
              fechaInicio,
            fecha_fin: final,
            hora_inicio:
              todoElDia
                ? null
                : horaInicio,
            hora_fin:
              todoElDia
                ? null
                : horaFin,
            motivo:
              motivo.trim() ||
              null,
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
    setTodoElDia(true);
    setHoraInicio("");
    setHoraFin("");
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

    const tieneHorario =
      Boolean(
        periodo.hora_inicio &&
          periodo.hora_fin
      );

    setTodoElDia(
      !tieneHorario
    );

    setHoraInicio(
      tieneHorario
        ? formatearHora(
            periodo.hora_inicio
          )
        : ""
    );

    setHoraFin(
      tieneHorario
        ? formatearHora(
            periodo.hora_fin
          )
        : ""
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
    setTodoElDia(true);
    setHoraInicio("");
    setHoraFin("");
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
        .from(
          "no_disponibilidades"
        )
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

  const hoy =
    fechaLocalISO(
      new Date()
    );

  function estadoPeriodo(
    periodo: NoDisponibilidad
  ) {
    if (
      periodo.fecha_fin < hoy
    ) {
      return "finalizado" as const;
    }

    if (
      periodo.fecha_inicio <=
        hoy &&
      periodo.fecha_fin >=
        hoy
    ) {
      return "en_curso" as const;
    }

    return "proximo" as const;
  }

  const periodosEnCurso =
    periodos.filter(
      (periodo) =>
        estadoPeriodo(
          periodo
        ) === "en_curso"
    ).length;

  const periodosProximos =
    periodos.filter(
      (periodo) =>
        estadoPeriodo(
          periodo
        ) === "proximo"
    ).length;

  const periodosFiltrados =
    periodos.filter(
      (periodo) => {
        const estado =
          estadoPeriodo(
            periodo
          );

        if (
          filtroPeriodo ===
          "vigentes"
        ) {
          return (
            estado ===
              "en_curso" ||
            estado ===
              "proximo"
          );
        }

        if (
          filtroPeriodo ===
          "finalizados"
        ) {
          return (
            estado ===
            "finalizado"
          );
        }

        return true;
      }
    );

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-4 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">

        {/* CABECERA */}
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                No disponibilidad
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Bloquea días completos o tramos horarios en los que no puedas impartir clases.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:min-w-[430px]">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Total
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {periodos.length}
                </p>
              </div>

              <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80">
                  En curso
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {periodosEnCurso}
                </p>
              </div>

              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Próximos
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {periodosProximos}
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
                    {periodoEditandoId
                      ? "Edición"
                      : "Nuevo bloqueo"}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-white">
                    {periodoEditandoId
                      ? "Editar periodo"
                      : "Añadir no disponibilidad"}
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Puedes bloquear días completos o un periodo continuo desde una fecha y hora hasta otra.
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-red-200">
                  <IconoBloqueo
                    className="h-5 w-5"
                  />
                </span>
              </div>
            </div>

            <form
              onSubmit={
                guardarPeriodo
              }
              className="space-y-4 p-4 sm:p-5"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <CampoFecha
                  etiqueta="Fecha inicio"
                  valor={fechaInicio}
                  required
                  onChange={(
                    valor
                  ) => {
                    setFechaInicio(
                      valor
                    );

                    if (
                      !fechaFin
                    ) {
                      setFechaFin(
                        valor
                      );
                    }
                  }}
                />

                <CampoFecha
                  etiqueta="Fecha final"
                  valor={fechaFin}
                  min={fechaInicio}
                  onChange={
                    setFechaFin
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Tipo de bloqueo
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTodoElDia(true);
                      setHoraInicio("");
                      setHoraFin("");
                    }}
                    className={
                      todoElDia
                        ? "h-10 rounded-xl bg-[#0F2742] px-3 text-xs font-bold text-white"
                        : "h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                    }
                  >
                    Todo el día
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTodoElDia(false)
                    }
                    className={
                      !todoElDia
                        ? "h-10 rounded-xl bg-[#00A79C] px-3 text-xs font-bold text-white"
                        : "h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                    }
                  >
                    Periodo con horas
                  </button>
                </div>
              </div>

              {!todoElDia && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Hora inicio
                    </label>

                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) =>
                        setHoraInicio(
                          e.target.value
                        )
                      }
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Hora final
                    </label>

                    <input
                      type="time"
                      value={horaFin}
                      min={
                        (fechaFin || fechaInicio) === fechaInicio
                          ? horaInicio || undefined
                          : undefined
                      }
                      onChange={(e) =>
                        setHoraFin(
                          e.target.value
                        )
                      }
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#17324D] outline-none transition placeholder:text-slate-300 focus:border-[#00A79C]/60 focus:ring-2 focus:ring-[#00A79C]/10"
                />
              </div>

              {fechaInicio && (
                <div className="rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-red-500">
                      <IconoCalendario />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-500">
                        Periodo a bloquear
                      </p>

                      <p className="mt-1 text-xs font-bold text-red-800">
                        {todoElDia
                          ? `${formatearFecha(fechaInicio)} → ${formatearFecha(
                              fechaFin || fechaInicio
                            )}`
                          : `${formatearFecha(fechaInicio)} ${
                              horaInicio || "--:--"
                            } → ${formatearFecha(
                              fechaFin || fechaInicio
                            )} ${horaFin || "--:--"}`}
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-red-700">
                        {todoElDia
                          ? "Días completos"
                          : "Periodo continuo"}
                      </p>

                      <p className="mt-1 text-[11px] text-red-700/70">
                        {diasEntre(
                          fechaInicio,
                          fechaFin ||
                            fechaInicio
                        )}{" "}
                        {diasEntre(
                          fechaInicio,
                          fechaFin ||
                            fechaInicio
                        ) === 1
                          ? "día"
                          : "días"}{" "}
                        de no disponibilidad
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-4 text-sm font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <IconoBloqueo />

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
            <section className="rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    Calendario
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Periodos registrados
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    Consulta bloqueos vigentes, próximos y ya finalizados.
                  </p>
                </div>

                <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:px-4 sm:py-2 sm:text-sm">
                  {periodosFiltrados.length} de {periodos.length}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                {[
                  {
                    valor: "todos",
                    etiqueta: "Todos",
                  },
                  {
                    valor: "vigentes",
                    etiqueta: "Vigentes",
                  },
                  {
                    valor: "finalizados",
                    etiqueta: "Finalizados",
                  },
                ].map(
                  (opcion) => (
                    <button
                      key={
                        opcion.valor
                      }
                      type="button"
                      onClick={() =>
                        setFiltroPeriodo(
                          opcion.valor as FiltroPeriodo
                        )
                      }
                      className={
                        filtroPeriodo ===
                        opcion.valor
                          ? "h-10 rounded-xl bg-[#00A79C] px-2 text-[11px] font-bold text-white"
                          : "h-10 rounded-xl border border-white/15 bg-white/10 px-2 text-[11px] font-bold text-white/70 transition hover:bg-white/15"
                      }
                    >
                      {opcion.etiqueta}
                    </button>
                  )
                )}
              </div>
            </section>

            <div className="mt-3 space-y-3 sm:mt-4">
              {periodosFiltrados.length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                  <p className="font-semibold text-slate-500">
                    No hay periodos para mostrar.
                  </p>
                </div>
              )}

              {periodosFiltrados.map(
                (periodo) => {
                  const estado =
                    estadoPeriodo(
                      periodo
                    );

                  const mismoDia =
                    periodo.fecha_inicio ===
                    periodo.fecha_fin;

                  const numeroDias =
                    diasEntre(
                      periodo.fecha_inicio,
                      periodo.fecha_fin
                    );

                  return (
                    <article
                      key={
                        periodo.id
                      }
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                    >
                      <span
                        className={
                          estado ===
                          "finalizado"
                            ? "pointer-events-none absolute inset-y-0 left-0 w-1 bg-slate-300"
                            : estado ===
                              "en_curso"
                            ? "pointer-events-none absolute inset-y-0 left-0 w-1 bg-red-500"
                            : "pointer-events-none absolute inset-y-0 left-0 w-1 bg-amber-400"
                        }
                      />

                      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={
                              estado ===
                              "finalizado"
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                                : estado ===
                                  "en_curso"
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500"
                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                            }
                          >
                            <IconoCalendario />
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-[#17324D] sm:text-base">
                                {mismoDia
                                  ? formatearFecha(
                                      periodo.fecha_inicio
                                    )
                                  : `${formatearFecha(
                                      periodo.fecha_inicio
                                    )} → ${formatearFecha(
                                      periodo.fecha_fin
                                    )}`}
                              </p>

                              <span
                                className={
                                  estado ===
                                  "finalizado"
                                    ? "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500"
                                    : estado ===
                                      "en_curso"
                                    ? "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                                    : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"
                                }
                              >
                                {estado ===
                                "finalizado"
                                  ? "Finalizado"
                                  : estado ===
                                    "en_curso"
                                  ? "En curso"
                                  : "Próximo"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-semibold text-red-700">
                              {periodo.motivo ||
                                "No disponible"}
                            </p>

                            <p className="mt-1 text-[11px] font-bold text-slate-500">
                              {textoHorario(
                                periodo
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:justify-end">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            {numeroDias}{" "}
                            {numeroDias === 1
                              ? "día"
                              : "días"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 bg-[#0F2742] px-3 py-3 sm:px-4">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              editarPeriodo(
                                periodo
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
                              borrarPeriodo(
                                periodo.id
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
