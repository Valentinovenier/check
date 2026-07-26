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
  console.log('Depuración: Entrando en obtenerProteccionAsignada', { conductor, tramoId, tieneDatosVivienda: !!project.datosVivienda });

  const targetId = (conductor as any)?.destinoId || tramoId;
  const tipoTramo = conductor?.tipoTramo;
  const isPanelTramo = ['LineaPrincipal', 'LineaSeccional'].includes(tipoTramo || '');

  // 1. Proyectos Residenciales (Vivienda)
  if (project.datosVivienda) {
    const tablerosVivienda = project.datosVivienda.tableros || [];
    const circuitosVivienda = project.datosVivienda.circuitosCalculados || [];

    // Si es un circuito terminal (o tramo que no es de panel/tablero)
    if (!isPanelTramo && targetId && targetId !== 'int-general-salida') {
      const circ = circuitosVivienda.find(c => c.id === targetId);
      if (circ && circ.proteccion && circ.proteccion.in_amp) {
        return circ.proteccion;
      }
      return undefined;
    }

    // Si es un tablero (LineaPrincipal o LineaSeccional) o el tramo general
    let tablero: any = undefined;

    if (targetId && targetId !== 'int-general-salida') {
      tablero = tablerosVivienda.find(t => t.id === targetId);
    } else if (targetId === 'int-general-salida') {
      // Buscar tablero principal si es el tramo general
      tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
    }

    if (!tablero) {
      if (tableroOrigenId) {
        tablero = tablerosVivienda.find(t => t.id === tableroOrigenId);
      }
      if (!tablero) {
        tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
      }
    }

    if (tablero) {
      const prot = tablero.proteccionCabecera || tablero.proteccionDiferencial;
      console.log('Depuración Protección:', { tablero, prot });
      if (prot && prot.in_amp) {
        return prot;
      }
    }

    return undefined;
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
