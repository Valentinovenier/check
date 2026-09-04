import React, { useState } from 'react';
import { Project, Canalizacion } from '../types/project';
import { Plus, Trash2, Cable, AlertTriangle, Zap, Network, Layers, ShieldCheck } from 'lucide-react';
import { validarAgrupamiento } from '../engine/strategies/vivienda/validacionesAgrupamiento';
import { useToast } from '../context/ToastContext';
import { ConduitCrossSection } from './ConduitCrossSection';

interface Props {
  project: Project;
  onChange: (updatedProject: Project) => void;
}

export const CanalizacionesPage = ({ project, onChange }: Props) => {
  const [nombre, setNombre] = useState('');
  const { addToast } = useToast();
  const canalizaciones = project.canalizaciones || [];
  const tableros = project.datosVivienda?.tableros || [];
  const tramosAlimentacion = tableros.filter(t => t.tipo !== 'Principal').map(t => ({
      id: `tramo_${t.id}`,
      nombre: `Línea de alimentación hacia ${t.nombre}`
  }));

  const addCanalizacion = () => {
    if (!nombre.trim()) return;
    const nueva: Canalizacion = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      circuitosIds: [],
      tramosIds: []
    };
    onChange({ ...project, canalizaciones: [...canalizaciones, nueva] });
    setNombre('');
    if (addToast) addToast('Canalización creada exitosamente', 'success');
  };

  const updateCircuitoNorma = (circuitoId: string, norma: string) => {
    const circuitos = project.datosVivienda?.circuitosCalculados || [];
    const nuevosCircuitos = circuitos.map(c => 
        c.id === circuitoId ? { ...c, normaCable: norma as any } : c
    );
    onChange({
        ...project,
        datosVivienda: {
            ...project.datosVivienda!,
            circuitosCalculados: nuevosCircuitos
        }
    });
  };

  const deleteCanalizacion = (id: string) => {
    onChange({ ...project, canalizaciones: canalizaciones.filter(c => c.id !== id) });
    if (addToast) addToast('Canalización eliminada', 'info');
  };

  const toggleElemento = (canalizacionId: string, elementoId: string, esTramo: boolean) => {
    const canalizacionesActualizadas = canalizaciones.map(c => {
        if (c.id === canalizacionId) return c;
        if (esTramo) {
            return { ...c, tramosIds: c.tramosIds?.filter(id => id !== elementoId) || [] };
        } else {
            return { ...c, circuitosIds: c.circuitosIds.filter(id => id !== elementoId) };
        }
    });

    const canalizacionActual = canalizacionesActualizadas.find(c => c.id === canalizacionId);
    if (!canalizacionActual) return;

    let newCircuitosIds = canalizacionActual.circuitosIds;
    let newTramosIds = canalizacionActual.tramosIds || [];

    if (esTramo) {
        const estaAsignado = newTramosIds.includes(elementoId);
        newTramosIds = estaAsignado
            ? newTramosIds.filter(id => id !== elementoId)
            : [...newTramosIds, elementoId];
    } else {
        const estaAsignado = newCircuitosIds.includes(elementoId);
        newCircuitosIds = estaAsignado
            ? newCircuitosIds.filter(id => id !== elementoId)
            : [...newCircuitosIds, elementoId];
    }

    // Validar antes de aplicar cambios
    const hypotheticalCanalizacion = { ...canalizacionActual, circuitosIds: newCircuitosIds, tramosIds: newTramosIds };
    const resultado = validarAgrupamiento(project, hypotheticalCanalizacion);

    if (!resultado.esValido) {
      if (addToast) addToast("Agrupamiento no permitido: " + resultado.errores[0], 'error');
      else alert("Agrupamiento no permitido: " + resultado.errores[0]);
      return;
    }

    // Aplicar cambios a todo el proyecto
    onChange({
        ...project,
        canalizaciones: canalizacionesActualizadas.map(c => 
            c.id === canalizacionId ? { ...c, circuitosIds: newCircuitosIds, tramosIds: newTramosIds } : c
        )
    });
    if (addToast) addToast('Asignación actualizada', 'success');
  };

  const updateTramoNorma = (tramoId: string, norma: string) => {
      const tableros = project.datosVivienda?.tableros || [];
      const nuevosTableros = tableros.map(t => 
          `tramo_${t.id}` === tramoId ? { ...t, normaCable: norma } : t
      );
      onChange({
          ...project,
          datosVivienda: {
              ...project.datosVivienda!,
              tableros: nuevosTableros
          }
      });
  };

  // Helper para estimar factor Ka
  const getFactorAgrupamiento = (n: number) => {
    if (n <= 1) return '1.00 (Sin reducción)';
    if (n === 2) return '0.80 (-20% Iz)';
    if (n === 3) return '0.70 (-30% Iz)';
    return '0.65 (-35% Iz)';
  };

  return (
    <div className="space-y-8">
      {/* Encabezado principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <Network className="text-[var(--accent)]" />
            Gestión de Canalizaciones y Agrupamiento
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Agrupa los circuitos en cañerías para determinar el factor de agrupamiento (Ka), tipo de montaje y verificar el factor de llenado (≤ 35%).
          </p>
        </div>

        {/* Input para nueva canalización */}
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            className="bg-slate-950 p-2.5 rounded-xl text-white text-xs border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-60" 
            placeholder="Ej: Cañería Principal Pasillo..." 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCanalizacion()}
          />
          <button 
            onClick={addCanalizacion} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Crear Cañería
          </button>
        </div>
      </div>

      {/* Lista de Canalizaciones */}
      <div className="space-y-6">
        {canalizaciones.length === 0 ? (
          <div className="bg-slate-900/50 p-8 rounded-2xl border border-dashed border-slate-700 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Layers size={24} />
            </div>
            <h3 className="text-white font-bold text-base">No hay canalizaciones creadas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Crea tu primera canalización o cañería arriba para agrupar los circuitos y calcular automáticamente los factores de corrección y ocupación.
            </p>
          </div>
        ) : (
          canalizaciones.map(c => {
            const val = validarAgrupamiento(project, c);
            const circuitosDisponibles = project.datosVivienda?.circuitosCalculados || [];
            const cantCircuitosEnCanalizacion = c.circuitosIds.length + (c.tramosIds?.length || 0);

            // Obtener norma predominante de la canalización
            const circuitosEnC = circuitosDisponibles.filter(circ => c.circuitosIds.includes(circ.id));
            const normaPredominante = circuitosEnC[0]?.normaCable || 'IRAM 2178';

            return (
              <div key={c.id} className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-6">
                {/* Cabecera de la canalización */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Network size={18} />
                    </div>
                    <div>
                      <span className="text-white font-bold text-lg">{c.nombre}</span>
                      <p className="text-xs text-slate-400">
                        {cantCircuitosEnCanalizacion} elementos asignados • Factor agrupamiento: <span className="text-amber-400 font-bold">{getFactorAgrupamiento(cantCircuitosEnCanalizacion)}</span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteCanalizacion(c.id)} 
                    className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Eliminar canalización"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Error de validación de agrupamiento si existe */}
                {!val.esValido && (
                  <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 text-red-400" />
                    <span>{val.errores[0]}</span>
                  </div>
                )}

                {/* Corte transversal interactivo del caño */}
                <ConduitCrossSection 
                  canalizacionNombre={c.nombre}
                  cantidadCircuitos={cantCircuitosEnCanalizacion}
                  norma={normaPredominante}
                />

                {/* Selección de circuitos agrupados */}
                <div className="space-y-3">
                  <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Asignar circuitos a esta canalización:
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {/* Tramos de alimentación */}
                    {tramosAlimentacion.map(tramo => {
                      const isChecked = c.tramosIds?.includes(tramo.id);
                      return (
                        <label 
                          key={tramo.id} 
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm' 
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleElemento(c.id, tramo.id, true)}
                            className="accent-blue-600 w-4 h-4 rounded"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <Zap size={14} className="text-amber-400 shrink-0" />
                              {tramo.nombre}
                            </span>
                            <span className="text-[10px] text-slate-500">Línea Seccional</span>
                          </div>
                        </label>
                      );
                    })}

                    {/* Circuitos terminales */}
                    {circuitosDisponibles.map((circ: any) => {
                      const isChecked = c.circuitosIds.includes(circ.id);
                      return (
                        <label 
                          key={circ.id} 
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm' 
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleElemento(c.id, circ.id, false)}
                            className="accent-blue-600 w-4 h-4 rounded"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <Cable size={14} className={isChecked ? 'text-blue-400 shrink-0' : 'text-slate-500 shrink-0'} />
                              {circ.nombre}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">{circ.tipo?.replace(/_/g, ' ') || 'Circuito'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Configuración rápida de Normas de Cable */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={18} />
          <h3 className="text-base font-bold text-white">Norma IRAM Aplicada por Circuito</h3>
        </div>
        <p className="text-xs text-slate-400">
          Define el tipo de aislación de cada circuito (ej: unipolar flexible IRAM-NM 247-3 o subterráneo IRAM 2178).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(project.datosVivienda?.circuitosCalculados || []).map((circ: any) => (
            <div key={circ.id} className="flex flex-col gap-1.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-white text-xs font-semibold">{circ.nombre}</span>
              <select 
                className="bg-slate-900 text-white text-xs rounded-lg p-2 border border-slate-700 focus:border-blue-500"
                value={circ.normaCable || 'IRAM 2178'}
                onChange={(e) => updateCircuitoNorma(circ.id, e.target.value)}
              >
                <option value="IRAM-NM 247-3">IRAM-NM 247-3 (Unipolar flexible)</option>
                <option value="IRAM 62266">IRAM 62266</option>
                <option value="IRAM 62267">IRAM 62267 (Libre halógenos)</option>
                <option value="IRAM 2178">IRAM 2178 (Subterráneo / Envolvente)</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

