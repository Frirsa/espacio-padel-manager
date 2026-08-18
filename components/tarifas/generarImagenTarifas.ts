type ValoresTarifas = Record<string, string>;

type TipoImagenTarifas =
  | "comerciales"
  | "escuela";

type OpcionesImagenTarifas = {
  valores: ValoresTarifas;
  anio?: number | string;
  nombreTarifa?: string;
  tipo?: TipoImagenTarifas;
};

const ANCHO = 1200;
const MARGEN = 34;
const NAVY = "#0F2742";
const NAVY_TEXTO = "#17324D";
const TEAL = "#00A79C";
const TEAL_CLARO = "#4DD4CA";
const BORDE = "#DDE5EC";
const BLANCO = "#FFFFFF";
const GRIS = "#6B7C8E";

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () =>
      reject(
        new Error(
          `No se pudo cargar ${src}`
        )
      );
    imagen.src = src;
  });
}

function rectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number
) {
  const r = Math.min(
    radio,
    ancho / 2,
    alto / 2
  );

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(
    x + ancho,
    y,
    x + ancho,
    y + alto,
    r
  );
  ctx.arcTo(
    x + ancho,
    y + alto,
    x,
    y + alto,
    r
  );
  ctx.arcTo(
    x,
    y + alto,
    x,
    y,
    r
  );
  ctx.arcTo(
    x,
    y,
    x + ancho,
    y,
    r
  );
  ctx.closePath();
}

function dibujarPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  fondo: string,
  radio = 18,
  borde?: string
) {
  ctx.save();
  rectRedondeado(
    ctx,
    x,
    y,
    ancho,
    alto,
    radio
  );
  ctx.fillStyle = fondo;
  ctx.fill();

  if (borde) {
    ctx.strokeStyle = borde;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function dibujarTextoCentrado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  centroX: number,
  y: number,
  tamano: number,
  color: string,
  peso = 700
) {
  ctx.save();
  ctx.font = `${peso} ${tamano}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    texto,
    centroX,
    y
  );
  ctx.restore();
}

function dibujarTextoIzquierda(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  tamano: number,
  color: string,
  peso = 700
) {
  ctx.save();
  ctx.font = `${peso} ${tamano}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, x, y);
  ctx.restore();
}

function numero(
  valores: ValoresTarifas,
  clave: string
) {
  const valor = Number(
    valores[clave] || 0
  );

  return Number.isFinite(valor)
    ? valor
    : 0;
}

function euro(valor: number) {
  return `${valor.toLocaleString(
    "es-ES",
    {
      minimumFractionDigits:
        Number.isInteger(valor)
          ? 0
          : 2,
      maximumFractionDigits: 2,
    }
  )} €`;
}

function descargarCanvas(
  canvas: HTMLCanvasElement,
  nombreArchivo: string
) {
  const enlace =
    document.createElement("a");
  enlace.download = nombreArchivo;
  enlace.href = canvas.toDataURL(
    "image/png",
    1
  );
  enlace.click();
}

async function cargarBase() {
  const [cabecera, footer] =
    await Promise.all([
      cargarImagen(
        "/cabecera-bono.png"
      ),
      cargarImagen(
        "/bloque-inferior-bono.png"
      ),
    ]);

  const altoFooter = Math.round(
    (footer.naturalHeight /
      footer.naturalWidth) *
      ANCHO
  );

  return {
    cabecera,
    footer,
    altoFooter,
  };
}

function crearCanvas(alto: number) {
  const canvas =
    document.createElement(
      "canvas"
    );
  canvas.width = ANCHO;
  canvas.height = alto;

  const ctx = canvas.getContext(
    "2d"
  );

  if (!ctx) {
    throw new Error(
      "No se pudo crear la imagen de tarifas."
    );
  }

  ctx.fillStyle = BLANCO;
  ctx.fillRect(
    0,
    0,
    ANCHO,
    alto
  );

  return { canvas, ctx };
}

function dibujarHeader(
  ctx: CanvasRenderingContext2D,
  cabecera: HTMLImageElement,
  titulo: string,
  subtitulo: string,
  valorDerecha: string
) {
  const cabeceraH = 300;
  const textoX = 410;
  const textoDerecha = ANCHO - 54;

  ctx.drawImage(
    cabecera,
    0,
    0,
    ANCHO,
    cabeceraH
  );

  ctx.save();
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillStyle = BLANCO;
  ctx.font = "800 52px Arial";
  ctx.fillText(
    "TARIFAS / RATES",
    textoX,
    98
  );

  ctx.fillStyle = TEAL_CLARO;
  ctx.font = "700 22px Arial";
  ctx.fillText(
    subtitulo,
    textoX,
    142
  );

  ctx.textAlign = "right";
  ctx.fillStyle = BLANCO;
  ctx.font = "800 78px Arial";
  ctx.fillText(
    valorDerecha,
    textoDerecha,
    238
  );

  ctx.restore();
}

