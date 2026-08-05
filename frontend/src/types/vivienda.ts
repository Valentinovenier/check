// Tipos de datos específicos para proyectos residenciales (Viviendas)
// AEA-90364-7-770

import { Proteccion } from './project';

export type TipoCircuito = 
  | 'iluminacion_usos_generales'
  | 'tomacorrientes_usos_generales'
  | 'usos_especiales'
  | 'usos_especificos';

export interface Ambiente {
  id: string;
  nombre: string;
  superficie: number;
  longitud: number;
  puntosIUG: number;
  puntosTUG: number;
  puntosTUE: number;
  // Campos para control de asignación automática/manual
  circuitoIUGId?: string;
  circuitoTUGId?: string;
  circuitoTUEId?: string;
}

export interface CircuitoCalculado {
  id: string;
  nombre: string;
  tipo: TipoCircuito;
  puntosIUG: number;
  puntosTUG: number;
  puntosTUE: number;
  manualPuntosIUG?: number;
  manualPuntosTUG?: number;
  manualPuntosTUE?: number;
  tieneTomacorrientesDerivados?: boolean;
  ambientesIds: string[];
  normaCable?: 'IRAM-NM 247-3' | 'IRAM 62267' | 'IRAM 2178';
  proteccion?: Proteccion;

  // Propiedades para usos específicos
  esEspecifico?: boolean;
  siglaEspecifica?: string;
  maximoBocas?: number | 'Sin límite' | 'N/A' | '12 por fase';
  condicionProteccion?: string;
  potencia?: number;
  unidadPotencia?: 'kW' | 'kVA';
  coefUtilizacion?: number;
  coefSimultaneidad?: number;
}

export interface ProteccionSalida {
  id: string; // ID único para esta protección de salida
  tableroDestinoId: string; // ID del tablero seccional al que alimenta
  proteccion: Proteccion; // La protección elegida del catálogo
}

export interface TableroVivienda {
  id: string;
  nombre: string;
  tipo: 'Principal' | 'Seccional' | 'SubSeccional';
  tableroPadreId?: string; // Para definir la jerarquía
  circuitosIds: string[];
  proteccionCabecera?: Proteccion;
  proteccionDiferencial?: Proteccion;
  proteccionesSalida?: ProteccionSalida[];
}

export interface TomasCircuito {
  IUG: number;
  TUG: number;
  TUE: number;
}

export interface DatosVivienda {
  superficieCubierta: number;
  superficieSemicubierta: number;
  superficieLimiteManual?: number;
  gradoElectrificacion?: 'Minimo' | 'Medio' | 'Elevado' | 'Superior';
  varianteElectrificacion?: string;
  ambientes: Ambiente[];
  circuitosCalculados: CircuitoCalculado[];
  tableros?: TableroVivienda[];
  tomasPorAmbiente?: Record<string, Record<string, TomasCircuito>>;
  potenciaInstalada?: number;
  potenciaMaximaSimultanea?: number;
  ikDistribuidora?: number; // kA
}

export interface CondicionesTramoResidencial {
  tipoTramo: 'LineaPrincipal' | 'LineaSeccional' | 'CircuitoTerminal';
  tipoCircuito: TipoCircuito;
  metodoInstalacion: 'B2' | 'D1' | 'D2' | 'sinEnvoltura' | string;
  longitudMetros: number;
  corrienteDiseñoAmperes: number;
  temperaturaAmbiente: number;
  canalizacionId?: string;
  tipoInstalacion?: 'Monofásica' | 'Trifásica';
  cosPhi?: number;
  normaCable?: string;
  tempSuelo?: number;
  resistividadTermica?: number;
  separacionBordes?: string;
}

export interface PasoVerificacion {
  numero: number;
  nombre: string;
  valor: string;
  condicion: string;
  cumple: boolean;
}

export interface ResultadoCalculoResidencial {
  seccionRecomendada: number;
  caidaTensionPorcentaje: number;
  cumpleCapacidadCorriente: boolean;
  cumpleCaidaTension: boolean;
  advertencias?: string[];
  pasosVerificacion?: PasoVerificacion[];
}
