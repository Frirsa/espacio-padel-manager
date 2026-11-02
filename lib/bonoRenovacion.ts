export type BonoRenovacion = {
  clases_restantes: number;
  activo: boolean;
  resolucion_renovacion?: "cerrado" | "renovado" | null;
};

export function pendienteRenovacion(bono: BonoRenovacion): boolean {
  return bono.clases_restantes <= 0 && !bono.resolucion_renovacion;
}

export function proximoAgotarse(bono: BonoRenovacion): boolean {
  return bono.activo && bono.clases_restantes === 1 && !bono.resolucion_renovacion;
}

export function ultimaClaseBono(usos: readonly {
  usa_bono: boolean;
  clases: { fecha: string; estado: string; facturable: boolean } | null;
}[]): string | null {
  return usos.filter(u => u.usa_bono && u.clases &&
    (u.clases.estado === "realizada" || (u.clases.estado === "cancelada" && u.clases.facturable)))
    .map(u => u.clases!.fecha).sort().at(-1) || null;
}
