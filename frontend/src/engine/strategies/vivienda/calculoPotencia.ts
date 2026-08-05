import { DatosVivienda, CircuitoCalculado } from '../../../types/vivienda';

// Cláusulas 770.8.2 y 770.8.3

export const calcularDPMS = (datos: DatosVivienda) => {
    // 1. DPMS_Grado
    // Grado Electrificación y coeficientes
    const factoresSimultaneidad: Record<string, number> = {
        'Minimo': 1.0,
        'Medio': 0.8,
        'Elevado': 0.7,
        'Superior': 0.6
    };
    const factorSimultaneidad = factoresSimultaneidad[datos.gradoElectrificacion || 'Minimo'] || 1.0;
    
    // Potencia circuitos generales (estimación simple según puntos)
    const circuitos = datos.circuitosCalculados || [];
    let potenciaTotal = 0;

    circuitos.forEach(circ => {
        if (circ.esEspecifico) return; // Saltamos específicos

        let potenciaCircuito = 0;
        
        switch (circ.tipo) {
            case 'iluminacion_usos_generales':
                let puntosIUG = 0;
                Object.values(datos.tomasPorAmbiente || {}).forEach((amb: any) => {
                    puntosIUG += (amb[circ.id]?.IUG || 0);
                });

                if (circ.tieneTomacorrientesDerivados) {
                    potenciaCircuito = 2200;
                } else {
                    potenciaCircuito = (2 / 3) * puntosIUG * 60;
                }
                break;
            case 'tomacorrientes_usos_generales':
                potenciaCircuito = 2200;
                break;
            case 'usos_especiales':
                potenciaCircuito = 3300;
                break;
        }
        potenciaTotal += potenciaCircuito;
    });

    const DPMS_Grado = potenciaTotal * factorSimultaneidad;

    // 2. DPMS_Específicas
    const circuitosEspecificos = datos.circuitosCalculados.filter(c => c.esEspecifico);
    const DPMS_Específicas = circuitosEspecificos.reduce((sum, c) => {
        const potenciaNominal = (c.potencia || 0) * (c.unidadPotencia === 'kW' ? 1000 : 1);
        const coefUtilizacion = c.coefUtilizacion || 1;
        const coefSimultaneidad = c.coefSimultaneidad || 1;
        return sum + (potenciaNominal * coefUtilizacion * coefSimultaneidad);
    }, 0);

    // 3. Carga Total
    const cargaTotal = DPMS_Grado + DPMS_Específicas;

    // 4. Validaciones Técnicas
    const advertencias: string[] = [];
    if (cargaTotal > 7000) {
        advertencias.push('La Carga Total supera los 7 kVA. Se recomienda suministro trifásico.');
    }
    
    circuitosEspecificos.forEach(c => {
        const potenciaNominal = (c.potencia || 0) * (c.unidadPotencia === 'kW' ? 1000 : 1);
        const corrienteNominal = potenciaNominal / 220;
        if (corrienteNominal > 8) {
            advertencias.push(`El circuito específico "${c.nombre}" consume más de 8A. Requiere canalización independiente.`);
        }
    });

    return {
        DPMS_Grado,
        DPMS_Específicas,
        cargaTotal,
        advertencias
    };
};
