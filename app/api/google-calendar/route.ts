import { createSign } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const TIME_ZONE = "Europe/Madrid";

type ClaseGoogle = {
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

function base64Url(valor: string | Buffer) {
  const buffer = Buffer.isBuffer(valor)
    ? valor
    : Buffer.from(valor, "utf8");

  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function comprobarUsuario(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return false;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  const respuesta = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      apikey: supabaseKey,
    },
    cache: "no-store",
  });

  return respuesta.ok;
}

async function obtenerAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const claveOriginal = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !claveOriginal) {
    throw new Error("Faltan las credenciales de Google Calendar en Vercel.");
  }

  const clavePrivada = claveOriginal.replace(/\\n/g, "\n");
  const ahora = Math.floor(Date.now() / 1000);

  const cabecera = base64Url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    })
  );

  const contenido = base64Url(
    JSON.stringify({
      iss: email,
      scope: GOOGLE_CALENDAR_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: ahora,
      exp: ahora + 3600,
    })
  );

  const sinFirmar = `${cabecera}.${contenido}`;
  const firmador = createSign("RSA-SHA256");
  firmador.update(sinFirmar);
  firmador.end();

  const firma = base64Url(
    firmador.sign(clavePrivada)
  );

  const assertion = `${sinFirmar}.${firma}`;

  const respuesta = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.access_token) {
    throw new Error(
      datos.error_description ||
        datos.error ||
        "Google no ha aceptado las credenciales de la cuenta de servicio."
    );
  }

  return datos.access_token as string;
}

function sumarMinutos(
  fecha: string,
  hora: string,
  minutos: number
) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [horas, mins] = hora.slice(0, 5).split(":").map(Number);

  const valor = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
      horas,
      mins + Number(minutos || 0),
      0
    )
  );

  const y = valor.getUTCFullYear();
  const m = String(valor.getUTCMonth() + 1).padStart(2, "0");
  const d = String(valor.getUTCDate()).padStart(2, "0");
  const h = String(valor.getUTCHours()).padStart(2, "0");
  const min = String(valor.getUTCMinutes()).padStart(2, "0");

  return `${y}-${m}-${d}T${h}:${min}:00`;
}

function nombreTipo(tipo: string) {
  if (tipo === "club") return "Clase para club";
  if (tipo === "privada") return "Pista privada";
  return "Clase propia";
}

function colorGoogle(clase: ClaseGoogle) {
  if (clase.estado === "cancelada") return "11"; // rojo
  if (clase.tipo === "club") return "6"; // naranja
  if (clase.tipo === "privada") return "3"; // violeta
  return "7"; // turquesa / peacock
}

function crearEvento(clase: ClaseGoogle) {
  const alumnos = (clase.alumnos || []).filter(Boolean);
  const nombres = alumnos.length > 0 ? alumnos.join(", ") : "Sin alumnos";
  const prefijo = clase.estado === "cancelada" ? "CANCELADA · " : "";
  const tipo = nombreTipo(clase.tipo);
  const hora = clase.hora_inicio.slice(0, 5);

  const descripcion = [
    "Sincronizado desde Espacio Pádel Manager",
    `Tipo: ${tipo}`,
    `Estado: ${clase.estado}`,
    `Alumnos: ${nombres}`,
    clase.observaciones ? `Observaciones: ${clase.observaciones}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `${prefijo}${tipo} · ${nombres}`,
    description: descripcion,
    location: clase.ubicacion || undefined,
    colorId: colorGoogle(clase),
    start: {
      dateTime: `${clase.fecha}T${hora}:00`,
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: sumarMinutos(
        clase.fecha,
        hora,
        Number(clase.duracion_minutos || 60)
      ),
      timeZone: TIME_ZONE,
    },
    extendedProperties: {
      private: {
        espacioPadelManagerClaseId: clase.id,
      },
    },
  };
}

async function llamarGoogle(
  url: string,
  accessToken: string,
  opciones: RequestInit
) {
  return fetch(url, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(opciones.headers || {}),
    },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  try {
    const usuarioValido = await comprobarUsuario(request);

    if (!usuarioValido) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return NextResponse.json(
        { error: "Falta GOOGLE_CALENDAR_ID en Vercel." },
        { status: 500 }
      );
    }

    const cuerpo = await request.json();
    const accion = cuerpo?.accion as "upsert" | "delete";
    const clase = cuerpo?.clase as ClaseGoogle | undefined;

    if (!clase?.id) {
      return NextResponse.json(
        { error: "Faltan los datos de la clase." },
        { status: 400 }
      );
    }

    const accessToken = await obtenerAccessToken();
    const calendario = encodeURIComponent(calendarId);

    if (accion === "delete") {
      const eventId = clase.google_calendar_event_id;

      if (!eventId) {
        return NextResponse.json({ ok: true, eliminado: false });
      }

      const respuesta = await llamarGoogle(
        `${GOOGLE_CALENDAR_API}/calendars/${calendario}/events/${encodeURIComponent(
          eventId
        )}`,
        accessToken,
        { method: "DELETE" }
      );

      if (respuesta.status === 404 || respuesta.status === 410) {
        return NextResponse.json({ ok: true, eliminado: false });
      }

      if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(`Google Calendar no pudo borrar el evento. ${texto}`);
      }

      return NextResponse.json({ ok: true, eliminado: true });
    }

    if (accion !== "upsert") {
      return NextResponse.json(
        { error: "Acción no válida." },
        { status: 400 }
      );
    }

    const evento = crearEvento(clase);
    let eventId = clase.google_calendar_event_id || null;

    if (eventId) {
      const respuestaActualizar = await llamarGoogle(
        `${GOOGLE_CALENDAR_API}/calendars/${calendario}/events/${encodeURIComponent(
          eventId
        )}?sendUpdates=none`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify(evento),
        }
      );

      if (respuestaActualizar.ok) {
        const actualizado = await respuestaActualizar.json();
        return NextResponse.json({
          ok: true,
          eventId: actualizado.id || eventId,
        });
      }

      if (
        respuestaActualizar.status !== 404 &&
        respuestaActualizar.status !== 410
      ) {
        const texto = await respuestaActualizar.text();
        throw new Error(
          `Google Calendar no pudo actualizar el evento. ${texto}`
        );
      }

      eventId = null;
    }

    const respuestaCrear = await llamarGoogle(
      `${GOOGLE_CALENDAR_API}/calendars/${calendario}/events?sendUpdates=none`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify(evento),
      }
    );

    const creado = await respuestaCrear.json();

    if (!respuestaCrear.ok || !creado.id) {
      throw new Error(
        creado?.error?.message ||
          "Google Calendar no pudo crear el evento."
      );
    }

    return NextResponse.json({
      ok: true,
      eventId: creado.id,
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: mensaje },
      { status: 500 }
    );
  }
}
