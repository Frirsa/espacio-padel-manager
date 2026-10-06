export type DatosClasePuntual = {
  nombre_grupo_libre?: string | null;
  numero_participantes?: number | null;
  pista_nombre?: string | null;
  monitor_nombre?: string | null;
  coste_monitor?: number | string | null;
  monitor_pagado?: boolean | null;
  fecha_pago_monitor?: string | null;
  metodo_pago_monitor?: string | null;
};

export function detalleClasePuntual(clase: DatosClasePuntual) {
  return [
    clase.numero_participantes ? `${clase.numero_participantes} personas` : "",
    clase.pista_nombre?.trim() ? `Pista: ${clase.pista_nombre.trim()}` : "",
    clase.monitor_nombre?.trim() ? `Monitor: ${clase.monitor_nombre.trim()}` : "",
  ].filter(Boolean).join(" · ");
}
