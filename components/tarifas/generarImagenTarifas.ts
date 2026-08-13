type ValoresTarifas = Record<string, string>;

type OpcionesImagenTarifas = {
  valores: ValoresTarifas;
  anio?: number;
  nombreTarifa?: string;
};

const ANCHO = 1200;
const MARGEN = 34;
const NAVY = "#0F2742";
const NAVY_TEXTO = "#17324D";
const TEAL = "#00A79C";
const TEAL_CLARO = "#4DD4CA";
const FONDO = "#F6F8FA";
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

function dibujarBolaMarca(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radio: number
) {
  ctx.save();
  ctx.strokeStyle = TEAL_CLARO;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    radio,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    x - radio * 0.22,
    y - radio * 0.1,
    radio * 0.82,
    -0.9,
    1.15
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    x + radio * 0.22,
    y + radio * 0.1,
    radio * 0.82,
    2.25,
    4.3
  );
  ctx.stroke();
  ctx.restore();
}

export async function generarImagenTarifas({
  valores,
  anio = new Date().getFullYear(),
}: OpcionesImagenTarifas) {
  const [
    cabecera,
    footer,
  ] = await Promise.all([
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

  // La misma cabecera aprobada de Bonos:
  // ancho completo de 1200 px, igual que el footer.
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

  const canvas =
    document.createElement(
      "canvas"
    );
  canvas.width = ANCHO;
  canvas.height = ALTO;

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
    ALTO
  );

  // CABECERA
  // Se reutiliza EXACTAMENTE la misma imagen aprobada en Bonos.
  // No se dibuja ninguna línea vertical adicional.
  ctx.drawImage(
    cabecera,
    0,
    0,
    ANCHO,
    cabeceraH
  );

  // Texto a la derecha del logo.
  // Se elimina por completo la tarjeta "1 HORA / 1 HOUR".
  const textoX = 410;
  const textoDerecha = ANCHO - 54;

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
    "CLASES Y BONOS / CLASSES & PACKS",
    textoX,
    142
  );

  // Año mucho más grande, como elemento gráfico principal del header.
  ctx.textAlign = "right";
  ctx.fillStyle = BLANCO;
  ctx.font = "800 78px Arial";
  ctx.fillText(
    String(anio),
    textoDerecha,
    238
  );

  ctx.restore();

  // TABLA: anchuras perfectamente cerradas dentro de los 1132 px útiles.
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

  // Primera celda superior: etiqueta de filas.
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

  // Grupos superiores.
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

  // Subcabecera clase suelta.
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

      // Etiqueta alumnos.
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

  // FOOTER EXACTO APROBADO EN BONOS.
  ctx.drawImage(
    footer,
    0,
    footerY,
    ANCHO,
    altoFooter
  );

  const enlace =
    document.createElement("a");
  enlace.download =
    `Tarifas_Espacio_Padel_${anio}.png`;
  enlace.href = canvas.toDataURL(
    "image/png",
    1
  );
  enlace.click();
}
