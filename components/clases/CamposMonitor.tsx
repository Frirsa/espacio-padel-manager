"use client";

import Link from "next/link";
import type { Monitor } from "../../lib/monitores";

type Props = {
  monitores: Monitor[]; nombre: string; coste: string; pagado: boolean; fecha: string; metodo: string;
  onNombre: (v: string) => void; onCoste: (v: string) => void; onPagado: (v: boolean) => void;
  onFecha: (v: string) => void; onMetodo: (v: string) => void;
};
const campo = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17324D]";
export default function CamposMonitor(p: Props) {
  const nombres = [...new Set(["Fran", ...p.monitores.filter(m => m.activo).map(m => m.nombre), p.nombre].filter(Boolean))];
  return <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold text-[#17324D]">Monitor de la clase</h3><Link href="/monitores" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#008C83]">Gestionar monitores</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">Monitor<select required className={campo} value={p.nombre} onChange={e => { p.onNombre(e.target.value); if (e.target.value === "Fran") { p.onCoste("0"); p.onPagado(false); } }}>
        {nombres.map(n => <option key={n} value={n}>{n}{n === "Fran" ? " (predeterminado)" : ""}</option>)}
      </select></label>
      <label className="text-sm">Coste del monitor por clase (€)<input className={campo} type="number" min="0" step="0.01" required value={p.coste} onChange={e => p.onCoste(e.target.value)} /></label>
      <label className="text-sm">Pago al monitor<select className={campo} value={p.pagado ? "pagado" : "pendiente"} onChange={e => p.onPagado(e.target.value === "pagado")}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></label>
      {p.pagado && <>
        <label className="text-sm">Fecha de pago al monitor<input required className={campo} type="date" value={p.fecha} onChange={e => p.onFecha(e.target.value)} /></label>
        <label className="text-sm">Método de pago al monitor<select className={campo} value={p.metodo} onChange={e => p.onMetodo(e.target.value)}>{["efectivo", "bizum", "transferencia", "tarjeta"].map(m => <option key={m}>{m}</option>)}</select></label>
      </>}
    </div>
    <p className="mt-3 text-xs text-slate-500">El bono se descuenta al realizar la clase, también si la imparte otro monitor. El coste del monitor se incluye en los gastos de esa clase.</p>
  </section>;
}
