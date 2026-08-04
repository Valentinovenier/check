import { useEffect, useState } from 'react';
import { Project } from '../types/project';
import { TableroVivienda, CircuitoCalculado } from '../types/vivienda';
import { ChevronDown, ChevronRight, Plus, FolderTree, Trash2 } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const TablerosVivienda = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], tableros: [] };
  const tableros = datos.tableros || [];

  // Asegurar tablero principal por defecto
  useEffect(() => {
    if (datos.circuitosCalculados.length > 0 && !tableros.find(t => t.tipo === 'Principal')) {
        const tp: TableroVivienda = { id: 'tp', nombre: 'Tablero Principal', tipo: 'Principal', circuitosIds: [] };
        onChange({ ...project, datosVivienda: { ...datos, tableros: [...tableros, tp] } });
    }
  }, [datos.circuitosCalculados, tableros, project, onChange, datos]);

  // Estado para gestionar nodos expandidos por ID
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(tableros.map(t => t.id)));

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const toggleCircuitoEnTablero = (tableroId: string, circuitoId: string) => {
    const nuevosTableros = tableros.map((t: TableroVivienda) => {
      if (t.id === tableroId) {
        const estaAsignado = t.circuitosIds.includes(circuitoId);
        return {
          ...t,
          circuitosIds: estaAsignado 
            ? t.circuitosIds.filter((id: string) => id !== circuitoId)
            : [...t.circuitosIds, circuitoId]
        };
      }
      // Quitar de otros tableros si se asigna aquí
      return {
        ...t,
        circuitosIds: t.circuitosIds.filter((id: string) => id !== circuitoId)
      };
    });
    onChange({ ...project, datosVivienda: { ...datos, tableros: nuevosTableros } });
  };

  const addTablero = (tipo: 'Seccional' | 'SubSeccional', padreId?: string) => {
    // Usar la referencia más actualizada de tableros obtenida de 'datos'
    const nuevosTableros = datos.tableros || [];
    const nuevoTablero: TableroVivienda = {
        id: Date.now().toString(),
        nombre: `${tipo} ${nuevosTableros.length + 1}`,
        tipo,
        tableroPadreId: padreId,
        circuitosIds: []
    };
    onChange({ ...project, datosVivienda: { ...datos, tableros: [...nuevosTableros, nuevoTablero] } });
  };

  const deleteTablero = (id: string) => {
    const nuevosTableros = tableros.filter(t => t.id !== id);
    onChange({ ...project, datosVivienda: { ...datos, tableros: nuevosTableros } });
  };

  const renderTableroNode = (tablero: TableroVivienda, depth = 0) => {
    const expanded = expandedNodes.has(tablero.id);
    const subTableros = tableros.filter((t: TableroVivienda) => t.tableroPadreId === tablero.id);

    return (
      <div key={tablero.id} className={`${depth > 0 ? 'ml-6' : ''} border-l border-slate-700 pl-4 space-y-2`}>
        <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <button onClick={() => toggleExpand(tablero.id)}>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <FolderTree size={16} className="text-[var(--accent)]" />
            <span className="font-bold text-white flex-1">{tablero.nombre}</span>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">{tablero.tipo}</span>
            
            {/* Botón de añadir */}
            {tablero.tipo !== 'SubSeccional' && (
                <button 
                  onClick={() => addTablero(tablero.tipo === 'Principal' ? 'Seccional' : 'SubSeccional', tablero.id)} 
                  className="flex items-center gap-1 text-[var(--accent)] hover:bg-slate-800 px-2 py-1 rounded text-xs font-bold"
                >
                    <Plus size={14} /> 
                    {tablero.tipo === 'Principal' ? 'Tablero Seccional' : 'Tablero Sub-seccional'}
                </button>
            )}
            
            {/* Input Ik para Principal */}
            {tablero.tipo === 'Principal' && (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-slate-500 uppercase">Corriente de cortocircuito</span>
                    <div className="w-32">
                        <input 
                          type="number"
                          placeholder="Ik (kA)"
                          className="w-full bg-slate-950 p-1 rounded border border-slate-700 text-white text-xs text-center"
                          value={(project.tableroPrincipal as any).corrienteCortocircuitoIk || ''}
                          onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onChange({ ...project, tableroPrincipal: { ...project.tableroPrincipal, corrienteCortocircuitoIk: val } });
                          }}
                        />
                    </div>
                </div>
            )}
            
            {/* Botón de eliminar (solo seccionales/sub-seccionales) */}
            {tablero.tipo !== 'Principal' && (
                <button 
                  onClick={() => deleteTablero(tablero.id)} 
                  className="text-red-400 hover:bg-red-900/20 p-1 rounded"
                  title="Eliminar tablero"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
        
        {expanded && (
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase ml-2">Circuitos</div>
                {datos.circuitosCalculados.map((c: CircuitoCalculado) => {
                    // Lógica actualizada: 
                    // 1. Está asignado si el circuito está explícitamente en la lista de IDs del tablero.
                    const esAsignado = tablero.circuitosIds.includes(c.id);
                    const estaEnOtro = tableros.some((t: TableroVivienda) => t.id !== tablero.id && t.circuitosIds.includes(c.id));
                    
                    return (
                        <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all border ${esAsignado ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-slate-950 border-slate-800'} cursor-pointer hover:border-slate-600`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${esAsignado ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-slate-600'}`}>
                                {esAsignado && <span className="text-white">✓</span>}
                            </div>
                            <input 
                                type="checkbox" 
                                checked={esAsignado} 
                                className="hidden"
                                onChange={() => toggleCircuitoEnTablero(tablero.id, c.id)}
                            />
                            <span className={esAsignado ? 'text-white' : 'text-slate-400'}>{c.nombre}</span>
                            {estaEnOtro && !esAsignado && <span className="text-[10px] text-slate-500 italic ml-auto">(Asignado a otro tablero)</span>}
                        </label>
                    );
                })}
                {subTableros.map((st: TableroVivienda) => renderTableroNode(st, depth + 1))}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Gestión de Tableros</h2>
      </div>
      
      {datos.circuitosCalculados.length === 0 ? (
        <div className="text-amber-400 bg-amber-900/20 p-4 rounded-lg border border-amber-800">
            <p className="font-bold">¡Atención!</p>
            <p className="text-sm">Primero debes completar la configuración de ambientes y circuitos en la etapa de parámetros para poder asignar circuitos a los tableros.</p>
        </div>
      ) : (
        <div className="space-y-4">
            {tableros.filter((t: TableroVivienda) => t.tipo === 'Principal').map((tp: TableroVivienda) => renderTableroNode(tp))}
        </div>
      )}
    </div>
  );
};
