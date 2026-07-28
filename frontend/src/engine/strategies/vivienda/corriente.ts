import { Project, BaseTablero, CircuitoTerminal, isTablero } from '../../../types/project';

const getTension = (project: Project): number => {
  const isTrifasica = project.tipoInstalacion === 'Trifásica';
  return isTrifasica ? 380 : 220;
};

// Función auxiliar para calcular potencia según normas (AEA 770)
const getPotenciaCircuito = (c: any, project?: Project): number => {
    // AEA 770: Demanda de potencia máxima simultánea
    switch (c.tipo) {
        case 'iluminacion_usos_generales': 
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
            // AEA 770: Minimo 1 punto por circuito IUG. Si puntos es 0, usamos 1 punto de 60 VA por defecto.
            const puntos = puntosIUG > 0 ? puntosIUG : 1;
            return c.tieneTomacorrientesDerivados 
                ? 2200 
                : (2 / 3) * puntos * 60;
        case 'tomacorrientes_usos_generales': 
            return 2200;
        case 'usos_especiales': 
            return 3300;
        case 'usos_especificos_mbtf': 
            return c.potenciaManual || 0;
        default: return 0;
    }
};

export const getTableroNominalCurrent = (tablero: BaseTablero, project: Project): number => {
    // 1. Si es el tablero principal, usamos la DPMS calculada para la vivienda
    // Hacemos la comprobación más robusta
    const esPrincipal = tablero.nombre.toLowerCase().includes('principal') || (tablero as any).tipo === 'Principal';
    
    if (esPrincipal) {
        return project.datosVivienda?.potenciaMaximaSimultanea 
            ? project.datosVivienda.potenciaMaximaSimultanea / getTension(project) 
            : 0;
    }

    // 2. Si tiene potenciaTotal definida (caso TableroSeccional), usarla
    if ('potenciaTotal' in tablero && (tablero as any).potenciaTotal) {
        return (tablero as any).potenciaTotal / getTension(project);
    }
    
    // 3. Caso contrario, sumar las potencias de sus circuitos y subtableros
    let totalPotencia = 0;
    if (tablero.circuitosTerminales) {
        totalPotencia += tablero.circuitosTerminales.reduce((acc, c) => acc + getPotenciaCircuito(c, project), 0);
    }
    
    return totalPotencia / getTension(project);
};

export const getCircuitoNominalCurrent = (circuito: CircuitoTerminal, project: Project): number => {
  const potencia = getPotenciaCircuito(circuito, project);
  const corriente = potencia / getTension(project);
  console.log(`DEBUG: Circuito ${circuito.nombre} - Potencia: ${potencia} VA - I: ${corriente} A`);
  return corriente;
};
