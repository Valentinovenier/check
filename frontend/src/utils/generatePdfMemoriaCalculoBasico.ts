import jsPDF from 'jspdf';
import { Project, DatosCaratula } from '../types/project';
import { PDF_COLORS, PDF_FONTS, drawHeaderFooter } from './pdfStyleTheme';

/**
 * Genera un informe de cálculo simplificado para el plan básico.
 */
export const generatePdfMemoriaCalculoBasico = (project: Project, overrideCaratula?: DatosCaratula): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  
  // Encabezado básico
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.titleSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('INFORME DE CÁLCULO - PLAN BÁSICO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.text(`Proyecto: ${project.name}`, marginLeft, 40);
  
  // TODO: Implementar la lógica para extraer y mostrar los pasos de cálculo aquí
  doc.text('Resultados de los cálculos paso a paso:', marginLeft, 50);

  doc.save(`Informe_Basico_${project.name.replace(/\s+/g, '_')}.pdf`);
};
