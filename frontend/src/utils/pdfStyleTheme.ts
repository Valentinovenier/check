import jsPDF from 'jspdf';

export const PDF_COLORS = {
  primary: [30, 58, 138],     // Deep Navy #1E3A8A (Azul Institucional Formal)
  primaryAccent: [4, 120, 87], // Emerald #047857 (Verde Acento Técnico)
  burgundy: [112, 26, 30],    // Vino Tinto Formal #701A1E
  dark: [30, 41, 59],         // Slate 800 #1E293B
  text: [51, 65, 85],         // Slate 700 #334155
  subtext: [100, 116, 139],   // Slate 500 #64748B
  lightBg: [248, 250, 252],   // Slate 50 #F8FAFC
  border: [226, 232, 240],    // Slate 200 #E2E8F0
  tableHead: [30, 41, 59],    // Slate 800
};

export const PDF_FONTS = {
  family: 'helvetica',
  titleSize: 16,
  subtitleSize: 11,
  sectionHeadingSize: 11,
  subHeadingSize: 9.5,
  bodySize: 8.5,
  smallSize: 7.5,
  footerSize: 7.5,
};

/**
 * Limpia y normaliza cadenas de fórmula matemática para evitar glifos Unicode corruptos en jsPDF.
 */
export const cleanMathFormula = (text: string): string => {
  return text
    .replace(/√3/g, 'sqrt(3)')
    .replace(/√/g, 'sqrt')
    .replace(/φ/g, 'phi')
    .replace(/θ/g, 'theta')
    .replace(/ΔV/g, 'dV')
    .replace(/Δ/g, 'd')
    .replace(/“|”/g, '"')
    .replace(/’|'/g, "'")
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/×/g, '*')
    .replace(/Ω/g, 'Ohm')
    .replace(/µ/g, 'u');
};

/**
 * Agrega un encabezado y pie de página institucional formal en cada página del documento PDF.
 */
export const drawHeaderFooter = (
  doc: jsPDF,
  currentPage: number,
  totalPages: number,
  documentTitle: string,
  projectName: string
) => {
  if (currentPage === 1) return; // La carátula no lleva encabezado superior

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.setTextColor(PDF_COLORS.subtext[0], PDF_COLORS.subtext[1], PDF_COLORS.subtext[2]);

  // Encabezado Superior
  doc.text(documentTitle.toUpperCase(), marginLeft, 10);
  doc.text(`OBRA: ${projectName.toUpperCase()}`, pageWidth - marginRight, 10, { align: 'right' });
  
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, 12, pageWidth - marginRight, 12);

  // Pie de Página Inferior
  doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);
  doc.text(`Memoria Técnica Oficial - Conforme Reglamentación AEA 90364`, marginLeft, pageHeight - 7);
  doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
};
