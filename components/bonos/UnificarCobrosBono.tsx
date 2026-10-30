"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { puedenUnificarseCobros, type CobroAgrupable } from "../../lib/bonoCobros";

export default function UnificarCobrosBono({ bonoId, cobros, disabled, onGuardado }: {
  bonoId: string; cobros: CobroAgrupable[]; disabled?: boolean; onGuardado: () => Promise<void>;
}) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  if (!puedenUnificarseCobros(cobros)) return null;
  const total = cobros.reduce((s,c) => s + Math.round(Number(c.importe) * 100), 0) / 100;
  async function unificar() {
    if (guardando || disabled) return;
    setGuardando(true); setMensaje("");
    try {
      const { error } = await supabase.rpc("unificar_cobros_bono", {
        p_bono_id: bonoId, p_cobro_ids: cobros.map(c => c.id), p_total_esperado: total,
      });
      if (error) throw new Error(error.message);
      await onGuardado();
      setMensaje("Pago conjunto registrado.");
    } catch (error) { setMensaje(error instanceof Error ? error.message : "No se pudo unificar el pago"); }
    finally { setGuardando(false); }
  }
  return <div className="my-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs leading-5 text-slate-600">Si estos importes corresponden a un único pago, puedes unificarlos. El total y el descuento de la clase se conservan.</p>
    <button type="button" disabled={guardando || disabled} onClick={unificar}
      className="mt-2 rounded-xl border border-[#00A79C] bg-white px-3 py-2 text-xs font-bold text-[#087F77] disabled:opacity-50">
      {guardando ? "Guardando…" : `Registrar como pago conjunto de ${total.toFixed(2)} €`}
    </button>
    {mensaje && <p role="status" className="mt-2 text-xs text-slate-700">{mensaje}</p>}
  </div>;
}
