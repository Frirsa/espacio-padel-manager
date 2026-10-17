import { supabase } from "./supabase";

export type Monitor = { id: string; nombre: string; activo: boolean; predeterminado: boolean };

export async function cargarMonitores(): Promise<Monitor[]> {
  const { error: preparacion } = await supabase.rpc("preparar_monitores");
  if (preparacion) throw new Error("No se pudieron cargar los monitores. Comprueba que la actualización de la base de datos está aplicada.");
  const { data, error } = await supabase.from("monitores").select("id,nombre,activo,predeterminado").order("nombre");
  if (error) throw new Error(error.message);
  return (data || []) as Monitor[];
}
