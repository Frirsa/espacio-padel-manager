"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { generarImagenDisponibilidad } from "../../components/disponibilidad/generarImagenDisponibilidad";

type SeleccionSemana = Record<string, string[]>;

type HorarioGuardado = {
  id: string;
  semana_inicio: string;
  nombre: string;
  seleccion: SeleccionSemana;
  created_at: string;
  updated_at: string;
};

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function lunesDeSemana(fecha: Date) {
  const copia = new Date(fecha);
  const dia = copia.getDay();

  copia.setDate(
    copia.getDate() - (dia === 0 ? 6 : dia - 1)
  );

  return copia;
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function textoRangoSemana(semana: string) {
  const lunes = new Date(`${semana}T12:00:00`);
  const domingo = new Date(lunes);

  domingo.setDate(lunes.getDate() + 6);

  const mismoMes =
    lunes.getMonth() === domingo.getMonth() &&
    lunes.getFullYear() === domingo.getFullYear();

  const mismoAnio =
    lunes.getFullYear() === domingo.getFullYear();

  const mesLunes = capitalizar(
    lunes.toLocaleDateString("es-ES", {
      month: "long",
    })
  );

  const mesDomingo = capitalizar(
    domingo.toLocaleDateString("es-ES", {
      month: "long",
    })
  );

  if (mismoMes) {
    return `${lunes.getDate()}–${domingo.getDate()} ${mesLunes} De ${lunes.getFullYear()}`;
  }

  if (mismoAnio) {
    return `${lunes.getDate()} ${mesLunes} – ${domingo.getDate()} ${mesDomingo} De ${lunes.getFullYear()}`;
  }

  return `${lunes.getDate()} ${mesLunes} ${lunes.getFullYear()} – ${domingo.getDate()} ${mesDomingo} ${domingo.getFullYear()}`;
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

function IconoDisponibilidad({
  className = "h-5 w-5",
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
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5v5l3 1.75" />
      <path d="m8.2 12.3 2.1 2.1 4-4.2" />
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

function IconoDuplicar() {
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
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
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

function crearTramos() {
  const tramos: string[] = [];

  for (let hora = 7; hora < 23; hora += 1) {
    tramos.push(`${String(hora).padStart(2, "0")}:00`);
    tramos.push(`${String(hora).padStart(2, "0")}:30`);
  }

  return tramos;
}

function contarHoras(seleccion: SeleccionSemana) {
  return Object.values(seleccion).reduce(
    (total, horas) => total + horas.length,
    0
  );
}

function inicioSemanaActual() {
  return fechaISO(lunesDeSemana(new Date()));
}

export default function DisponibilidadPage() {
  const inputSemanaRef =
    useRef<HTMLInputElement | null>(null);

  const [semana, setSemana] = useState(
    fechaISO(lunesDeSemana(new Date()))
  );

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);

  const [horarioEditandoId, setHorarioEditandoId] =
    useState<string | null>(null);

  const [nombreHorario, setNombreHorario] =
    useState("Disponibilidad general");

  const [seleccion, setSeleccion] =
    useState<SeleccionSemana>({});

  const [horarios, setHorarios] =
    useState<HorarioGuardado[]>([]);

  const [cargando, setCargando] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [generandoImagenId, setGenerandoImagenId] =
    useState<string | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const tramos = useMemo(
    () => crearTramos(),
    []
  );

  const diasSemana = useMemo(() => {
    const lunes = new Date(`${semana}T12:00:00`);

    return Array.from({ length: 7 }, (_, indice) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + indice);

      return {
        iso: fechaISO(fecha),
        nombre: fecha.toLocaleDateString("es-ES", {
          weekday: "long",
        }),
        fechaCorta: fecha.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        }),
      };
    });
  }, [semana]);

  const textoSemana = useMemo(
    () => textoRangoSemana(semana),
    [semana]
  );

  const totalSeleccionados = useMemo(
    () => contarHoras(seleccion),
    [seleccion]
  );

  useEffect(() => {
    cargarHorariosVigentes();
  }, []);

  async function cargarHorariosVigentes() {
    setCargando(true);
    setMensaje("");

    const { data, error } = await supabase
      .from("disponibilidad_horarios")
      .select(
        "id,semana_inicio,nombre,seleccion,created_at,updated_at"
      )
      .gte("semana_inicio", inicioSemanaActual())
      .order("semana_inicio", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMensaje(
        "❌ No se pudieron cargar los horarios: " +
          error.message
      );
      setHorarios([]);
      setCargando(false);
      return;
    }

    setHorarios(
      (data || []) as HorarioGuardado[]
    );

    setCargando(false);
  }

  function abrirSelectorSemana() {
    const input = inputSemanaRef.current;

    if (!input) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {}

    input.focus();
    input.click();
  }

  function establecerSemana(fecha: Date) {
    setSemana(
      fechaISO(
        lunesDeSemana(fecha)
      )
    );

    setSeleccion({});
    setHorarioEditandoId(null);
    setFormularioAbierto(false);
    setMensaje("");
  }

  function cambiarSemana(valor: string) {
    if (!valor) {
      return;
    }

    establecerSemana(
      new Date(`${valor}T12:00:00`)
    );
  }

  function moverSemana(diferenciaDias: number) {
    const lunesActual = new Date(`${semana}T12:00:00`);

    lunesActual.setDate(
      lunesActual.getDate() + diferenciaDias
    );

    establecerSemana(lunesActual);
  }

  function irAHoy() {
    establecerSemana(new Date());
  }

  function nuevoHorario() {
    setHorarioEditandoId(null);
    setNombreHorario("Disponibilidad general");
    setSeleccion({});
    setMensaje("");
    setFormularioAbierto(true);
  }

  function editarHorario(horario: HorarioGuardado) {
    setSemana(horario.semana_inicio);
    setHorarioEditandoId(horario.id);
    setNombreHorario(horario.nombre);
    setSeleccion(horario.seleccion || {});
    setMensaje("");
    setFormularioAbierto(true);

    window.setTimeout(() => {
      document
        .getElementById("editor-disponibilidad")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function alternarHora(
    fecha: string,
    hora: string
  ) {
    setSeleccion((actual) => {
      const horasDia = actual[fecha] || [];

      const nuevasHoras = horasDia.includes(hora)
        ? horasDia.filter((item) => item !== hora)
        : [...horasDia, hora].sort();

      return {
        ...actual,
        [fecha]: nuevasHoras,
      };
    });
  }

  async function guardarHorario() {
    if (!nombreHorario.trim()) {
      setMensaje("❌ Escribe un nombre para el horario.");
      return;
    }

    if (totalSeleccionados === 0) {
      setMensaje("❌ Selecciona al menos un tramo horario.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const datos = {
      semana_inicio: semana,
      nombre: nombreHorario.trim(),
      seleccion,
      updated_at: new Date().toISOString(),
    };

    const resultado = horarioEditandoId
      ? await supabase
          .from("disponibilidad_horarios")
          .update(datos)
          .eq("id", horarioEditandoId)
      : await supabase
          .from("disponibilidad_horarios")
          .insert(datos);

    if (resultado.error) {
      setMensaje(
        "❌ No se pudo guardar el horario: " +
          resultado.error.message
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      horarioEditandoId
        ? "✅ Horario actualizado correctamente."
        : "✅ Horario guardado correctamente."
    );

    setFormularioAbierto(false);
    setHorarioEditandoId(null);
    setSeleccion({});
    setNombreHorario("Disponibilidad general");

    await cargarHorariosVigentes();

    setGuardando(false);
  }

  async function duplicarHorario(horario: HorarioGuardado) {
    setMensaje("");

    const { error } = await supabase
      .from("disponibilidad_horarios")
      .insert({
        semana_inicio: horario.semana_inicio,
        nombre: `${horario.nombre} · copia`,
        seleccion: horario.seleccion,
      });

    if (error) {
      setMensaje(
        "❌ No se pudo duplicar el horario: " +
          error.message
      );
      return;
    }

    setMensaje("✅ Horario duplicado correctamente.");

    await cargarHorariosVigentes();
  }

  async function generarImagen(horario: HorarioGuardado) {
    setGenerandoImagenId(horario.id);
    setMensaje("");

    try {
      await generarImagenDisponibilidad({
        nombre: horario.nombre,
        semana_inicio: horario.semana_inicio,
        seleccion: horario.seleccion || {},
      });

      setMensaje(
        "✅ Imagen de disponibilidad generada correctamente."
      );
    } catch (error) {
      setMensaje(
        "❌ No se pudo generar la imagen: " +
          (error instanceof Error
            ? error.message
            : "Error desconocido")
      );
    } finally {
      setGenerandoImagenId(null);
    }
  }

  async function borrarHorario(horario: HorarioGuardado) {
    const confirmar = window.confirm(
      `¿Seguro que quieres borrar "${horario.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    setMensaje("");

    const { error } = await supabase
      .from("disponibilidad_horarios")
      .delete()
      .eq("id", horario.id);

    if (error) {
      setMensaje(
        "❌ No se pudo borrar el horario: " +
          error.message
      );
      return;
    }

    if (horarioEditandoId === horario.id) {
      setFormularioAbierto(false);
      setHorarioEditandoId(null);
      setSeleccion({});
    }

    setMensaje("✅ Horario borrado correctamente.");

    await cargarHorariosVigentes();
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] px-3 py-3.5 sm:px-7 sm:py-7 lg:px-9">
      <div className="mx-auto w-full max-w-[1540px]">
        <section className="overflow-hidden rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4DD4CA]">
                Gestión
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white sm:text-4xl">
                Disponibilidad
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:mt-2 sm:text-sm">
                Crea, guarda y genera los horarios disponibles de cada semana.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[500px]">
              <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
                  Semana seleccionada
                </p>

                <p className="mt-1 text-base font-bold text-white sm:text-lg">
                  {textoSemana}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Disponibilidades vigentes
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {horarios.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => moverSemana(-7)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#31506E] bg-[#203D5D] text-xl font-medium text-white transition hover:bg-[#2A4A6B]"
              aria-label="Semana anterior"
              title="Semana anterior"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => moverSemana(7)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#31506E] bg-[#203D5D] text-xl font-medium text-white transition hover:bg-[#2A4A6B]"
              aria-label="Semana siguiente"
              title="Semana siguiente"
            >
              ›
            </button>

            <button
              type="button"
              onClick={irAHoy}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#00B8AD] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,184,173,0.18)] transition hover:bg-[#00A79C]"
            >
              Hoy
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={abrirSelectorSemana}
                className="inline-flex h-11 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-[#31506E] bg-[#203D5D] px-4 text-sm font-bold text-white transition hover:bg-[#2A4A6B]"
              >
                <IconoCalendario className="h-5 w-5 shrink-0" />

                <span className="truncate">
                  {textoSemana}
                </span>

                <span className="ml-1 text-[10px] text-white/70">
                  ▾
                </span>
              </button>

              <input
                ref={inputSemanaRef}
                type="date"
                value={semana}
                onChange={(e) =>
                  cambiarSemana(e.target.value)
                }
                className="pointer-events-none absolute h-px w-px opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={nuevoHorario}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00A79C] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,167,156,0.20)] transition hover:bg-[#008F86] sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo horario
          </button>
        </div>

        {mensaje && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#17324D] shadow-sm">
            {mensaje}
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="bg-[#0F2742] px-4 py-4 text-white sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    Configuración
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Semana de trabajo
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Usa los controles superiores para cambiar rápidamente de semana.
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#4DD4CA]">
                  <IconoCalendario className="h-5 w-5" />
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="rounded-xl border border-[#00A79C]/15 bg-[#E8F7F5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#008C83]/70">
                  Semana activa
                </p>

                <p className="mt-1 text-sm font-bold text-[#17324D]">
                  {textoSemana}
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {diasSemana.map((dia) => (
                  <div
                    key={dia.iso}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-2 text-center"
                  >
                    <p className="truncate text-[9px] font-bold capitalize text-slate-400">
                      {dia.nombre.slice(0, 3)}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold text-[#17324D]">
                      {dia.fechaCorta.slice(0, 2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {formularioAbierto ? (
            <section
              id="editor-disponibilidad"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-4 bg-[#0F2742] px-4 py-4 text-white sm:flex-row sm:items-end sm:justify-between sm:px-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4DD4CA]">
                    {horarioEditandoId
                      ? "Edición"
                      : "Nuevo horario"}
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Selecciona la disponibilidad
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Pulsa los tramos de 30 minutos que quieras incluir.
                  </p>
                </div>

                <div className="w-full sm:max-w-[280px]">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
                    Nombre del horario
                  </label>

                  <input
                    type="text"
                    value={nombreHorario}
                    onChange={(e) =>
                      setNombreHorario(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#4DD4CA]/60 focus:ring-2 focus:ring-[#4DD4CA]/10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="min-w-[930px]">
                  <div className="grid grid-cols-7 gap-2">
                    {diasSemana.map((dia) => (
                      <div
                        key={dia.iso}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2"
                      >
                        <div className="mb-2 text-center">
                          <p className="text-[10px] font-bold uppercase capitalize tracking-[0.08em] text-[#00A79C]">
                            {dia.nombre}
                          </p>

                          <p className="mt-0.5 text-xs font-bold text-[#17324D]">
                            {dia.fechaCorta}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {tramos.map((hora) => {
                            const activo =
                              (seleccion[dia.iso] || []).includes(hora);

                            return (
                              <button
                                key={hora}
                                type="button"
                                onClick={() =>
                                  alternarHora(
                                    dia.iso,
                                    hora
                                  )
                                }
                                className={
                                  activo
                                    ? "h-8 rounded-lg border border-[#00A79C] bg-[#00A79C] px-1 text-[10px] font-bold text-white shadow-sm"
                                    : "h-8 rounded-lg border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-500 transition hover:border-[#00A79C]/40 hover:bg-[#E8F7F5] hover:text-[#008C83]"
                                }
                              >
                                {hora}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-500">
                  {totalSeleccionados} tramos seleccionados
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormularioAbierto(false);
                      setHorarioEditandoId(null);
                      setSeleccion({});
                    }}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#17324D] transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={guardarHorario}
                    disabled={guardando}
                    className="h-10 rounded-xl bg-[#00A79C] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(0,167,156,0.18)] transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guardando
                      ? "Guardando..."
                      : horarioEditandoId
                      ? "Guardar cambios"
                      : "Guardar horario"}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A79C]">
                    Horarios
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#17324D]">
                    Disponibilidades vigentes
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Se muestran la semana actual y todas las futuras. Las semanas pasadas quedan ocultas.
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#00A79C]">
                  <IconoDisponibilidad />
                </span>
              </div>

              {cargando ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#00A79C]" />
                </div>
              ) : horarios.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F7F5] text-[#00A79C]">
                    <IconoDisponibilidad className="h-6 w-6" />
                  </span>

                  <p className="mt-4 text-sm font-bold text-[#17324D]">
                    Todavía no hay horarios creados
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    Pulsa “Nuevo horario” para crear la primera disponibilidad.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {horarios.map((horario) => (
                    <article
                      key={horario.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#17324D]">
                            {horario.nombre}
                          </p>

                          <p className="mt-1 text-[11px] font-bold text-[#008C83]">
                            Semana {textoRangoSemana(horario.semana_inicio)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {contarHoras(
                              horario.seleccion || {}
                            )} tramos seleccionados
                          </p>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F5] text-[#00A79C]">
                          <IconoDisponibilidad />
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editarHorario(horario)
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-[#17324D] transition hover:bg-slate-50"
                        >
                          <IconoEditar />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            duplicarHorario(horario)
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-[#17324D] transition hover:bg-slate-50"
                        >
                          <IconoDuplicar />
                          Duplicar
                        </button>

                        <button
                          type="button"
                          disabled={
                            generandoImagenId === horario.id
                          }
                          onClick={() =>
                            generarImagen(horario)
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#00A79C] px-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <IconoImagen />
                          {generandoImagenId === horario.id
                            ? "Generando..."
                            : "Generar imagen"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            borrarHorario(horario)
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                        >
                          <IconoBorrar />
                          Borrar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
