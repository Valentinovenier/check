import { ParametrosCable } from '../../../types/cables';
import { catalogoCablesPVC, catalogoCablesXLPE, ParametrosCableCompleto } from '../../../data/cables';

export const calcularImpedanciaCable = (
  seccion: number,
  longitudKm: number,
  aislacion: 'PVC' | 'XLPE',
  tipoConfiguracion: 'unipolar_trebol' | 'unipolar_contacto' | 'monofasico' | 'trifasico' | 'trifasico_neutro'
): { r: number; x: number } => {
  const catalogo = aislacion === 'PVC' ? catalogoCablesPVC : catalogoCablesXLPE;
  const cable = catalogo.find((c: ParametrosCableCompleto) => c.seccion === seccion);

  if (!cable) {
    throw new Error(`No se encontraron parámetros para cable ${aislacion} de ${seccion} mm²`);
  }

  // Z = (R + jX) * longitud
  const r = cable.resistencia * longitudKm;
  const x = cable.reactancia[tipoConfiguracion] * longitudKm;

  return { r, x };
};

// Función para sumar impedancias: Z_total = Z_trafo + Z_cable
export const calcularImpedanciaTotal = (
  zTrafo: { r: number; x: number },
  zCable: { r: number; x: number }
) => {
  return {
    r: zTrafo.r + zCable.r,
    x: zTrafo.x + zCable.x
  };
};
