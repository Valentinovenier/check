import { useState } from 'react';
import { Project } from '../../types/project';
import { TableroVivienda } from '../../types/vivienda';
import { Trash2, Plus, ChevronDown, ChevronRight, Zap } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaTablero = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], tableros: [] };
  const tableros = datos.tableros || [];

  const toggleCircuitoEnTablero = (tableroId: string, circuitoId: string) => {
    const nuevosTableros = tableros.map(t => {
      if (t.id === tableroId) {
        const estaAsignado = t.circuitosIds.includes(circuitoId);
        return {
          ...t,
          circuitosIds: estaAsignado 
            ? t.circuitosIds.filter(id => id !== circuitoId)
            : [...t.circuitosIds, circuitoId]
        };
      }
      // Si estamos asignando, quitar de otros tableros
      return {
        ...t,
        circuitosIds: t.circuitosIds.filter(id => id !== circuitoId)
      };
    });
    onChange({ ...project, datosVivienda: { ...datos, tableros: nuevosTableros } });
  };

  const addTablero = (tipo: 'Seccional' | 'SubSeccional', padreId?: string) => {
    const nuevoTablero: TableroVivienda = {
        id: Date.now().toString(),
        nombre: `${tipo} ${tableros.length + 1}`,
        tipo,
        tableroPadreId: padreId,
        circuitosIds: []
    };
    onChange({ ...project, datosVivienda: { ...datos, tableros: [...tableros, nuevoTablero] } });
  };

  const TableroItem = ({ tablero, depth = 0 }: { tablero: TableroVivienda; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const subTableros = tableros.filter(t => t.tableroPadreId === tablero.id);

    return (
      <div style={{ marginLeft: `${depth * 16}px` }} className="border-l border-slate-700 pl-4 space-y-2 mt-2">
        <div className="flex items-center gap-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
            <button onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <span className="font-bold text-white flex-1 text-base">{tablero.nombre} ({tablero.tipo})</span>
            {tablero.tipo !== 'SubSeccional' && (
                <button onClick={() => addTablero(tablero.tipo === 'Principal' ? 'Seccional' : 'SubSeccional', tablero.id)} className="text-[var(--accent)]">
                    <Plus size={16} />
                </button>
            )}
        </div>
        
        {expanded && (
            <div className="space-y-2 pl-4">
                {datos.circuitosCalculados.map(c => {
                    const esAsignado = tablero.circuitosIds.includes(c.id);
                    const estaEnOtro = tableros.some(t => t.id !== tablero.id && t.circuitosIds.includes(c.id));
                    
                    return (
                        <label key={c.id} className={`flex items-center gap-2.5 p-2.5 rounded text-base ${estaEnOtro ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`}>
                            <input 
                                type="checkbox" 
                                checked={esAsignado} 
                                disabled={estaEnOtro}
                                onChange={() => toggleCircuitoEnTablero(tablero.id, c.id)}
                            />
                            {c.nombre}
                        </label>
                    );
                })}
                {subTableros.map(st => <TableroItem key={st.id} tablero={st} depth={depth + 1} />)}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-4">Gestión de Tableros y Circuitos</h2>
      
      <div className="space-y-4">
        {tableros.filter(t => t.tipo === 'Principal').map(tp => <TableroItem key={tp.id} tablero={tp} />)}
        {tableros.length === 0 && (
            <button onClick={() => {
                const tp: TableroVivienda = { id: 'tp', nombre: 'Tablero Principal', tipo: 'Principal', circuitosIds: [] };
                onChange({ ...project, datosVivienda: { ...datos, tableros: [tp] } });
            }} className="bg-[var(--accent)] text-black px-5 py-3 rounded-lg font-bold text-base">
                Crear Tablero Principal
            </button>
        )}
      </div>
    </div>
  );
};
