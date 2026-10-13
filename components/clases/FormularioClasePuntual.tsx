"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { DatosClasePuntual } from "../../lib/clasesPuntuales";
import { sincronizarClaseConGoogleCalendar } from "../../lib/googleCalendarClient";
import { sincronizarParticipantesPuntuales } from "../../lib/participantesClasePuntual";

type Alumno = { id: string; nombre: string; apellidos: string | null; apodo?: string | null };
const nombreAlumno = (alumno: Alumno) => alumno.apodo?.trim() || [alumno.nombre, alumno.apellidos].filter(Boolean).join(" ");

type ClasePuntual = DatosClasePuntual & {
  id: string; fecha: string; hora_inicio: string; duracion_minutos: number;
  ubicacion_id: string | null; tipo: string; estado: string; facturable: boolean;
  cobrada: boolean; importe_total: number | null; coste_pista: number;
  motivo_cancelacion: string | null; observaciones: string | null;
  google_calendar_event_id: string | null;
  clase_alumnos?: { alumno_id: string }[];
};
type Pago = { clase_id: string | null; alumno_id: string | null; estado: string; metodo: string; fecha_pago?: string };
type Props = {
  clase: ClasePuntual | null;
  ubicaciones: { id: string; nombre: string; tipo: string; coste_pista: number | null }[];
  monitores: string[];
  alumnos: Alumno[];
  grupos: { id: string; nombre: string; grupo_alumnos: { alumno_id: string }[] }[];
  pagos: Pago[];
  fechaInicial?: string;
  horaInicial?: string;
  duracionInicial?: number;
  otroProfesor?: boolean;
  onCancelar: () => void;
  onGuardada: (aviso: string) => Promise<void>;
};
const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#17324D] outline-none focus:border-[#00A79C]";
const metodos = ["efectivo", "bizum", "transferencia", "tarjeta"];
function hoy() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

