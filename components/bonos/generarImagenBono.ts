import { supabase } from "../../lib/supabase";

type UsoBonoImagen = {
  bono_id: string | null;
  usa_bono: boolean;
  clases: {
    fecha: string;
    hora_inicio: string;
    estado: string;
  } | null;
};

type BonoImagen = {
  id: string;
  numero_clases: number;
  clases_restantes: number;
  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
  clase_alumnos: UsoBonoImagen[];
};

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    imagen.src = src;
  });
}

function redondearRectangulo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number
) {
  const r = Math.min(radio, ancho / 2, alto / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, r);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, r);
  ctx.arcTo(x, y + alto, x, y, r);
  ctx.arcTo(x, y, x + ancho, y, r);
  ctx.closePath();
}

function ajustarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number,
  tamanoInicial: number,
  tamanoMinimo = 20,
  peso = 700
) {
  let tamano = tamanoInicial;

  while (tamano > tamanoMinimo) {
    ctx.font = `${peso} ${tamano}px Arial`;
    if (ctx.measureText(texto).width <= anchoMaximo) {
      break;
    }
    tamano -= 1;
  }

  return tamano;
}

function fechaEspana(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function dibujarCheck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radio: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fillStyle = "#29b000";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(3.5, radio * 0.15);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x - radio * 0.42, y + radio * 0.02);
  ctx.lineTo(x - radio * 0.10, y + radio * 0.32);
  ctx.lineTo(x + radio * 0.48, y - radio * 0.36);
  ctx.stroke();
  ctx.restore();
}

function dibujarCalendario(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  escala = 1,
  color = "#10aea8"
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * escala;
  ctx.lineCap = "round";

  ctx.strokeRect(x, y + 5 * escala, 32 * escala, 28 * escala);
  ctx.beginPath();
  ctx.moveTo(x, y + 13 * escala);
  ctx.lineTo(x + 32 * escala, y + 13 * escala);
  ctx.moveTo(x + 8 * escala, y);
  ctx.lineTo(x + 8 * escala, y + 9 * escala);
  ctx.moveTo(x + 24 * escala, y);
  ctx.lineTo(x + 24 * escala, y + 9 * escala);
  ctx.stroke();
  ctx.restore();
}

function dibujarTextoBicolorCentrado(
  ctx: CanvasRenderingContext2D,
  partes: Array<{
    texto: string;
    color: string;
    peso?: number;
  }>,
  centroX: number,
  y: number,
  tamano: number
) {
  const anchos = partes.map((parte) => {
    ctx.font = `${parte.peso ?? 700} ${tamano}px Arial`;
    return ctx.measureText(parte.texto).width;
  });

  const anchoTotal = anchos.reduce((total, ancho) => total + ancho, 0);
  let x = centroX - anchoTotal / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  partes.forEach((parte, indice) => {
    ctx.font = `${parte.peso ?? 700} ${tamano}px Arial`;
    ctx.fillStyle = parte.color;
    ctx.fillText(parte.texto, x, y);
    x += anchos[indice];
  });
}

function dibujarBolaRecortada(
  ctx: CanvasRenderingContext2D,
  imagen: HTMLImageElement,
  centroX: number,
  centroY: number,
  tamano: number
) {
  const recorte = 18;
  const origenW = Math.max(1, imagen.naturalWidth - recorte * 2);
  const origenH = Math.max(1, imagen.naturalHeight - recorte * 2);

  ctx.drawImage(
    imagen,
    recorte,
    recorte,
    origenW,
    origenH,
    centroX - tamano / 2,
    centroY - tamano / 2,
    tamano,
    tamano
  );
}

function dibujarGuiasBola(
  ctx: CanvasRenderingContext2D,
  centroX: number,
  centroY: number,
  ancho = 156,
  alto = 168,
  esquina = 16
) {
  const izquierda = centroX - ancho / 2;
  const derecha = centroX + ancho / 2;
  const arriba = centroY - alto / 2;
  const abajo = centroY + alto / 2;

  ctx.save();
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(izquierda, arriba + esquina);
  ctx.lineTo(izquierda, arriba);
  ctx.lineTo(izquierda + esquina, arriba);

  ctx.moveTo(derecha - esquina, arriba);
  ctx.lineTo(derecha, arriba);
  ctx.lineTo(derecha, arriba + esquina);

  ctx.moveTo(izquierda, abajo - esquina);
  ctx.lineTo(izquierda, abajo);
  ctx.lineTo(izquierda + esquina, abajo);

  ctx.moveTo(derecha - esquina, abajo);
  ctx.lineTo(derecha, abajo);
  ctx.lineTo(derecha, abajo - esquina);

  ctx.stroke();
  ctx.restore();
}

