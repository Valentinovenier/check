export interface DefinicionCircuito {
  categoria: 'Uso General' | 'Uso Especial' | 'Uso específico';
  descripcion: string;
  sigla: string;
  maximoBocas: number | 'Sin límite' | 'N/A' | '12 por fase';
  proteccionCalibre: string;
}

export const LISTA_CIRCUITOS: DefinicionCircuito[] = [
  { categoria: 'Uso General', descripcion: 'Iluminación uso general', sigla: 'IUG', maximoBocas: 15, proteccionCalibre: '16 A' },
  { categoria: 'Uso General', descripcion: 'Tomacorriente uso general', sigla: 'TUG', maximoBocas: 15, proteccionCalibre: '20 A' },
  { categoria: 'Uso Especial', descripcion: 'Tomacorriente uso especial', sigla: 'TUE', maximoBocas: 15, proteccionCalibre: '32 A' },
  { categoria: 'Uso específico', descripcion: 'Consultar AEA 90364-7-771', sigla: '-', maximoBocas: 'N/A', proteccionCalibre: 'Responsabilidad del proyectista' },
];
