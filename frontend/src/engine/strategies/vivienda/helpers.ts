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
  if (!project) return undefined;

  const targetId = (conductor as any)?.destinoId || tramoId;
  const tipoTramo = conductor?.tipoTramo;
  const isPanelTramo = ['LineaPrincipal', 'LineaSeccional'].includes(tipoTramo || '');

  console.log('Depuración obtenerProteccionAsignada:', { targetId, tipoTramo, isPanelTramo });

  // 1. Proyectos Residenciales (Vivienda)
  if (project.datosVivienda) {
    const tablerosVivienda = project.datosVivienda.tableros || [];
    console.log('Tableros disponibles:', tablerosVivienda.map(t => t.id));
    const circuitosVivienda = project.datosVivienda.circuitosCalculados || [];

    // Si es un circuito terminal
    if (!isPanelTramo && targetId && targetId !== 'int-general-salida' && targetId !== 'tp') {
      // PRIMERO verificamos si es un tablero (caso reportado donde el tramo no marca tipoPanel correctamente)
      const tableroDestino = tablerosVivienda.find(t => t.id === targetId);
      if (tableroDestino && (tableroDestino.proteccionCabecera || tableroDestino.proteccionDiferencial)) {
        return tableroDestino.proteccionCabecera || tableroDestino.proteccionDiferencial;
      }

      const circ = circuitosVivienda.find(c => c.id === targetId);
      if (circ && circ.proteccion && circ.proteccion.in_amp) {
        return circ.proteccion;
      }
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
      if (tableroOrigenId) tablero = tablerosVivienda.find(t => t.id === tableroOrigenId);
      if (!tablero) tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
    }

    if (tablero) {
      const prot = tablero.proteccionCabecera || tablero.proteccionDiferencial;
      if (prot && (prot.in_amp !== undefined)) {
        return prot;
      }
    }
  }

  // 2. Proyectos Industriales / Comerciales (Fallback)
  if (!isPanelTramo && targetId) {
    const allTablerosInd = [project.tableroPrincipal, ...(project.tableros || [])].filter(Boolean);
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

  return undefined;
};
