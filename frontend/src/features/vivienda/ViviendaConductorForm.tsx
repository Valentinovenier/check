import { Conductor } from '../../types/project';
import { useProject } from '../../context/ProjectDataContext';
import { useMemo, useEffect } from 'react';
import { calcularConductorResidencial } from '../../engine/strategies/vivienda/calculador';
import { obtenerProteccionAsignada } from '../../engine/strategies/vivienda/helpers';
import { METODOS_INSTALACION_VIVIENDA } from './uiMappers';
import { DetalleCalculoConductor } from './DetalleCalculoConductor';

interface Props {
  label: string;
  conductor?: Conductor;
  onChange: (c: Conductor) => void;
  tramoId?: string;
  hideCanalizacion?: boolean;
}

export const ViviendaConductorForm = ({ label, conductor, onChange, tramoId, hideCanalizacion }: Props) => {
  const { state: project } = useProject();
  
  const esTramoProtegido = tramoId === 'int-general-salida' || hideCanalizacion;
  const isPanelTramo = ['LineaPrincipal', 'LineaSeccional'].includes(conductor?.tipoTramo || '');

  // Buscar circuito correspondiente en datosVivienda
  const circuito = useMemo(() => project?.datosVivienda?.circuitosCalculados.find(c => c.id === tramoId), [project, tramoId]);

  // Solo los circuitos terminales requieren vinculación a canalización
  const esCircuitoTerminal = Boolean(circuito) || conductor?.tipoTramo === 'CircuitoTerminal';
  const necesitaCanalizacion = esCircuitoTerminal && !isPanelTramo && !esTramoProtegido && tramoId !== 'int-general-salida';
  
  // Verificar si tiene protección asignada buscando el circuito o tablero en los datos del proyecto
  const proteccionAsignada = useMemo(() => {
    return obtenerProteccionAsignada(project, conductor, tramoId);
  }, [project, conductor, tramoId]);

  const tieneProteccionAsignada = Boolean(proteccionAsignada);

  // Recalcular automáticamente si tiene protección asignada y faltan resultados pero hay datos suficientes
  useEffect(() => {
    if (project && tieneProteccionAsignada && conductor && !conductor.resultadoCalculo) {
        // Solo calcular si tenemos los datos mínimos necesarios
        if (conductor.metodoInstalacion && conductor.longitud) {
            const calculated = calcularConductorResidencial({ ...conductor, ...(tramoId ? { tramoId } : {}) } as any, project);
            if (calculated.resultadoCalculo) {
                onChange(calculated);
            }
        }
    }
  }, [project, tieneProteccionAsignada, tramoId, conductor]);

  const datosFaltantes = !conductor?.metodoInstalacion || !conductor?.longitud;

  // Buscar canalización vinculada si no está en el conductor
  const canalizacionVinculada = useMemo(() => {
    const found = project?.canalizaciones?.find(c => c.circuitosIds.includes(tramoId || ''));
    if (conductor?.canalizacionId) return project?.canalizaciones?.find(c => c.id === conductor.canalizacionId);
    return found;
  }, [project, conductor, tramoId]);

  const handleDataChange = (updates: Partial<Conductor>) => {
    let newConductor = { ...conductor, ...updates, ...(tramoId ? { tramoId } : {}) } as Conductor;
    
    if (isPanelTramo || esTramoProtegido) {
        newConductor.canalizacionId = undefined;
    }
    
    // Intentar calcular solo si tenemos lo mínimo
    if (project && tieneProteccionAsignada && newConductor.metodoInstalacion && newConductor.longitud) {
        newConductor = calcularConductorResidencial(newConductor, project);
    } else {
        newConductor.resultadoCalculo = undefined;
        newConductor.seccion = undefined;
    }
    
    onChange(newConductor);
  };

  return (
    <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
        <label className="text-xs font-medium text-slate-400 mb-4 block border-b border-slate-800 pb-2">
            {label} <span className="text-[var(--accent)] ml-2">(Normativa Viviendas AEA-90364-7-770)</span>
        </label>
        
        {!tieneProteccionAsignada ? (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>Debe asignar una protección al tablero o circuito en la sección "Protecciones" antes de poder calcular el conductor.</span>
            </div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
            {datosFaltantes && (
                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-blue-300 text-xs">
                    ℹ️ Complete el Método de Instalación y la Longitud para calcular la sección.
                </div>
            )}


            <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    {conductor?.metodoInstalacion?.startsWith('D') ? 'Temp. Suelo (°C)' : 'Temp. Ambiente (°C)'}
                </label>
                <input 
                    type="number"
                    className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                    value={conductor?.metodoInstalacion?.startsWith('D') ? (conductor?.tempSuelo ?? 25) : (conductor?.temperaturaAmbiente ?? 40)}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (conductor?.metodoInstalacion?.startsWith('D')) {
                            handleDataChange({ tempSuelo: val });
                        } else {
                            handleDataChange({ temperaturaAmbiente: val });
                        }
                    }}
                />
            </div>

            {conductor?.metodoInstalacion?.startsWith('D') && (
                <>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Resistividad Térmica (K·m/W)</label>
                        <input 
                            type="number"
                            step="0.1"
                            className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                            value={conductor?.resistividadTermica ?? 1.0}
                            onChange={(e) => handleDataChange({ resistividadTermica: parseFloat(e.target.value) || 1.0 })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Separación de bordes</label>
                        <select 
                            className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                            value={conductor?.separacionBordes || 'en_contacto'}
                            onChange={(e) => handleDataChange({ separacionBordes: e.target.value })}
                        >
                            <option value="en_contacto">En contacto</option>
                            {conductor.metodoInstalacion.startsWith('D1') && (
                                <>
                                    <option value="sep_0.25">0.25m</option>
                                    <option value="sep_0.5">0.5m</option>
                                    <option value="sep_1.0">1.0m</option>
                                </>
                            )}
                            {conductor.metodoInstalacion.startsWith('D2') && (
                                <>
                                    <option value="sep_un_diam">Separados un diámetro</option>
                                    <option value="sep_0.125">0.125m</option>
                                    <option value="sep_0.25">0.25m</option>
                                    <option value="sep_0.5">0.5m</option>
                                </>
                            )}
                        </select>
                    </div>
                </>
            )}

            <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Longitud (m)</label>
                <input 
                    type="number"
                    className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                    value={conductor?.longitud || ''}
                    onChange={(e) => handleDataChange({ longitud: parseFloat(e.target.value) || 0 })}
                />
            </div>
            
            <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Caída de Tensión Máxima Permitida (%)</label>
                <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                    value={conductor?.caidaMaxPermitida ?? 3.0}
                    onChange={(e) => handleDataChange({ caidaMaxPermitida: parseFloat(e.target.value) || 3.0 })}
                />
            </div>
        </div>
        )}
        
        {conductor?.resultadoCalculo && (
            <DetalleCalculoConductor resultado={conductor.resultadoCalculo} />
        )}
    </div>
  );
};
