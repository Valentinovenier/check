import { FACTORES_AGRUPAMIENTO_VIVIENDA } from '../../../data/vivienda/factoresAgrupamiento';

/**
 * Obtiene el factor de agrupamiento para viviendas según AEA 770.
 */
export const getFactorAgrupamientoVivienda = (nCircuitos: number): number => {
    console.log('[DEBUG] getFactorAgrupamientoVivienda llamado con nCircuitos=', nCircuitos);
    // Si la cantidad de circuitos excede la tabla, usamos el valor para el máximo definido
    const maxCircuitos = Math.max(...Object.keys(FACTORES_AGRUPAMIENTO_VIVIENDA).map(Number));
    const n = Math.min(nCircuitos, maxCircuitos);
    
    const factor = FACTORES_AGRUPAMIENTO_VIVIENDA[n] || 0.5;
    console.log('[DEBUG] getFactorAgrupamientoVivienda retorno factor=', factor);
    return factor;
};
