import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Pago } from "./tipos";

import {
  formatearFecha,
  obtenerNombreMes,
} from "./utils";

type DatosPdfPendientes = {
  mes: string;
  pagosPendientes: Pago[];
  totalPendiente: number;
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

function nombrePagoPendiente(
  pago: Pago
) {
  if (pago.alumnos) {
    return `${pago.alumnos.nombre} ${
      pago.alumnos.apellidos || ""
    }`.trim();
  }

  if (
    pago.clases?.modo_cobro ===
    "total"
  ) {
    const nombres =
      (
        pago.clases.clase_alumnos ||
        []
      )
        .map(
          (item) =>
            item.alumnos
              ? `${item.alumnos.nombre} ${
                  item.alumnos.apellidos || ""
                }`.trim()
              : ""
        )
        .filter(Boolean);

    return nombres.length > 0
      ? `Clase completa · ${nombres.join(" + ")}`
      : "Clase completa";
  }

  return "Sin alumno";
}

export async function generarPdfPendientes({
  mes,
  pagosPendientes,
  totalPendiente,
}: DatosPdfPendientes) {
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

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const altoPagina =
    doc.internal.pageSize.getHeight();

  const margen = 15;

  const logo =
    await cargarLogoBase64();

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
    "Pendientes de cobro",
    52,
    27
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  doc.setTextColor(
    ...gris
  );

  doc.text(
    obtenerNombreMes(mes),
    52,
    34
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

  doc.setFillColor(
    254,
    242,
    242
  );

  doc.roundedRect(
    anchoPagina - 65,
    53,
    50,
    24,
    3,
    3,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(
    ...rojo
  );

  doc.text(
    "TOTAL PENDIENTE",
    anchoPagina - 20,
    61,
    {
      align: "right",
    }
  );

  doc.setFontSize(17);

  doc.text(
    `${totalPendiente.toFixed(2)} €`,
    anchoPagina - 20,
    71,
    {
      align: "right",
    }
  );

  let y = 87;

  if (
    pagosPendientes.length === 0
  ) {
    doc.setFillColor(
      ...grisClaro
    );

    doc.setDrawColor(
      ...borde
    );

    doc.roundedRect(
      margen,
      y,
      anchoPagina - margen * 2,
      22,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
      ...gris
    );

    doc.text(
      "No existen pagos pendientes en este periodo.",
      anchoPagina / 2,
      y + 13,
      {
        align: "center",
      }
    );
  } else {
    autoTable(doc, {
      startY: y,
      margin: {
        left: margen,
        right: margen,
      },
      head: [
        [
          "Alumno / clase",
          "Fecha",
          "Método",
          "Importe",
        ],
      ],
      body:
        pagosPendientes.map(
          (pago) => [
            nombrePagoPendiente(
              pago
            ),

            formatearFecha(
              pago.fecha_pago
            ),

            pago.metodo ||
              "Sin especificar",

            `${Number(
              pago.importe || 0
            ).toFixed(2)} €`,
          ]
        ),
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.8,
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
          cellWidth: "auto",
        },
        1: {
          cellWidth: 30,
        },
        2: {
          cellWidth: 32,
        },
        3: {
          cellWidth: 28,
          halign: "right",
          textColor: rojo,
          fontStyle: "bold",
        },
      },
    });
  }

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
    `Pendientes_Cobro_${mes}.pdf`
  );
}
