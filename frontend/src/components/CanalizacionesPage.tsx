import React, { useState } from 'react';
import { Project, Canalizacion } from '../types/project';
import { Plus, Trash2, Cable, AlertTriangle, Zap } from 'lucide-react';
import { validarAgrupamiento } from '../engine/strategies/vivienda/validacionesAgrupamiento';
import { useToast } from '../context/ToastContext';

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
      nombre: `Tramo al ${t.nombre}`
  }));

  const addCanalizacion = () => {
    if (!nombre) return;
    const nueva: Canalizacion = {
      id: Date.now().toString(),
      nombre,
      circuitosIds: [],
      tramosIds: []
    };
    onChange({ ...project, canalizaciones: [...canalizaciones, nueva] });
    setNombre('');
    addToast('Canalización creada exitosamente', 'success');
  };

  const updateCircuitoNorma = (circuitoId: string, norma: string) => {
    // Necesito actualizar el circuito en project.datosVivienda.circuitosCalculados
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
  };

  const toggleElemento = (canalizacionId: string, elementoId: string, esTramo: boolean) => {
    const canalizacionesActualizadas = canalizaciones.map(c => {
        if (c.id === canalizacionId) return c; // Saltamos la actual para procesarla luego
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
      addToast("Agrupamiento no permitido: " + resultado.errores[0], 'error');
      return;
    }

    // Aplicar cambios a todo el proyecto
    onChange({
        ...project,
        canalizaciones: canalizacionesActualizadas.map(c => 
            c.id === canalizacionId ? { ...c, circuitosIds: newCircuitosIds, tramosIds: newTramosIds } : c
        )
    });
    addToast('Asignación actualizada', 'success');
  };

  return (
    <div className="p-6">
      
      {/* SECCIÓN NUEVA: Configuración de normas por circuito (MOVIDA ARRIBA) */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-slate-700 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Configuración de Normas por Circuito</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(project.datosVivienda?.circuitosCalculados || []).map((circ: any) => (
                  <div key={circ.id} className="flex flex-col gap-1 p-3 bg-slate-950 rounded border border-slate-700">
                      <span className="text-white text-sm font-medium">{circ.nombre}</span>
                      <select 
                        className="bg-slate-800 text-white text-xs rounded p-2 border border-slate-700"
                        value={circ.normaCable || 'IRAM 2178'}
                        onChange={(e) => updateCircuitoNorma(circ.id, e.target.value)}
                      >
                          <option value="IRAM-NM 247-3">IRAM-NM 247-3</option>
                          <option value="IRAM 62266">IRAM 62266</option>
                          <option value="IRAM 62267">IRAM 62267</option>
                          <option value="IRAM 2178">IRAM 2178</option>
                      </select>
                  </div>
              ))}
          </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Gestión de Canalizaciones</h2>
        <div className="flex gap-2">
          <input 
            className="bg-[var(--bg-secondary)] p-3 rounded-lg text-white border border-slate-700" 
            placeholder="Nueva canalización..." 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button onClick={addCanalizacion} className="bg-[var(--accent)] text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90">
            <Plus size={20} /> Añadir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {canalizaciones.map(c => {
            const val = validarAgrupamiento(project, c);
            const circuitosDisponibles = project.datosVivienda?.circuitosCalculados || [];
            
            return (
              <div key={c.id} className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <div className='flex items-center gap-4'>
                    <span className="text-white font-bold text-xl">{c.nombre}</span>
                  </div>
                  <button onClick={() => deleteCanalizacion(c.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                {!val.esValido && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm flex items-center gap-2">
                        <AlertTriangle size={16}/> {val.errores[0]}
                    </div>
                )}

                <h4 className="text-slate-400 text-sm font-semibold uppercase mb-3">Elementos Asignados</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Tramos */}
                    {tramosAlimentacion.map(tramo => (
                        <label key={tramo.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${c.tramosIds?.includes(tramo.id) ? 'bg-slate-800 border-[var(--accent)]' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}>
                          <input 
                            type="checkbox" 
                            checked={c.tramosIds?.includes(tramo.id)}
                            onChange={() => toggleElemento(c.id, tramo.id, true)}
                            className="accent-[var(--accent)] w-4 h-4"
                          />
                          <div className='flex flex-col'>
                            <span className="text-white text-sm font-medium flex items-center gap-1.5"><Zap size={14} className="text-amber-500"/> {tramo.nombre}</span>
                          </div>
                        </label>
                    ))}

                    {/* Circuitos */}
                    {circuitosDisponibles.map((circ: any) => {
                      return (
                        <label key={circ.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${c.circuitosIds.includes(circ.id) ? 'bg-slate-800 border-[var(--accent)]' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}>
                          <input 
                            type="checkbox" 
                            checked={c.circuitosIds.includes(circ.id)}
                            onChange={() => toggleElemento(c.id, circ.id, false)}
                            className="accent-[var(--accent)] w-4 h-4"
                          />
                          <div className='flex flex-col'>
                            <span className="text-white text-sm font-medium flex items-center gap-1.5"><Cable size={14} className="text-slate-500"/> {circ.nombre}</span>
                            <span className="text-slate-500 text-[10px]">{circ.tipo || 'Sin tipo'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
