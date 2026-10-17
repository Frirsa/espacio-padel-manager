"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { cargarMonitores, type Monitor } from "../../lib/monitores";

export default function MonitoresPage() {
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function cargar() {
    try { setMonitores(await cargarMonitores()); }
    catch (e) { setMensaje(e instanceof Error ? e.message : "No se pudieron cargar los monitores."); }
  }
  useEffect(() => {
    let vigente = true;
    cargarMonitores().then(datos => { if (vigente) setMonitores(datos); })
      .catch(e => { if (vigente) setMensaje(e instanceof Error ? e.message : "No se pudieron cargar los monitores."); });
    return () => { vigente = false; };
  }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (ocupado || !nombre.trim()) return;
    setOcupado(true); setMensaje("");
    try {
      const { error } = await supabase.from("monitores").insert({ nombre: nombre.trim().replace(/\s+/g, " ") });
      if (error) throw new Error(error.code === "23505" ? "Ya existe un monitor con ese nombre." : error.message);
      setNombre(""); await cargar();
    } catch (e) { setMensaje(e instanceof Error ? e.message : "No se pudo crear el monitor."); }
    finally { setOcupado(false); }
  }
  async function cambiarActivo(m: Monitor) {
    if (ocupado) return;
    setOcupado(true); setMensaje("");
    try {
      const { error } = await supabase.from("monitores").update({ activo: !m.activo }).eq("id", m.id);
      if (error) throw new Error(error.message);
      await cargar();
    } catch (e) { setMensaje(e instanceof Error ? e.message : "No se pudo actualizar el monitor."); }
    finally { setOcupado(false); }
  }
  return <div className="mx-auto max-w-4xl p-4 sm:p-6">
    <header className="rounded-2xl bg-[#0F2742] p-6 text-white"><h1 className="text-2xl font-bold">Monitores</h1><p className="mt-2 text-sm text-white/70">Fran aparece por defecto al crear una clase. Puedes asignar otro monitor desde el formulario de clases.</p></header>
    <form onSubmit={crear} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5">
      <label className="min-w-48 flex-1 text-sm font-semibold">Nombre del monitor<input required maxLength={200} value={nombre} onChange={e => setNombre(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label>
      <button disabled={ocupado} className="rounded-xl bg-[#00A79C] px-5 py-2.5 font-bold text-white disabled:opacity-50">Añadir monitor</button>
    </form>
    {mensaje && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>}
    <div className="mt-5 space-y-3">{monitores.map(m => <article key={m.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><h2 className="font-bold text-[#17324D]">{m.nombre}</h2><p className="text-sm text-slate-500">{m.predeterminado ? "Monitor predeterminado" : m.activo ? "Activo" : "Inactivo"}</p></div>{!m.predeterminado && <button disabled={ocupado} onClick={() => cambiarActivo(m)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">{m.activo ? "Desactivar" : "Activar"}</button>}</article>)}</div>
    <p className="mt-4 text-sm text-slate-500">Desactivar un monitor conserva sus clases y gastos. Los nombres de los monitores de clases anteriores se incorporan al abrir este apartado por primera vez.</p>
  </div>;
}
