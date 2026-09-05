import { useState } from 'react';
import { Conductor, Project, TableroSeccionalSimple } from '../types/project';
import { useProject } from '../context/ProjectDataContext';
import { ConductorForm } from './ConductorForm';
import { ViviendaConductorCalculation } from './ViviendaConductorCalculation';
import { catalogoCablesPVC, catalogoCablesXLPE, ParametrosCableCompleto } from '../data/cables';
import { getProjectStrategy } from '../engine/factory';
import { calcularImpedanciaTransformador } from '../engine/strategies/industrial/transformador';
import { calcularConductorTramo } from '../engine/strategies/industrial/calculadorTramo';

const TRAMOS_ELECTRICOS = [
  { id: 'trafo-tgbt', label: 'Transformador → Interruptor Cabecera TGBT', usaPotenciaTrafo: true },
  { id: 'tgbt-barra', label: 'Interruptor Cabecera TGBT → Barra Omnibus', usaPotenciaTrafo: true },
  { id: 'barra-salida', label: 'Barra Omnibus → Interruptor de Salida TGBT', usaPotenciaTrafo: false },
  { id: 'salida-tablero', label: 'Interruptor de Salida TGBT → Tablero Seccional', usaPotenciaTrafo: false },
];

const TRAMOS_VIVIENDA = [
  { id: 'acometida-tp', label: 'Acometida → Tablero Principal', usaPotenciaTrafo: true },
  { id: 'tp-circuito', label: 'Tablero Principal → Circuito Terminal', usaPotenciaTrafo: false },
];

