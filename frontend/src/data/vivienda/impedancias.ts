// Datos de impedancia y cortocircuito para viviendas
// AEA-90364-7-770 (Basado en tablas anexas de la norma)

// Estos valores son aproximaciones técnicas necesarias para la verificación.
// R: Resistencia en ohm/km, X: Reactancia en ohm/km
export const IMPEDANCIAS_AEA_770: Record<string, { r: number, x: number }> = {
  "1.5": { r: 12.1, x: 0.1 },
  "2.5": { r: 7.41, x: 0.1 },
  "4.0": { r: 4.61, x: 0.09 },
  "6.0": { r: 3.08, x: 0.09 },
  "10.0": { r: 1.83, x: 0.08 },
  "16.0": { r: 1.15, x: 0.08 },
};

// Exportar la nueva norma
export * from './impedanciasIRAM';

// Mantener compatibilidad hacia atrás
export const IMPEDANCIAS_CABLES_VIVIENDA = IMPEDANCIAS_AEA_770;
