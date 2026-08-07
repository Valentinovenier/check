import { Project } from '../../types/project';
import { Ambiente } from '../../types/vivienda';
import { calcularPuntosMinimosAmbiente } from '../../engine/strategies/vivienda/normas770';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

const TIPOS_AMBIENTES = [
    'Estar-Comedor', 'Dormitorio', 'Cocina', 'Baño', 'Pasillo', 'Lavadero', 'Garage', 'Balcón/Galería', 'Otro'
];

export const ViviendaAmbientes = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [] };

  const needsLongitud = (nombre: string) => {
    const n = nombre.toLowerCase();
    return n.includes('pasillo') || n.includes('balcon') || n.includes('galeria') || n.includes('semicubierto');
  };

  const handleAddAmbiente = (tipo: string) => {
    const existentes = datos.ambientes.filter(a => a.nombre.startsWith(tipo)).length;
    const nuevoNombre = `${tipo} ${existentes + 1}`;
    
    const nuevoAmbiente: Ambiente = { id: Date.now().toString(), nombre: nuevoNombre, superficie: 0, longitud: 0, puntosIUG: 0, puntosTUG: 0, puntosTUE: 0 };
    onChange({ ...project, datosVivienda: { ...datos, ambientes: [...datos.ambientes, nuevoAmbiente] } });
  };

  const updateAmbiente = (id: string, updates: Partial<Ambiente>) => {
    const nuevosAmbientes = datos.ambientes.map(a => {
        if (a.id !== id) return a;
        const updated = { ...a, ...updates };
        
        // No recalcular si es 'Otro'
        if (!updated.nombre.toLowerCase().includes('otro')) {
            const pmu = calcularPuntosMinimosAmbiente(updated.nombre, updated.superficie, updated.longitud);
            
            // Si es cambio de medidas, actualizar los puntos al nuevo mínimo
            if (updates.superficie !== undefined || updates.longitud !== undefined || updates.nombre !== undefined) {
              updated.puntosTUG = pmu.tug;
              updated.puntosIUG = pmu.iug;
            }
        }

        return updated;
    });
    onChange({ ...project, datosVivienda: { ...datos, ambientes: nuevosAmbientes } });
  };

  const removeAmbiente = (id: string) => {
    onChange({ ...project, datosVivienda: { ...datos, ambientes: datos.ambientes.filter(amb => amb.id !== id) } });
  };

  const autocompletarMinimos = () => {
      const nuevosAmbientes = datos.ambientes.map(a => {
        if (a.nombre.toLowerCase().includes('otro')) return a;
        const pmu = calcularPuntosMinimosAmbiente(a.nombre, a.superficie, a.longitud);
        return { ...a, puntosIUG: pmu.iug, puntosTUG: pmu.tug };
      });
      onChange({ ...project, datosVivienda: { ...datos, ambientes: nuevosAmbientes } });
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-4">
      <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4">Puntos de utilizacion y dimensiones por ambiente</h2>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {TIPOS_AMBIENTES.map(tipo => (
            <button key={tipo} onClick={() => handleAddAmbiente(tipo)} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full text-xs whitespace-nowrap">
                <Plus size={14} /> {tipo}
            </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {/* Encabezados */}
        <div className="grid grid-cols-12 gap-3 px-3 text-xs font-semibold text-slate-400 uppercase">
          <div className="col-span-2 text-center">Ambientes</div>
          <div className="col-span-3 text-center">Dimensiones (m²)</div>
          <div className="col-span-4 text-center">Puntos de utilización minimos</div>
        </div>
        {datos.ambientes.map((a) => (
          <div key={a.id} className="grid grid-cols-12 gap-3 items-center bg-slate-900 p-3 rounded-lg text-sm">
            <input 
              className="col-span-2 bg-slate-950 p-2 rounded border border-slate-700 text-white font-medium" 
              value={a.nombre} 
              onChange={(e) => updateAmbiente(a.id, { nombre: e.target.value })} 
            />
            
            <div className="col-span-3 flex gap-2">
                <input type="number" className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" value={a.superficie || ''} onChange={(e) => updateAmbiente(a.id, { superficie: parseFloat(e.target.value) || 0 })} placeholder="m²" />
                {needsLongitud(a.nombre) && (
                    <input type="number" className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" value={a.longitud || ''} onChange={(e) => updateAmbiente(a.id, { longitud: parseFloat(e.target.value) || 0 })} placeholder="Largo" />
                )}
            </div>
            
            <div className="col-span-4 flex justify-around bg-slate-950/50 rounded-lg py-1">
                <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">IUG</p>
                    <input 
                      type="number" 
                      className="w-12 bg-transparent text-center font-bold text-[var(--accent)] outline-none focus:border-b border-[var(--accent)]" 
                      value={a.puntosIUG || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const min = calcularPuntosMinimosAmbiente(a.nombre, a.superficie, a.longitud).iug;
                        updateAmbiente(a.id, { puntosIUG: Math.max(val, min) });
                      }}
                    />
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">TUG</p>
                    <input 
                    type="number" 
                    className="w-12 bg-transparent text-center font-bold text-[var(--accent)] outline-none focus:border-b border-[var(--accent)]" 
                    value={a.puntosTUG || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const min = calcularPuntosMinimosAmbiente(a.nombre, a.superficie, a.longitud).tug;
                      updateAmbiente(a.id, { puntosTUG: Math.max(val, min) });
                    }}
                    />
                    </div>
                    <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">TUE</p>
                    <input 
                    type="number" 
                    className="w-12 bg-transparent text-center font-bold text-[var(--accent)] outline-none focus:border-b border-[var(--accent)]" 
                    value={a.puntosTUE || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      // TUE no tiene un mínimo definido automáticamente en la función, permitimos edición libre
                      updateAmbiente(a.id, { puntosTUE: val });
                    }}
                    />
                </div>
            </div>
            
            <button onClick={() => removeAmbiente(a.id)} className="col-span-1 text-red-400 p-2 flex justify-center">
                <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
