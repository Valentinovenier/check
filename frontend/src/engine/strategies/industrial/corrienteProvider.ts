import { TABLAS_CORRIENTE_SAEA } from '../../../data/corrientesNormativasAdmisibles';
import { AEA_770_RULES } from '../../../data/vivienda/rules';
import { AEA_Part } from '../../../types/normas';

export const getAdmisible = (
  norma: AEA_Part,
  seccion: number,
  metodo: string,
  tipoInstalacion: 'Trifásica' | 'Monofásica',
  material: 'Cobre' | 'Aluminio',
  aislacion: 'PVC' | 'XLPE' | 'Mineral',
  normaMineral?: 'B52-8' | 'B52-9',
  disposicion?: string,
  tipoCable?: 'unipolar' | 'multipolar',
  plano?: 'horizontal' | 'vertical'
): number | undefined => {
  console.log(`[DEBUG] getAdmisible - Buscando: Norma=${norma}, Seccion=${seccion}, Metodo=${metodo}, Aislacion=${aislacion}, Material=${material}, Instalacion=${tipoInstalacion}, TipoCable=${tipoCable}`);
  
  // Validación Normativa
  if (norma === '770') {
    const metodoNormalizado = metodo.toUpperCase().replace('METODO', '').trim();
    if (!AEA_770_RULES.allowedMethods.includes(metodoNormalizado)) {
        console.warn(`[WARNING] Método ${metodoNormalizado} no permitido en AEA 770`);
        return undefined;
    }
  }
  
  const esTrifasico = tipoInstalacion === 'Trifásica';
  const nConductoresBuscado = esTrifasico ? 3 : 2;
  const metodoNormalizado = metodo.toUpperCase().replace('METODO', '').trim();
  
  const tablas = TABLAS_CORRIENTE_SAEA.filter(t => {
    if (aislacion === 'Mineral') {
        // Para Mineral, verificar que la tabla soporta el método solicitado
        // Se usa split('_') para manejar claves como 'E_F'
        const soportaMetodo = Object.keys(t.metodosSoportados).some(key => key.split('_').includes(metodoNormalizado));
        if (!soportaMetodo) return false;
        
        if (metodoNormalizado === 'C') {
             return (t.norma === 'B52-6' || t.norma === 'B52-7') && t.material === material;
        }
        
        // Para E, F, G usar normaMineral explícita
        if (normaMineral) {
            return t.norma === normaMineral && t.material === material;
        }
        
        // Fallback si no se especificó normaMineral para E, F, G
        return (t.norma === 'B52-8' || t.norma === 'B52-9') && t.material === material;
    }
    // Filtrado universal
    const soportaMetodo = Object.keys(t.metodosSoportados).some(key => key.split('_').includes(metodoNormalizado));
    const isMetodoE_F_G = ['E', 'F', 'G'].includes(metodoNormalizado);
    
    // Para métodos E, F y G, la misma tabla contiene valores para 2C y 3C.
    // Ignoramos el chequeo estricto de nConductoresCargados para estos métodos.
    const matchesConductores = isMetodoE_F_G || t.nConductoresCargados === nConductoresBuscado;

    return t.material === material && 
           t.aislacion === aislacion && 
           matchesConductores &&
           soportaMetodo;
  });

  // Find the first table that actually has data for this section
  const tabla = tablas.find(t => !!t.datos[seccion]);

  if (!tabla) {
      console.error(`[ERROR] No se encontró tabla de corriente para: Norma=${norma}, Seccion=${seccion}, Metodo=${metodo}`);
      return 0; // Retornar 0 en lugar de undefined para ser manejado en la capa superior
  }
  
  const datosSeccion = tabla.datos[seccion];

  // Lógica de selección explícita para E, F, G
  if (['E', 'F', 'G'].includes(metodoNormalizado)) {
    console.log(`[DEBUG] Buscando Método ${metodoNormalizado}, TipoCable=${tipoCable}, Trifasico=${esTrifasico}`);
    
    // Corregido: permitir Método E tanto para multipolar como unipolar si los datos existen
    if (metodoNormalizado === 'E') {
        const data = (datosSeccion.multipolar as any)?.metodoE || (datosSeccion.unipolar as any)?.metodoE;
        if (!data) return undefined;
        const key = esTrifasico ? '3C' : '2C';
        return data[key];
    }
    
    if (tipoCable === 'unipolar') {
        if (metodoNormalizado === 'F') {
            // ... (resto del código igual) ...
            console.log(`[DEBUG] Método F, disposicion recibida: ${disposicion}`);
            const keyMap: Record<string, string> = esTrifasico 
                ? { 'trebol': '3C_tresbolillo_cuadrete', 'contacto': '3C_contacto' }
                : { 'trebol': '2C_contacto', 'contacto': '2C_contacto' };
            const key = disposicion ? keyMap[disposicion.toLowerCase()] : undefined; // Asegurar minúsculas
            console.log(`[DEBUG] Método F, Key buscada: ${key}`);
            return (datosSeccion.unipolar as any)?.metodoF?.[key || ''];
        }
        if (metodoNormalizado === 'G') {
            // ... (resto del código igual) ...
            const key = esTrifasico && disposicion === 'separado' 
                ? (plano === 'horizontal' ? '3C_plano_horizontal_separado_1D' : '3C_plano_vertical_separado_1D') 
                : undefined;
            
            console.log(`[DEBUG] Método G, Key buscada: ${key}`);
            
            if (key) {
                const metodoGData = (datosSeccion.unipolar as any)?.metodoG;
                if (metodoGData) {
                    // Try exact key first
                    if (metodoGData[key] !== undefined) return metodoGData[key];

                    // Fallback: try removing '_separado_1D'
                    const fallbackKey = key.replace('_separado_1D', '');
                    console.log(`[DEBUG] Clave exacta no encontrada, probando fallback: ${fallbackKey}`);
                    return metodoGData[fallbackKey];
                }
            }
            return undefined;
        }
    }
    return undefined;
  }
  
  // Búsqueda estándar (A, B, C, D)
  const valor = (datosSeccion as any)[metodoNormalizado];
  
  // Si es Método C y aislación Mineral, el valor es un objeto con disposiciones
  if (metodoNormalizado === 'C' && aislacion === 'Mineral' && typeof valor === 'object') {
       // Buscar la disposición correcta (por ahora asumimos una lógica simple o la primera)
       // Esto necesitaría mayor refinamiento si el usuario puede elegir la disposición para Mineral C.
       return Object.values(valor)[0] as number;
  }

  return valor;
};
