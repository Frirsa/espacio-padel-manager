import type { Clase } from "./tipos";

export function formatearFecha(
  fecha: string
) {
  const [anio, mes, dia] =
    fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

export function calcularHorario(
  horaInicio: string,
  duracionMinutos: number
) {
  const [hora, minuto] =
    horaInicio
      .split(":")
      .map(Number);

  const inicio = new Date();

  inicio.setHours(
    hora,
    minuto,
    0,
    0
  );

  const fin = new Date(
    inicio.getTime() +
      duracionMinutos *
        60 *
        1000
  );

  const inicioTexto =
    `${String(
      inicio.getHours()
    ).padStart(2, "0")}:` +
    `${String(
      inicio.getMinutes()
    ).padStart(2, "0")} h`;

  const finTexto =
    `${String(
      fin.getHours()
    ).padStart(2, "0")}:` +
    `${String(
      fin.getMinutes()
    ).padStart(2, "0")} h`;

  return `${inicioTexto} a ${finTexto}`;
}

export function obtenerNombreMes(
  mes: string
) {
  const [anio, numeroMes] =
    mes.split("-").map(Number);

  const fecha = new Date(
    anio,
    numeroMes - 1,
    1
  );

  const texto =
    fecha.toLocaleDateString(
      "es-ES",
      {
        month: "long",
        year: "numeric",
      }
    );

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

export function obtenerNombreAlumnos(
  clase: Clase
) {
  return clase.clase_alumnos
    .map(
      (participante) =>
        participante.alumnos
    )
    .filter(Boolean)
    .map(
      (alumno) =>
        `${alumno?.nombre || ""} ${
          alumno?.apellidos || ""
        }`.trim()
    )
    .join(", ");
}