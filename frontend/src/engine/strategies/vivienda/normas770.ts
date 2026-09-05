import { DatosVivienda } from '../../../types/vivienda';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../../../data/vivienda/factoresSimultaneidad';
import { DISTRIBUCION_CIRCUITOS, GradoElectrificacion, ConfiguracionCircuitos } from '../../../data/vivienda/circuitosDistribucion';

/**
 * AEA 770: Determina la superficie límite de aplicación
 */
export const calcularSuperficieLimite = (datos: DatosVivienda): number => {
  if (datos.superficieLimiteManual) {
    return datos.superficieLimiteManual;
  }
  return datos.superficieCubierta + (datos.superficieSemicubierta * 0.5);
};

/**
 * AEA 770: Determina el grado de electrificación
 */
export const determinarGradoElectrificacion = (superficieLimite: number): GradoElectrificacion => {
  if (superficieLimite < 60) return 'Minimo';
  if (superficieLimite < 130) return 'Medio';
  if (superficieLimite < 200) return 'Elevado';
  return 'Superior';
};

/**
 * AEA 770: Define la cantidad mínima de circuitos por grado y variante
 */
export const obtenerConfiguracionCircuitos = (grado: GradoElectrificacion, variante?: string): ConfiguracionCircuitos[] => {
    return DISTRIBUCION_CIRCUITOS.filter(c => c.grado === grado && (!variante || c.variante === variante));
};

export const obtenerCircuitosMinimos = (grado: GradoElectrificacion, variante?: string): number => {
  const configs = obtenerConfiguracionCircuitos(grado, variante);
  if (configs.length === 0) return 0;
  return configs[0].cantidadMinima;
};

/**
 * AEA 770: Determina la cantidad mínima de bocas de IUG y TUG basándose en la Tabla 770.7.III.
 */
export const calcularPuntosMinimosAmbiente = (
  tipoAmbiente: string, 
  superficie: number, 
  longitud: number, 
  grado: GradoElectrificacion = 'Minimo'
) => {
    let iug = 0;
    let tug = 0;

    const tipo = tipoAmbiente.toLowerCase();

    // 1. Estar, Comedor, Escritorio, etc.
    if (tipo.includes('estar') || tipo.includes('comedor') || tipo.includes('estudio') || tipo.includes('biblioteca')) {
        iug = Math.max(1, Math.ceil(superficie / 18));
        tug = Math.max(2, Math.ceil(superficie / 6));
    } 
    // 2. Dormitorios (Lógica por superficie)
    else if (tipo.includes('dormitorio')) {
        if (superficie < 10) {
            iug = 1; tug = 2;
        } else if (superficie <= 36) {
            iug = 1; tug = 3;
        } else {
            // Dormitorio > 36m2 se considera Grado Elevado según Nota 1
            iug = 2; tug = 3;
        }
    }
    // 3. Cocina
    else if (tipo.includes('cocina')) {
        iug = 1; 
        tug = 3; 
    }
    // 4. Baño
    else if (tipo.includes('baño') || tipo.includes('banio')) {
        iug = 1; tug = 1;
    }
    // 5. Vestíbulo, Garage, Hall, Vestidor
    else if (tipo.includes('vestibulo') || tipo.includes('garage') || tipo.includes('hall') || tipo.includes('vestidor')) {
        iug = 1;
        tug = Math.max(1, Math.ceil(superficie / 12));
    }
    // 6. Pasillos Cubiertos
    else if (tipo.includes('pasillo')) {
        iug = Math.max(1, Math.ceil(longitud / 5));
        tug = 0;
    }
    // 7. Lavadero
    else if (tipo.includes('lavadero')) {
        iug = 1; tug = 1;
    }
    // 8. Semicubiertos (Balcones, Galerías)
    else if (tipo.includes('balcon') || tipo.includes('galeria') || tipo.includes('semicubierto')) {
        iug = Math.max(1, Math.ceil(longitud / 5));
        tug = 0;
    }
    else {
        iug = 1; tug = 1;
    }

    return { iug, tug };
};

/**
 * AEA 770: Calcula la Potencia Instalada (PI) y la Demanda de Potencia Máxima Simultánea (DPMS)
 * 
 * Basado en reglas:
 * - IUG (sin tomas derivados): (2/3) * puntos * 60 VA
 * - IUG (con tomas derivados): 2200 VA
 * - TUG (Tomacorrientes): 2200 VA
 * - TUE (Usos Especiales): 3300 VA
 */
export const calcularPotencias = (datos: DatosVivienda): { potenciaInstalada: number; potenciaMaximaSimultanea: number } => {
    let potenciaTotal = 0;
    const circuitos = datos.circuitosCalculados || [];

    circuitos.forEach(circ => {
        let potenciaCircuito = 0;
        
        switch (circ.tipo) {
            case 'iluminacion_usos_generales':
                // Sumar puntos IUG asignados en todos los ambientes para ESTE circuito
                let puntosIUG = 0;
                Object.values(datos.tomasPorAmbiente || {}).forEach((amb: any) => {
                    puntosIUG += (amb[circ.id]?.IUG || 0);
                });

                if (circ.tieneTomacorrientesDerivados) {
                    // AEA 770: Si tiene tomas derivados, se considera la potencia del circuito
                    potenciaCircuito = 2200;
                } else {
                    // AEA 770: (2/3) * puntosIUG * 60 VA, con un mínimo reglamentario de 660 VA
                    potenciaCircuito = Math.max(660, (2 / 3) * puntosIUG * 60);
                }
                break;
            case 'tomacorrientes_usos_generales':
                potenciaCircuito = 2200;
                break;
            case 'usos_especiales':
                potenciaCircuito = 3300;
                break;
            default:
                potenciaCircuito = 0;
        }
        potenciaTotal += potenciaCircuito;
    });

    // Aplicar coeficiente de simultaneidad sobre el total de la PI
    const minimos = obtenerCircuitosMinimos(datos.gradoElectrificacion || 'Minimo');
    const factorSimultaneidad = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimos] || 0.6;
    
    return {
        potenciaInstalada: potenciaTotal,
        potenciaMaximaSimultanea: potenciaTotal * factorSimultaneidad
    };
};
