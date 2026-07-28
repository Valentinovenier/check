import { Project, Conductor, Canalizacion } from '../../../types/project';

/**
 * Servicio para gestionar la lógica de canalizaciones y agrupamiento de circuitos.
 */

export const getCircuitosPorCanalizacion = (project: Project, canalizacionId: string): any[] => {
  // Buscamos la canalización
  const canalizacion = project.canalizaciones?.find(c => c.id === canalizacionId);
  if (!canalizacion) return [];

  // En proyectos de vivienda, los circuitos están en datosVivienda.circuitosCalculados
  // y la canalización referencia a estos circuitos mediante sus IDs.
  if (project.projectType === 'Vivienda' && project.datosVivienda?.circuitosCalculados) {
      return project.datosVivienda.circuitosCalculados.filter(
        (c: any) => canalizacion.circuitosIds.includes(c.id)
      );
  }

  // Comportamiento para proyectos industriales
  return (project.informeConductores || []).filter(
    (c: any) => canalizacion.circuitosIds.includes(c.id)
  );
};

export const calcularFactorAgrupamiento = (
  nCircuitos: number,
  tipoInstalacion: 'Monofásica' | 'Trifásica'
): number => {
  // Factores de agrupamiento según tabla AEA:
  // Monofásicos (2 circuitos -> 4 cables): 0.80
  // Monofásicos (3 circuitos -> 6 cables): 0.70
  // Trifásicos (2 circuitos -> 6 cables): 0.80
  // Trifásicos (3 circuitos -> 9 cables): 0.70

  if (nCircuitos <= 1) return 1.0;

  if (tipoInstalacion === 'Monofásica') {
    if (nCircuitos === 2) return 0.80;
    if (nCircuitos >= 3) return 0.70;
  } else {
    // Trifásica
    if (nCircuitos === 2) return 0.80;
    if (nCircuitos >= 3) return 0.70;
  }
  
  return 0.7; // Factor conservador
};
