"use client";

import { useState } from "react";

type Props = {
  busqueda: string;
  filtroEstado: string;
  filtroMes: string;
  totalClases: number;
  setBusqueda: (valor: string) => void;
  setFiltroEstado: (valor: string) => void;
  setFiltroMes: (valor: string) => void;
  onLimpiar: () => void;
  integrado?: boolean;
};

const MESES = [
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

function IconoBuscar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function IconoFiltro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export default function FiltrosAgenda({
  busqueda,
  filtroEstado,
  filtroMes,
  totalClases,
  setBusqueda,
  setFiltroEstado,
  setFiltroMes,
  onLimpiar,
  integrado = false,
}: Props) {
  const ahora = new Date();

  const [
    selectorMesAbierto,
    setSelectorMesAbierto,
  ] = useState(false);

  const [
    selectorEstadoAbierto,
    setSelectorEstadoAbierto,
  ] = useState(false);

  const [
    anioSelector,
    setAnioSelector,
  ] = useState(
    filtroMes
      ? Number(filtroMes.slice(0, 4))
      : ahora.getFullYear()
  );

  const hayFiltros =
    busqueda.trim().length > 0 ||
    filtroEstado !== "todas" ||
    filtroMes.length > 0;

  function abrirSelectorMes() {
    setAnioSelector(
      filtroMes
        ? Number(
            filtroMes.slice(
              0,
              4
            )
          )
        : new Date().getFullYear()
    );

    setSelectorMesAbierto(
      true
    );
  }

  function seleccionarMes(
    numeroMes: number
  ) {
    setFiltroMes(
      `${anioSelector}-${String(
        numeroMes
      ).padStart(2, "0")}`
    );

    setSelectorMesAbierto(
      false
    );
  }

  const textoMes =
    filtroMes
      ? `${MESES[
          Number(
            filtroMes.slice(
              5,
              7
            )
          ) - 1
        ]} ${filtroMes.slice(0, 4)}`
      : "Todos los meses";

  return (
    <section
      className={
        integrado
          ? "bg-transparent"
          : "mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)] sm:p-4"
      }
    >

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

        {!integrado && (
          <div className="flex min-w-[175px] items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#17324D]">
              <IconoFiltro />
            </div>

            <div>
              <p className="text-xs font-bold text-[#17324D]">
                Filtros
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                {totalClases} {totalClases === 1 ? "clase" : "clases"} mostradas
              </p>
            </div>
          </div>
        )}

        <div className="flex-1">
          {integrado && (
            <div className="mb-2 flex items-center justify-between">
              <p className={integrado ? "text-[11px] font-medium text-white/45" : "text-[11px] font-medium text-slate-400"}>
                {totalClases} {totalClases === 1 ? "clase" : "clases"} mostradas
              </p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(170px,0.7fr)_minmax(210px,0.85fr)_auto]">

          <div className="relative">
            <span className={integrado ? "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4DD4CA]" : "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"}>
              <IconoBuscar />
            </span>

            <input
              type="text"
              placeholder="Buscar alumno o ubicación..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              className={
                integrado
                  ? "h-11 w-full rounded-xl border border-white/15 bg-white/10 py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 hover:bg-white/15 focus:border-[#4DD4CA]/45 focus:ring-2 focus:ring-[#00A79C]/15"
                  : "h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-[#17324D] outline-none transition placeholder:text-slate-400 focus:border-[#00A79C] focus:ring-2 focus:ring-[#00A79C]/10"
              }
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setSelectorEstadoAbierto(
                  (abierto) => !abierto
                )
              }
              className={
                integrado
                  ? selectorEstadoAbierto
                    ? "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#4DD4CA]/40 bg-white/15 px-3 text-sm font-semibold text-white"
                    : "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  : selectorEstadoAbierto
                  ? "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#00A79C]/30 bg-[#E8F7F5] px-3 text-sm font-semibold text-[#008C83]"
                  : "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#17324D] transition hover:bg-slate-50"
              }
              aria-label="Filtrar por estado"
              aria-expanded={selectorEstadoAbierto}
            >
              <span>
                {filtroEstado === "programada"
                  ? "Programadas"
                  : filtroEstado === "realizada"
                  ? "Realizadas"
                  : filtroEstado === "cancelada"
                  ? "Canceladas"
                  : "Todos los estados"}
              </span>
              <span className={integrado ? "text-xs text-white/45" : "text-xs text-slate-400"}>
                ⌄
              </span>
            </button>

            {selectorEstadoAbierto && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectorEstadoAbierto(false)
                  }
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Cerrar selector de estado"
                />

                <div className="absolute left-0 top-12 z-50 w-full min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                  {[
                    ["todas", "Todos los estados"],
                    ["programada", "Programadas"],
                    ["realizada", "Realizadas"],
                    ["cancelada", "Canceladas"],
                  ].map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => {
                        setFiltroEstado(valor);
                        setSelectorEstadoAbierto(false);
                      }}
                      className={
                        filtroEstado === valor
                          ? "flex h-9 w-full items-center rounded-lg bg-[#17324D] px-3 text-left text-xs font-bold text-white"
                          : "flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold text-[#17324D] transition hover:bg-[#17324D] hover:text-white"
                      }
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={abrirSelectorMes}
              className={
                integrado
                  ? selectorMesAbierto
                    ? "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#4DD4CA]/40 bg-white/15 px-3 text-sm font-bold text-white"
                    : "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/15"
                  : selectorMesAbierto
                  ? "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#00A79C]/30 bg-[#E8F7F5] px-3 text-sm font-bold text-[#008C83]"
                  : "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#17324D] transition hover:bg-slate-50"
              }
              aria-label="Filtrar por mes y año"
              aria-expanded={
                selectorMesAbierto
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0">
                  <IconoCalendario />
                </span>

                <span className="truncate">
                  {textoMes}
                </span>
              </span>

              <span className="shrink-0 text-xs">
                ⌄
              </span>
            </button>

            {selectorMesAbierto && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectorMesAbierto(
                      false
                    )
                  }
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Cerrar selector de mes"
                />

                <div className="absolute right-0 top-12 z-50 w-[330px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">

                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">

                    <button
                      type="button"
                      onClick={() =>
                        setAnioSelector(
                          (anio) =>
                            anio - 1
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                      aria-label="Año anterior"
                    >
                      ‹
                    </button>

                    <label className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Año
                      </span>

                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={
                          anioSelector
                        }
                        onChange={(e) => {
                          const nuevoAnio =
                            Number(
                              e.target
                                .value
                            );

                          if (
                            Number.isFinite(
                              nuevoAnio
                            )
                          ) {
                            setAnioSelector(
                              nuevoAnio
                            );
                          }
                        }}
                        className="w-[88px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-base font-bold text-[#17324D] outline-none transition focus:border-[#00A79C] focus:ring-2 focus:ring-[#00A79C]/10"
                        aria-label="Año"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setAnioSelector(
                          (anio) =>
                            anio + 1
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-[#17324D] transition hover:bg-slate-50"
                      aria-label="Año siguiente"
                    >
                      ›
                    </button>

                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {MESES.map(
                      (
                        nombreMes,
                        indice
                      ) => {
                        const numeroMes =
                          indice + 1;

                        const activo =
                          filtroMes ===
                          `${anioSelector}-${String(
                            numeroMes
                          ).padStart(
                            2,
                            "0"
                          )}`;

                        return (
                          <button
                            key={
                              nombreMes
                            }
                            type="button"
                            onClick={() =>
                              seleccionarMes(
                                numeroMes
                              )
                            }
                            className={
                              activo
                                ? "rounded-lg bg-[#00A79C] px-2 py-2.5 text-xs font-bold text-white shadow-sm"
                                : "rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-[#17324D] transition hover:border-[#00A79C]/40 hover:bg-[#E8F7F5]"
                            }
                          >
                            {
                              nombreMes
                            }
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">

                    <p className="text-[11px] text-slate-400">
                      Filtra directamente por mes
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setFiltroMes("");
                        setSelectorMesAbierto(
                          false
                        );
                      }}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-[#00A79C] transition hover:bg-[#E8F7F5]"
                    >
                      Todos los meses
                    </button>

                  </div>

                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onLimpiar}
            disabled={!hayFiltros}
            className={
              integrado
                ? hayFiltros
                  ? "h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                  : "h-11 cursor-default rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/25"
                : hayFiltros
                ? "h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#17324D] transition hover:bg-slate-100"
                : "h-11 cursor-default rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-300"
            }
          >
            Limpiar
          </button>

          </div>
        </div>

      </div>

    </section>
  );
}
