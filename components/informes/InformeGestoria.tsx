"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  construirInformeGestoria,
  type BonoGestoria,
  type ClaseGestoria,
  type CobroBonoGestoria,
  type PagoGestoria,
} from "../../lib/informe-gestoria";

const euros = (n: number) => new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR",
}).format(n);
const fecha = (valor: string | null) => valor
  ? valor.split("-").reverse().join("/") : "—";

export default function InformeGestoria({ mes }: { mes: string }) {
  const [clases, setClases] = useState<ClaseGestoria[]>([]);
  const [pagos, setPagos] = useState<PagoGestoria[]>([]);
  const [bonos, setBonos] = useState<BonoGestoria[]>([]);
  const [cobrosBonos, setCobrosBonos] = useState<CobroBonoGestoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const [anio, numeroMes] = mes.split("-").map(Number);
        if (!anio || !numeroMes || numeroMes < 1 || numeroMes > 12) throw new Error("Mes no válido");
        const inicio = `${mes}-01`;
        const siguiente = new Date(anio, numeroMes, 1);
        const fin = `${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, "0")}-01`;
        const { data: clasesData, error: errorClases } = await supabase.from("clases")
          .select(`id,fecha,hora_inicio,tipo,estado,facturable,cobrada,importe_club,coste_pista,ingreso_extra,modo_cobro,importe_total,metodo_cobro_club,fecha_cobro_club,
            ubicaciones(nombre),
            clase_alumnos(alumno_id,importe,pagado,usa_bono,bono_id,alumnos(nombre,apellidos))`)
          .gte("fecha", inicio).lt("fecha", fin)
          .order("fecha", { ascending: true }).order("hora_inicio", { ascending: true });
        if (errorClases) throw errorClases;
        const clasesMes = (clasesData || []) as unknown as ClaseGestoria[];
        const ids = clasesMes.map((c) => c.id);
        const bonoIds = [...new Set(clasesMes.flatMap((c) => c.clase_alumnos || [])
          .filter((p) => p.usa_bono && p.bono_id).map((p) => p.bono_id as string))];
        const pagosMes: PagoGestoria[] = [];
        const bonosMes: BonoGestoria[] = [];
        const cobrosMes: CobroBonoGestoria[] = [];
        for (let i = 0; i < ids.length; i += 100) {
          const { data, error: err } = await supabase.from("pagos")
            .select("id,clase_id,alumno_id,importe,estado,metodo,fecha_pago")
            .in("clase_id", ids.slice(i, i + 100));
          if (err) throw err;
          pagosMes.push(...((data || []) as PagoGestoria[]));
        }
        for (let i = 0; i < bonoIds.length; i += 100) {
          const lote = bonoIds.slice(i, i + 100);
          const [resultadoBonos, resultadoCobros] = await Promise.all([
            supabase.from("bonos").select("id,estado_cobro,metodo_cobro").in("id", lote),
            supabase.from("bono_cobros").select("bono_id,estado,metodo_cobro").in("bono_id", lote),
          ]);
          if (resultadoBonos.error) throw resultadoBonos.error;
          if (resultadoCobros.error) throw resultadoCobros.error;
          bonosMes.push(...((resultadoBonos.data || []) as BonoGestoria[]));
          cobrosMes.push(...((resultadoCobros.data || []) as CobroBonoGestoria[]));
        }
        if (vigente) {
          setClases(clasesMes);
          setPagos(pagosMes);
          setBonos(bonosMes);
          setCobrosBonos(cobrosMes);
        }
      } catch (e) {
        if (vigente) setError(e instanceof Error ? e.message : "No se pudo cargar el informe");
      } finally {
        if (vigente) setCargando(false);
      }
    }
    cargar();
    return () => { vigente = false; };
  }, [mes]);

  const informe = useMemo(() => construirInformeGestoria(clases, pagos, bonos, cobrosBonos),
    [clases, pagos, bonos, cobrosBonos]);

  async function descargarPdf() {
    try {
      setGenerando(true);
      const { generarPdfGestoria } = await import("./generarPdfGestoria");
      generarPdfGestoria(mes, informe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el PDF");
    } finally {
      setGenerando(false);
    }
  }

  if (cargando) return <p className="p-6 text-sm text-slate-500">Cargando detalle mensual...</p>;
  if (error) return <p className="p-6 text-sm text-red-700">Error: {error}</p>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold text-[#17324D]">Detalle mensual para gestoría</h3>
        <p className="mt-1 text-sm text-slate-600">Importes asignados a la fecha de cada clase. Los bonos se imputan por clase consumida, sin sumar de nuevo su compra.</p>
      </div>
      <button type="button" onClick={descargarPdf} disabled={generando}
        className="rounded-xl bg-[#17324D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {generando ? "Generando..." : "Descargar PDF"}
      </button>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {([ ["Cobrado directamente", informe.cobrado], ["Bono imputado", informe.bonoImputado], ["Pendiente de cobro", informe.pendiente],
        ["Cobro por revisar", informe.porRevisar], ["Costes de pista", informe.totalGastos] ] as const).map(([titulo, total]) =>
        <div key={titulo} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-600">{titulo}</p>
          <p className="mt-2 text-xl font-bold text-[#17324D]">{euros(total)}</p>
        </div>)}
    </div>

    <section>
      <h4 className="mb-3 text-lg font-bold text-[#17324D]">Clases e ingresos</h4>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[870px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600"><tr>
            <th className="p-3">Clase</th><th className="p-3">Ubicación</th><th className="p-3">Alumno / concepto</th>
            <th className="p-3 text-right">Importe</th><th className="p-3">Estado</th><th className="p-3">Forma</th><th className="p-3">Fecha de cobro</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {informe.ingresos.map((linea) => <tr key={linea.id}>
              <td className="p-3 whitespace-nowrap">{fecha(linea.fecha)} · {linea.hora.slice(0, 5)}</td>
              <td className="p-3">{linea.ubicacion}</td><td className="p-3">{linea.concepto}</td>
              <td className="p-3 text-right font-semibold whitespace-nowrap">{euros(linea.importe)}</td>
              <td className="p-3">{linea.estado}</td><td className="p-3">{linea.metodo}</td><td className="p-3">{fecha(linea.fechaCobro)}</td>
            </tr>)}
            {!informe.ingresos.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No hay clases con importe en este mes.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h4 className="mb-3 text-lg font-bold text-[#17324D]">Costes de pista por ubicación</h4>
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {informe.gastosPorUbicacion.map((g) => <span key={g.ubicacion}
          className="rounded-lg bg-slate-100 px-3 py-2 text-[#17324D]">
          {g.ubicacion}: <strong>{euros(g.total)}</strong>
        </span>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[550px] text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600"><tr>
            <th className="p-3">Fecha de clase</th><th className="p-3">Ubicación</th><th className="p-3 text-right">Coste registrado</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {informe.gastos.map((g) => <tr key={g.id}><td className="p-3">{fecha(g.fecha)} · {g.hora.slice(0, 5)}</td>
              <td className="p-3">{g.ubicacion}</td><td className="p-3 text-right font-semibold">{euros(g.importe)}</td></tr>)}
            {!informe.gastos.length && <tr><td colSpan={3} className="p-6 text-center text-slate-500">No hay costes registrados este mes.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
    <p className="text-xs leading-5 text-slate-500">Los costes de pista se asignan a la fecha de la clase. La aplicación no registra si se pagaron ni guarda factura, base imponible o cuota de IVA. Revisa los justificantes con tu gestora antes de preparar la liquidación.</p>
  </div>;
}
