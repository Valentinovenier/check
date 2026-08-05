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
    // Nota: Esto es una simplificación basada en la lógica existente del proyecto
    const potenciaIUG = datos.circuitosCalculados
        .filter(c => c.tipo === 'iluminacion_usos_generales')
        .reduce((sum, c) => sum + (c.manualPuntosIUG || c.puntosIUG || 0) * 150, 0); // 150VA por punto IUG
    
    const potenciaTUG = datos.circuitosCalculados
        .filter(c => c.tipo === 'tomacorrientes_usos_generales')
        .reduce((sum, c) => sum + (c.manualPuntosTUG || c.puntosTUG || 0) * 220, 0); // 220VA por punto TUG

    const DPMS_Grado = (potenciaIUG + potenciaTUG) * factorSimultaneidad;

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