function dibujarTextoContador(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  restantes: number,
  tamano: number,
  colorNegro: string,
  colorTurquesa: string,
  colorTurquesaOscuro: string
) {
  const partes = [
    { texto: "CLASES RESTANTES: ", color: colorNegro },
    { texto: String(restantes), color: colorTurquesa },
    { texto: "   |   ", color: colorTurquesa },
    { texto: "REMAINING CLASSES: ", color: colorTurquesaOscuro },
    { texto: String(restantes), color: colorTurquesa },
  ];

  const anchos = partes.map((parte) => {
    ctx.font = `400 ${tamano}px Arial`;
    return ctx.measureText(parte.texto).width;
  });

  let cursor = x;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `400 ${tamano}px Arial`;

  partes.forEach((parte, i) => {
    ctx.fillStyle = parte.color;
    ctx.fillText(parte.texto, cursor, y);
    cursor += anchos[i];
  });
}


async function obtenerIntegrantesBono(bono: BonoImagen) {
  const { data, error } = await supabase
    .from("bono_alumnos")
    .select(`
      alumno_id,
      alumnos (
        nombre,
        apellidos
      )
    `)
    .eq("bono_id", bono.id);

  if (!error && data && data.length > 0) {
    const nombres = data
      .map((fila: any) => {
        const alumno = Array.isArray(fila.alumnos)
          ? fila.alumnos[0]
          : fila.alumnos;

        if (!alumno) return "";

        return `${alumno.nombre || ""} ${alumno.apellidos || ""}`
          .replace(/\s+/g, " ")
          .trim();
      })
      .filter(Boolean);

    return Array.from(new Set(nombres));
  }

  const titular = bono.alumnos
    ? `${bono.alumnos.nombre} ${bono.alumnos.apellidos || ""}`
        .replace(/\s+/g, " ")
        .trim()
    : "Alumno";

  return [titular];
}

function partirTextoCabecera(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number
) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  palabras.forEach((palabra) => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;

    if (ctx.measureText(prueba).width <= anchoMaximo) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  });

  if (actual) lineas.push(actual);
  return lineas;
}

