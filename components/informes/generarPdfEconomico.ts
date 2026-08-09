import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Clase } from "./tipos";

import {
  calcularHorario,
  formatearFecha,
  obtenerNombreAlumnos,
  obtenerNombreMes,
} from "./utils";

type ClaseInforme = Clase & {
  ingreso_extra?: number | null;
  ubicaciones?: {
    nombre: string;
    tipo?: string | null;
  } | null;
  clase_alumnos?: {
    importe?: number | null;
    usa_bono?: boolean | null;
    alumnos?: {
      nombre: string;
      apellidos: string | null;
    } | null;
  }[];
};

type DatosPdfEconomico = {
  mes: string;
  clases: ClaseInforme[];
  totalIngresos: number;
  totalGastos: number;
  totalPendiente: number;
  totalHoras: number;
  totalClases: number;
};

type ColorRGB = [
  number,
  number,
  number
];

async function cargarLogoBase64() {
  const respuesta = await fetch(
    "/logo-espacio-padel.png"
  );

  if (!respuesta.ok) {
    throw new Error(
      "No se ha podido cargar el logotipo"
    );
  }

  const blob =
    await respuesta.blob();

  return new Promise<string>(
    (resolve, reject) => {
      const lector =
        new FileReader();

      lector.onloadend = () => {
        resolve(
          lector.result as string
        );
      };

      lector.onerror =
        reject;

      lector.readAsDataURL(
        blob
      );
    }
  );
}

function textoTipoClase(
  tipo: string
) {
  if (tipo === "club") {
    return "Clase para club";
  }

  if (tipo === "propia") {
    return "Clase propia · pista de pago";
  }

  if (tipo === "privada") {
    return "Clase propia · pista privada";
  }

  return tipo;
}

function ingresoClase(
  clase: ClaseInforme
) {
  const extra =
    Number(
      clase.ingreso_extra ||
        0
    );

  if (
    clase.tipo === "club"
  ) {
    return (
      Number(
        clase.importe_club ||
          0
      ) +
      extra
    );
  }

  const alumnos =
    (
      clase.clase_alumnos ||
      []
    ).reduce(
      (
        total,
        participante
      ) =>
        total +
        Number(
          participante.importe ||
            0
        ),
      0
    );

  return alumnos + extra;
}

