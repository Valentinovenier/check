export interface DefinicionCircuitoEspecifico {
  descripcion: string;
  sigla: string;
  maximoBocas: number | 'Sin límite' | 'N/A' | '12 por fase';
  proteccionCondicion: string;
}

export const CIRCUITOS_ESPECIFICOS: DefinicionCircuitoEspecifico[] = [
  { descripcion: 'Alimentación fuentes MBTF', sigla: 'MBTF', maximoBocas: 15, proteccionCondicion: '20 A' },
  { descripcion: 'Salidas fuentes MBTF', sigla: '----', maximoBocas: 'Sin límite', proteccionCondicion: 'Responsabilidad del proyectista' },
  { descripcion: 'Alimentación pequeños motores', sigla: 'APM', maximoBocas: 15, proteccionCondicion: '25 A' },
  { descripcion: 'Alimentación tensión estabilizada', sigla: 'ATE', maximoBocas: 15, proteccionCondicion: 'Responsabilidad del proyectista' },
  { descripcion: 'Muy baja tensión sin puesta a tierra', sigla: 'MBTS', maximoBocas: 'Sin límite', proteccionCondicion: 'Responsabilidad del proyectista' },
  { descripcion: 'Alimentación carga única', sigla: 'ACU', maximoBocas: 'N/A', proteccionCondicion: 'Responsabilidad del proyectista' },
  { descripcion: 'Iluminación trifásica específica', sigla: 'ITE', maximoBocas: '12 por fase', proteccionCondicion: 'Responsabilidad del proyectista' },
  { descripcion: 'Otros circuitos específicos', sigla: 'OCE', maximoBocas: 'Sin límite', proteccionCondicion: 'Responsabilidad del proyectista' },
];
