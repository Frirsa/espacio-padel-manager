import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { construirInformeGestoria } from "../../lib/informe-gestoria";

const euros = (n: number) => new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(n) + " EUR";
const fecha = (valor: string | null) => valor ? valor.split("-").reverse().join("/") : "-";

export function generarPdfGestoria(mes: string, informe: ReturnType<typeof construirInformeGestoria>) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margen = 13;
  doc.setTextColor(23, 50, 77);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Espacio Padel Academy | Informe mensual para gestoria", margen, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Periodo: ${mes}  |  Fecha de referencia: clase impartida`, margen, 25);
  doc.text(`Cobrado: ${euros(informe.cobrado)}   Bono imputado: ${euros(informe.bonoImputado)}   Pendiente: ${euros(informe.pendiente)}   Por revisar: ${euros(informe.porRevisar)}   Pistas: ${euros(informe.totalGastos)}`, margen, 32);

  autoTable(doc, {
    startY: 39, margin: { left: margen, right: margen },
    head: [["Fecha clase", "Ubicacion", "Alumno / concepto", "Importe", "Estado", "Forma", "Fecha cobro"]],
    body: informe.ingresos.map((l) => [
      `${fecha(l.fecha)} ${l.hora.slice(0, 5)}`, l.ubicacion, l.concepto,
      euros(l.importe), l.estado, l.metodo, fecha(l.fechaCobro),
    ]),
    theme: "grid", styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [23, 50, 77] },
    columnStyles: { 0: { cellWidth: 31 }, 1: { cellWidth: 34 }, 2: { cellWidth: 70 },
      3: { cellWidth: 28, halign: "right" }, 4: { cellWidth: 24 },
      5: { cellWidth: 53 }, 6: { cellWidth: 28 } },
  });

  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 11;
  if (y > 174) { doc.addPage(); y = 17; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Costes de pista por ubicacion", margen, y);
  autoTable(doc, {
    startY: y + 4, margin: { left: margen, right: margen },
    head: [["Fecha clase", "Ubicacion", "Coste registrado"]],
    body: [
      ...informe.gastos.map((g) => [`${fecha(g.fecha)} ${g.hora.slice(0, 5)}`, g.ubicacion, euros(g.importe)]),
      ...informe.gastosPorUbicacion.map((g) => ["Total ubicacion", g.ubicacion, euros(g.total)]),
    ],
    theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [0, 167, 156] },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 110 }, 2: { cellWidth: 40, halign: "right" } },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  if (y > 180) { doc.addPage(); y = 17; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const nota = "Bonos: valor imputado a la clase, sin sumar la compra. Costes de pista: fecha de clase; pago y justificante no registrados. Este detalle no calcula base ni cuota de IVA; verificar con la gestoria y las facturas.";
  doc.text(doc.splitTextToSize(nota, 265), margen, y);

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setTextColor(110, 120, 130);
    doc.setFontSize(8);
    doc.text(`${p} / ${paginas}`, 280, 202, { align: "right" });
  }
  doc.save(`Espacio-Padel-informe-gestoria-${mes}.pdf`);
}
