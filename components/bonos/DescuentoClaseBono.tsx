"use client";

import UnificarCobrosBono from "./UnificarCobrosBono";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { precioOriginalBono, precioSesionBono, type BonoEconomico } from "../../lib/economia";

type Clase = {
  id: string;
  estado: string;
  tipo: string;
  modo_cobro?: string | null;
  clase_alumnos: { bono_id?: string | null; usa_bono: boolean; alumnos?: { nombre: string; apellidos: string | null } | null }[];
};
type Bono = BonoEconomico & { estado_cobro?: string | null };
type Cobro = { id: string; bono_id: string; importe: number; estado: string; metodo_cobro: string | null; fecha_cobro: string | null };
type Props = {
  clase: Clase;
  bonos?: Bono[];
  disabled?: boolean;
  onGuardado: (bonos: Bono[]) => Promise<void>;
};
const euros = (valor: number) => valor.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function Ajuste({ clase, bono, disabled, onGuardado }: {
  clase: Clase; bono: Bono; disabled?: boolean; onGuardado: () => Promise<void>;
}) {
  const ajuste = bono.ajustes_clase?.[clase.id];
  const [descuento, setDescuento] = useState(String(ajuste?.descuento || 0));
  const [motivo, setMotivo] = useState(ajuste?.motivo || "");
  const [cobroId, setCobroId] = useState(ajuste?.cobro_id || "");
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  useEffect(() => {
    let activo = true;
    setListo(false);
    void supabase.from("bono_cobros")
      .select("id,bono_id,importe,estado,metodo_cobro,fecha_cobro")
      .eq("bono_id", bono.id).order("created_at").then(({ data, error }) => {
        if (!activo) return;
        if (error) setMensaje(`No se pudieron cargar los cobros: ${error.message}`);
        else { setCobros(data || []); setListo(true); }
      });
    return () => { activo = false; };
  }, [bono.id]);
  const nuevo = Number(descuento.replace(",", "."));
  const habitual = precioSesionBono(bono);
  const totalNuevo = Number(bono.importe_pagado) + Number(ajuste?.descuento || 0) - nuevo;
  const valido = !!descuento.trim() && Number.isFinite(nuevo) && nuevo >= 0 && nuevo <= habitual &&
    Math.abs(nuevo * 100 - Math.round(nuevo * 100)) < 0.00001 && (nuevo === 0 || !!motivo.trim());

  async function guardar() {
    if (!valido || guardando || !listo) return;
    setGuardando(true); setMensaje("");
    try {
      const { error } = await supabase.rpc("guardar_descuento_clase_bono", {
        p_clase_id: clase.id, p_bono_id: bono.id, p_descuento: nuevo,
        p_motivo: motivo.trim(), p_cobro_id: cobroId || null,
        p_descuento_anterior: Number(ajuste?.descuento || 0),
      });
      if (error) throw new Error(error.message);
      await onGuardado();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar el descuento");
    } finally { setGuardando(false); }
  }
  const nombres = clase.clase_alumnos.filter(p => p.bono_id === bono.id && p.alumnos)
    .map(p => `${p.alumnos!.nombre} ${p.alumnos!.apellidos || ""}`.trim()).join(" + ");
  return <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-sm font-semibold text-[#17324D]">Bono de {nombres || "esta clase"}</p>
    <p className="text-xs text-slate-600">Precio habitual de la sesión: <strong>{euros(habitual)}</strong>. Precio original del bono: {euros(precioOriginalBono(bono))}.</p>
    <label className="block text-xs font-semibold text-slate-700">Descuento solo en esta clase (€)
      <input type="text" inputMode="decimal" value={descuento} disabled={guardando || disabled}
        onChange={e => setDescuento(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </label>
    <label className="block text-xs font-semibold text-slate-700">Motivo
      <input type="text" value={motivo} disabled={guardando || disabled}
        onChange={e => setMotivo(e.target.value)} placeholder="Solo asiste un alumno"
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </label>
    <label className="block text-xs font-semibold text-slate-700">Cómo se ha cobrado
      <select value={cobroId} disabled={!listo || guardando || disabled} onChange={e => setCobroId(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
        <option value="">Conservar los cobros registrados</option>
        {cobros.map(cobro => <option key={cobro.id} value={cobro.id}>
          Descuento aplicado en {cobro.estado === "pagado" ? "pago" : "pago pendiente"} de {euros(Number(cobro.importe))} · {cobro.metodo_cobro || "Sin método"} · {cobro.fecha_cobro || "Sin fecha"}
        </option>)}
      </select>
    </label>
    <p className="text-xs leading-5 text-slate-500">Si recibiste el importe ya rebajado, selecciona el cobro para corregirlo. Si recibiste el importe completo, conserva los cobros: la diferencia quedará a favor de los alumnos. Esta opción no registra una devolución.</p>
    {valido && <p className="text-sm text-[#17324D]">Esta clase: <strong>{euros(habitual - nuevo)}</strong>. Total del bono: <strong>{euros(totalNuevo)}</strong>. El beneficio de esta clase se reduce en {euros(nuevo)}. Las demás conservan su precio.</p>}
    <p className="text-xs text-slate-500">Consume una clase completa. Para retirar el ajuste, guarda un descuento de 0 €.</p>
    <button type="button" disabled={!valido || !listo || guardando || disabled} onClick={guardar}
      className="rounded-xl bg-[#00A79C] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{guardando ? "Guardando…" : "Guardar descuento"}</button>
    <UnificarCobrosBono bonoId={bono.id} cobros={cobros} disabled={guardando || disabled} onGuardado={onGuardado} />
    {mensaje && <p role="alert" className="text-sm text-red-700">{mensaje}</p>}
  </div>;
}

export default function DescuentoClaseBono({ clase, bonos, disabled, onGuardado }: Props) {
  const ids = [...new Set(clase.clase_alumnos.filter(p => p.usa_bono && p.bono_id).map(p => p.bono_id!))].sort();
  const claveIds = ids.join(",");
  const [cargados, setCargados] = useState<Bono[] | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [revision, setRevision] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  useEffect(() => {
    if (bonos || !claveIds) return;
    let activo = true;
    void supabase.from("bonos").select("id,importe_pagado,numero_clases,ajustes_clase,estado_cobro")
      .in("id", claveIds.split(",")).then(({ data, error }) => {
        if (!activo) return;
        if (error) setMensaje(error.message); else setCargados(data || []);
      });
    return () => { activo = false; };
  }, [claveIds, bonos]);
  if (!ids.length || clase.tipo === "club" || clase.modo_cobro === "total") return null;
  const seleccion = (cargados || bonos || []).filter(b => ids.includes(b.id));
  if (clase.estado !== "realizada" && !seleccion.some(b => b.ajustes_clase?.[clase.id])) return null;
  async function refrescar() {
    const { data, error } = await supabase.from("bonos")
      .select("id,importe_pagado,numero_clases,ajustes_clase,estado_cobro").in("id", ids);
    if (error) throw new Error(`Descuento guardado. No se pudo actualizar la vista: ${error.message}`);
    setCargados(data || []); setRevision(r => r + 1);
    await onGuardado(data || []);
    setConfirmacion("Descuento guardado. El importe de la clase y el total del bono están actualizados.");
  }
  return <details onToggle={e => setAbierto(e.currentTarget.open)} className="my-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm">
    <summary className="cursor-pointer font-semibold text-[#17324D]">Descuento de esta clase en el bono
      {seleccion.map(b => b.ajustes_clase?.[clase.id]).filter(Boolean).map((a, i) =>
        <span key={i} className="mt-1 block text-xs font-normal text-amber-800">−{euros(Number(a!.descuento))} · {a!.motivo}</span>)}
    </summary>
    {confirmacion && <p role="status" className="mt-2 text-xs text-emerald-800">{confirmacion}</p>}
    <div className="mt-3 space-y-3">{abierto && seleccion.map(b => <Ajuste key={`${b.id}-${revision}`} clase={clase} bono={b} disabled={disabled} onGuardado={refrescar} />)}
      {mensaje && <p role="alert" className="text-red-700">{mensaje}</p>}
      {!seleccion.length && !mensaje && <p>Cargando bono…</p>}
    </div>
  </details>;
}
