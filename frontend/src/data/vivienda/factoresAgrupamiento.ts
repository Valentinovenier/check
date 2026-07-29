// frontend/src/data/vivienda/factoresAgrupamiento.ts

/**
 * Factores de corrección por agrupamiento para instalaciones en viviendas (AEA 770).
 */
export const FACTORES_AGRUPAMIENTO_VIVIENDA: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  5: 0.60,
  6: 0.55
};

/**
 * Factores para métodos de instalación subterráneos (D1, D2) según AEA 770.
 * Basado en las tablas B52-18 (D2) y B52-19 (D1).
 */
export const FACTORES_AGRUPAMIENTO_SUBTERRANEO: any = {
    'D2': {
        // Tabla B52-18
        'en_contacto':      { 2: 0.75, 3: 0.65, 4: 0.60, 5: 0.55, 6: 0.50 },
        'sep_un_diam':      { 2: 0.80, 3: 0.70, 4: 0.60, 5: 0.55, 6: 0.55 },
        'sep_0.125':        { 2: 0.85, 3: 0.75, 4: 0.70, 5: 0.65, 6: 0.60 },
        'sep_0.25':         { 2: 0.90, 3: 0.80, 4: 0.75, 5: 0.70, 6: 0.70 },
        'sep_0.5':          { 2: 0.90, 3: 0.85, 4: 0.80, 5: 0.80, 6: 0.80 },
    },
    'D1': {
        // Tabla B52-19 (A: Multipolar, B: Unipolar)
        'Multipolar': {
            'en_contacto':  { 2: 0.85, 3: 0.75, 4: 0.70, 5: 0.65, 6: 0.60 },
            'sep_0.25':     { 2: 0.90, 3: 0.85, 4: 0.80, 5: 0.80, 6: 0.80 },
            'sep_0.5':      { 2: 0.95, 3: 0.90, 4: 0.85, 5: 0.85, 6: 0.80 },
            'sep_1.0':      { 2: 0.95, 3: 0.95, 4: 0.90, 5: 0.90, 6: 0.90 },
        },
        'Unipolar': {
            'en_contacto':  { 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.60 },
            'sep_0.25':     { 2: 0.90, 3: 0.80, 4: 0.75, 5: 0.70, 6: 0.70 },
            'sep_0.5':      { 2: 0.90, 3: 0.85, 4: 0.80, 5: 0.80, 6: 0.80 },
            'sep_1.0':      { 2: 0.95, 3: 0.90, 4: 0.90, 5: 0.90, 6: 0.90 },
        }
    }
};
