export type RepartoCobroBono = "conjunto" | "por_alumno";
export type CobroAgrupable = {
  id: string;
  importe: number;
  estado: string;
  metodo_cobro: string | null;
  fecha_cobro: string | null;
};

export function puedenUnificarseCobros(cobros: readonly CobroAgrupable[]) {
  const primero = cobros[0];
  return cobros.length > 1 && cobros.every(c => c.estado === primero.estado &&
    c.metodo_cobro === primero.metodo_cobro && c.fecha_cobro === primero.fecha_cobro);
}

export function prepararCobrosInicialesBono({ bonoId, importe, integrantes, reparto, estado, metodo, fecha }: {
  bonoId: string; importe: number; integrantes: string[]; reparto: RepartoCobroBono;
  estado: "pagado" | "pendiente"; metodo: string; fecha: string;
}) {
  if (!Number.isFinite(importe) || importe < 0) throw new Error("Importe de bono inválido");
  const centimos = Math.round(importe * 100);
  if (!centimos) return [];
  const ids = [...new Set(integrantes.filter(Boolean))].sort();
  const partes: { alumno_id: string | null; importe: number }[] = reparto === "por_alumno" && ids.length > 1
    ? ids.map((id, i) => ({ alumno_id: id,
        importe: (Math.floor(centimos / ids.length) + (i < centimos % ids.length ? 1 : 0)) / 100 }))
    : [{ alumno_id: null, importe: centimos / 100 }];
  return partes.map(parte => ({ ...parte, bono_id: bonoId, estado,
    metodo_cobro: estado === "pagado" ? metodo : null,
    fecha_cobro: estado === "pagado" ? fecha : null }));
}
