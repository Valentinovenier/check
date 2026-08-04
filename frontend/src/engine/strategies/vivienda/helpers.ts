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
    const circuitosVivienda = project.datosVivienda.circuitosCalculados || [];

    // Búsqueda del tablero destino (si aplica) para buscar protecciones de salida en el padre
    let tableroDestino: any = undefined;
    if (targetId && targetId !== 'int-general-salida' && targetId !== 'tp') {
        tableroDestino = tablerosVivienda.find(t => t.id === targetId);
    }
    
    // SI estamos calculando un tramo HACIA este tablero (es un destino),
    // buscamos en el tablero padre (el origen) la protección de salida hacia este destino.
    if (tableroDestino && tableroDestino.tableroPadreId) {
        const padre = tablerosVivienda.find(t => t.id === tableroDestino.tableroPadreId);
        if (padre && padre.proteccionesSalida) {
            const protSalida = padre.proteccionesSalida.find(ps => ps.tableroDestinoId === tableroDestino.id);
            if (protSalida && protSalida.proteccion && protSalida.proteccion.in_amp !== undefined) {
                return protSalida.proteccion;
            }
        }
    }

    // Si es un circuito terminal
    if (!isPanelTramo && targetId && targetId !== 'int-general-salida' && targetId !== 'tp') {
      const circ = circuitosVivienda.find(c => c.id === targetId);
      if (circ && circ.proteccion && circ.proteccion.in_amp) {
        return circ.proteccion;
      }
      return undefined;
    }

    // Si es un tablero o tramo general
    let tablero: any = tableroDestino; // Ya lo encontramos arriba

    if (!tablero) {
        if (targetId === 'int-general-salida' || targetId === 'tp') {
          tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
        } else if (tableroOrigenId) {
          tablero = tablerosVivienda.find(t => t.id === tableroOrigenId);
        } else {
          tablero = tablerosVivienda.find(t => t.tipo === 'Principal');
        }
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
