import { FACTORES_AGRUPAMIENTO_VIVIENDA, FACTORES_AGRUPAMIENTO_SUBTERRANEO } from '../../../data/vivienda/factoresAgrupamiento';
import { Conductor } from '../../../types/project';

/**
 * Obtiene el factor de agrupamiento para viviendas según AEA 770.
 */
export const getFactorAgrupamientoVivienda = (
    nCircuitos: number, 
    conductor?: Conductor
): number => {
    console.log('[DEBUG] getFactorAgrupamientoVivienda llamado con nCircuitos=', nCircuitos, 'conductor=', conductor);
    
    // Si la cantidad de circuitos es 1, el factor es 1.0 por definición
    if (nCircuitos <= 1) return 1.0;

    const metodo = conductor?.metodoInstalacion;
    const tipoCable = conductor?.tipoCable || 'Multipolar';
    const separacion = conductor?.separacionBordes || 'en_contacto';

    // Lógica para método D2 (Tabla B52-18)
    if (metodo === 'D2') {
        const tablaD2 = FACTORES_AGRUPAMIENTO_SUBTERRANEO['D2'];
        const factor = tablaD2[separacion]?.[nCircuitos];
        if (factor) return factor;
    }

    // Lógica para método D1 (Tabla B52-19)
    if (metodo === 'D1') {
        const tablaD1 = FACTORES_AGRUPAMIENTO_SUBTERRANEO['D1'];
        const factor = tablaD1[tipoCable]?.[separacion]?.[nCircuitos];
        if (factor) return factor;
    }

    // Default para otros métodos o si no se encuentra en tabla
    const maxCircuitos = Math.max(...Object.keys(FACTORES_AGRUPAMIENTO_VIVIENDA).map(Number));
    const n = Math.min(nCircuitos, maxCircuitos);
    
    const factor = FACTORES_AGRUPAMIENTO_VIVIENDA[n] || 0.5;
    console.log('[DEBUG] getFactorAgrupamientoVivienda (Default) retorno factor=', factor);
    return factor;
};
