"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calcularEconomiaClase } from "../../lib/economia";

type UbicacionClub = {
  id: string;
  nombre: string;
  es_club_referencia: boolean | null;
};

type ClaseClub = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  importe_club: number;
  coste_pista: number;
  ingreso_extra: number;
  modo_cobro: string | null;
  importe_total: number | null;
  fecha_cobro_club: string | null;
  metodo_cobro_club: string | null;
  ubicaciones: {
    es_club_referencia: boolean | null;
  } | null;
  clase_alumnos: {
    importe: number;
    usa_bono: boolean;
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

type LiquidacionClub = {
  id: string;
  fecha_cobro: string;
  metodo: string;
  importe: number;
  numero_clases: number;
};

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

function hoyISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function limitesMes(mes: string) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const inicio = `${anio}-${String(numeroMes).padStart(2, "0")}-01`;
  const siguiente = new Date(anio, numeroMes, 1);
  const fin = `${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, "0")}-01`;
  return { inicio, fin };
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function nombreAlumnos(clase: ClaseClub) {
  const nombres = (clase.clase_alumnos || [])
    .map((participante) => {
      const alumno = participante.alumnos;
      if (!alumno) return "";
      return `${alumno.nombre} ${alumno.apellidos || ""}`.trim();
    })
    .filter(Boolean);

  return nombres.length > 0 ? nombres.join(", ") : "Sin alumnos";
}


function formatearMesControlClub(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
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

function formatearFechaControlClub(
  valor: string
) {
  if (!valor) {
    return "Seleccionar";
  }

  const [anio, mes, dia] =
    valor.split("-").map(Number);

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(
      anio,
      mes - 1,
      dia
    )
  );
}

function SelectorClubCobros({
  valor,
  onChange,
  clubs,
}: {
  valor: string;
  onChange: (valor: string) => void;
  clubs: UbicacionClub[];
}) {
  const [abierto, setAbierto] =
    useState(false);

  const etiqueta =
    clubs.find(
      (club) => club.id === valor
    )?.nombre || "Sin clubs";

  return (
    <div className="relative">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        Club
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
      >
        <span className="truncate">
          {etiqueta}
        </span>
        <span className="text-white/45">
          ⌄
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de club"
            onClick={() =>
              setAbierto(false)
            }
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-[58px] z-50 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
            {clubs.map(
              (club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => {
                    onChange(
                      club.id
                    );
                    setAbierto(false);
                  }}
                  className={
                    club.id === valor
                      ? "flex h-9 w-full items-center rounded-lg bg-[#17324D] px-3 text-left text-xs font-bold text-white"
                      : "flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                  }
                >
                  {club.nombre}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SelectorMesCobros({
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
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
        Mes
      </span>

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
          {formatearMesControlClub(
            valor
          )}
        </span>
        <span className="text-white/45">⌄</span>
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

            <div className="mt-3 grid grid-cols-3 gap-2">
              {meses.map(
                (nombreMes, indice) => {
                  const numeroMes = indice + 1;
                  const seleccionado =
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

function CampoFechaCobroClub({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  function abrir() {
    const input = inputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {}

    input.focus();
    input.click();
  }

  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        Fecha de liquidación
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={abrir}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold capitalize text-[#17324D] transition hover:bg-slate-50 focus:border-[#00A79C]/60 focus:outline-none focus:ring-2 focus:ring-[#00A79C]/10"
        >
          <span className="truncate">
            {formatearFechaControlClub(
              valor
            )}
          </span>
          <span className="text-xs text-[#00A79C]">⌄</span>
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
          className="pointer-events-none absolute h-px w-px opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default function CobrosClub() {
  const [clubs, setClubs] = useState<UbicacionClub[]>([]);
  const [clubId, setClubId] = useState("");
  const [mes, setMes] = useState(mesActual());
  const [clases, setClases] = useState<ClaseClub[]>([]);
  const [fechaCobro, setFechaCobro] = useState(hoyISO());
  const [metodo, setMetodo] = useState("transferencia");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [liquidacion, setLiquidacion] = useState<LiquidacionClub | null>(null);

  useEffect(() => {
    cargarClubs();
  }, []);

  useEffect(() => {
    if (!clubId || !mes) {
      setClases([]);
      return;
    }

    cargarClases();
  }, [clubId, mes]);

  async function cargarClubs() {
    setCargando(true);

    const { data, error } = await supabase
      .from("ubicaciones")
      .select("id,nombre,es_club_referencia")
      .eq("tipo", "club")
      .eq("activa", true)
      .order("nombre");

    if (error) {
      setMensaje("❌ No se pudieron cargar los clubs: " + error.message);
      setCargando(false);
      return;
    }

    const lista = (data || []) as UbicacionClub[];
    setClubs(lista);

    if (lista.length > 0) {
      setClubId((actual) => actual || lista[0].id);
    }

    setCargando(false);
  }

  async function cargarClases() {
    const { inicio, fin } = limitesMes(mes);
    setCargando(true);
    setMensaje("");
    setLiquidacion(null);

    const { data, error } = await supabase
      .from("clases")
      .select(`
        id,
        fecha,
        hora_inicio,
        duracion_minutos,
        tipo,
        estado,
        facturable,
        cobrada,
        importe_club,
        coste_pista,
        ingreso_extra,
        modo_cobro,
        importe_total,
        fecha_cobro_club,
        metodo_cobro_club,
        ubicaciones (
          es_club_referencia
        ),
        clase_alumnos (
          importe,
          usa_bono,
          alumnos (
            nombre,
            apellidos
          )
        )
      `)
      .eq("ubicacion_id", clubId)
      .gte("fecha", inicio)
      .lt("fecha", fin)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      setMensaje("❌ No se pudieron cargar las clases del mes: " + error.message);
      setClases([]);
      setCargando(false);
      return;
    }

    const periodo = `${mes}-01`;

    const {
      data: liquidacionData,
      error: errorLiquidacion,
    } = await supabase
      .from("cobros_club")
      .select(`
        id,
        fecha_cobro,
        metodo,
        importe,
        numero_clases
      `)
      .eq("ubicacion_id", clubId)
      .eq("periodo", periodo)
      .maybeSingle();

    if (errorLiquidacion) {
      setMensaje(
        "❌ No se pudo cargar la liquidación mensual: " +
          errorLiquidacion.message
      );
      setClases([]);
      setCargando(false);
      return;
    }

    setClases((data || []) as unknown as ClaseClub[]);
    setLiquidacion(
      liquidacionData
        ? {
            ...liquidacionData,
            importe: Number(liquidacionData.importe || 0),
            numero_clases: Number(liquidacionData.numero_clases || 0),
          }
        : null
    );
    setCargando(false);
  }

  const clasesFacturables = useMemo(
    () =>
      clases.filter((clase) => {
        const economia = calcularEconomiaClase(clase);
        return clase.tipo === "club" && economia.cuentaEconomicamente;
      }),
    [clases]
  );

  const pendientes = clasesFacturables.filter((clase) => !clase.cobrada);
  const cobradas = clasesFacturables.filter((clase) => clase.cobrada);

  const totalMes = clases.reduce(
    (total, clase) =>
      total + calcularEconomiaClase(clase).clubGenerado,
    0
  );

  const totalPendiente = pendientes.reduce(
    (total, clase) =>
      total + calcularEconomiaClase(clase).clubGenerado,
    0
  );

  const totalCobrado = cobradas.reduce(
    (total, clase) =>
      total + calcularEconomiaClase(clase).clubCobrado,
    0
  );

  const pistasPagadasClub = clases.reduce(
    (total, clase) =>
      total + calcularEconomiaClase(clase).pistasPagadasClub,
    0
  );

  const saldoNetoMes = totalMes - pistasPagadasClub;

  const clubSeleccionado = clubs.find((club) => club.id === clubId);

  const saldoAbsoluto = Math.abs(saldoNetoMes);

  const textoSaldo =
    saldoNetoMes > 0.005
      ? `${saldoAbsoluto.toFixed(2)} € a favor de Espacio Pádel Academy`
      : saldoNetoMes < -0.005
      ? `${saldoAbsoluto.toFixed(2)} € a favor de ${clubSeleccionado?.nombre || "club"}`
      : "Saldo 0,00 €";

  const textoLiquidacion =
    liquidacion
      ? liquidacion.importe > 0.005
        ? `${Math.abs(liquidacion.importe).toFixed(2)} € a favor de Espacio Pádel Academy`
        : liquidacion.importe < -0.005
        ? `${Math.abs(liquidacion.importe).toFixed(2)} € a favor de ${clubSeleccionado?.nombre || "club"}`
        : "Saldo 0,00 €"
      : "";

  async function marcarMesCobrado() {
    if (
      !clubId ||
      !mes ||
      clasesFacturables.length === 0 ||
      liquidacion
    ) {
      return;
    }

    const confirmar = window.confirm(
      `Se cerrará la liquidación mensual de ${clubSeleccionado?.nombre || "club"}.\n\n` +
        `Club generado: ${totalMes.toFixed(2)} €\n` +
        `Pistas pagadas: ${pistasPagadasClub.toFixed(2)} €\n` +
        `Saldo: ${textoSaldo}\n\n` +
        `Se marcarán como cobradas ${pendientes.length} clase(s) pendiente(s). ¿Continuar?`
    );

    if (!confirmar) return;

    setGuardando(true);
    setMensaje("");

    if (pendientes.length > 0) {
      const ids = pendientes.map((clase) => clase.id);

      const { error: errorClases } = await supabase
        .from("clases")
        .update({
          cobrada: true,
          fecha_cobro_club: fechaCobro,
          metodo_cobro_club: metodo,
        })
        .in("id", ids);

      if (errorClases) {
        setMensaje("❌ No se pudo cerrar la liquidación: " + errorClases.message);
        setGuardando(false);
        return;
      }
    }

    const periodo = `${mes}-01`;

    const { error: errorLiquidacion } = await supabase
      .from("cobros_club")
      .upsert(
        {
          ubicacion_id: clubId,
          periodo,
          fecha_cobro: fechaCobro,
          metodo,
          importe: saldoNetoMes,
          numero_clases: clasesFacturables.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ubicacion_id,periodo" }
      );

    if (errorLiquidacion) {
      setMensaje(
        "⚠️ Las clases se han marcado como cobradas, pero no se pudo guardar la liquidación mensual: " +
          errorLiquidacion.message
      );
      setGuardando(false);
      await cargarClases();
      return;
    }

    setMensaje(
      `✅ Liquidación de ${clubSeleccionado?.nombre || "club"} cerrada: ${textoSaldo}`
    );

    setGuardando(false);
    await cargarClases();
  }

  return (
    <section className="min-w-0">
      {/* CABECERA / FILTROS · MISMO LENGUAJE QUE EL RESTO DE V2 */}
      <div className="rounded-2xl bg-[#0F2742] p-4 text-white shadow-[0_14px_34px_rgba(15,39,66,0.16)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4DD4CA]">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8h16l-2-4H6L4 8Z" />
                <path d="M5 8v11h14V8M9 19v-6h6v6" />
              </svg>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4DD4CA]">
                Liquidación mensual
              </p>

              <h2 className="mt-0.5 text-xl font-bold text-white">
                Cobros de clubs
              </h2>

              <p className="mt-1 text-sm text-white/55">
                Compensa clases del club y pistas pagadas para cerrar el saldo real del mes.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-2.5 sm:grid-cols-2 xl:w-auto xl:min-w-[520px]">
            <SelectorClubCobros
              valor={clubId}
              onChange={setClubId}
              clubs={clubs}
            />

            <SelectorMesCobros
              valor={mes}
              onChange={setMes}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/45">
              Facturables
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {clasesFacturables.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#4DD4CA]/20 bg-[#00A79C]/15 px-3 py-3 sm:px-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#85E6DF]">
              Club generado
            </p>
            <p className="mt-1 whitespace-nowrap text-xl font-bold text-[#85E6DF]">
              {totalMes.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-3 sm:px-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200/80">
              Pistas pagadas
            </p>
            <p className="mt-1 whitespace-nowrap text-xl font-bold text-white">
              {pistasPagadasClub.toFixed(2)} €
            </p>
          </div>

          <div
            className={
              saldoNetoMes >= 0
                ? "rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-3 sm:px-4"
                : "rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 sm:px-4"
            }
          >
            <p
              className={
                saldoNetoMes >= 0
                  ? "text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200/80"
                  : "text-[9px] font-bold uppercase tracking-[0.1em] text-red-200/80"
              }
            >
              Saldo neto
            </p>
            <p className="mt-1 whitespace-nowrap text-xl font-bold text-white">
              {saldoNetoMes.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-4 sm:mt-5">
        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <p className="text-sm font-semibold text-slate-500">
              Cargando clases...
            </p>
          </div>
        ) : clasesFacturables.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
            </div>

            <p className="mt-3 font-bold text-[#17324D]">
              No hay clases facturables
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Solo se incluyen realizadas y canceladas marcadas como facturables.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liquidacion && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
                  Mes liquidado
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-800">
                  {textoLiquidacion}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700/80">
                  Liquidado el {formatearFecha(liquidacion.fecha_cobro)} · {liquidacion.metodo}
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#FBFCFD] px-4 py-3.5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#00A79C]">
                  Detalle del mes
                </p>

                <h3 className="mt-0.5 text-base font-bold text-[#17324D]">
                  {clubSeleccionado?.nombre ||
                    "Club"}{" "}
                  · {mes}
                </h3>
              </div>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                {clasesFacturables.length}{" "}
                {clasesFacturables.length ===
                1
                  ? "clase"
                  : "clases"} · {totalPendiente.toFixed(2)} € pendiente bruto
              </span>
            </div>

            {/* MÓVIL · FICHAS EN LUGAR DE TABLA */}
            <div className="space-y-2.5 p-3 md:hidden">
              {clasesFacturables.map(
                (clase) => (
                  <article
                    key={clase.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 bg-[#FBFCFD] px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#17324D]">
                          {formatearFecha(
                            clase.fecha
                          )}{" "}
                          ·{" "}
                          {clase.hora_inicio.slice(
                            0,
                            5
                          )}
                        </p>

                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {
                            clase.duracion_minutos
                          }{" "}
                          min
                        </p>
                      </div>

                      <p className="shrink-0 text-base font-bold text-[#17324D]">
                        {Number(
                          clase.importe_club ||
                            0
                        ).toFixed(
                          2
                        )} €
                      </p>
                    </div>

                    <div className="space-y-3 border-t border-slate-100 px-3.5 py-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Alumnos
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                          {nombreAlumnos(
                            clase
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={
                            clase.estado ===
                            "cancelada"
                              ? "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                              : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                          }
                        >
                          {clase.estado ===
                          "cancelada"
                            ? "Cancelada · facturable"
                            : "Realizada"}
                        </span>

                        <span
                          className={
                            clase.cobrada
                              ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                              : "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                          }
                        >
                          {clase.cobrada
                            ? "Cobrado"
                            : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>

            {/* TABLET / PC · TABLA ORIGINAL SIN CAMBIOS */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse">
                <thead className="bg-[#0F2742] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Horario
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Alumnos
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Importe
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
                      Cobro
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clasesFacturables.map(
                    (clase) => (
                      <tr
                        key={
                          clase.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-[#17324D]">
                          {formatearFecha(
                            clase.fecha
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-500">
                          {clase.hora_inicio.slice(
                            0,
                            5
                          )}{" "}
                          ·{" "}
                          {
                            clase.duracion_minutos
                          }{" "}
                          min
                        </td>

                        <td className="px-4 py-3 text-sm font-medium text-slate-600">
                          {nombreAlumnos(
                            clase
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              clase.estado ===
                              "cancelada"
                                ? "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                                : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                            }
                          >
                            {clase.estado ===
                            "cancelada"
                              ? "Cancelada · facturable"
                              : "Realizada"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-[#17324D]">
                          {Number(
                            clase.importe_club ||
                              0
                          ).toFixed(
                            2
                          )} €
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              clase.cobrada
                                ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                                : "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700"
                            }
                          >
                            {clase.cobrada
                              ? "Cobrado"
                              : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-[#F8FAFC] p-4 sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[210px_210px_minmax(280px,1fr)] lg:items-end">
                <CampoFechaCobroClub
                  valor={fechaCobro}
                  onChange={setFechaCobro}
                />

                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Método
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["transferencia", "Transferencia"],
                      ["efectivo", "Efectivo"],
                      ["bizum", "Bizum"],
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
                            ? "h-11 rounded-xl border border-[#00A79C] bg-[#E8F7F5] px-3 text-xs font-bold text-[#008C83]"
                            : "h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                        }
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    marcarMesCobrado
                  }
                  disabled={
                    guardando ||
                    clasesFacturables.length ===
                      0 ||
                    Boolean(liquidacion)
                  }
                  className="h-11 rounded-xl bg-[#00A79C] px-5 text-sm font-bold text-white transition hover:bg-[#008F86] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {guardando
                    ? "Guardando..."
                    : liquidacion
                    ? "Mes liquidado"
                    : `Liquidar mes · ${textoSaldo}`}
                </button>
              </div>

              {!liquidacion && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  La liquidación mensual compensa el importe generado por las clases del club con las pistas pagadas en el club de referencia. Al confirmar se cerrarán globalmente las {pendientes.length} clase(s) de club que sigan pendientes.
                </p>
              )}
            </div>
          </div>
          </div>
        )}

        {mensaje && (
          <div
            className={
              mensaje.startsWith(
                "✅"
              )
                ? "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                : mensaje.startsWith(
                    "⚠️"
                  )
                ? "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                : "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {mensaje}
          </div>
        )}
      </div>
    </section>
  );
}