export async function generarImagenBono(bono: BonoImagen) {
  const ANCHO = 1200;
  const MARGEN = 34;

  const TURQUESA = "#10aea8";
  const TURQUESA_OSCURO = "#068b91";
  const TEXTO = "#111111";

  const nombre = bono.alumnos
    ? `${bono.alumnos.nombre} ${bono.alumnos.apellidos || ""}`.trim()
    : "Alumno";

  const integrantes = await obtenerIntegrantesBono(bono);

  const usos = (bono.clase_alumnos || [])
    .filter(
      (uso) =>
        uso.usa_bono &&
        uso.bono_id === bono.id &&
        uso.clases?.estado === "realizada"
    )
    .sort((a, b) =>
      `${a.clases?.fecha || ""} ${a.clases?.hora_inicio || ""}`.localeCompare(
        `${b.clases?.fecha || ""} ${b.clases?.hora_inicio || ""}`
      )
    );

  const total = Math.max(1, Number(bono.numero_clases || 1));

  const columnas =
    total <= 5
      ? total
      : total <= 10
      ? 5
      : total <= 12
      ? 6
      : Math.min(6, Math.ceil(total / 2));

  const filas = Math.ceil(total / columnas);

  const altoFilaBolas = 270;
  const yInicioBolas = 368;
  const yContador = yInicioBolas + filas * altoFilaBolas + 10;
  const altoContador = 58;
  const yBloqueInferior = yContador + altoContador + 24;
  const anchoUtil = ANCHO - MARGEN * 2;

  const [cabecera, bolaVerde, bolaGris, bloqueInferior] = await Promise.all([
    cargarImagen("/cabecera-bono.png"),
    cargarImagen("/bola-verde.png"),
    cargarImagen("/bola-gris.png"),
    cargarImagen("/bloque-inferior-bono.png"),
  ]);

  const altoBloqueInferior = Math.round(
    (bloqueInferior.naturalHeight / bloqueInferior.naturalWidth) * ANCHO
  );

  const ALTO = yBloqueInferior + altoBloqueInferior;

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear la imagen del bono.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // CABECERA
  // Se sustituye únicamente la cabecera. Desde // BOLAS hacia abajo
  // se conserva exactamente el diseño de la versión v9 aprobada.
  const cabeceraAlto = 300;
  ctx.drawImage(cabecera, 0, 0, ANCHO, cabeceraAlto);

  const textoX = 410;
  const textoW = ANCHO - textoX - 55;
  const textoIntegrantes = integrantes.join(" · ");

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const titulo = `BONO ${total}`;
  const tamTitulo = 52;
  const tamEtiqueta = 21;
  const tamNombres = 20;
  const altoLineaNombres = 27;

  ctx.font = `700 ${tamNombres}px Arial`;
  const lineasNombres = partirTextoCabecera(
    ctx,
    textoIntegrantes,
    textoW
  );

  const altoBloque =
    tamTitulo +
    18 +
    tamEtiqueta +
    12 +
    Math.max(1, lineasNombres.length) * altoLineaNombres;

  const yInicio = Math.round((cabeceraAlto - altoBloque) / 2);

  ctx.font = `700 ${tamTitulo}px Arial`;
  ctx.fillText(titulo, textoX, yInicio + tamTitulo);

  ctx.font = `700 ${tamEtiqueta}px Arial`;
  const yEtiqueta = yInicio + tamTitulo + 18 + tamEtiqueta;
  ctx.fillText("INTEGRANTES DEL BONO", textoX, yEtiqueta);

  ctx.font = `700 ${tamNombres}px Arial`;
  const yNombres = yEtiqueta + 12 + tamNombres;

  lineasNombres.forEach((linea, indice) => {
    ctx.fillText(
      linea,
      textoX,
      yNombres + indice * altoLineaNombres
    );
  });

  // BOLAS
  const anchoCelda = anchoUtil / columnas;
  const tamanoBola = Math.min(122, anchoCelda * 0.55);

  for (let indice = 0; indice < total; indice++) {
    const fila = Math.floor(indice / columnas);
    const columna = indice % columnas;

    const centroX = MARGEN + anchoCelda * columna + anchoCelda / 2;
    const centroY = yInicioBolas + fila * altoFilaBolas + 70;

    dibujarGuiasBola(ctx, centroX, centroY, 160, 178, 18);
    dibujarBolaRecortada(
      ctx,
      indice < usos.length ? bolaVerde : bolaGris,
      centroX,
      centroY,
      tamanoBola
    );

    ctx.fillStyle = TEXTO;
    ctx.font = `700 ${Math.round(tamanoBola * 0.44)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(indice + 1), centroX, centroY + 2);

    if (indice < usos.length) {
      dibujarCheck(
        ctx,
        centroX + tamanoBola * 0.44,
        centroY - tamanoBola * 0.44,
        20
      );
    }

    ctx.fillStyle = TEXTO;
    ctx.font = "400 27px Arial";
    const fecha =
      indice < usos.length && usos[indice]?.clases?.fecha
        ? fechaEspana(usos[indice].clases!.fecha)
        : "-";
    ctx.fillText(fecha, centroX, centroY + 130);
  }

  // CONTADOR
  const restantes = Math.max(0, Number(bono.clases_restantes || 0));
  const contadorX = 220;
  const contadorW = ANCHO - contadorX * 2;

  ctx.strokeStyle = TURQUESA;
  ctx.lineWidth = 2;
  redondearRectangulo(ctx, contadorX, yContador, contadorW, altoContador, 6);
  ctx.stroke();

  const tamContador = 22;
  ctx.font = `400 ${tamContador}px Arial`;
  const anchoBloqueTexto =
    ctx.measureText("CLASES RESTANTES: ").width +
    ctx.measureText(String(restantes)).width +
    ctx.measureText("   |   ").width +
    ctx.measureText("REMAINING CLASSES: ").width +
    ctx.measureText(String(restantes)).width;
  const iconoW = 34;
  const espacioIcono = 22;
  const inicioBloque =
    contadorX +
    (contadorW - (iconoW + espacioIcono + anchoBloqueTexto)) / 2;

  dibujarCalendario(ctx, inicioBloque, yContador + 12, 1, TURQUESA);
  dibujarTextoContador(
    ctx,
    inicioBloque + iconoW + espacioIcono,
    yContador + altoContador / 2 + 1,
    restantes,
    tamContador,
    TEXTO,
    TURQUESA,
    TURQUESA_OSCURO
  );

  // BLOQUE INFERIOR COMO IMAGEN EXACTA
  ctx.drawImage(
    bloqueInferior,
    0,
    yBloqueInferior,
    ANCHO,
    altoBloqueInferior
  );

  const dataUrl = canvas.toDataURL("image/png", 1);
  const enlace = document.createElement("a");
  const nombreArchivo = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  enlace.download = `Bono_${total}_${nombreArchivo}.png`;
  enlace.href = dataUrl;
  enlace.click();
}
