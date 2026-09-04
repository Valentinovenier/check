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
  const { state: project, setState: setProject } = useProject();
  
  const esTramoProtegido = tramoId === 'tp' || hideCanalizacion;
  const isPanelTramo = ['LineaPrincipal', 'LineaSeccional'].includes(conductor?.tipoTramo || '');

  const circuito = useMemo(() => project?.datosVivienda?.circuitosCalculados.find(c => c.id === tramoId), [project, tramoId]);
  const esCircuitoTerminal = Boolean(circuito) || conductor?.tipoTramo === 'CircuitoTerminal';
  const necesitaCanalizacion = esCircuitoTerminal && !isPanelTramo && !esTramoProtegido && tramoId !== 'tp';
  
  const proteccionAsignada = useMemo(() => {
    const proteccion = obtenerProteccionAsignada(project, conductor, tramoId);
    console.log('DEBUG ViviendaConductorForm - proteccionAsignada encontrada:', proteccion);
    return proteccion;
  }, [project, conductor, tramoId]);

  const tieneProteccionAsignada = Boolean(proteccionAsignada);
  console.log('DEBUG ViviendaConductorForm - tieneProteccionAsignada:', tieneProteccionAsignada);

  useEffect(() => {
    // Calculamos siempre si tenemos datos mínimos
    if (project && tieneProteccionAsignada && conductor && conductor.metodoInstalacion && conductor.longitud) {
        const conductorCalculo = {
            ...conductor,
            caidaMaxPermitida: conductor.caidaMaxPermitida ?? (isPanelTramo ? 1.0 : 3.0),
            ...(tramoId ? { tramoId } : {}),
            ...(esCircuitoTerminal 
              ? { tipoTramo: 'CircuitoTerminal', destinoId: tramoId, tipoCircuito: circuito?.tipo } 
              : { tipoTramo: conductor.tipoTramo || 'LineaSeccional', destinoId: tramoId })
        };
        const calculated = calcularConductorResidencial(conductorCalculo as any, project);
        
        // Verificación de seguridad: Asegurar que la estructura del resultado es válida
        const esValido = calculated.resultadoCalculo && 
                         Array.isArray(calculated.resultadoCalculo.pasosVerificacion) && 
                         calculated.resultadoCalculo.pasosVerificacion.length > 0;

        if (esValido && JSON.stringify(calculated.resultadoCalculo) !== JSON.stringify(conductor.resultadoCalculo)) {
            console.log('Depuración: useEffect - calculated antes de onChange', calculated);
            onChange(calculated);
        }
    }
  }, [project, tieneProteccionAsignada, tramoId, conductor]);

  const datosFaltantes = !conductor?.metodoInstalacion || !conductor?.longitud;

  const canalizacionVinculada = useMemo(() => {
    const found = project?.canalizaciones?.find(c => c.circuitosIds.includes(tramoId || ''));
    if (conductor?.canalizacionId) return project?.canalizaciones?.find(c => c.id === conductor.canalizacionId);
    return found;
  }, [project, conductor, tramoId]);

  // Filtrado reactivo de métodos según norma
  const { metodosDisponibles, esTipoCableForzado } = useMemo(() => {
    const esTramoPrincipalOSeccional = tramoId === 'tp' || isPanelTramo || conductor?.tipoTramo === 'LineaPrincipal' || conductor?.tipoTramo === 'LineaSeccional';
    
    let norma = 'IRAM 2178';
    if (esTramoPrincipalOSeccional) {
        norma = conductor?.normaCable || 'IRAM 2178';
    } else {
        // Buscar norma en el circuito (si existe) o canalización vinculada
        norma = circuito?.normaCable || canalizacionVinculada?.normaCable || 'IRAM 2178';
    }
    
    const esForzado = ['IRAM-NM 247-3', 'IRAM 62267'].includes(norma);

    // Reglas
    const metodosPermitidos = ['IRAM-NM 247-3', 'IRAM 62267'].includes(norma)
        ? ['sinEnvoltura']
        : ['IRAM 2178', 'IRAM 62266'].includes(norma)
        ? ['B2', 'D1', 'D2']
        : METODOS_INSTALACION_VIVIENDA.map(m => m.value);

    return {
        metodosDisponibles: METODOS_INSTALACION_VIVIENDA.filter(m => metodosPermitidos.includes(m.value)),
        esTipoCableForzado: esForzado
    };
  }, [tramoId, isPanelTramo, conductor?.tipoTramo, conductor?.normaCable, canalizacionVinculada?.normaCable, circuito?.normaCable]);

  const handleDataChange = (updates: Partial<Conductor>) => {
    let newConductor = {
        caidaMaxPermitida: conductor?.caidaMaxPermitida ?? (isPanelTramo ? 1.0 : 3.0),
        ...conductor,
        ...updates,
        ...(tramoId ? { tramoId } : {}),
        ...(esCircuitoTerminal 
          ? { tipoTramo: 'CircuitoTerminal', destinoId: tramoId, tipoCircuito: circuito?.tipo } 
          : { tipoTramo: conductor?.tipoTramo || 'LineaSeccional', destinoId: tramoId })
    } as Conductor;
    
    // Si la norma fuerza a Unipolar, aseguramos el tipo
    if (esTipoCableForzado) {
        newConductor.tipoCable = 'Unipolar';
    }
    
    // Si no tiene ID de canalización pero existe una vinculada, la asignamos automáticamente
    if (!newConductor.canalizacionId && canalizacionVinculada) {
        newConductor.canalizacionId = canalizacionVinculada.id;
    }
    
    if (isPanelTramo || esTramoProtegido) {
        newConductor.canalizacionId = undefined;
    }
    
    if (project && tieneProteccionAsignada && newConductor.metodoInstalacion && newConductor.longitud) {
        newConductor = calcularConductorResidencial(newConductor, project);
    } else {
        newConductor.resultadoCalculo = undefined;
        newConductor.seccion = undefined;
    }
    
    onChange(newConductor);
  };

  const esTramoPanelOSeccional = tramoId === 'tp' || isPanelTramo || conductor?.tipoTramo === 'LineaPrincipal' || conductor?.tipoTramo === 'LineaSeccional';

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
        <div className="grid grid-cols-1 gap-6">
            
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 pb-2">1. Configuración del Tramo y Método</h3>
                
                {esTramoPanelOSeccional && (
                <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Norma del Cable</label>
                    <select 
                        className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                        value={conductor?.normaCable || 'IRAM 2178'}
                        onChange={(e) => handleDataChange({ normaCable: e.target.value as any })}
                    >
                        <option value="IRAM 2178">IRAM 2178 (Subterráneo / Bandeja / Cañería)</option>
                        <option value="IRAM-NM 247-3">IRAM-NM 247-3 (Unipolar en cañería)</option>
                        <option value="IRAM 62267">IRAM 62267 (Libre de Halógenos LSZH)</option>
                        <option value="IRAM 62266">IRAM 62266</option>
                    </select>
                </div>
                )}

                {!esTipoCableForzado && (
                <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Tipo de Cable</label>
                    <select 
                        className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                        value={conductor?.tipoCable || 'Multipolar'}
                        onChange={(e) => handleDataChange({ tipoCable: e.target.value as any })}
                    >
                        <option value="Multipolar">Multipolar</option>
                        <option value="Unipolar">Unipolar</option>
                    </select>
                </div>
                )}

                <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Método de Instalación</label>
                    {(necesitaCanalizacion && !conductor?.canalizacionId && !canalizacionVinculada) ? (
                        <div className="p-3.5 bg-amber-950/40 border border-amber-700/80 rounded-xl text-amber-300 text-xs space-y-2">
                            <p className="font-semibold">⚠️ Este circuito aún no está asignado a una canalización.</p>
                            <p className="text-[11px] text-slate-300">
                              Para calcular la corriente admisible se requiere conocer el caño y la norma. Puedes asignarlo a una canalización existente aquí:
                            </p>
                            {project?.canalizaciones && project.canalizaciones.length > 0 ? (
                              <select 
                                className="w-full bg-slate-950 text-white text-xs rounded-lg p-2 border border-slate-700 focus:border-blue-500"
                                onChange={(e) => {
                                  const canId = e.target.value;
                                  if (canId && tramoId) {
                                    const canalizacionesActualizadas = (project.canalizaciones || []).map(c => 
                                      c.id === canId && !c.circuitosIds.includes(tramoId)
                                        ? { ...c, circuitosIds: [...c.circuitosIds, tramoId] }
                                        : c
                                    );
                                    const newProject = { ...project, canalizaciones: canalizacionesActualizadas };
                                    setProject(newProject);
                                    handleDataChange({ canalizacionId: canId });
                                  }
                                }}
                              >
                                <option value="">— Seleccionar Canalización Existente —</option>
                                {project.canalizaciones.map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[11px] text-amber-400 italic">
                                No hay canalizaciones creadas aún. Por favor, crea una en la pestaña "Canalizaciones".
                              </p>
                            )}
                        </div>
                    ) : (
                        <select 
                            className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
                            value={conductor?.metodoInstalacion || ''}
                            onChange={(e) => handleDataChange({ metodoInstalacion: e.target.value })}
                        >
                            <option value="">Selecciona Método</option>
                            {metodosDisponibles.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* {datosFaltantes && (

                )} */}

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
                                value={conductor?.resistividadTermica ?? 2.5}
                                onChange={(e) => handleDataChange({ resistividadTermica: parseFloat(e.target.value) || 2.5 })}
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
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleDataChange({ caidaMaxPermitida: isNaN(val) ? 3.0 : val });
                        }} 
                    />
                </div>
            </div>
        </div>
        )}
        
        {conductor?.resultadoCalculo && (
            <DetalleCalculoConductor resultado={conductor.resultadoCalculo} />
        )}
    </div>
  );
};