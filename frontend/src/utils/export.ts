import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";

/** Descarga un CSV con encabezado UTF-8 (compatible con Excel). */
export function exportarCSV(nombre: string, columnas: string[], filas: Array<Array<string | number>>): void {
  const escapar = (v: string | number): string => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenido = `﻿${columnas.map(escapar).join(";")}\n${filas.map((f) => f.map(escapar).join(";")).join("\n")}`;
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta una tabla a PDF con encabezado del sistema y fecha. */
export function exportarPDF(
  nombre: string,
  titulo: string,
  columnas: string[],
  filas: Array<Array<string | number>>,
): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("DSS-Becas · Bienestar Universitario", 14, 16);
  doc.setFontSize(11);
  doc.text(titulo, 14, 24);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 14, 30);
  autoTable(doc, { head: [columnas], body: filas, startY: 34 });
  doc.save(nombre);
}