export async function generarPdfEconomico({
  mes,
  clases,
  totalIngresos,
  totalGastos,
  totalPendiente,
  totalHoras,
  totalClases,
}: DatosPdfEconomico) {
  const doc = new jsPDF({
    orientation:
      "portrait",
    unit: "mm",
    format: "a4",
  });

  const turquesa: ColorRGB = [
    9,
    169,
    163,
  ];

  const turquesaOscuro: ColorRGB = [
    7,
    143,
    138,
  ];

  const oscuro: ColorRGB = [
    30,
    41,
    59,
  ];

  const gris: ColorRGB = [
    100,
    116,
    139,
  ];

  const grisClaro: ColorRGB = [
    241,
    245,
    249,
  ];

  const borde: ColorRGB = [
    203,
    213,
    225,
  ];

  const blanco: ColorRGB = [
    255,
    255,
    255,
  ];

  const verde: ColorRGB = [
    16,
    185,
    129,
  ];

  const rojo: ColorRGB = [
    239,
    68,
    68,
  ];

  const naranja: ColorRGB = [
    234,
    88,
    12,
  ];

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const margen = 15;

  const anchoContenido =
    anchoPagina -
    margen * 2;

  const logo =
    await cargarLogoBase64();

  const resultadoFinal =
    totalIngresos -
    totalGastos;

  function dibujarEncabezado() {
    doc.addImage(
      logo,
      "PNG",
      margen,
      11,
      31,
      26
    );

    doc.setTextColor(
      ...turquesa
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(
      9
    );

    doc.text(
      "ESPACIO PÁDEL ACADEMY",
      52,
      17
    );

    doc.setTextColor(
      ...oscuro
    );

    doc.setFontSize(
      19
    );

    doc.text(
      "Informe mensual completo",
      52,
      27
    );

    doc.setFontSize(
      11.5
    );

    doc.setTextColor(
      ...gris
    );

    doc.text(
      "Actividad, ingresos, gastos y resultado",
      52,
      34
    );

    doc.setFillColor(
      ...grisClaro
    );

    doc.roundedRect(
      anchoPagina - 57,
      12,
      42,
      22,
      3,
      3,
      "F"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      7.5
    );

    doc.setTextColor(
      ...gris
    );

    doc.text(
      "PERIODO",
      anchoPagina - 20,
      19,
      {
        align: "right",
      }
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(
      10.5
    );

    doc.setTextColor(
      ...oscuro
    );

    doc.text(
      obtenerNombreMes(
        mes
      ),
      anchoPagina - 20,
      27,
      {
        align: "right",
      }
    );

    doc.setDrawColor(
      ...turquesa
    );

    doc.setLineWidth(
      0.8
    );

    doc.line(
      margen,
      44,
      anchoPagina - margen,
      44
    );
  }

  dibujarEncabezado();

  let y = 57;

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    7.5
  );

  doc.setTextColor(
    ...gris
  );

  doc.text(
    "ACTIVIDAD DEL MES",
    margen,
    y
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    13
  );

  doc.setTextColor(
    ...oscuro
  );

  doc.text(
    "Todas las clases realizadas",
    margen,
    y + 7
  );

  y += 15;

  const filas =
    clases.map(
      (clase) => {
        const ubicacion =
          clase.ubicaciones
            ?.nombre ||
          "Sin ubicación";

        const tipo =
          textoTipoClase(
            clase.tipo
          );

        const nombres =
          obtenerNombreAlumnos(
            clase as Clase
          );

        const ingreso =
          ingresoClase(
            clase
          );

        const gasto =
          Number(
            clase.coste_pista ||
              0
          );

        return [
          formatearFecha(
            clase.fecha
          ),
          calcularHorario(
            clase.hora_inicio,
            clase.duracion_minutos
          ),
          `${ubicacion}\n${tipo}`,
          nombres ||
            "Sin alumnos",
          `${ingreso.toFixed(
            2
          )} €`,
          `${gasto.toFixed(
            2
          )} €`,
        ];
      }
    );

  autoTable(
    doc,
    {
      startY: y,

      margin: {
        left: margen,
        right: margen,
        top: 55,
        bottom: 16,
      },

      head: [
        [
          "Fecha",
          "Horario",
          "Ubicación / tipo",
          "Alumnos",
          "Ingresos",
          "Gastos",
        ],
      ],

      body: filas,

      theme: "grid",

      styles: {
        font:
          "helvetica",
        fontSize: 7.4,
        textColor:
          oscuro,
        lineColor:
          borde,
        lineWidth: 0.2,
        cellPadding: {
          top: 2.3,
          right: 2,
          bottom: 2.3,
          left: 2,
        },
        valign:
          "middle",
      },

      headStyles: {
        fillColor:
          oscuro,
        textColor:
          blanco,
        fontStyle:
          "bold",
        fontSize: 7.5,
        halign:
          "center",
      },

      alternateRowStyles: {
        fillColor:
          grisClaro,
      },

      rowPageBreak: "avoid",

      columnStyles: {
        0: {
          cellWidth: 20,
          halign:
            "center",
        },
        1: {
          cellWidth: 29,
          halign:
            "center",
        },
        2: {
          cellWidth: 40,
          halign:
            "left",
        },
        3: {
          cellWidth: 48,
          halign:
            "left",
        },
        4: {
          cellWidth: 22,
          halign:
            "center",
        },
        5: {
          cellWidth: 21,
          halign:
            "center",
        },
      },

      didParseCell: (
        data
      ) => {
        if (
          data.section ===
            "body" &&
          data.column.index ===
            4
        ) {
          data.cell.styles.textColor =
            turquesaOscuro;
          data.cell.styles.fontStyle =
            "bold";
        }

        if (
          data.section ===
            "body" &&
          data.column.index ===
            5
        ) {
          data.cell.styles.textColor =
            rojo;
        }
      },

      didDrawPage: () => {
        dibujarEncabezado();
      },
    }
  );

  const ultimaTabla =
    (
      doc as any
    ).lastAutoTable;

  y =
    Number(
      ultimaTabla?.finalY ||
        70
    ) + 8;

  if (
    y >
    altoPagina - 72
  ) {
    doc.addPage();
    dibujarEncabezado();
    y = 58;
  }

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    7.5
  );

  doc.setTextColor(
    ...gris
  );

  doc.text(
    "RESUMEN ECONÓMICO",
    margen,
    y
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    13
  );

  doc.setTextColor(
    ...oscuro
  );

  doc.text(
    "Resultado del mes",
    margen,
    y + 7
  );

  y += 13;

  autoTable(
    doc,
    {
      startY: y,

      margin: {
        left: margen,
        right: margen,
      },

      body: [
        [
          "Clases realizadas",
          String(
            totalClases
          ),
        ],
        [
          "Horas impartidas",
          totalHoras.toFixed(
            1
          ),
        ],
        [
          "Ingresos generados",
          `${totalIngresos.toFixed(
            2
          )} €`,
        ],
        [
          "Gastos de pista",
          `${totalGastos.toFixed(
            2
          )} €`,
        ],
        [
          "Pendiente de cobro",
          `${totalPendiente.toFixed(
            2
          )} €`,
        ],
      ],

      theme: "grid",

      styles: {
        font:
          "helvetica",
        fontSize: 8,
        textColor:
          oscuro,
        lineColor:
          borde,
        lineWidth: 0.2,
        cellPadding: {
          top: 1.8,
          bottom: 1.8,
          left: 3,
          right: 3,
        },
      },

      columnStyles: {
        0: {
          cellWidth:
            anchoContenido *
            0.62,
          fontStyle:
            "bold",
        },
        1: {
          cellWidth:
            anchoContenido *
            0.38,
          halign:
            "right",
        },
      },

      alternateRowStyles: {
        fillColor:
          grisClaro,
      },
    }
  );

  y =
    Number(
      (
        doc as any
      ).lastAutoTable
        ?.finalY ||
        y
    ) + 5;

  const altoResultadoFinal =
    15;

  const limiteResultadoFinal =
    altoPagina - 22;

  if (
    y +
      altoResultadoFinal >
    limiteResultadoFinal
  ) {
    doc.addPage();
    dibujarEncabezado();
    y = 58;
  }

  doc.setFillColor(
    ...(
      resultadoFinal >=
      0
        ? turquesa
        : rojo
    )
  );

  doc.roundedRect(
    margen,
    y,
    anchoContenido,
    15,
    3,
    3,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    8
  );

  doc.setTextColor(
    ...blanco
  );

  doc.text(
    "RESULTADO FINAL DEL MES",
    margen + 5,
    y + 6
  );

  doc.setFontSize(
    15
  );

  doc.text(
    `${resultadoFinal.toFixed(
      2
    )} €`,
    anchoPagina - margen - 5,
    y + 10,
    {
      align: "right",
    }
  );

  if (
    totalPendiente >
    0
  ) {
    y += 20;

    doc.setFillColor(
      255,
      247,
      237
    );

    doc.setDrawColor(
      ...naranja
    );

    doc.roundedRect(
      margen,
      y,
      anchoContenido,
      12,
      3,
      3,
      "FD"
    );

    doc.setFontSize(
      8
    );

    doc.setTextColor(
      ...naranja
    );

    doc.text(
      `Pendiente de cobro incluido en los ingresos generados: ${totalPendiente.toFixed(
        2
      )} €`,
      margen + 5,
      y + 7.5
    );
  }

  const totalPaginas =
    doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina++
  ) {
    doc.setPage(
      pagina
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      9
    );

    doc.setTextColor(
      ...gris
    );

    doc.text(
      `${pagina}/${totalPaginas}`,
      anchoPagina / 2,
      altoPagina - 4,
      {
        align: "center",
      }
    );
  }

  const nombreArchivo =
    `Informe_Mensual_Completo_${mes}.pdf`;

  doc.save(
    nombreArchivo
  );
}
