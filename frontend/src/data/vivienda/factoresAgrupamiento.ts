// frontend/src/data/vivienda/factoresAgrupamiento.ts

/**
 * Factores de corrección por agrupamiento para instalaciones en viviendas (AEA 770).
 * Basado en los requisitos específicos del usuario:
 * 2 circuitos: 0.80
 * 3 circuitos: 0.70
 */
export const FACTORES_AGRUPAMIENTO_VIVIENDA: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65, // Valor conservador si no se especifica
  5: 0.60, // Valor conservador si no se especifica
  6: 0.55  // Valor conservador si no se especifica
};
