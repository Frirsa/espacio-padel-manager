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

type ColorRGB = [number, number, number];

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

export async function generarPdfIQLSimplificado(
  datos: DatosPdfIQL
) {
  const {
    mes,
    clasesParaClub,
    clasesPropiasIQL,
    saldoIQL,
  } = datos;

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

  const saldoPositivo: ColorRGB = [
    16,
    185,
    129,
  ];

  const saldoNegativo: ColorRGB = [
    239,
    68,
    68,
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

    doc.setTextColor(
      ...turquesa
    );
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

    doc.setTextColor(
      ...oscuro
    );
    doc.setFontSize(19);

    doc.text(
      "Liquidación mensual",
      52,
      27
    );

    doc.setFontSize(12);
    doc.setTextColor(
      ...gris
    );

    doc.text(
      "IQL",
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
    doc.setFontSize(7.5);
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
    doc.setFontSize(10.5);
    doc.setTextColor(
      ...oscuro
    );

    doc.text(
      obtenerNombreMes(mes),
      anchoPagina - 20,
      27,
      {
        align: "right",
      }
    );

    doc.setDrawColor(
      ...turquesa
    );
    doc.setLineWidth(0.8);

    doc.line(
      margen,
      44,
      anchoPagina - margen,
      44
    );
  }

  function prepararNuevaPagina() {
    doc.addPage();
    dibujarEncabezado();
    return 55;
  }

  function dibujarTituloSeccion(
    etiqueta: string,
    titulo: string,
    y: number
  ) {
    doc.setFont(
      "helvetica",
      "normal"
    );
    doc.setFontSize(7.5);
    doc.setTextColor(
      ...gris
    );

    doc.text(
      etiqueta,
      margen,
      y
    );

    doc.setFont(
      "helvetica",
      "bold"
    );
    doc.setFontSize(13);
    doc.setTextColor(
      ...oscuro
    );

    doc.text(
      titulo,
      margen,
      y + 7
    );

    return y + 15;
  }

  dibujarEncabezado();

  let y = 57;

  y = dibujarTituloSeccion(
    "SERVICIOS PARA EL CLUB",
    "Clases impartidas para IQL",
    y
  );

  if (
    clasesParaClub.length > 0
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
          "Alumnos",
          "Importe",
        ],
      ],
      body:
        clasesParaClub.map(
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
              clase.importe_club ||
                0
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
        valign: "middle",
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
          cellWidth:
            anchoContenido -
            25 -
            40 -
            25,
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
        if (
          data.pageNumber > 1
        ) {
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
      ).lastAutoTable.finalY + 10;
  } else {
    doc.setFillColor(
      ...grisClaro
    );
    doc.setDrawColor(
      ...borde
    );

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
    doc.setTextColor(
      ...gris
    );

    doc.text(
      "No hay clases para IQL registradas en este mes.",
      anchoPagina / 2,
      y + 11,
      {
        align: "center",
      }
    );

    y += 28;
  }

  if (
    y >
    altoPagina - 70
  ) {
    y = prepararNuevaPagina();
  }

  y = dibujarTituloSeccion(
    "USO DE INSTALACIONES",
    "Clases propias en IQL",
    y
  );

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
      body:
        clasesPropiasIQL.map(
          (clase) => [
            formatearFecha(
              clase.fecha
            ),
            calcularHorario(
              clase.hora_inicio,
              clase.duracion_minutos
            ),
            `${Number(
              clase.coste_pista ||
                0
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
        valign: "middle",
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
          cellWidth:
            anchoContenido -
            25 -
            25,
        },
        2: {
          cellWidth: 25,
          textColor: rojo,
          fontStyle: "bold",
        },
      },
      didParseCell: (data) => {
        if (data.section === "head") {
          data.cell.styles.halign = "center";
        }

        if (data.section === "body") {
          data.cell.styles.halign = "center";
        }
      },
      didDrawPage: (data) => {
        if (
          data.pageNumber > 1
        ) {
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
      ).lastAutoTable.finalY + 10;
  } else {
    doc.setFillColor(
      ...grisClaro
    );
    doc.setDrawColor(
      ...borde
    );

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
    doc.setTextColor(
      ...gris
    );

    doc.text(
      "No hay clases propias en IQL registradas en este mes.",
      anchoPagina / 2,
      y + 11,
      {
        align: "center",
      }
    );

    y += 28;
  }

  if (
    y >
    altoPagina - 45
  ) {
    y = prepararNuevaPagina();
  }

  const textoSaldo =
    saldoIQL > 0
      ? "Saldo a favor de Espacio Pádel Academy"
      : saldoIQL < 0
        ? "Saldo a favor de IQL"
        : "Saldo final";

  const colorSaldo =
    saldoIQL > 0
      ? saldoPositivo
      : saldoIQL < 0
        ? saldoNegativo
        : blanco;

  doc.setFillColor(
    ...oscuro
  );

  doc.roundedRect(
    margen,
    y,
    anchoContenido,
    27,
    3,
    3,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );
  doc.setFontSize(9);
  doc.setTextColor(
    203,
    213,
    225
  );

  doc.text(
    textoSaldo,
    anchoPagina / 2,
    y + 9,
    {
      align: "center",
    }
  );

  doc.setFontSize(18);
  doc.setTextColor(
    ...colorSaldo
  );

  doc.text(
    `${Math.abs(
      saldoIQL
    ).toFixed(2)} €`,
    anchoPagina / 2,
    y + 21,
    {
      align: "center",
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
    doc.setTextColor(
      ...gris
    );

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
    `Liquidacion_IQL_${mes}_simplificada.pdf`
  );
}
