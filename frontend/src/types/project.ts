import { DatosVivienda } from './vivienda';

export interface ProjectStrategy {
  calcularTramo(condiciones: CondicionesTramo, project?: Project): any;
  validarReglas(project: Project): boolean;
  getFormularioComponente(): React.ComponentType<any>;
  getInformeComponente(): React.ComponentType<{ project: Project }>;
}

export interface HarmonicDistortion {
  habilitado: boolean;
  modoEntrada: 'porcentaje' | 'amperios';
  h3: number;
  h5: number;
  h7: number;
  h9: number;
}

export type TipoConductor = 'Cable' | 'CEP';
export type MaterialConductor = 'Cobre' | 'Aluminio';
export type AislacionConductor = 'PVC' | 'XLPE' | 'Mineral';

export interface Conductor {
  tipo: TipoConductor;
  material?: MaterialConductor;
  aislacion?: AislacionConductor;
  seccion?: number; // mm²
  longitud?: number; // m
  metodoInstalacion?: string;
  agrupamiento?: number;
  tipoCable?: 'Multipolar' | 'Unipolar';
  disposicion?: 'trebol' | 'contacto' | 'separado';
  plano?: 'horizontal' | 'vertical';
  caidaMaxPermitida?: number;
  tiempoAperturaMT?: number;
  resultadoCalculo?: any;
  canalizacionId?: string;
  tipoTramo?: 'LineaPrincipal' | 'LineaSeccional' | 'CircuitoTerminal';
  tipoCircuito?: string;
  normaCable?: 'IRAM-NM 247-3' | 'IRAM 62267' | 'IRAM 2178';
  temperaturaAmbiente?: number;
  tempSuelo?: number;
  resistividadTermica?: number;
  separacionBordes?: string;
}

export interface Proteccion {
  id: string;
  modelo: string;
  tipo_proteccion: 'Interruptor Automático' | 'Fusible' | 'Interruptor Automático Abierto' | 'Interruptor Automático Compacto' | 'PIA' | 'Interruptor Diferencial' | 'Termomagnética';
  in_amp: number;
  curva_disparo?: string;
  polos: number;
  marca?: 'Schneider' | 'ABB';
  capacidades: { tension_v: number; icn_ka: number; clase_limitacion: number }[];
  energia_pasante?: number;
}

export interface Transformador {
  potencia: number;
  tensionPrimario: number;
  tensionSecundario: number;
  cosFi: number;
  impedancia: number;
  proteccionesSalida: Proteccion[];
  modoEntrada?: 'manual' | 'catalogo';
  tipo?: 'Aceite' | 'Seco';
  uccPorcentaje?: number;
  PccW?: number;
  catalogoId?: string;
}

export interface CondicionesTramo {
  tipoTramo: 'LineaPrincipal' | 'LineaSeccional' | 'CircuitoTerminal';
  tipoCircuito: string;
  metodoInstalacion: string;
  longitudMetros: number;
  corrienteDiseñoAmperes: number;
  temperaturaAmbiente: number;
  canalizacionId?: string;
  tipoInstalacion?: 'Monofásica' | 'Trifásica';
  aislacion?: AislacionConductor;
  material?: MaterialConductor;
  disposicion?: 'trebol' | 'contacto' | 'separado';
  plano?: 'horizontal' | 'vertical';
  normaCable?: string;
  tempSuelo?: number;
  resistividadTermica?: number;
  separacionBordes?: string;
}

export interface CircuitoTerminal {
  id: string;
  nombre: string;
  tipo: string;
  potencia: number;
  conductor: Conductor;
  proteccion: Proteccion;
  normaCable?: 'IRAM-NM 247-3' | 'IRAM 62267' | 'IRAM 2178';
}

export interface BaseTablero {
  id: string;
  nombre: string;
  subTableros: (Tablero | TableroSeccional)[];
  circuitosTerminales: CircuitoTerminal[];
  proteccionCabecera?: Proteccion; // Opcional para todos
  proteccionDiferencial?: Proteccion; // Nueva: Opcional
  proteccionesSalida: Proteccion[]; // Lista uniforme para todos
}

export interface Tablero extends BaseTablero {
  conductorAlimentacion: Conductor;
  // proteccionCabecera es obligatoria aquí (heredada de BaseTablero)
  corrienteCortocircuitoIk?: number;
}

export interface TableroSeccional extends BaseTablero {
  tipo: 'Fuerza Motriz' | 'Iluminación';
  potenciaTotal: number;
}

export const isTablero = (node: BaseTablero): node is Tablero => {
  return 'conductorAlimentacion' in node;
};

export interface TableroSeccionalSimple {
  id: string;
  nombre: string;
  potencia: number;
  Ik?: number;
  proteccionCabecera?: Proteccion;
  proteccionesSalida: Proteccion[];
}

export interface Canalizacion {
  id: string;
  nombre: string;
  circuitosIds: string[];
  normaCable?: 'IRAM-NM 247-3' | 'IRAM 62267' | 'IRAM 2178';
}

export interface DatosCaratula {
  propietario?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  instaladorNombre?: string;
  instaladorCategoria?: string;
  instaladorMatricula?: string;
  instaladorTelefono?: string;
  instaladorEmail?: string;
}

export interface Project {
  id: string;
  name: string;
  projectType: string;
  createdAt: string;
  status: 'draft' | 'completed';
  transformador?: any;
  acometida?: any;
  armonicos: HarmonicDistortion;
  
  datosVivienda?: DatosVivienda;
  datosCaratula?: DatosCaratula;

  tableroPrincipal: Tablero; 
  
  tableros?: TableroSeccional[];
  tablerosSeccionales?: TableroSeccionalSimple[];
  conductores?: Record<string, Conductor>;
  informeConductores?: Conductor[];
  canalizaciones?: Canalizacion[];
  
  tempAmbiente?: number;
  coefSimultaneidad?: number;
  tipoInstalacion?: 'Monofásica' | 'Trifásica';
  cosPhi?: number;
}
