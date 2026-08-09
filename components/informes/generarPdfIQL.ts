import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Clase } from "./tipos";

import {
  calcularHorario,
  formatearFecha,
  obtenerNombreAlumnos,
  obtenerNombreMes,
} from "./utils";

type DatosPdfIQL = {
  mes: string;
  clasesParaClub: Clase[];
  clasesPropiasIQL: Clase[];
  totalClub: number;
  totalAlquiler: number;
  saldoIQL: number;
  totalHorasClub: number;
  totalHorasPropias: number;
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

  const blob = await respuesta.blob();

  return new Promise<string>(
    (resolve, reject) => {
      const lector = new FileReader();

      lector.onloadend = () => {
        resolve(
          lector.result as string
        );
      };

      lector.onerror = reject;

      lector.readAsDataURL(blob);
    }
  );
}

export async function generarPdfIQL({
  mes,
  clasesParaClub,
  clasesPropiasIQL,
  totalClub,
  totalAlquiler,
  saldoIQL,
  totalHorasClub,
  totalHorasPropias,
}: DatosPdfIQL) {
  const doc = new jsPDF({
    orientation: "portrait",
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

  const rojo: ColorRGB = [
    220,
    38,
    38,
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

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const margen = 15;
  const anchoContenido =
    anchoPagina - margen * 2;

  const logo =
    await cargarLogoBase64();

  function dibujarEncabezado() {
    doc.addImage(
      logo,
      "PNG",
      margen,
      11,
      31,
      26
    );

    doc.setTextColor(...turquesa);
    doc.setFont(
      "helvetica",
      "bold"
    );
    doc.setFontSize(9);

    doc.text(
      "ESPACIO PÁDEL ACADEMY",
      52,
      17
    );

    doc.setTextColor(...oscuro);
    doc.setFontSize(19);

    doc.text(
      "Liquidación mensual",
      52,
      27
    );

    doc.setFontSize(12);
    doc.setTextColor(...gris);

    doc.text(
      "IQL",
      52,
      34
    );

    doc.setFillColor(...grisClaro);
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
    doc.setFontSize(7.5);
    doc.setTextColor(...gris);

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
    doc.setFontSize(10.5);
    doc.setTextColor(...oscuro);

    doc.text(
      obtenerNombreMes(mes),
      anchoPagina - 20,
      27,
      {
        align: "right",
      }
    );

    doc.setDrawColor(...turquesa);
    doc.setLineWidth(0.8);

    doc.line(
      margen,
      44,
      anchoPagina - margen,
      44
    );
  }

  function nuevaPaginaConEncabezado() {
    doc.addPage();
    dibujarEncabezado();
    return 55;
  }

  dibujarEncabezado();

  let y = 57;

  doc.setFont(
    "helvetica",
    "normal"
  );
  doc.setFontSize(7.5);
  doc.setTextColor(...gris);

  doc.text(
    "SERVICIOS PARA EL CLUB",
    margen,
    y
  );

  doc.setFont(
    "helvetica",
    "bold"
  );
  doc.setFontSize(13);
  doc.setTextColor(...oscuro);

  doc.text(
    "Clases impartidas para IQL",
    margen,
    y + 7
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...turquesaOscuro);

  doc.text(
    "IQL DEBE ABONAR",
    anchoPagina - margen,
    y,
    {
      align: "right",
    }
  );

  doc.setFontSize(15);
  doc.setTextColor(...turquesa);

  doc.text(
    `${totalClub.toFixed(2)} €`,
    anchoPagina - margen,
    y + 8,
    {
      align: "right",
    }
  );

  y += 15;

  if (clasesParaClub.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: {
        left: margen,
        right: margen,
        top: 55,
        bottom: 15,
      },
      head: [
        [
          "Fecha",
          "Horario",
          "Alumnos",
          "Importe",
        ],
      ],
      body: clasesParaClub.map(
        (clase) => [
          formatearFecha(
            clase.fecha
          ),
          calcularHorario(
            clase.hora_inicio,
            clase.duracion_minutos
          ),
          obtenerNombreAlumnos(
            clase
          ) || "Sin alumnos",
          `${Number(
            clase.importe_club || 0
          ).toFixed(2)} €`,
        ]
      ),
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.5,
        textColor: oscuro,
        lineColor: borde,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: oscuro,
        textColor: blanco,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: grisClaro,
      },
      columnStyles: {
        0: {
          cellWidth: 25,
        },
        1: {
          cellWidth: 40,
        },
        2: {
          cellWidth: "auto",
        },
        3: {
          cellWidth: 25,
          textColor: turquesa,
          fontStyle: "bold",
        },
      },

      didParseCell: (data) => {
        if (data.section === "head") {
          data.cell.styles.halign = "center";
        }

        if (data.section === "body") {
          if (
            data.column.index === 0 ||
            data.column.index === 1 ||
            data.column.index === 3
          ) {
            data.cell.styles.halign = "center";
          }

          if (data.column.index === 2) {
            data.cell.styles.halign = "left";
          }
        }
      },

      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          dibujarEncabezado();
        }
      },
    });

    y =
      (
        doc as jsPDF & {
          lastAutoTable: {
            finalY: number;
          };
        }
      ).lastAutoTable.finalY + 6;
  } else {
    doc.setFillColor(...grisClaro);
    doc.setDrawColor(...borde);

    doc.roundedRect(
      margen,
      y,
      anchoContenido,
      18,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );
    doc.setFontSize(9);
    doc.setTextColor(...gris);

    doc.text(
      "No hay clases para IQL registradas en este mes.",
      anchoPagina / 2,
      y + 11,
      {
        align: "center",
      }
    );

    y += 24;
  }

  doc.setFont(
    "helvetica",
    "normal"
  );
  doc.setFontSize(8);
  doc.setTextColor(...gris);

  const resumenClub =
    `Clases: ${clasesParaClub.length}    Horas: ${totalHorasClub.toFixed(
      1
    )}    Total: ${totalClub.toFixed(
      2
    )} €`;

  doc.text(
    resumenClub,
    anchoPagina - margen,
    y,
    {
      align: "right",
    }
  );

  y += 16;

  if (y > altoPagina - 85) {
    y =
      nuevaPaginaConEncabezado();
  }

  doc.setFontSize(7.5);
  doc.setTextColor(...gris);

  doc.text(
    "USO DE INSTALACIONES",
    margen,
    y
  );

  doc.setFont(
    "helvetica",
    "bold"
  );
  doc.setFontSize(13);
  doc.setTextColor(...oscuro);

  doc.text(
    "Clases propias en IQL",
    margen,
    y + 7
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...rojo);

  doc.text(
    "A PAGAR A IQL",
    anchoPagina - margen,
    y,
    {
      align: "right",
    }
  );

  doc.setFontSize(15);

  doc.text(
    `${totalAlquiler.toFixed(2)} €`,
    anchoPagina - margen,
    y + 8,
    {
      align: "right",
    }
  );

  y += 15;

  if (
    clasesPropiasIQL.length > 0
  ) {
    autoTable(doc, {
      startY: y,
      margin: {
        left: margen,
        right: margen,
        top: 55,
        bottom: 15,
      },
      head: [
        [
          "Fecha",
          "Horario",
          "Importe",
        ],
      ],
      body: clasesPropiasIQL.map(
        (clase) => [
          formatearFecha(
            clase.fecha
          ),
          calcularHorario(
            clase.hora_inicio,
            clase.duracion_minutos
          ),
          `${Number(
            clase.coste_pista || 0
          ).toFixed(2)} €`,
        ]
      ),
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.5,
        textColor: oscuro,
        lineColor: borde,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: oscuro,
        textColor: blanco,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: grisClaro,
      },
      columnStyles: {
        0: {
          cellWidth: 25,
        },
        1: {
          cellWidth: "auto",
        },
        2: {
          cellWidth: 25,
          textColor: rojo,
          fontStyle: "bold",
        },
      },

      didParseCell: (data) => {
        data.cell.styles.halign = "center";
      },

      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          dibujarEncabezado();
        }
      },
    });

    y =
      (
        doc as jsPDF & {
          lastAutoTable: {
            finalY: number;
          };
        }
      ).lastAutoTable.finalY + 6;
  } else {
    doc.setFillColor(...grisClaro);
    doc.setDrawColor(...borde);

    doc.roundedRect(
      margen,
      y,
      anchoContenido,
      18,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );
    doc.setFontSize(9);
    doc.setTextColor(...gris);

    doc.text(
      "No hay clases propias en IQL registradas en este mes.",
      anchoPagina / 2,
      y + 11,
      {
        align: "center",
      }
    );

    y += 24;
  }

  doc.setFont(
    "helvetica",
    "normal"
  );
  doc.setFontSize(8);
  doc.setTextColor(...gris);

  const resumenPropias =
    `Clases: ${clasesPropiasIQL.length}    Horas: ${totalHorasPropias.toFixed(
      1
    )}    Total: ${totalAlquiler.toFixed(
      2
    )} €`;

  doc.text(
    resumenPropias,
    anchoPagina - margen,
    y,
    {
      align: "right",
    }
  );

  y += 16;

  if (y > altoPagina - 45) {
    y =
      nuevaPaginaConEncabezado();
  }

  const anchoColumna =
    anchoContenido / 3;

  const altoResumen =
    20;

  doc.setFillColor(...grisClaro);

  doc.roundedRect(
    margen,
    y,
    anchoContenido,
    altoResumen,
    3,
    3,
    "F"
  );

  doc.setFillColor(...turquesa);

  doc.roundedRect(
    margen + anchoColumna * 2,
    y,
    anchoColumna,
    altoResumen,
    3,
    3,
    "F"
  );

  doc.setDrawColor(...borde);
  doc.setLineWidth(0.2);

  doc.line(
    margen + anchoColumna,
    y,
    margen + anchoColumna,
    y + altoResumen
  );

  doc.setFont(
    "helvetica",
    "normal"
  );
  doc.setFontSize(7.5);
  doc.setTextColor(...gris);

  doc.text(
    "IQL debe abonar",
    margen + 7,
    y + 6
  );

  doc.setFont(
    "helvetica",
    "bold"
  );
  doc.setFontSize(14);
  doc.setTextColor(...turquesa);

  doc.text(
    `${totalClub.toFixed(2)} €`,
    margen + 7,
    y + 15
  );

  doc.setFont(
    "helvetica",
    "normal"
  );
  doc.setFontSize(7.5);
  doc.setTextColor(...gris);

  doc.text(
    "A pagar a IQL",
    margen + anchoColumna + 7,
    y + 6
  );

  doc.setFont(
    "helvetica",
    "bold"
  );
  doc.setFontSize(14);
  doc.setTextColor(...rojo);

  doc.text(
    `- ${totalAlquiler.toFixed(2)} €`,
    margen + anchoColumna + 7,
    y + 15
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...blanco);

  doc.text(
    "SALDO FINAL",
    anchoPagina - margen - 7,
    y + 6,
    {
      align: "right",
    }
  );

  doc.setFontSize(15);
  doc.setTextColor(...oscuro);

  doc.text(
    `${saldoIQL.toFixed(2)} €`,
    anchoPagina - margen - 7,
    y + 15,
    {
      align: "right",
    }
  );

  const totalPaginas =
    doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina++
  ) {
    doc.setPage(pagina);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);
    doc.setTextColor(...gris);

    doc.text(
      `${pagina}/${totalPaginas}`,
      anchoPagina / 2,
      altoPagina - 7,
      {
        align: "center",
      }
    );
  }

  doc.save(
    `Liquidacion_IQL_${mes}.pdf`
  );
}