async function generarImagenComerciales({
  valores,
  anio = new Date().getFullYear(),
}: OpcionesImagenTarifas) {
  const {
    cabecera,
    footer,
    altoFooter,
  } = await cargarBase();

  const cabeceraH = 300;
  const tablaY = 328;
  const cabeceraGrupoH = 92;
  const subcabeceraH = 62;
  const filaH = 102;
  const tablaH =
    cabeceraGrupoH +
    subcabeceraH +
    filaH * 4;
  const footerY =
    tablaY + tablaH + 28;
  const ALTO =
    footerY + altoFooter;

  const { canvas, ctx } =
    crearCanvas(ALTO);

  dibujarHeader(
    ctx,
    cabecera,
    "TARIFAS / RATES",
    "CLASES Y BONOS / CLASSES & PACKS",
    String(anio)
  );

  const x0 = MARGEN;
  const wAlumnos = 220;
  const wSuelta = 240;
  const wPack5 = 336;
  const wPack10 = 336;

  const xSuelta =
    x0 + wAlumnos;
  const xPack5 =
    xSuelta + wSuelta;
  const xPack10 =
    xPack5 + wPack5;

  dibujarPanel(
    ctx,
    x0,
    tablaY,
    wAlumnos - 8,
    cabeceraGrupoH +
      subcabeceraH,
    NAVY,
    18
  );

  dibujarTextoCentrado(
    ctx,
    "ALUMNOS",
    x0 +
      (wAlumnos - 8) / 2,
    tablaY + 58,
    23,
    BLANCO,
    800
  );

  dibujarTextoCentrado(
    ctx,
    "STUDENTS",
    x0 +
      (wAlumnos - 8) / 2,
    tablaY + 94,
    15,
    TEAL_CLARO,
    700
  );

  dibujarPanel(
    ctx,
    xSuelta,
    tablaY,
    wSuelta - 8,
    cabeceraGrupoH,
    TEAL,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "CLASE SUELTA",
    xSuelta +
      (wSuelta - 8) / 2,
    tablaY + 33,
    23,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "SINGLE CLASS",
    xSuelta +
      (wSuelta - 8) / 2,
    tablaY + 62,
    14,
    "rgba(255,255,255,0.78)",
    700
  );

  dibujarPanel(
    ctx,
    xPack5,
    tablaY,
    wPack5 - 8,
    cabeceraGrupoH,
    NAVY,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "BONO 5",
    xPack5 +
      (wPack5 - 8) / 2,
    tablaY + 33,
    23,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "5-CLASS PACK",
    xPack5 +
      (wPack5 - 8) / 2,
    tablaY + 62,
    14,
    TEAL_CLARO,
    700
  );

  dibujarPanel(
    ctx,
    xPack10,
    tablaY,
    wPack10,
    cabeceraGrupoH,
    NAVY,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "BONO 10",
    xPack10 +
      wPack10 / 2,
    tablaY + 33,
    23,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "10-CLASS PACK",
    xPack10 +
      wPack10 / 2,
    tablaY + 62,
    14,
    TEAL_CLARO,
    700
  );

  const subY =
    tablaY + cabeceraGrupoH + 8;

  dibujarPanel(
    ctx,
    xSuelta,
    subY,
    wSuelta - 8,
    subcabeceraH - 8,
    "#E8F7F5",
    12,
    "#CDEDE9"
  );
  dibujarTextoCentrado(
    ctx,
    "PRECIO / PRICE",
    xSuelta +
      (wSuelta - 8) / 2,
    subY + 19,
    13,
    TEAL,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "por hora · per hour",
    xSuelta +
      (wSuelta - 8) / 2,
    subY + 39,
    11,
    NAVY_TEXTO,
    600
  );

  const medio5 = wPack5 / 2;
  const medio10 =
    wPack10 / 2;

  const subcabecera = (
    x: number,
    ancho: number,
    linea1: string,
    linea2: string
  ) => {
    dibujarPanel(
      ctx,
      x,
      subY,
      ancho - 8,
      subcabeceraH - 8,
      "#EEF3F7",
      12,
      BORDE
    );
    dibujarTextoCentrado(
      ctx,
      linea1,
      x +
        (ancho - 8) / 2,
      subY + 19,
      12,
      NAVY_TEXTO,
      800
    );
    dibujarTextoCentrado(
      ctx,
      linea2,
      x +
        (ancho - 8) / 2,
      subY + 39,
      10,
      GRIS,
      600
    );
  };

  subcabecera(
    xPack5,
    medio5,
    "TOTAL BONO",
    "PACK TOTAL"
  );
  subcabecera(
    xPack5 + medio5,
    medio5,
    "POR CLASE",
    "PER CLASS"
  );
  subcabecera(
    xPack10,
    medio10,
    "TOTAL BONO",
    "PACK TOTAL"
  );
  subcabecera(
    xPack10 + medio10,
    medio10,
    "POR CLASE",
    "PER CLASS"
  );

  const yFilas =
    tablaY +
    cabeceraGrupoH +
    subcabeceraH +
    8;

  [1, 2, 3, 4].forEach(
    (alumnos, indice) => {
      const y =
        yFilas +
        indice * filaH;
      const altura =
        filaH - 8;

      dibujarPanel(
        ctx,
        x0,
        y,
        wAlumnos - 8,
        altura,
        indice % 2 === 0
          ? BLANCO
          : "#F0F5F8",
        14,
        BORDE
      );

      dibujarPanel(
        ctx,
        x0 + 16,
        y + 20,
        46,
        46,
        "#E8F7F5",
        23
      );

      dibujarTextoCentrado(
        ctx,
        String(alumnos),
        x0 + 39,
        y + 43,
        19,
        TEAL,
        800
      );

      dibujarTextoIzquierda(
        ctx,
        `${alumnos} ${
          alumnos === 1
            ? "ALUMNO"
            : "ALUMNOS"
        }`,
        x0 + 76,
        y + 34,
        17,
        NAVY_TEXTO,
        800
      );

      dibujarTextoIzquierda(
        ctx,
        `${alumnos} ${
          alumnos === 1
            ? "STUDENT"
            : "STUDENTS"
        }`,
        x0 + 76,
        y + 59,
        11,
        GRIS,
        700
      );

      const suelta = numero(
        valores,
        `clase_suelta-60-${alumnos}`
      );
      const bono5 = numero(
        valores,
        `bono_5-60-${alumnos}`
      );
      const bono10 = numero(
        valores,
        `bono_10-60-${alumnos}`
      );

      const valoresFila = [
        {
          x: xSuelta,
          w: wSuelta - 8,
          valor: suelta,
          color: TEAL,
          fondo:
            indice % 2 === 0
              ? BLANCO
              : "#FAFCFD",
        },
        {
          x: xPack5,
          w: medio5 - 8,
          valor: bono5,
          color: TEAL,
          fondo:
            indice % 2 === 0
              ? BLANCO
              : "#FAFCFD",
        },
        {
          x: xPack5 + medio5,
          w: medio5 - 8,
          valor:
            bono5 > 0
              ? bono5 / 5
              : 0,
          color: NAVY_TEXTO,
          fondo:
            indice % 2 === 0
              ? BLANCO
              : "#FAFCFD",
        },
        {
          x: xPack10,
          w: medio10 - 8,
          valor: bono10,
          color: TEAL,
          fondo:
            indice % 2 === 0
              ? BLANCO
              : "#FAFCFD",
        },
        {
          x: xPack10 + medio10,
          w: medio10,
          valor:
            bono10 > 0
              ? bono10 / 10
              : 0,
          color: NAVY_TEXTO,
          fondo:
            indice % 2 === 0
              ? BLANCO
              : "#FAFCFD",
        },
      ];

      valoresFila.forEach(
        (celda) => {
          dibujarPanel(
            ctx,
            celda.x,
            y,
            celda.w,
            altura,
            celda.fondo,
            14,
            BORDE
          );

          dibujarTextoCentrado(
            ctx,
            celda.valor > 0
              ? euro(celda.valor)
              : "—",
            celda.x +
              celda.w / 2,
            y + altura / 2,
            26,
            celda.color,
            800
          );
        }
      );
    }
  );

  ctx.drawImage(
    footer,
    0,
    footerY,
    ANCHO,
    altoFooter
  );

  descargarCanvas(
    canvas,
    `Tarifas_Espacio_Padel_${anio}.png`
  );
}

