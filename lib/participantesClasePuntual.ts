import type { SupabaseClient } from "@supabase/supabase-js";

// El precio y el cobro pertenecen a la clase completa. Estas relaciones
// identifican a los alumnos y permiten consultar su historial.
export async function sincronizarParticipantesPuntuales(
  cliente: SupabaseClient,
  claseId: string,
  alumnosIds: string[],
  pagado: boolean,
) {
  const ids = [...new Set(alumnosIds)];
  const { data, error } = await cliente.from("clase_alumnos")
    .select("alumno_id").eq("clase_id", claseId);
  if (error) throw new Error(`No se pudieron consultar los alumnos de la clase: ${error.message}`);
  const actuales = (data || []) as { alumno_id: string }[];
  const actualesIds = new Set(actuales.map(p => p.alumno_id));
  const nuevos = ids.filter(id => !actualesIds.has(id));
  const retirados = actuales.filter(p => !ids.includes(p.alumno_id)).map(p => p.alumno_id);

  // Añadir antes de retirar conserva los participantes anteriores si falla
  // una inserción. Consultar de nuevo en cada intento evita duplicados.
  if (nuevos.length) {
    const { error } = await cliente.from("clase_alumnos").insert(nuevos.map(alumno_id => ({
      clase_id: claseId, alumno_id, importe: 0, pagado,
      usa_bono: false, bono_id: null, asistio: true,
    })));
    if (error) throw new Error(`No se pudieron añadir los alumnos: ${error.message}`);
  }
  if (retirados.length) {
    const { error } = await cliente.from("clase_alumnos").delete()
      .eq("clase_id", claseId).in("alumno_id", retirados);
    if (error) throw new Error(`No se pudieron retirar los alumnos: ${error.message}`);
  }
  if (ids.length) {
    const { error } = await cliente.from("clase_alumnos").update({ pagado })
      .eq("clase_id", claseId).in("alumno_id", ids);
    if (error) throw new Error(`No se pudo actualizar el estado de los alumnos: ${error.message}`);
  }
}
