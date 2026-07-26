import { Project, Conductor, Proteccion } from '../../../types/project';

/**
 * Obtiene la protección asignada a un tablero o circuito terminal dentro del proyecto.
 * Para proyectos residenciales (Vivienda), verifica estrictamente en project.datosVivienda.
 */
export const obtenerProteccionAsignada = (
  project: Project | null | undefined,
  conductor?: Conductor,
  tramoId?: string,
  tableroOrigenId?: string
): Proteccion | undefined => {
  if (!project) {
    console.log('Depuración: No hay project.');
    return undefined;
  }
  
  const targetId = (conductor as any)?.destinoId || tramoId;
  const tipoTramo = conductor?.tipoTramo;
  const isPanelTramo = ['LineaPrincipal', 'LineaSeccional'].includes(tipoTramo || '');
  
  console.log('Depuración: Iniciar búsqueda', { targetId, tipoTramo, isPanelTramo, tieneDatosVivienda: !!project.datosVivienda });

  // 1. Proyectos Residenciales (Vivienda)
  if (project.datosVivienda) {
    const tablerosVivienda = project.datosVivienda.tableros || [];
    const circuitosVivienda = project.datosVivienda.circuitosCalculados || [];

    // Si es un circuito terminal
    if (!isPanelTramo && targetId && targetId !== 'int-general-salida' && targetId !== 'tp') {
      const circ = circuitosVivienda.find(c => c.id === targetId);
      if (circ && circ.proteccion && circ.proteccion.in_amp) {
        console.log('Depuración: Protección encontrada en circuito terminal.');
        return circ.proteccion;
      }
      console.log('Depuración: No se encontró protección en circuito terminal.');
      return undefined;
    }

    // Si es un tablero o tramo general
    let tablero: any = undefined;

    if (targetId && targetId !== 'int-general-salida' && targetId !== 'tp') {
      tablero = tablerosVivienda.find(t => t.id === targetId);
    } else if (targetId === 'int-general-salida' || targetId === 'tp') {
      tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
    }

    if (!tablero) {
      console.log('Depuración: Tablero no encontrado por targetId principal.');
      if (tableroOrigenId) tablero = tablerosVivienda.find(t => t.id === tableroOrigenId);
      if (!tablero) tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
    }

    if (tablero) {
      const prot = tablero.proteccionCabecera || tablero.proteccionDiferencial;
      console.log('Depuración: Tablero encontrado:', tablero, 'Protección:', prot);
      if (prot && (prot.in_amp !== undefined)) {
        return prot;
      }
      console.log('Depuración: Tablero encontrado pero sin protección válida.');
    } else {
        console.log('Depuración: No se encontró tablero en datosVivienda.');
    }
  } else {
    console.log('Depuración: No hay datosVivienda.');
  }

  // 2. Proyectos Industriales / Comerciales (Fallback)
  console.log('Depuración: Intentando fallback industrial');
  if (!isPanelTramo && targetId) {
    const allTablerosInd = [project.tableroPrincipal, ...(project.tableroPrincipal ? [] : []), ...(project.tableros || [])].filter(Boolean);
    for (const t of allTablerosInd) {
      const ct = t?.circuitosTerminales?.find(c => c.id === targetId);
      if (ct && ct.proteccion && ct.proteccion.in_amp) {
        return ct.proteccion;
      }
    }
  }

  const tablerosInd = [project.tableroPrincipal, ...(project.tableros || [])].filter(Boolean);
  let tableroInd: any = undefined;

  if (targetId) {
    tableroInd = tablerosInd.find(t => t.id === targetId);
  }
  if (!tableroInd && tableroOrigenId) {
    tableroInd = tablerosInd.find(t => t.id === tableroOrigenId);
  }

  if (tableroInd && tableroInd.proteccionCabecera && tableroInd.proteccionCabecera.in_amp) {
    if (tableroInd.proteccionCabecera.id !== 'cabecera-principal') {
      return tableroInd.proteccionCabecera;
    }
  }

  console.log('Depuración: No se encontró protección en ninguna parte.');
  return undefined;
};
