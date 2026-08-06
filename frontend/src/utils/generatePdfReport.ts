import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaDescriptiva } from './generatePdfMemoriaDescriptiva';
import { generatePdfMemoriaCalculo } from './generatePdfMemoriaCalculo';

/**
 * Genera y descarga la Carpeta Técnica Completa en formato PDF.
 * Incluye la Memoria Descriptiva Enriquecida y la Memoria de Cálculo Paso a Paso.
 */
export const generatePdfReport = (project: Project, overrideCaratula?: DatosCaratula): void => {
  // Descargar la Memoria Descriptiva Enriquecida
  generatePdfMemoriaDescriptiva(project, overrideCaratula);
  
  // Descargar la Memoria de Cálculo Paso a Paso
  generatePdfMemoriaCalculo(project, overrideCaratula);
};

export { generatePdfMemoriaDescriptiva, generatePdfMemoriaCalculo };
