import { Conductor, Project, CircuitoTerminal } from '../../../types/project';
import { CondicionesTramoResidencial, TipoCircuito } from '../../../types/vivienda';
import { getCircuitoNominalCurrent, getTableroNominalCurrent } from './corriente';

export const adaptarConductorACondiciones = (
  conductor: Conductor,
  project: Project
): CondicionesTramoResidencial => {
  const canalizacion = project.canalizaciones?.find(c => c.id === conductor.canalizacionId);
  const normaCable = canalizacion?.normaCable || conductor.normaCable || 'IRAM 2178';

  let canalizacionId = conductor.canalizacionId;
  let corrienteDiseño = 16; // Fallback
  const targetId = (conductor as any).destinoId || (conductor as any).tramoId;

  let tipoTramo = conductor.tipoTramo;
  let tipoCircuito = conductor.tipoCircuito;
  
  if (project.datosVivienda) {
      // 1. Buscar si targetId corresponde a un circuito calculado
      const circuito = targetId 
        ? project.datosVivienda.circuitosCalculados?.find(c => c.id === targetId)
        : undefined;

      if (circuito || tipoTramo === 'CircuitoTerminal') {
          tipoTramo = 'CircuitoTerminal';
          const circ = circuito || (targetId ? project.datosVivienda.circuitosCalculados?.find(c => c.id === targetId) : undefined);
          console.log('[DEBUG] Adaptador - Conductor:', conductor, 'CircuitoEncontrado:', !!circ, 'CircuitoCanalizacionId:', (circ as any)?.canalizacionId);
          if (circ) {
              tipoCircuito = (circ.tipo as TipoCircuito) || tipoCircuito;
              corrienteDiseño = getCircuitoNominalCurrent(circ as unknown as CircuitoTerminal, project);
              // CRUCIAL: Si no está en el conductor, buscar en el objeto circuito
              if (!canalizacionId) {
                  canalizacionId = (circ as any).canalizacionId;
              }
          }
      } else if (tipoTramo === 'LineaPrincipal' || targetId === 'tp' || targetId === 'int-general-salida') {
          tipoTramo = 'LineaPrincipal';
          corrienteDiseño = getTableroNominalCurrent(project.tableroPrincipal, project);
      } else if (tipoTramo === 'LineaSeccional' || project.datosVivienda.tableros?.some(t => t.id === targetId)) {
          tipoTramo = 'LineaSeccional';
          const tableroDestino = project.datosVivienda.tableros?.find(t => t.id === targetId);
          if (tableroDestino) {
              const baseTablero: any = {
                  id: tableroDestino.id,
                  nombre: tableroDestino.nombre,
                  tipo: tableroDestino.tipo,
                  circuitosTerminales: project.datosVivienda.circuitosCalculados?.filter(c => tableroDestino.circuitosIds?.includes(c.id)) || [],
                  subTableros: []
              };
              corrienteDiseño = getTableroNominalCurrent(baseTablero, project);
          } else {
              corrienteDiseño = getTableroNominalCurrent(project.tableroPrincipal, project);
          }
      }
  }

  return {
    tipoTramo: (tipoTramo as 'LineaPrincipal' | 'LineaSeccional' | 'CircuitoTerminal') || 'CircuitoTerminal',
    tipoCircuito: (tipoCircuito as TipoCircuito) || 'iluminacion_usos_generales',
    metodoInstalacion: conductor.metodoInstalacion || 'B1',
    longitudMetros: conductor.longitud || 0,
    corrienteDiseñoAmperes: corrienteDiseño,
    temperaturaAmbiente: conductor.temperaturaAmbiente || project.tempAmbiente || 40,
    tempSuelo: conductor.tempSuelo || 25,
    canalizacionId: canalizacionId, // Usar el ID recuperado
    tipoInstalacion: project.tipoInstalacion || 'Monofásica',
    resistividadTermica: conductor.resistividadTermica || 2.5, // Default a 2.5 para métodos D
    separacionBordes: conductor.separacionBordes,
    normaCable: normaCable as any,
    caidaMaxPermitida: conductor.caidaMaxPermitida ?? 3.0
  };
};
