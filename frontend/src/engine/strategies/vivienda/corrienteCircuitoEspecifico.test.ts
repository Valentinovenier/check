import { getPotenciaCircuito, getCircuitoNominalCurrent } from './corriente';
import { calcularConductorResidencial } from './calculador';
import { Project, Conductor } from '../../../types/project';
import { CircuitoCalculado } from '../../../types/vivienda';

describe('Cálculo de corriente y caída de tensión para cargas específicas', () => {
  const mockProject: Project = {
    id: 'test-proj',
    name: 'Proyecto Test',
    projectType: 'Vivienda',
    createdAt: '2026-09-03',
    status: 'draft',
    armonicos: { habilitado: false, modoEntrada: 'porcentaje', h3: 0, h5: 0, h7: 0, h9: 0 },
    cosPhi: 0.85,
    tableros: [],
    tableroPrincipal: {} as any,
    datosVivienda: {
      superficieCubierta: 80,
      superficieSemicubierta: 0,
      gradoElectrificacion: 'Medio',
      ambientes: [],
      circuitosCalculados: [
        {
          id: 'ce-1',
          nombre: 'Alimentación Aire Acondicionado',
          tipo: 'usos_especificos',
          esEspecifico: true,
          siglaEspecifica: 'ACU',
          potencia: 2500,
          unidadPotencia: 'W',
          coefUtilizacion: 1,
          coefSimultaneidad: 1,
          puntosIUG: 0,
          puntosTUG: 0,
          puntosTUE: 0,
          ambientesIds: [],
          proteccion: {
            id: 'prot-1',
            modelo: 'Termomagnética Curva C 16A',
            tipo_proteccion: 'Termomagnética',
            in_amp: 16,
            curva_disparo: 'C',
            polos: 2,
            capacidades: [{ tension_v: 220, icn_ka: 3, clase_limitacion: 3 }]
          }
        } as unknown as CircuitoCalculado
      ]
    }
  };

  test('getPotenciaCircuito debe calcular la potencia en VA convirtiendo desde W con cosPhi', () => {
    const circ = mockProject.datosVivienda!.circuitosCalculados[0];
    const pot = getPotenciaCircuito(circ, mockProject);
    // 2500 W / 0.85 = 2941.176 VA
    expect(pot).toBeCloseTo(2941.18, 1);
  });

  test('getPotenciaCircuito debe calcular la potencia directamente si la unidad es VA', () => {
    const circVA: CircuitoCalculado = {
      id: 'ce-2',
      nombre: 'Bomba de Agua',
      tipo: 'usos_especificos',
      esEspecifico: true,
      potencia: 1500,
      unidadPotencia: 'VA',
      coefUtilizacion: 0.9,
      coefSimultaneidad: 0.8,
      puntosIUG: 0,
      puntosTUG: 0,
      puntosTUE: 0,
      ambientesIds: []
    };
    const pot = getPotenciaCircuito(circVA, mockProject);
    // 1500 * 0.9 * 0.8 = 1080 VA
    expect(pot).toBeCloseTo(1080, 1);
  });

  test('getCircuitoNominalCurrent no debe ser 0 para un circuito de carga específica', () => {
    const circ = mockProject.datosVivienda!.circuitosCalculados[0];
    const corriente = getCircuitoNominalCurrent(circ as any, mockProject);
    // 2941.176 VA / 220 V = 13.37 A
    expect(corriente).toBeCloseTo(13.37, 1);
    expect(corriente).toBeGreaterThan(0);
  });

  test('calcularConductorResidencial debe calcular IB y caída de tensión mayores a 0 con límite configurado por el usuario', () => {
    const conductor: Conductor = {
      tipo: 'Cable',
      material: 'Cobre',
      aislacion: 'PVC',
      metodoInstalacion: 'B2',
      longitud: 15,
      destinoId: 'ce-1',
      tramoId: 'ce-1',
      tipoTramo: 'CircuitoTerminal',
      normaCable: 'IRAM 2178'
    } as any;

    const resultado = calcularConductorResidencial(conductor, mockProject);
    expect(resultado.resultadoCalculo).toBeDefined();

    const pasos = resultado.resultadoCalculo!.pasosVerificacion;
    expect(pasos.length).toBeGreaterThanOrEqual(8);

    // Paso 1: Corriente de diseño IB
    const paso1 = pasos.find((p: any) => p.numero === 1);
    expect(paso1).toBeDefined();
    expect(paso1!.valor).toContain('13.37 A');
    expect(paso1!.valor).not.toContain('0.00 A');

    // Paso 8: Caída de tensión - debe ser 3% por defecto y NO 5%
    const paso8 = pasos.find((p: any) => p.numero === 8);
    expect(paso8).toBeDefined();
    expect(paso8!.valor).toContain('13.37A');
    expect(resultado.resultadoCalculo!.caidaTensionPorcentaje).toBeGreaterThan(0);
    expect(paso8!.valor).not.toContain('0.00A');
    expect(paso8!.condicion).toContain('3%');
    expect(paso8!.condicion).not.toContain('5%');
  });

  test('calcularConductorResidencial debe respetar el valor de caída personalizada ingresado por el usuario (ej: 2.5%)', () => {
    const conductorCustom: Conductor = {
      tipo: 'Cable',
      material: 'Cobre',
      aislacion: 'PVC',
      metodoInstalacion: 'B2',
      longitud: 15,
      destinoId: 'ce-1',
      tramoId: 'ce-1',
      tipoTramo: 'CircuitoTerminal',
      normaCable: 'IRAM 2178',
      caidaMaxPermitida: 2.5
    } as any;

    const resultado = calcularConductorResidencial(conductorCustom, mockProject);
    const paso8 = resultado.resultadoCalculo!.pasosVerificacion.find((p: any) => p.numero === 8);
    expect(paso8).toBeDefined();
    expect(paso8!.condicion).toContain('2.5%');
  });
});
