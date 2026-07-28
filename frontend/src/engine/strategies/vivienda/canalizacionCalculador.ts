import { Project, Canalizacion } from '../../../types/project';
import { calcularConductorTramo } from '../industrial/calculadorTramo';
import { CondicionesTramo } from '../../../types/project';
import { getCircuitosPorCanalizacion } from '../industrial/canalizacionService';
import { getFactorAgrupamientoVivienda } from './agrupamientoProvider';

/**
 * Calcula todas las secciones de conductores en una canalización de forma iterativa
 * usando el motor general de cálculo (apto para AEA Parte 5).
 */
export const calcularCanalizacionIterativa = (
  project: Project,
  canalizacion: Canalizacion,
  tramosEnCanalizacion: { id: string, condiciones: CondicionesTramo & { ib: number, longitudKm: number, ik: number, tApertura: number, cosPhi: number, caidaMax: number }, catalogo: any[] }[]
) => {
  console.log('[DEBUG] Ejecutando calcularCanalizacionIterativa para canalizacion:', canalizacion.id);
  let seccionesActuales: Record<string, number> = {};
  let convergio = false;
  let iteraciones = 0;
  const MAX_ITERACIONES = 10;

  // 1. Obtener número de circuitos real desde la topología
  const nCircuitos = canalizacion.cantidadCircuitos || 1;
  const tempAmbiente = project.tempAmbiente || 30;

  while (!convergio && iteraciones < MAX_ITERACIONES) {
    convergio = true;
    
    tramosEnCanalizacion.forEach(({ id, condiciones, catalogo }) => {
      // Determinar si el tramo es 'al aire' o 'subterráneo' basado en su método
      const esAire = !(condiciones.metodoInstalacion ?? '').toLowerCase().includes('d');

      // 2. Preparar condiciones con el agrupamiento automático
      const condicionesConAgrupamiento = { 
          ...condiciones, 
          norma: '5', 
          agrupamiento: nCircuitos,
          tipoInstalacion: condiciones.tipoInstalacion || project.tipoInstalacion || 'Trifásica',
          tipoCable: (condiciones as any).tipoCable, // Ajuste para cumplir el tipo
          customFactorAgrupamiento: getFactorAgrupamientoVivienda // Inyectar lógica de vivienda
      };
      
      // 3. Usar el motor robusto existente
      const resultado = calcularConductorTramo(
          condicionesConAgrupamiento,
          condiciones.ib,
          condiciones.ik,
          condiciones.tApertura,
          condiciones.longitudKm,
          condiciones.cosPhi,
          condiciones.caidaMax,
          catalogo,
          tempAmbiente,
          esAire
      );
      
      // 2. Verificar si hubo cambio de sección
      const nuevaSeccion = resultado.cable?.seccion;
      if (nuevaSeccion && seccionesActuales[id] !== nuevaSeccion) {
        seccionesActuales[id] = nuevaSeccion;
        convergio = false; // Requiere otra pasada
      }
    });
    
    iteraciones++;
  }

  return {
    iteraciones,
    convergenciaLograda: convergio,
    resultados: seccionesActuales
  };
};
