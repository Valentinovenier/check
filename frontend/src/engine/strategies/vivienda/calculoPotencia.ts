import { DatosVivienda } from '../../../types/vivienda';
import { calcularPotencias } from './normas770';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../../../data/vivienda/factoresSimultaneidad';
import { obtenerCircuitosMinimos } from './normas770';

// Cláusulas 770.8.2 y 770.8.3

export const calcularDPMS = (datos: DatosVivienda) => {
    // 1. DPMS_Grado
    const { potenciaMaximaSimultanea: DPMS_Grado_Original } = calcularPotencias(datos);
    
    // Obtener factor normativo para ajustar el grado
    const minimos = obtenerCircuitosMinimos(datos.gradoElectrificacion || 'Minimo');
    const factorSimultaneidadGradoNormativo = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimos] || 0.6;
    
    // Aplicar factor manual si existe y es mayor
    const factorSimultaneidadFinal = Math.max(factorSimultaneidadGradoNormativo, datos.coefSimultaneidadManual || 0);
    
    // Recalcular DPMS_Grado con el factor ajustado (asumiendo que DPMS_Grado_Original usaba factorSimultaneidadGradoNormativo)
    const DPMS_Grado = (DPMS_Grado_Original / factorSimultaneidadGradoNormativo) * factorSimultaneidadFinal;

    // 2. DPMS_Específicas
    const circuitosEspecificos = datos.circuitosCalculados.filter(c => c.esEspecifico);
    const DPMS_Específicas = circuitosEspecificos.reduce((sum, c) => {
        const potenciaNominalW = c.unidadPotencia === 'W' ? (c.potencia || 0) / 0.85 : (c.potencia || 0); // Convert W to VA using 0.85
        const coefUtilizacion = c.coefUtilizacion || 1;
        const coefSimultaneidad = c.coefSimultaneidad || 1;
        return sum + (potenciaNominalW * coefUtilizacion * coefSimultaneidad);
    }, 0);

    // 3. Carga Total
    const cargaTotal = DPMS_Grado + DPMS_Específicas;

    // 4. Validaciones Técnicas
    const advertencias: string[] = [];
    const supplyType = datos.supplyType || 'monophasic';

    if (supplyType === 'monophasic' && cargaTotal > 7000) {
        advertencias.push('La Carga Total supera los 7 kVA. Se recomienda cambiar a suministro trifásico.');
    }
    
    circuitosEspecificos.forEach(c => {
        const potenciaNominalVA = c.unidadPotencia === 'W' ? (c.potencia || 0) / 0.85 : (c.potencia || 0); // Convert W to VA using 0.85
        const corrienteNominal = potenciaNominalVA / (supplyType === 'trifasic' ? 380 : 220); // Ajuste básico por tensión
        
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
