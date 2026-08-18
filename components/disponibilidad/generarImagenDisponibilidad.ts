"use client";

type SeleccionSemana = Record<string, string[]>;

type HorarioParaImagen = {
  nombre: string;
  semana_inicio: string;
  seleccion: SeleccionSemana;
};

type ImagenBase = {
  imagen: HTMLImageElement;
  url: string;
};

const ANCHO = 1065;
const ALTO = 1379;

const COLORES = {
  azul: "#17324D",
  turquesa: "#00A79C",
  gris: "#B2B3B3",
  negro: "#2E2E2E",
  blanco: "#FFFFFF",
};

function fechaLocal(fechaIso: string) {
  const [anio, mes, dia] =
    fechaIso.split("-").map(Number);

  return new Date(
    anio,
    mes - 1,
    dia
  );
}

function fechaISO(fecha: Date) {
  const y = fecha.getFullYear();
  const m = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");
  const d = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function diasDeSemana(
  semanaInicio: string
) {
  const lunes =
    fechaLocal(
      semanaInicio
    );

  const nombresEs = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const nombresEn = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return Array.from(
    { length: 7 },
    (_, indice) => {
      const fecha =
        new Date(lunes);

      fecha.setDate(
        lunes.getDate() +
          indice
      );

      return {
        iso:
          fechaISO(fecha),

        es:
          nombresEs[
            indice
          ],

        en:
          nombresEn[
            indice
          ],

        fecha:
          `${String(
            fecha.getDate()
          ).padStart(
            2,
            "0"
          )}/${String(
            fecha.getMonth() +
              1
          ).padStart(
            2,
            "0"
          )}`,
      };
    }
  );
}

async function cargarImagen(
  url: string
) {
  return await new Promise<HTMLImageElement>(
    (
      resolve,
      reject
    ) => {
      const imagen =
        new Image();

      imagen.onload =
        () =>
          resolve(
            imagen
          );

      imagen.onerror =
        () =>
          reject(
            new Error(
              `No se pudo cargar ${url}`
            )
          );

      imagen.src =
        url;
    }
  );
}

async function cargarImagenBase(
  nombre: string
): Promise<ImagenBase> {
  const candidatos = [
    `/${nombre}.png`,
    `/${nombre}.jpg`,
    `/${nombre}.jpeg`,
    `/${nombre}.webp`,
  ];

  for (
    const url
    of candidatos
  ) {
    try {
      const imagen =
        await cargarImagen(
          url
        );

      return {
        imagen,
        url,
      };
    } catch {}
  }

  throw new Error(
    `No encuentro la imagen "${nombre}" en la carpeta public.`
  );
}

function ajustarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number,
  tamanoInicial: number,
  tamanoMinimo: number
) {
  let tamano =
    tamanoInicial;

  while (
    tamano >
    tamanoMinimo
  ) {
    ctx.font =
      `900 ${tamano}px "Arial Black", Arial, Helvetica, sans-serif`;

    if (
      ctx.measureText(
        texto
      ).width <=
      anchoMaximo
    ) {
      return tamano;
    }

    tamano -= 1;
  }

  return tamanoMinimo;
}

function dividirHoras(
  ctx: CanvasRenderingContext2D,
  horas: string[],
  anchoMaximo: number
) {
  let tamano =
    29;

  while (
    tamano >= 20
  ) {
    ctx.font =
      `900 ${tamano}px "Arial Black", Arial, Helvetica, sans-serif`;

    const lineas:
      string[] = [];

    let actual =
      "";

    for (
      const hora
      of horas
    ) {
      const fragmento =
        `${hora} h`;

      const candidata =
        actual
          ? `${actual}, ${fragmento}`
          : fragmento;

      if (
        actual &&
        ctx.measureText(
          candidata
        ).width >
          anchoMaximo
      ) {
        lineas.push(
          actual
        );

        actual =
          fragmento;
      } else {
        actual =
          candidata;
      }
    }

    if (actual) {
      lineas.push(
        actual
      );
    }

    if (
      lineas.length <=
      2
    ) {
      return {
        tamano,
        lineas,
      };
    }

    tamano -= 1;
  }

  return {
    tamano: 20,
    lineas: [
      horas
        .map(
          (hora) =>
            `${hora} h`
        )
        .join(", "),
    ],
  };
}

function descargarCanvas(
  canvas: HTMLCanvasElement,
  nombreArchivo: string
) {
  const enlace =
    document.createElement(
      "a"
    );

  enlace.download =
    nombreArchivo;

  enlace.href =
    canvas.toDataURL(
      "image/png",
      1
    );

  enlace.click();
}

