export interface ParametrosCableVivienda {
  seccion: number;
  resistenciaCC20: number;
  resistenciaCA70: number;
  reactancia: number;
}

export const cablesUnipolaresVivienda: ParametrosCableVivienda[] = [
  { seccion: 1.0, resistenciaCC20: 19.50, resistenciaCA70: 23.32, reactancia: 0.090 },
  { seccion: 1.5, resistenciaCC20: 13.30, resistenciaCA70: 15.90, reactancia: 0.090 },
  { seccion: 2.5, resistenciaCC20: 7.98, resistenciaCA70: 9.54, reactancia: 0.080 },
  { seccion: 4.0, resistenciaCC20: 4.95, resistenciaCA70: 5.92, reactancia: 0.080 },
  { seccion: 6.0, resistenciaCC20: 3.30, resistenciaCA70: 3.95, reactancia: 0.080 },
  { seccion: 10.0, resistenciaCC20: 1.91, resistenciaCA70: 2.28, reactancia: 0.080 },
  { seccion: 16.0, resistenciaCC20: 1.21, resistenciaCA70: 1.45, reactancia: 0.080 },
  { seccion: 25.0, resistenciaCC20: 0.78, resistenciaCA70: 0.93, reactancia: 0.080 },
];