async function generarImagenEscuela({
  valores,
  anio = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
}: OpcionesImagenTarifas) {
  const {
    cabecera,
    footer,
    altoFooter,
  } = await cargarBase();

  const cabeceraH = 300;
  const tablaY = 332;
  const encabezadoH = 92;
  const filaH = 118;
  const filas = 3;
  const baseY =
    tablaY + encabezadoH + 8;
  const filasFinY =
    baseY + filaH * filas - 8;
  const bannerY =
    filasFinY + 20;
  const bannerH = 44;
  const footerY =
    bannerY + bannerH + 20;
  const ALTO =
    footerY + altoFooter;

  const { canvas, ctx } =
    crearCanvas(ALTO);

  dibujarHeader(
    ctx,
    cabecera,
    "TARIFAS / RATES",
    "ESCUELA / SCHOOL",
    String(anio)
  );

  const x0 = MARGEN;
  const wHoras = 300;
  const wMensual = 410;
  const wTrimestral = 422;

  const xMensual =
    x0 + wHoras;
  const xTrimestral =
    xMensual + wMensual;

  dibujarPanel(
    ctx,
    x0,
    tablaY,
    wHoras - 8,
    encabezadoH,
    NAVY,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "HORAS SEMANALES",
    x0 +
      (wHoras - 8) / 2,
    tablaY + 36,
    21,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "HOURS PER WEEK",
    x0 +
      (wHoras - 8) / 2,
    tablaY + 64,
    14,
    TEAL_CLARO,
    700
  );

  dibujarPanel(
    ctx,
    xMensual,
    tablaY,
    wMensual - 8,
    encabezadoH,
    TEAL,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "MENSUAL",
    xMensual +
      (wMensual - 8) / 2,
    tablaY + 36,
    25,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "MONTHLY",
    xMensual +
      (wMensual - 8) / 2,
    tablaY + 66,
    14,
    "rgba(255,255,255,0.82)",
    700
  );

  dibujarPanel(
    ctx,
    xTrimestral,
    tablaY,
    wTrimestral,
    encabezadoH,
    NAVY,
    18
  );
  dibujarTextoCentrado(
    ctx,
    "TRIMESTRAL",
    xTrimestral +
      wTrimestral / 2,
    tablaY + 36,
    25,
    BLANCO,
    800
  );
  dibujarTextoCentrado(
    ctx,
    "QUARTERLY",
    xTrimestral +
      wTrimestral / 2,
    tablaY + 66,
    14,
    TEAL_CLARO,
    700
  );

  const horasLista = [1, 2, 3];

  horasLista.forEach(
    (horas, indice) => {
      const y =
        baseY +
        indice * filaH;
      const altura =
        filaH - 8;
      const fondoFila =
        indice % 2 === 0
          ? BLANCO
          : "#FAFCFD";

      dibujarPanel(
        ctx,
        x0,
        y,
        wHoras - 8,
        altura,
        indice % 2 === 0
          ? BLANCO
          : "#F0F5F8",
        14,
        BORDE
      );

      dibujarPanel(
        ctx,
        x0 + 16,
        y + 20,
        58,
        58,
        "#E8F7F5",
        29
      );

      dibujarTextoCentrado(
        ctx,
        String(horas),
        x0 + 45,
        y + 49,
        24,
        TEAL,
        800
      );

      dibujarTextoIzquierda(
        ctx,
        horas === 1
          ? "1 HORA / 1 HOUR"
          : `${horas} HORAS / ${horas} HOURS`,
        x0 + 92,
        y + 38,
        17,
        NAVY_TEXTO,
        800
      );

      dibujarTextoIzquierda(
        ctx,
        "por semana · per week",
        x0 + 92,
        y + 66,
        12,
        GRIS,
        700
      );

      const mensual = numero(
        valores,
        `escuela_mensual-${horas}`
      );
      const trimestral = numero(
        valores,
        `escuela_trimestral-${horas}`
      );

      [
        {
          x: xMensual,
          w: wMensual - 8,
          valor: mensual,
          color: TEAL,
          ayuda:
            "Pago mensual / Monthly payment",
        },
        {
          x: xTrimestral,
          w: wTrimestral,
          valor: trimestral,
          color: NAVY_TEXTO,
          ayuda:
            "Pago trimestral / Quarterly payment",
        },
      ].forEach((celda) => {
        dibujarPanel(
          ctx,
          celda.x,
          y,
          celda.w,
          altura,
          fondoFila,
          14,
          BORDE
        );

        dibujarTextoCentrado(
          ctx,
          celda.valor > 0
            ? euro(celda.valor)
            : "—",
          celda.x +
            celda.w / 2,
          y + 42,
          31,
          celda.color,
          800
        );

        dibujarTextoCentrado(
          ctx,
          celda.ayuda,
          celda.x +
            celda.w / 2,
          y + 76,
          12,
          GRIS,
          700
        );
      });
    }
  );

  dibujarPanel(
    ctx,
    MARGEN,
    bannerY,
    ANCHO - MARGEN * 2,
    bannerH,
    "#E8F7F5",
    14,
    "#CDEDE9"
  );
  dibujarTextoCentrado(
    ctx,
    "GRUPOS DE 3–4 ALUMNOS / GROUPS OF 3–4 STUDENTS",
    ANCHO / 2,
    bannerY + bannerH / 2,
    16,
    NAVY_TEXTO,
    800
  );

  ctx.drawImage(
    footer,
    0,
    footerY,
    ANCHO,
    altoFooter
  );

  descargarCanvas(
    canvas,
    `Tarifa_Escuela_${anio}.png`
  );
}

export async function generarImagenTarifas(
  opciones: OpcionesImagenTarifas
) {
  if (
    opciones.tipo ===
    "escuela"
  ) {
    return generarImagenEscuela(
      opciones
    );
  }

  return generarImagenComerciales(
    opciones
  );
}
