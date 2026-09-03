import { Project, BaseTablero, CircuitoTerminal, isTablero } from '../../../types/project';

const getTension = (project: Project): number => {
  const isTrifasica = project.tipoInstalacion === 'Trifásica';
  return isTrifasica ? 380 : 220;
};

// Función auxiliar para calcular potencia según normas (AEA 770)
export const getPotenciaCircuito = (c: any, project?: Project): number => {
    // Si es un circuito de usos específicos o carga específica
    if (c.esEspecifico || c.tipo === 'usos_especificos' || c.tipo === 'usos_especificos_mbtf' || (typeof c.tipo === 'string' && c.tipo.startsWith('usos_especificos'))) {
        const rawPotencia = Number(c.potencia ?? c.potenciaManual ?? 0);
        if (rawPotencia <= 0) return 0;
        const cosPhi = project?.cosPhi || 0.85;
        const nominalVA = c.unidadPotencia === 'W' ? rawPotencia / cosPhi : rawPotencia;
        const coefUtil = typeof c.coefUtilizacion === 'number' && c.coefUtilizacion > 0 ? c.coefUtilizacion : 1;
        const coefSimul = typeof c.coefSimultaneidad === 'number' && c.coefSimultaneidad > 0 ? c.coefSimultaneidad : 1;
        const potenciaFinal = nominalVA * coefUtil * coefSimul;
        console.log(`DEBUG: Circuito específico ${c.nombre || c.id} - Potencia nominal: ${rawPotencia} ${c.unidadPotencia || 'VA'} -> ${potenciaFinal.toFixed(2)} VA`);
        return potenciaFinal;
    }

    // AEA 770: Demanda de potencia máxima simultánea
    switch (c.tipo) {
        case 'iluminacion_usos_generales': {
            // AEA 770: Sumar puntos IUG asignados en todos los ambientes para ESTE circuito
            let puntosIUG = 0;
            if (project && project.datosVivienda && project.datosVivienda.tomasPorAmbiente) {
                console.log(`DEBUG: Calculando IUG para circuito ${c.id}`);
                Object.entries(project.datosVivienda.tomasPorAmbiente).forEach(([ambId, amb]: [string, any]) => {
                    const puntos = amb[c.id]?.IUG || 0;
                    if (puntos > 0) console.log(`DEBUG: Ambiente ${ambId} aporta ${puntos} puntos al circuito ${c.id}`);
                    puntosIUG += puntos;
                });
            } else {
                puntosIUG = c.puntosIUG || 0;
            }

            console.log(`DEBUG: Circuito ${c.id} - Total puntos IUG: ${puntosIUG}`);
            
            // Si el circuito no tiene tomas (0 puntos), la potencia es 0.
            const puntos = puntosIUG;
            const potencia = c.tieneTomacorrientesDerivados 
                ? 2200 
                : (2 / 3) * puntos * 60;
                
            console.log(`DEBUG: Circuito ${c.id} - Potencia final calculada: ${potencia} VA`);
            return potencia;
        }
        case 'tomacorrientes_usos_generales': 
            return 2200;
        case 'iluminacion_con_tomacorrientes':
            return 2200;
        case 'usos_especiales': 
            return 3300;
        default: {
            if (c.potencia && Number(c.potencia) > 0) {
                const raw = Number(c.potencia);
                const cosPhi = project?.cosPhi || 0.85;
                return c.unidadPotencia === 'W' ? raw / cosPhi : raw;
            }
            return 0;
        }
    }
};

export const getTableroNominalCurrent = (tablero: BaseTablero, project: Project): number => {
    // 1. Si es el tablero principal, usamos la DPMS calculada para la vivienda
    const esPrincipal = tablero.nombre?.toLowerCase().includes('principal') || (tablero as any).tipo === 'Principal';
    const isTrifasica = project.tipoInstalacion === 'Trifásica';
    const divisor = isTrifasica ? Math.sqrt(3) * 380 : 220;
    
    if (esPrincipal) {
        return project.datosVivienda?.potenciaMaximaSimultanea 
            ? project.datosVivienda.potenciaMaximaSimultanea / divisor 
            : 0;
    }

    // 2. Si tiene potenciaTotal definida (caso TableroSeccional), usarla
    if ('potenciaTotal' in tablero && (tablero as any).potenciaTotal) {
        return (tablero as any).potenciaTotal / divisor;
    }
    
    // 3. Caso contrario, sumar las potencias de sus circuitos y subtableros
    let totalPotencia = 0;
    if (tablero.circuitosTerminales) {
        totalPotencia += tablero.circuitosTerminales.reduce((acc, c) => acc + getPotenciaCircuito(c, project), 0);
    }
    
    return totalPotencia / divisor;
};

export const getCircuitoNominalCurrent = (circuito: CircuitoTerminal, project: Project): number => {
  const potencia = getPotenciaCircuito(circuito, project);
  // En viviendas (AEA 770), los circuitos terminales son monofásicos (220V) a menos que sea un circuito trifásico específico (ej: ITE)
  const esCircuitoTrifasico = (circuito as any).siglaEspecifica === 'ITE' || (circuito as any).tipoInstalacion === 'Trifásica';
  const tension = esCircuitoTrifasico ? Math.sqrt(3) * 380 : 220;
  const corriente = tension > 0 ? potencia / tension : 0;
  console.log(`DEBUG: Circuito ${circuito.nombre || circuito.id} - Potencia: ${potencia} VA - Tensión: ${tension}V - I: ${corriente} A`);
  return corriente;
};