export async function generarImagenDisponibilidad(
  horario: HorarioParaImagen
) {
  const [
    cabeceraBase,
    pieBase,
  ] =
    await Promise.all([
      cargarImagenBase(
        "cabecera-bono"
      ),
      cargarImagenBase(
        "bloque-inferior-bono"
      ),
    ]);

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    ANCHO;

  canvas.height =
    ALTO;

  const ctx =
    canvas.getContext(
      "2d"
    );

  if (!ctx) {
    throw new Error(
      "No se pudo preparar la imagen."
    );
  }

  ctx.fillStyle =
    COLORES.blanco;

  ctx.fillRect(
    0,
    0,
    ANCHO,
    ALTO
  );

  /*
   * PLANTILLA FIJA
   * 1065 x 1379 px
   * Tomada de la imagen de referencia.
   */

  // HEADER
  ctx.drawImage(
    cabeceraBase.imagen,
    14,
    16,
    1036,
    259
  );

  // TÍTULO HEADER
  ctx.textAlign =
    "left";

  ctx.textBaseline =
    "alphabetic";

  ctx.fillStyle =
    COLORES.blanco;

  ctx.font =
    '900 45px "Arial Black", Arial, Helvetica, sans-serif';

  ctx.fillText(
    "DISPONIBILIDAD",
    370,
    128
  );

  ctx.fillStyle =
    COLORES.turquesa;

  ctx.font =
    '900 44px "Arial Black", Arial, Helvetica, sans-serif';

  ctx.fillText(
    "AVAILABILITY",
    368,
    191
  );

  ctx.textAlign =
    "right";

  ctx.fillStyle =
    COLORES.blanco;

  ctx.font =
    '900 69px "Arial Black", Arial, Helvetica, sans-serif';

  ctx.fillText(
    String(
      fechaLocal(
        horario.semana_inicio
      ).getFullYear()
    ),
    1002,
    229
  );

  // FILAS CENTRALES
  const filas = [
    { y: 287, alto: 86 },
    { y: 389, alto: 86 },
    { y: 492, alto: 86 },
    { y: 593, alto: 86 },
    { y: 692, alto: 87 },
    { y: 794, alto: 86 },
    { y: 893, alto: 86 },
  ];

  const dias =
    diasDeSemana(
      horario.semana_inicio
    );

  dias.forEach(
    (
      dia,
      indice
    ) => {
      const fila =
        filas[indice];

      // Columna día
      ctx.fillStyle =
        COLORES.gris;

      ctx.fillRect(
        14,
        fila.y,
        337,
        fila.alto
      );

      // Columna horarios
      ctx.fillStyle =
        COLORES.turquesa;

      ctx.fillRect(
        365,
        fila.y,
        684,
        fila.alto
      );

      // Día ES
      ctx.textAlign =
        "center";

      ctx.fillStyle =
        COLORES.negro;

      const tamDia =
        ajustarTexto(
          ctx,
          dia.es,
          185,
          31,
          25
        );

      ctx.font =
        `900 ${tamDia}px "Arial Black", Arial, Helvetica, sans-serif`;

      ctx.fillText(
        dia.es,
        126,
        fila.y + 36
      );

      // Día EN
      const tamDiaEn =
        ajustarTexto(
          ctx,
          dia.en,
          195,
          29,
          23
        );

      ctx.font =
        `900 ${tamDiaEn}px "Arial Black", Arial, Helvetica, sans-serif`;

      ctx.fillText(
        dia.en,
        126,
        fila.y + 72
      );

      // Fecha
      ctx.textAlign =
        "right";

      ctx.font =
        '900 29px "Arial Black", Arial, Helvetica, sans-serif';

      ctx.fillText(
        dia.fecha,
        331,
        fila.y + 57
      );

      // Horas
      const horas =
        (
          horario
            .seleccion[
            dia.iso
          ] || []
        )
          .slice()
          .sort();

      if (
        horas.length ===
        0
      ) {
        return;
      }

      const {
        tamano,
        lineas,
      } =
        dividirHoras(
          ctx,
          horas,
          640
        );

      ctx.textAlign =
        "center";

      ctx.fillStyle =
        COLORES.negro;

      ctx.font =
        `900 ${tamano}px "Arial Black", Arial, Helvetica, sans-serif`;

      if (
        lineas.length ===
        1
      ) {
        ctx.fillText(
          lineas[0],
          707,
          fila.y + 58
        );
      } else {
        ctx.fillText(
          lineas[0],
          707,
          fila.y + 40
        );

        ctx.fillText(
          lineas[1],
          707,
          fila.y + 72
        );
      }
    }
  );

  // FOOTER COMPLETO
  ctx.drawImage(
    pieBase.imagen,
    14,
    991,
    1036,
    372
  );

  const nombreSeguro =
    horario.nombre
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      )
      .toLowerCase() ||
    "disponibilidad";

  descargarCanvas(
    canvas,
    `${nombreSeguro}-${horario.semana_inicio}.png`
  );
}
