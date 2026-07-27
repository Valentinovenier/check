import { Conductor, Project, CircuitoTerminal } from '../../../types/project';
import { CondicionesTramoResidencial, TipoCircuito } from '../../../types/vivienda';
import { getCircuitoNominalCurrent, getTableroNominalCurrent } from './corriente';

export const adaptarConductorACondiciones = (
  conductor: Conductor,
  project: Project
): CondicionesTramoResidencial => {
  const canalizacion = project.canalizaciones?.find(c => c.id === conductor.canalizacionId);
  const normaCable = canalizacion?.normaCable || conductor.normaCable || 'IRAM 2178';

  let corrienteDiseño = 16; // Fallback
  
  if (project.datosVivienda) {
      if (conductor.tipoTramo === 'LineaPrincipal') {
          corrienteDiseño = getTableroNominalCurrent(project.tableroPrincipal, project);
      } else if (conductor.tipoTramo === 'LineaSeccional') {
          // Intentar encontrar el tablero destino o usar el principal como fallback
          const destinoId = (conductor as any).destinoId;
          const tableroDestino = project.datosVivienda.tableros?.find(t => t.id === destinoId);
          if (tableroDestino) {
              // Convertir TableroVivienda a BaseTablero para la función
              const baseTablero: any = {
                  id: tableroDestino.id,
                  nombre: tableroDestino.nombre,
                  tipo: tableroDestino.tipo,
                  circuitosTerminales: [],
                  subTableros: []
              };
              corrienteDiseño = getTableroNominalCurrent(baseTablero, project);
          } else {
              corrienteDiseño = getTableroNominalCurrent(project.tableroPrincipal, project);
          }
      } else if (conductor.tipoTramo === 'CircuitoTerminal' && (conductor as any).destinoId) {
          const circuitoId = (conductor as any).destinoId;
          const circuito = project.datosVivienda.circuitosCalculados?.find(c => c.id === circuitoId);
          if (circuito) {
              corrienteDiseño = getCircuitoNominalCurrent(circuito as unknown as CircuitoTerminal, project);
          }
      }
  }

  return {
    tipoTramo: conductor.tipoTramo as 'LineaPrincipal' | 'LineaSeccional' | 'CircuitoTerminal',
    tipoCircuito: (conductor.tipoCircuito as TipoCircuito) || 'iluminacion_usos_generales',
    metodoInstalacion: conductor.metodoInstalacion || 'B1',
    longitudMetros: conductor.longitud || 0,
    corrienteDiseñoAmperes: corrienteDiseño,
    temperaturaAmbiente: conductor.temperaturaAmbiente || project.tempAmbiente || 40,
    canalizacionId: conductor.canalizacionId,
    tipoInstalacion: project.tipoInstalacion || 'Monofásica',
    tempSuelo: conductor.tempSuelo,
    resistividadTermica: conductor.resistividadTermica,
    separacionBordes: conductor.separacionBordes,
    normaCable: normaCable as any
  };
};
