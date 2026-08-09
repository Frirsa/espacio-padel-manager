import { supabase } from "./supabase";

export type ClaseGoogleCalendar = {
  id: string;
  google_calendar_event_id?: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  observaciones?: string | null;
  ubicacion?: string | null;
  alumnos?: string[];
};

async function llamarApiGoogle(
  accion: "upsert" | "delete",
  clase: ClaseGoogleCalendar
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay una sesión válida para sincronizar Google Calendar.");
  }

  const respuesta = await fetch("/api/google-calendar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ accion, clase }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos?.error || "No se pudo sincronizar con Google Calendar."
    );
  }

  return datos as {
    ok: boolean;
    eventId?: string;
    eliminado?: boolean;
  };
}

export async function sincronizarClaseConGoogleCalendar(
  clase: ClaseGoogleCalendar
) {
  const resultado = await llamarApiGoogle("upsert", clase);

  if (!resultado.eventId) {
    throw new Error("Google Calendar no devolvió el identificador del evento.");
  }

  const {
    error,
  } = await supabase
    .from("clases")
    .update({
      google_calendar_event_id: resultado.eventId,
      google_calendar_synced_at: new Date().toISOString(),
    })
    .eq("id", clase.id);

  if (error) {
    throw new Error(
      "El evento se creó en Google, pero no se pudo guardar su identificador en Manager."
    );
  }

  return resultado.eventId;
}

export async function borrarClaseDeGoogleCalendar(
  clase: Pick<
    ClaseGoogleCalendar,
    "id" | "google_calendar_event_id"
  >
) {
  if (!clase.google_calendar_event_id) {
    return;
  }

  await llamarApiGoogle("delete", {
    id: clase.id,
    google_calendar_event_id: clase.google_calendar_event_id,
    fecha: "",
    hora_inicio: "",
    duracion_minutos: 0,
    tipo: "",
    estado: "",
  });
}