export default function FormularioClasePuntual({ clase, ubicaciones, monitores, alumnos, grupos, pagos, fechaInicial, horaInicial, duracionInicial, otroProfesor, onCancelar, onGuardada }: Props) {
  const pago = pagos.find(p => p.clase_id === clase?.id && p.alumno_id === null);
  const [nombre, setNombre] = useState(clase?.nombre_grupo_libre || "");
  const [seleccionados, setSeleccionados] = useState<string[]>(clase?.clase_alumnos?.map(p => p.alumno_id) || []);
  const [participantesRegistrados, setParticipantesRegistrados] = useState(Boolean(clase?.clase_alumnos?.length));
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [personas, setPersonas] = useState(String(clase?.numero_participantes || 4));
  const [fecha, setFecha] = useState(clase?.fecha || fechaInicial || hoy());
  const [hora, setHora] = useState(clase?.hora_inicio.slice(0,5) || horaInicial || "");
  const [duracion, setDuracion] = useState(String(clase?.duracion_minutos || duracionInicial || 60));
  const [ubicacion, setUbicacion] = useState(clase?.ubicacion_id || "");
  const [pista, setPista] = useState(clase?.pista_nombre || "");
  const [tipo, setTipo] = useState(clase?.tipo || "propia");
  const [monitor, setMonitor] = useState(clase?.monitor_nombre || (otroProfesor ? "" : "Fran"));
  const [importe, setImporte] = useState(String(clase?.importe_total ?? ""));
  const [costePista, setCostePista] = useState(String(clase?.coste_pista ?? 0));
  const [costeMonitor, setCosteMonitor] = useState(String(clase?.coste_monitor ?? 0));
  const [monitorPagado, setMonitorPagado] = useState(clase?.monitor_pagado || false);
  const [fechaMonitor, setFechaMonitor] = useState(clase?.fecha_pago_monitor || hoy());
  const [metodoMonitor, setMetodoMonitor] = useState(clase?.metodo_pago_monitor || "efectivo");
  const [cobrada, setCobrada] = useState(pago?.estado === "pagado" || clase?.cobrada || false);
  const [fechaCobro, setFechaCobro] = useState(pago?.fecha_pago?.slice(0,10) || hoy());
  const [metodo, setMetodo] = useState(pago?.metodo || "efectivo");
  const [estado, setEstado] = useState(clase?.estado || "programada");
  const [facturable, setFacturable] = useState(clase?.facturable !== false);
  const [motivo, setMotivo] = useState(clase?.motivo_cancelacion || "");
  const [observaciones, setObservaciones] = useState(clase?.observaciones || "");
  const guardandoRef = useRef(false);
  const claseGuardadaId = useRef(clase?.id || null);
  const requiereSincronizarAlumnos = useRef(Boolean(clase?.clase_alumnos?.length));
  const nombresSeleccionados = alumnos.filter(a => seleccionados.includes(a.id)).map(nombreAlumno);
  const alumnosVisibles = alumnos.filter(a => `${a.nombre} ${a.apellidos || ""} ${a.apodo || ""}`.toLocaleLowerCase().includes(busquedaAlumno.trim().toLocaleLowerCase()));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); if (guardandoRef.current) return;
    guardandoRef.current = true;
    setError(""); setGuardando(true);
    try {
      if (participantesRegistrados && !seleccionados.length) throw new Error("Selecciona al menos un alumno registrado.");
      if (participantesRegistrados && nombresSeleccionados.length !== seleccionados.length) throw new Error("No se han podido cargar todos los alumnos seleccionados. Actualiza la lista antes de guardar.");
      const nombreClase = nombre.trim() || (participantesRegistrados ? nombresSeleccionados.join(" · ") : "");
      if (!nombreClase) throw new Error("Escribe un nombre o concepto para esta clase puntual.");
      const datos = {
        nombre_grupo_libre: nombreClase, numero_participantes: participantesRegistrados ? seleccionados.length : Number(personas),
        fecha, hora_inicio: hora, duracion_minutos: Number(duracion), ubicacion_id: ubicacion || null,
        pista_nombre: pista.trim() || null, tipo, monitor_nombre: monitor.trim(),
        importe_total: Number(importe), coste_pista: Number(costePista), coste_monitor: Number(costeMonitor),
        monitor_pagado: monitorPagado, fecha_pago_monitor: monitorPagado ? fechaMonitor : null,
        metodo_pago_monitor: monitorPagado ? metodoMonitor : null,
        cobrada, metodo_cobro: metodo, fecha_cobro: fechaCobro,
        estado, facturable: estado === "cancelada" ? facturable : true,
        motivo_cancelacion: estado === "cancelada" ? motivo.trim() : null,
        observaciones: observaciones.trim() || null,
      };
      const { data: id, error: fallo } = await supabase.rpc("guardar_clase_puntual", { p_clase_id: claseGuardadaId.current, p_datos: datos });
      if (fallo || !id) throw new Error(fallo?.message || "No se ha podido guardar la clase");
      claseGuardadaId.current = String(id);
      try {
        if (participantesRegistrados) requiereSincronizarAlumnos.current = true;
        if (requiereSincronizarAlumnos.current) {
          await sincronizarParticipantesPuntuales(supabase, String(id), participantesRegistrados ? seleccionados : [], cobrada && (estado !== "cancelada" || facturable));
          requiereSincronizarAlumnos.current = participantesRegistrados;
        }
      } catch (e) {
        throw new Error(`La clase se ha guardado, pero falta completar la selección de alumnos. ${e instanceof Error ? e.message : "Error de conexión."} Vuelve a guardar para completar esta misma clase.`);
      }
      let aviso = "Clase puntual guardada.";
      try {
        const u = ubicaciones.find(u => u.id === ubicacion);
        await sincronizarClaseConGoogleCalendar({
          id: String(id), google_calendar_event_id: clase?.google_calendar_event_id || null,
          fecha, hora_inicio: hora, duracion_minutos: Number(duracion), tipo, estado,
          alumnos: participantesRegistrados ? nombresSeleccionados : [nombreClase], ubicacion: u?.nombre || null, tipo_ubicacion: u?.tipo || null,
          observaciones: [`Monitor: ${monitor.trim()}`, pista.trim() ? `Pista: ${pista.trim()}` : "", observaciones.trim(), estado === "cancelada" ? `Cancelación: ${motivo.trim()}` : ""].filter(Boolean).join("\n"),
        });
      } catch { aviso += " No se ha podido sincronizar con Google Calendar."; }
      await onGuardada(aviso);
    } catch (e) { setError(e instanceof Error ? e.message : "No se ha podido guardar la clase"); }
    finally { guardandoRef.current = false; setGuardando(false); }
  }

  return <form onSubmit={guardar} className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="rounded-xl bg-[#0F2742] p-4 text-white"><h2 className="text-xl font-bold">{clase ? "Editar clase puntual" : "Nueva clase puntual"}</h2><p className="mt-1 text-sm text-white/70">Escribe un nombre o concepto libre, o selecciona alumnos registrados.</p></div>
    <fieldset disabled={guardando} className="mt-4 space-y-5">
      {otroProfesor && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Indica el profesor que dará esta clase. La no disponibilidad personal se aplica a Fran; otro profesor puede impartirla durante ese periodo.</p>}
      <section><h3 className="mb-3 font-bold text-[#17324D]">Participantes</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={participantesRegistrados} onClick={() => setParticipantesRegistrados(true)} className={`rounded-xl border px-4 py-2 text-sm ${participantesRegistrados ? "border-[#00A79C] bg-[#E8F7F5] text-[#008C83]" : "border-slate-200"}`}>Alumnos registrados</button>
          <button type="button" aria-pressed={!participantesRegistrados} onClick={() => setParticipantesRegistrados(false)} className={`rounded-xl border px-4 py-2 text-sm ${!participantesRegistrados ? "border-[#00A79C] bg-[#E8F7F5] text-[#008C83]" : "border-slate-200"}`}>Nombre o concepto libre</button>
        </div>
        {!participantesRegistrados && <p className="mt-3 text-sm text-slate-600">Puedes escribir el nombre de un grupo, de una persona o un concepto como «Alquiler de pista». No necesitas seleccionar ni dar de alta alumnos.</p>}
        {participantesRegistrados && <div className="mt-3 space-y-3">
          <label className="block text-sm">Seleccionar un grupo existente<select className={input} value="" onChange={e => { const grupo = grupos.find(g => g.id === e.target.value); if (grupo) { setSeleccionados([...new Set(grupo.grupo_alumnos.map(p => p.alumno_id))]); setNombre(grupo.nombre); } }}><option value="">Elegir grupo...</option>{grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select></label>
          <label className="block text-sm">Buscar alumno<input className={input} value={busquedaAlumno} onChange={e => setBusquedaAlumno(e.target.value)} placeholder="Nombre, apellidos o apodo" /></label>
          <p className="text-sm text-slate-600">{seleccionados.length} alumnos seleccionados{nombresSeleccionados.length ? `: ${nombresSeleccionados.join(" · ")}` : ""}</p>
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 p-3">
            {alumnosVisibles.map(a => <label key={a.id} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm"><input type="checkbox" checked={seleccionados.includes(a.id)} onChange={e => setSeleccionados(actuales => e.target.checked ? [...actuales, a.id] : actuales.filter(id => id !== a.id))} />{nombreAlumno(a)}</label>)}
            {!alumnosVisibles.length && <p className="text-sm text-slate-500">No hay alumnos que coincidan con la búsqueda.</p>}
          </div>
          <p className="text-xs text-slate-500">El precio y el cobro corresponden a la clase completa. Los alumnos seleccionados quedan vinculados a su historial.</p>
        </div>}
      </section>
      <section><h3 className="mb-3 font-bold text-[#17324D]">Grupo y horario</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">{participantesRegistrados ? "Nombre de la clase (opcional)" : "Nombre o concepto"}<input className={input} required={!participantesRegistrados} maxLength={200} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder={participantesRegistrados ? "Se usará el nombre de los alumnos" : "Nombre de grupo, persona o concepto"} /></label>
        <label className="text-sm">Número de participantes<input className={input} type="number" min="1" step="1" required readOnly={participantesRegistrados} value={participantesRegistrados ? seleccionados.length : personas} onChange={e=>setPersonas(e.target.value)} /></label>
        <label className="text-sm">Monitor<input className={input} required maxLength={200} list="monitores-puntuales" value={monitor} onChange={e=>setMonitor(e.target.value)} placeholder="Nombre del monitor" /><datalist id="monitores-puntuales">{[...new Set(["Fran",...monitores])].map(m=><option key={m} value={m}/>)}</datalist></label>
        <label className="text-sm">Fecha<input className={input} type="date" required value={fecha} onChange={e=>setFecha(e.target.value)}/></label>
        <label className="text-sm">Hora<input className={input} type="time" required value={hora} onChange={e=>setHora(e.target.value)}/></label>
        <label className="text-sm">Duración (minutos)<input className={input} type="number" min="1" step="1" required value={duracion} onChange={e=>setDuracion(e.target.value)}/></label>
        <label className="text-sm">Ubicación<select className={input} value={ubicacion} onChange={e=>{setUbicacion(e.target.value);setCostePista(String(ubicaciones.find(u=>u.id===e.target.value)?.coste_pista || 0));}}><option value="">Sin ubicación</option>{ubicaciones.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</select></label>
        <label className="text-sm">Pista<input className={input} value={pista} onChange={e=>setPista(e.target.value)} placeholder="Pista 1"/></label>
        <label className="text-sm">Tipo<select className={input} value={tipo} onChange={e=>setTipo(e.target.value)}><option value="propia">Clase propia en pista de pago</option><option value="privada">Clase propia en pista privada</option></select></label>
      </div></section>
      <section><h3 className="mb-3 font-bold text-[#17324D]">Cobro de la clase y gastos</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">Importe total de la clase (€)<input className={input} type="number" min="0" step="0.01" required value={importe} onChange={e=>setImporte(e.target.value)}/></label>
        <label className="text-sm">Estado del cobro<select className={input} value={cobrada ? "pagado" : "pendiente"} onChange={e=>setCobrada(e.target.value==="pagado")}><option value="pendiente">Pendiente de cobro</option><option value="pagado">Cobrado</option></select></label>
        <label className="text-sm">Método de cobro<select className={input} value={metodo} onChange={e=>setMetodo(e.target.value)}>{metodos.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</select></label>
        {cobrada && <label className="text-sm">Fecha de cobro<input className={input} type="date" required value={fechaCobro} onChange={e=>setFechaCobro(e.target.value)}/></label>}
        <label className="text-sm">Coste de pista (€)<input className={input} type="number" min="0" step="0.01" required value={costePista} onChange={e=>setCostePista(e.target.value)}/></label>
        <label className="text-sm">Coste del monitor (€)<input className={input} type="number" min="0" step="0.01" required value={costeMonitor} onChange={e=>setCosteMonitor(e.target.value)}/></label>
        <label className="text-sm">Pago al monitor<select className={input} value={monitorPagado ? "pagado" : "pendiente"} onChange={e=>setMonitorPagado(e.target.value==="pagado")}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></label>
        {monitorPagado && <><label className="text-sm">Fecha de pago al monitor<input className={input} type="date" required value={fechaMonitor} onChange={e=>setFechaMonitor(e.target.value)}/></label><label className="text-sm">Método de pago al monitor<select className={input} value={metodoMonitor} onChange={e=>setMetodoMonitor(e.target.value)}>{metodos.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</select></label></>}
      </div><p className="mt-3 text-xs text-slate-500">El coste del monitor se descuenta del resultado cuando la clase se realiza, aunque esté pendiente de pago.</p></section>
      <section><h3 className="mb-3 font-bold text-[#17324D]">Estado y observaciones</h3><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Estado de la clase<select className={input} value={estado} onChange={e=>setEstado(e.target.value)}><option value="programada">Programada</option><option value="realizada">Realizada</option><option value="cancelada">Cancelada</option></select></label>
        {estado === "cancelada" && <><label className="text-sm">Cobro de la cancelación<select className={input} value={facturable ? "si" : "no"} onChange={e=>setFacturable(e.target.value==="si")}><option value="si">Se cobra</option><option value="no">No se cobra</option></select></label><label className="text-sm sm:col-span-2">Motivo de cancelación<input className={input} required value={motivo} onChange={e=>setMotivo(e.target.value)}/></label></>}
        <label className="text-sm sm:col-span-2">Observaciones<textarea className={input} rows={4} value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Nombres de los participantes y otras notas..."/></label>
      </div></section>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancelar} className="rounded-xl border px-4 py-2.5 text-sm">Cancelar</button><button type="submit" className="rounded-xl bg-[#00A79C] px-4 py-2.5 text-sm font-bold text-white">{guardando ? "Guardando…" : "Guardar clase puntual"}</button></div>
    </fieldset>
  </form>;
}