export const ConductorCalculation = ({ project, onChange }: { project: Project; onChange: (p: Project) => void }) => {
  const isVivienda = project.projectType === 'Vivienda';
  if (isVivienda) {
      return <ViviendaConductorCalculation project={project} onChange={onChange} />;
  }

  const tramosDisponibles = TRAMOS_ELECTRICOS;
  
  const tablerosSec: TableroSeccionalSimple[] = project.tablerosSeccionales || [];

  const [selectedTramoId, setSelectedTramoId] = useState<string>(tramosDisponibles[0].id);
  const [selectedTableroId, setSelectedTableroId] = useState<string>(tablerosSec[0]?.id || '');
  
  const tramoActual = tramosDisponibles.find(t => t.id === selectedTramoId)!;
  const esTramoDeTablero = !isVivienda && !tramoActual.usaPotenciaTrafo; // Solo industria usa tableros aquí
  const tableroSeleccionado: TableroSeccionalSimple | undefined = tablerosSec.find(t => t.id === selectedTableroId);

  const getTramoKey = (tramoId: string): string => {
    const tramo = TRAMOS_ELECTRICOS.find(t => t.id === tramoId);
    if (!tramo?.usaPotenciaTrafo && selectedTableroId) {
      return `${tramoId}__${selectedTableroId}`;
    }
    return tramoId;
  };

  const currentTramoKey = getTramoKey(selectedTramoId);

  const getConductor = (key: string): Conductor | undefined =>
    (project as any).conductores?.[key];

  const updateConductor = (key: string, conductor: Conductor) => {
    onChange({
      ...project,
      conductores: {
        ...(project as any).conductores,
        [key]: conductor,
      },
    });
  };

  /**
   * Corriente nominal del tramo:
   * - Tramos 1 y 2 (fijos): potencia total del transformador
   * - Tramos 3 y 4 (por tablero): potencia del tablero seleccionado
   */
  const getInominal = (): number => {
    const tipoInstalacion = project.tipoInstalacion || 'Trifásica';
    const tension =
      Number(project.transformador?.tensionSecundario) ||
      (tipoInstalacion === 'Trifásica' ? 380 : 220);
    
    const esTri = tipoInstalacion === 'Trifásica' || (tipoInstalacion as any) === 'trifasica';
    const div = esTri ? Math.sqrt(3) * tension : tension;

    let resultado = 0;
    if (tramoActual.usaPotenciaTrafo) {
      resultado = ((Number(project.transformador?.potencia) || 0) * 1000) / div;
    } else if (tableroSeleccionado) {
      resultado = ((Number(tableroSeleccionado.potencia) || 0) * 1000) / div;
    }
    
    // Aplicar coeficiente de simultaneidad del proyecto (si está configurado)
    const coef = Number(project.coefSimultaneidad);
    if (!isNaN(coef) && coef > 0 && coef <= 1) {
       resultado = resultado * coef;
    }
    
    console.log(`[DEBUG Inominal] Tensión: ${tension}, Tipo: ${tipoInstalacion}, EsTri: ${esTri}, Div: ${div}, Potencia: ${tramoActual.usaPotenciaTrafo ? project.transformador?.potencia : tableroSeleccionado?.potencia}, Resultado: ${resultado}`);
    return resultado;
  };

  const handleCalcular = () => {
    if (esTramoDeTablero && !tableroSeleccionado) {
      alert('Seleccioná un tablero seccional para calcular este tramo.');
      return;
    }

    const conductor = getConductor(currentTramoKey);
    if (!conductor || !conductor.aislacion || !conductor.material || !conductor.metodoInstalacion) {
      alert('Por favor completa todos los datos del conductor');
      return;
    }

    const catalogo: ParametrosCableCompleto[] =
      conductor.aislacion === 'XLPE' ? catalogoCablesXLPE : catalogoCablesPVC;

    const tipoInstalacion = project.tipoInstalacion || 'Trifásica';
    const tension =
      Number(project.transformador?.tensionSecundario) ||
      (tipoInstalacion === 'Trifásica' ? 380 : 220);

    const Inominal = getInominal();

    // --- Armónicos ---
    const armonicos = project.armonicos;
    let I_fase = Inominal;
    let I_neutro: number | undefined = undefined;

    if (armonicos?.habilitado) {
      const toPorc = (val: number) =>
        armonicos.modoEntrada === 'amperios' ? (Inominal > 0 ? val / Inominal : 0) : val;
      const I3 = toPorc(Number(armonicos.h3) || 0);
      const I5 = toPorc(Number(armonicos.h5) || 0);
      const I7 = toPorc(Number(armonicos.h7) || 0);
      const I9 = toPorc(Number(armonicos.h9) || 0);
      I_fase = Inominal * Math.sqrt(1 + I3 ** 2 + I5 ** 2 + I7 ** 2 + I9 ** 2);
      I_neutro = 3 * Inominal * (I3 + I9);
    }

    // --- Ik acumulado ---
    let total_R = 0;
    let total_X = 0;

    if (project.transformador) {
      const zTrafo = calcularImpedanciaTransformador({
        potenciaKVA: Number(project.transformador.potencia),
        tensionSecundarioV: Number(project.transformador.tensionSecundario),
        uccPorcentaje: project.transformador.uccPorcentaje,
        PccW: project.transformador.PccW,
        tipo: project.transformador.tipo
      });
      total_R = zTrafo.r;
      total_X = zTrafo.x;
    }

    const tramoIndex = TRAMOS_ELECTRICOS.findIndex(t => t.id === selectedTramoId);

    for (let i = 0; i < tramoIndex; i++) {
      const tramoPrev = TRAMOS_ELECTRICOS[i];
      // Key del tramo anterior: si es de tablero, usa el mismo tablero seleccionado
      const prevKey = tramoPrev.usaPotenciaTrafo
        ? tramoPrev.id
        : `${tramoPrev.id}__${selectedTableroId}`;

      const condAnterior = getConductor(prevKey);
      const resAnterior = condAnterior?.resultadoCalculo; // <--- USAR resultadoCalculo DIRECTAMENTE

      if (!resAnterior || !resAnterior.cable || !condAnterior) {
        alert(
          `Para calcular este tramo y su Ik, primero debés calcular el tramo aguas arriba: ${tramoPrev.label}`
        );
        return;
      }

      const longitudKm = (Number(condAnterior.longitud) || 0) / 1000;
      const n = resAnterior.nConductores;
      const R = Number(resAnterior.cable.resistencia || 0);

      let X = 0;
      if (condAnterior.tipoCable === 'Unipolar' && condAnterior.disposicion === 'trebol') {
        X = Number(resAnterior.cable.reactancia?.['unipolar_trebol'] || 0);
      } else if (condAnterior.tipoCable === 'Unipolar' && condAnterior.disposicion === 'contacto') {
        X = Number(resAnterior.cable.reactancia?.['unipolar_contacto'] || 0);
      } else {
        X = Number(
          resAnterior.cable.reactancia?.[
            tipoInstalacion === 'Trifásica' ? 'trifasico' : 'monofasico'
          ] || 0
        );
      }

      total_R += (R * longitudKm) / n;
      total_X += (X * longitudKm) / n;
    }

    const Z_total = Math.sqrt(total_R ** 2 + total_X ** 2);
    let Ik_calculado = 50;
    if (Z_total > 0) {
      Ik_calculado =
        tipoInstalacion === 'Trifásica'
          ? tension / (Math.sqrt(3) * Z_total) / 1000
          : tension / (2 * Z_total) / 1000;
    }

    const caidaMaxPermitida = Number(conductor.caidaMaxPermitida) || 3;
    const tiempoApertura =
      selectedTramoId === 'trafo-tgbt' ? Number(conductor.tiempoAperturaMT) || 0.1 : 0.1;

    // Determinar si es instalación en aire o tierra
    // D1 y D2 son métodos enterrados (tierra)
    const esAire = !conductor.metodoInstalacion?.toUpperCase().startsWith('D');
    
    // Determinar temperatura ambiente
    const tempDefault = esAire ? 40 : 25;
    const tempAmbiente = project.tempAmbiente ? Number(project.tempAmbiente) : tempDefault;

    const resultado = calcularConductorTramo(
      { 
        tipoTramo: conductor.tipoTramo || 'CircuitoTerminal',
        tipoCircuito: conductor.tipoCircuito || 'iluminacion_usos_generales',
        metodoInstalacion: conductor.metodoInstalacion || 'B2',
        longitudMetros: Number(conductor.longitud) || 0,
        corrienteDiseñoAmperes: I_fase,
        temperaturaAmbiente: tempAmbiente,
        canalizacionId: conductor.canalizacionId,
        tipoInstalacion: tipoInstalacion,
        aislacion: conductor.aislacion,
        material: conductor.material,
        disposicion: conductor.disposicion,
        plano: conductor.plano,
        tipoCable: conductor.tipoCable,
        agrupamiento: conductor.agrupamiento,
        norma: '5'
      },
      I_fase,
      Ik_calculado,
      tiempoApertura,
      (Number(conductor.longitud) || 0) / 1000,
      Number(project.transformador?.cosFi) || project.cosPhi || 0.85,
      caidaMaxPermitida,
      catalogo,
      tempAmbiente,
      esAire
    );

    const resultadoCompleto = {
      ...resultado,
      I_nominal: Inominal,
      I_fase,
      I_neutro,
      armonicosActivos: armonicos?.habilitado ?? false,
      Ik: Ik_calculado,
    };

    updateConductor(currentTramoKey, { ...conductor, resultadoCalculo: resultadoCompleto });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: project.id, name: project.name, data: project }),
      });
      if (response.ok) {
        alert('Configuración de conductores guardada exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const currentConductor = getConductor(currentTramoKey);
  const currentResultado = currentConductor?.resultadoCalculo;
  const currentTramoLabel = tramoActual.label;

  return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Cálculo de Conductores</h2>
        <button
          onClick={handleSave}
          className="bg-[var(--accent)] text-black px-4 py-2 rounded-lg font-bold"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-6">
        {/* Selector de tramo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
            Seleccionar Tramo
          </label>
          <select
            className="bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 hover:border-slate-500 transition-colors w-full md:w-2/3"
            value={selectedTramoId}
            onChange={e => setSelectedTramoId(e.target.value)}
          >
            {tramosDisponibles.map(t => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de tablero seccional (solo para tramos industriales de tablero) */}
        {esTramoDeTablero && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
              Tablero Seccional
            </label>
            {tablerosSec.length === 0 ? (
              <p className="text-xs text-slate-500 italic ml-1">
                No hay tableros seccionales cargados. Andá a la sección "Tableros Seccionales" para agregar.
              </p>
            ) : (
              <select
                className="bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 hover:border-slate-500 transition-colors w-full md:w-2/3"
                value={selectedTableroId}
                onChange={e => setSelectedTableroId(e.target.value)}
              >
                <option value="">— Seleccioná un tablero —</option>
                {tablerosSec.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({Number(t.potencia).toFixed(1)} kVA)
                  </option>
                ))}
              </select>
            )}
            {tableroSeleccionado && (
              <p className="text-xs text-slate-400 ml-1">
                Corriente nominal del tramo:{' '}
                <span className="font-bold text-amber-400">{getInominal().toFixed(1)} A</span>
                {' '}(basada en {Number(tableroSeleccionado.potencia).toFixed(1)} kVA del tablero "{tableroSeleccionado.nombre}")
              </p>
            )}
          </div>
        )}

        {/* Formulario del conductor */}
        <div className="bg-[var(--bg-primary)] rounded-xl border border-slate-700 p-6 space-y-6">
          <ConductorForm
            label={`Configuración: ${currentTramoLabel}`}
            tramoId={selectedTramoId}
            conductor={currentConductor}
            onChange={c => updateConductor(currentTramoKey, c)}
          />

          <button
            onClick={handleCalcular}
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-600 transition-colors"
          >
            Calcular Conductor
          </button>

          {currentResultado?.error && (
            <div className="p-3 bg-red-950 rounded border border-red-700 text-xs text-red-200">
              <p>{currentResultado.error}</p>
            </div>
          )}

          {currentResultado && !currentResultado.error && (
            <div className="p-4 bg-slate-950 rounded border border-slate-700 text-sm text-white space-y-3">
              <p className="font-bold text-slate-400 uppercase text-[10px] mb-3">Resultado del Cálculo</p>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase mb-0.5">Sección</p>
                  <p className="text-[var(--accent)] font-bold text-base">
                    {currentResultado?.cable?.seccion ? `${currentResultado.cable.seccion} mm²` : '—'}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase mb-0.5">Cables ‖</p>
                  <p className="text-[var(--accent)] font-bold text-base">
                    {currentResultado.nConductores}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase mb-0.5">Caída V</p>
                  <p className="text-[var(--accent)] font-bold text-base">
                    {currentResultado.porcentajeCaida?.toFixed(2) || '—'}%
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Corrientes del Tramo
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Corriente nominal (I<sub>nom</sub>):</span>
                  <span className="font-bold text-white">{currentResultado.I_nominal?.toFixed(1)} A</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ik (Corriente de Cortocircuito):</span>
                  <span className="font-bold text-red-400">{currentResultado.Ik?.toFixed(2)} kA</span>
                </div>
                {currentResultado.armonicosActivos && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400">Corriente real por fase (con armónicos):</span>
                      <span className="font-bold text-amber-300">
                        {currentResultado.I_fase?.toFixed(1)} A
                      </span>
                    </div>
                    {currentResultado.I_neutro !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400">Corriente por neutro (3° + 9° arm.):</span>
                        <span className="font-bold text-orange-300">
                          {currentResultado.I_neutro?.toFixed(1)} A
                        </span>
                      </div>
                    )}
                    <div className="mt-2 p-2 bg-amber-950/40 rounded border border-amber-900/50 text-[10px] text-amber-400">
                      ⚠ Diseño con armónicos activos. Conductor seleccionado para I<sub>fase</sub> ={' '}
                      {currentResultado.I_fase?.toFixed(1)} A.
                      {currentResultado.I_neutro !== undefined &&
                        ` El neutro debe soportar ${currentResultado.I_neutro?.toFixed(1)} A.`}
                    </div>
                  </>
                )}
              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Factores de Corrección (Normativos)
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Corriente base catálogo (I<sub>adm_base</sub>):</span>
                  <span className="font-semibold text-white">{currentResultado.I_adm_base || 0} A</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Temp. Ambiente (K<sub>t</sub>):</span>
                  <span className="font-semibold text-white">{currentResultado.f_temp?.toFixed(2) || '1.00'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Agrupamiento (K<sub>a</sub>):</span>
                  <span className="font-semibold text-white">{currentResultado.f_agrup?.toFixed(2) || '1.00'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Simetría en Paralelo (K<sub>s</sub>):</span>
                  <span className="font-semibold text-white">{currentResultado.f_simetria?.toFixed(2) || '1.00'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Corriente corregida total (I<sub>admisible</sub>):</span>
                  <span className="font-bold text-emerald-400">{currentResultado.I_adm_corregida?.toFixed(1)} A</span>
                </div>
              </div>

              {currentResultado.capacidadCorto !== undefined && (
                <div className="border-t border-slate-800 pt-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Verificación Térmica (Cortocircuito)
                  </p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Soportabilidad cable (K²S²):</span>
                    <span className="font-semibold text-white">{(currentResultado.capacidadCorto ? (currentResultado.capacidadCorto / 1e6).toFixed(2) : '—')} MA²s</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Energía de falla (I<sub>k</sub>²t):</span>
                    <span className="font-semibold text-white">{(currentResultado.energiaCorto ? (currentResultado.energiaCorto / 1e6).toFixed(2) : '—')} MA²s</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Estado de solicitación:</span>
                    <span className="font-bold text-emerald-400">✓ CUMPLE</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
