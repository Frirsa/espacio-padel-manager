"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type UbicacionClub = {
  id: string;
  nombre: string;
};

type ClaseClub = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  estado: string;
  facturable: boolean;
  cobrada: boolean;
  importe_club: number;
  fecha_cobro_club: string | null;
  metodo_cobro_club: string | null;
  clase_alumnos: {
    alumnos: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
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
      .select("id,nombre")
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

    const { data, error } = await supabase
      .from("clases")
      .select(`
        id,
        fecha,
        hora_inicio,
        duracion_minutos,
        estado,
        facturable,
        cobrada,
        importe_club,
        fecha_cobro_club,
        metodo_cobro_club,
        clase_alumnos (
          alumnos (
            nombre,
            apellidos
          )
        )
      `)
      .eq("tipo", "club")
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

    setClases((data || []) as unknown as ClaseClub[]);
    setCargando(false);
  }

  const clasesFacturables = useMemo(
    () =>
      clases.filter(
        (clase) =>
          clase.facturable &&
          (clase.estado === "realizada" || clase.estado === "cancelada")
      ),
    [clases]
  );

  const pendientes = clasesFacturables.filter((clase) => !clase.cobrada);
  const cobradas = clasesFacturables.filter((clase) => clase.cobrada);

  const totalMes = clasesFacturables.reduce(
    (total, clase) => total + Number(clase.importe_club || 0),
    0
  );

  const totalPendiente = pendientes.reduce(
    (total, clase) => total + Number(clase.importe_club || 0),
    0
  );

  const totalCobrado = cobradas.reduce(
    (total, clase) => total + Number(clase.importe_club || 0),
    0
  );

  const clubSeleccionado = clubs.find((club) => club.id === clubId);

  async function marcarMesCobrado() {
    if (pendientes.length === 0 || !clubId || !mes) return;

    const confirmar = window.confirm(
      `Se marcarán como cobradas ${pendientes.length} clase(s) por un total de ${totalPendiente.toFixed(2)} €. ¿Continuar?`
    );

    if (!confirmar) return;

    setGuardando(true);
    setMensaje("");

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
      setMensaje("❌ No se pudo registrar el cobro: " + errorClases.message);
      setGuardando(false);
      return;
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
          importe: totalMes,
          numero_clases: clasesFacturables.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ubicacion_id,periodo" }
      );

    if (errorLiquidacion) {
      setMensaje(
        "⚠️ Las clases se han marcado como cobradas, pero no se pudo guardar el resumen mensual: " +
          errorLiquidacion.message
      );
      setGuardando(false);
      await cargarClases();
      return;
    }

    setMensaje(
      `✅ Cobro de ${clubSeleccionado?.nombre || "club"} registrado: ${totalPendiente.toFixed(2)} €`
    );

    setGuardando(false);
    await cargarClases();
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#09a9a3]">
            Cobro mensual
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Cobros de clubs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisa las clases facturables de un mes y registra el cobro completo.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[500px]">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Club
            </label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              {clubs.length === 0 && <option value="">Sin clubs</option>}
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Mes
            </label>
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Facturables</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{clasesFacturables.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total del mes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalMes.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-green-600">Cobrado</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{totalCobrado.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-600">Pendiente</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{totalPendiente.toFixed(2)} €</p>
        </div>
      </div>

      {cargando ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Cargando clases...
        </div>
      ) : clasesFacturables.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-semibold text-slate-700">No hay clases facturables en este mes.</p>
          <p className="mt-1 text-sm text-slate-500">
            Solo aparecen clases realizadas y canceladas que estén marcadas como facturables.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Alumnos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Importe</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Cobro</th>
              </tr>
            </thead>
            <tbody>
              {clasesFacturables.map((clase) => (
                <tr key={clase.id} className="border-t border-slate-200">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">
                    {formatearFecha(clase.fecha)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {clase.hora_inicio.slice(0, 5)} · {clase.duracion_minutos} min
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{nombreAlumnos(clase)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        clase.estado === "cancelada"
                          ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700"
                          : "rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700"
                      }
                    >
                      {clase.estado === "cancelada" ? "Cancelada · facturable" : "Realizada"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {Number(clase.importe_club || 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-center">
                    {clase.cobrada ? (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Cobrado
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clasesFacturables.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Fecha de cobro
              </label>
              <input
                type="date"
                value={fechaCobro}
                onChange={(e) => setFechaCobro(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Forma de cobro
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="bizum">Bizum</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <button
              type="button"
              onClick={marcarMesCobrado}
              disabled={guardando || pendientes.length === 0}
              className="rounded-xl bg-[#09a9a3] px-5 py-3 font-bold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {guardando
                ? "Guardando..."
                : pendientes.length === 0
                  ? "Mes cobrado"
                  : `Marcar ${totalPendiente.toFixed(2)} € como cobrado`}
            </button>
          </div>

          {pendientes.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Se marcarán como cobradas únicamente las {pendientes.length} clase(s) pendientes de este mes.
            </p>
          )}
        </div>
      )}

      {mensaje && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {mensaje}
        </div>
      )}
    </section>
  );
}
