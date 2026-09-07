import { validarAgrupamiento } from './validacionesAgrupamiento';
import { Project, Canalizacion } from '../../../types/project';

describe('validarAgrupamiento', () => {
  const mockProject: Project = {
    id: 'test',
    name: 'Test Project',
    projectType: 'Vivienda',
    createdAt: '',
    status: 'draft',
    protecciones: [],
    armonicos: { habilitado: false, modoEntrada: 'porcentaje', h3: 0, h5: 0, h7: 0, h9: 0 },
    tableros: [],
    tableroPrincipal: {} as any,
    datosVivienda: {
      superficieCubierta: 100,
      superficieSemicubierta: 0,
      ambientes: [],
      circuitosCalculados: [
        { id: 'c1', nombre: 'Circuito 1', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 1, puntosTUE: 0, ambientesIds: [] },
        { id: 'c2', nombre: 'Circuito 2', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 1, puntosTUE: 0, ambientesIds: [] },
        { id: 'c3', nombre: 'Circuito 3', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 1, puntosTUE: 0, ambientesIds: [] },
        { id: 'c4', nombre: 'Circuito 4', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 1, puntosTUE: 0, ambientesIds: [] },
      ]
    }
  };

  test('debe permitir hasta 3 circuitos de uso general', () => {
    const canalizacion: Canalizacion = {
      id: 'can1',
      nombre: 'Canalización 1',
      circuitosIds: ['c1', 'c2', 'c3']
    };
    const resultado = validarAgrupamiento(mockProject, canalizacion);
    expect(resultado.esValido).toBe(true);
    expect(resultado.errores.length).toBe(0);
  });

  test('debe fallar si hay más de 3 circuitos de uso general', () => {
    const canalizacion: Canalizacion = {
      id: 'can1',
      nombre: 'Canalización 1',
      circuitosIds: ['c1', 'c2', 'c3', 'c4']
    };
    const resultado = validarAgrupamiento(mockProject, canalizacion);
    expect(resultado.esValido).toBe(false);
    expect(resultado.errores).toContain('Máximo tres circuitos para usos generales por cañería.');
  });
});
