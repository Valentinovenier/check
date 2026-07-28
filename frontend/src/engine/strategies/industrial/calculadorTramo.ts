import { Conductor, Proteccion, Transformador, CondicionesTramo } from '../../../types/project';
import { K_VALUES } from './constantes';
import { getFactorResistividad } from '../../../data/factoresResistividad';
import { FACTORES_TEMPERATURA_AIRE, FACTORES_TEMPERATURA_TIERRA } from '../../../data/factoresTemperatura';
import { 
  FACTORES_AGRUPAMIENTO_B52_17, 
  FACTORES_AGRUPAMIENTO_B52_18, 
  FACTORES_AGRUPAMIENTO_B52_19, 
  FACTORES_AGRUPAMIENTO_B52_20, 
  FACTORES_AGRUPAMIENTO_B52_21 
} from '../../../data/factoresAgrupamiento';
import { FACTOR_SIMETRIA_PARALELO } from '../../../data/factoresSimetria';
import { getAdmisible } from './corrienteProvider';

export const calcularConductorTramo = (
  condiciones: CondicionesTramo & { 
    tipoCable?: 'Multipolar' | 'Unipolar', 
    agrupamiento?: number, 
    norma?: string,
    customFactorAgrupamiento?: (nCircuitos: number) => number 
  },
  Itrafo: number,
  Ik: number, // kA
  t_apertura: number, // seg
  longitudKm: number,
  cosPhi: number,
  caidaMaxPermitida: number, // %
  catalogoCables: any[], // Tabla correspondiente
  tempAmbiente: number,
  tipoInstalacionAire: boolean
) => {
  const tensionNominal = condiciones.tipoInstalacion === 'Trifásica' ? 380 : 220;
  
  // 1. Factores base (Temperatura y Simetría)
  let aisKey: string = condiciones.aislacion!;
  if (aisKey === 'Mineral') {
      const tempCond = (condiciones as any).tempConductor || 70;
      aisKey = tempCond === 105 ? 'Mineral_105' : 'Mineral_70'; 
  }

  const tempMap = tipoInstalacionAire ? FACTORES_TEMPERATURA_AIRE : FACTORES_TEMPERATURA_TIERRA;
  const f_temp = tempMap[aisKey]?.[(condiciones.tempSuelo !== undefined && !tipoInstalacionAire) ? condiciones.tempSuelo : tempAmbiente] || 1.0;
  const f_resistividad = condiciones.resistividadTermica ? getFactorResistividad(condiciones.metodoInstalacion || '', condiciones.resistividadTermica) : 1.0;
    
  // Refactor: Calcular factor de simetría dinámico
  const getFsimetria = (nCond: number) => {
      if (nCond === 1) return 1.0;
      
      if (condiciones.tipoCable === 'Unipolar') {
          // Factor de asimetría (0.8) aplica solo para número impar de conductores unipolares en paralelo.
          if (nCond % 2 !== 0) {
              return 0.8;
          }
          return 1.0;
      }
      
      // Para cables multipolares en paralelo mayor a 1, el factor es 0.8
      return 0.8;
  };
  
  const f_base_temp = f_temp; // Simetría se aplica dentro del bucle


  // 2. Preparar factores de agrupamiento
  const nCircuitos = condiciones.agrupamiento || 1;
  const metodo = condiciones.metodoInstalacion;
  
  const getFagrup = (nCond: number) => {
      // Calculamos la cantidad total de circuitos físicos agrupados.
      // nCircuitos es la cantidad de circuitos base que el usuario agrupó.
      // nCond es la cantidad de cables en paralelo por fase.
      const totalCircuits = nCircuitos * nCond;
      
      // Si existe una estrategia inyectada, usarla
      if (condiciones.customFactorAgrupamiento) {
          const factor = condiciones.customFactorAgrupamiento(totalCircuits);
          console.log(`[DEBUG] Custom F_Agrup (nCircuitosBase=${nCircuitos}, nCond=${nCond}, total=${totalCircuits}) => ${factor}`);
          return factor;
      }
      
      if (totalCircuits === 1) return 1.0;
      
      const disp = condiciones.separacionBordes || condiciones.disposicion || 'en_contacto';

      if (metodo?.startsWith('D2')) {
          if (totalCircuits > 6) advertencia = `Factor de agrupamiento: Tabla D2 soporta máximo 6 circuitos. Se utilizó el factor de 6 (calculado: ${totalCircuits}).`;
          const nCirc = totalCircuits > 6 ? 6 : totalCircuits;
          const tabla = FACTORES_AGRUPAMIENTO_B52_18[nCirc] || FACTORES_AGRUPAMIENTO_B52_18[2];
          return tabla[disp] || tabla['en_contacto'] || 0.5;
      }
      if (metodo?.startsWith('D1')) {
          if (totalCircuits > 6) advertencia = `Factor de agrupamiento: Tabla D1 soporta máximo 6 circuitos. Se utilizó el factor de 6 (calculado: ${totalCircuits}).`;
          const nCirc = totalCircuits > 6 ? 6 : totalCircuits;
          const tabla = FACTORES_AGRUPAMIENTO_B52_19[nCirc] || FACTORES_AGRUPAMIENTO_B52_19[2];
          return tabla[disp] || tabla['en_contacto'] || 0.6;
      }
      if (metodo === 'E') {
          if (totalCircuits > 6) advertencia = `Factor de agrupamiento: Tabla E soporta máximo 6 circuitos. Se utilizó el factor de 6 (calculado: ${totalCircuits}).`;
          const nCirc = totalCircuits > 6 ? 6 : totalCircuits;
          return FACTORES_AGRUPAMIENTO_B52_20[0][nCirc - 1] || 0.7;
      }
      if (condiciones.tipoCable === 'Unipolar' && (metodo === 'F' || metodo === 'G')) {
          if (totalCircuits > 3) advertencia = `Factor de agrupamiento: Método F/G soporta máximo 3 circuitos. Se utilizó el factor de 3 (calculado: ${totalCircuits}).`;
          const nCirc = totalCircuits > 3 ? 3 : totalCircuits;
          return FACTORES_AGRUPAMIENTO_B52_21[1][nCirc - 1] || 0.8;
      }
      
      // Default (B52-17 para A, B, C) - Soporta hasta 20 circuitos
      if (totalCircuits > 20) advertencia = `Factor de agrupamiento: La norma soporta máximo 20 circuitos. Se utilizó el factor de 20 (calculado: ${totalCircuits}).`;
      const mapaCircuitos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20];
      let idx = mapaCircuitos.findIndex(c => c >= totalCircuits);
      if (idx === -1) idx = mapaCircuitos.length - 1;
      
      return FACTORES_AGRUPAMIENTO_B52_17[1][idx] || 0.5;
  };

  const SECCION_MAX = 240;
  let advertencia: string | undefined;

  // 3. Iterar de 1 a 20 conductores
  let mejorResultado: any = null;
  
  for (let n = 1; n <= 20; n++) { 
    const factorTotal = f_base_temp * f_resistividad * getFsimetria(n) * getFagrup(n);

    for (const cable of catalogoCables) {
      if (cable.seccion > SECCION_MAX) continue;

      // Lógica de tipo de cable: solo filtramos si el cable TIENE un tipo definido y no coincide
      if (condiciones.tipoCable === 'Multipolar' && cable.tipo && cable.tipo !== 'Multipolar') continue;
      if (condiciones.tipoCable === 'Unipolar' && cable.tipo && cable.tipo !== 'Unipolar') continue;

      // Obtener corriente base usando el nuevo Provider
      const I_adm_base = getAdmisible(
          (condiciones.norma as '5' | '770' | '771') || '5',
          cable.seccion,
          condiciones.metodoInstalacion!,
          condiciones.tipoInstalacion || 'Trifásica', // Pasamos el string directamente
          condiciones.material!,
          condiciones.aislacion!,
          undefined, // normaMineral
          condiciones.disposicion,
          condiciones.tipoCable?.toLowerCase() as 'unipolar' | 'multipolar',
          (condiciones as any).plano
      );

      if (I_adm_base === undefined || I_adm_base === null) {
          console.log(`[DEBUG] No se encontró I_adm para: Secc=${cable.seccion}, Metodo=${condiciones.metodoInstalacion}, Aisl=${condiciones.aislacion}, Mat=${condiciones.material}`);
          continue;
      }

      const I_adm_corregida = I_adm_base * n * factorTotal;
      
      // K_key para Mineral o Mineral_105
      let K_key: string = condiciones.aislacion!;
      if (K_key === 'Mineral') {
          const tempCond = (condiciones as any).tempConductor || 70;
          K_key = tempCond === 105 ? 'Mineral_105' : 'Mineral';
      }
      const K = K_VALUES[K_key][condiciones.material!];
      
      // Soportabilidad cortocircuito en paralelo: (S * n * K)^2
      const capacidadCorto = Math.pow(cable.seccion * n * K, 2); 
      const energiaCorto = Math.pow(Ik * 1000, 2) * t_apertura;

      const h = condiciones.tipoInstalacion === 'Trifásica' ? Math.sqrt(3) : 2;
      const sinPhi = Math.sqrt(1 - Math.pow(cosPhi, 2));
      const R = Number(cable.resistencia || 0);
      const tipoReactancia = condiciones.tipoInstalacion === 'Trifásica' ? 'trifasico' : 'monofasico';
      const X = Number(cable.reactancia?.[tipoReactancia] || 0);
      const dv = (h * Itrafo * longitudKm * (R * cosPhi + X * sinPhi)) / n;
      const porcentajeCaida = (dv / tensionNominal) * 100;

      if (cable.seccion === 95) {
          console.log(`[DEBUG 95mm²] n=${n}`, {
              I_adm_base,
              factorTotal,
              I_adm_corregida,
              Itrafo
          });
      }

      if (I_adm_corregida < Itrafo || capacidadCorto < energiaCorto || isNaN(porcentajeCaida) || porcentajeCaida > caidaMaxPermitida) {
        let motivo = "";
        if (I_adm_corregida < Itrafo) motivo += `[Corriente: ${I_adm_corregida.toFixed(1)} < ${Itrafo.toFixed(1)}] `;
        if (capacidadCorto < energiaCorto) motivo += `[Corto: ${capacidadCorto.toFixed(0)} < ${energiaCorto.toFixed(0)}] `;
        if (isNaN(porcentajeCaida) || porcentajeCaida > caidaMaxPermitida) motivo += `[Caída: ${porcentajeCaida.toFixed(2)}% > ${caidaMaxPermitida}%] `;

        console.log(`[DEBUG] Descartado cable Secc=${cable.seccion} (n=${n}): ${motivo}`);
        continue;
      }

      return { 
        cable, 
        nConductores: n, 
        porcentajeCaida,
        I_adm_base,
        I_adm_corregida,
        factorTotal,
        f_temp: f_base_temp,
        f_simetria: getFsimetria(n),
        f_agrup: getFagrup(n),
        f_resistividad,
        capacidadCorto,
        energiaCorto,
        advertencia
      };
    }
  }

  return { error: "Ningún conductor cumple con los criterios de Corriente, Cortocircuito o Caída de Tensión." };
};
