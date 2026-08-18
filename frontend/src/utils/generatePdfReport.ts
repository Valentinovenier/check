import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaCalculoBasico } from './generatePdfMemoriaCalculoBasico';

/**
 * Genera y descarga el Legajo Técnico Completo en formato PDF.
 */
export const generatePdfReport = (project: Project, overrideCaratula?: DatosCaratula): void => {
  generatePdfMemoriaCalculoBasico(project, overrideCaratula, true);
};

export { generatePdfMemoriaCalculoBasico };

