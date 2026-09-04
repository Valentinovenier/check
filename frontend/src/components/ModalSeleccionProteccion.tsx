import React from 'react';
import { Proteccion } from '../types/project';
import { X, Check, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  protecciones: Proteccion[];
  currentProteccion?: Proteccion;
  onSelect: (proteccion: Proteccion | undefined) => void;
  tipoExclusivo?: 'termica' | 'diferencial';
}

export const ModalSeleccionProteccion: React.FC<Props> = ({
  isOpen,
  onClose,
  title = 'Seleccionar Modelo del Catálogo',
  protecciones,
  currentProteccion,
  onSelect,
  tipoExclusivo,
}) => {
  if (!isOpen) return null;

  // Filtrar estrictamente según tipo (diferencial vs interruptor automático/térmica)
  const modelosDelUsuario = (protecciones || []).filter(p => {
    if (!p) return false;
    const tipoLower = (p.tipo_proteccion || '').toLowerCase();
    const isDif = tipoLower.includes('diferen');

    if (tipoExclusivo === 'diferencial') return isDif;
    if (tipoExclusivo === 'termica') return !isDif;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado simple */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de modelos del catálogo del usuario */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
          {modelosDelUsuario.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>No tienes modelos de este tipo en tu catálogo de protecciones.</p>
            </div>
          ) : (
            modelosDelUsuario.map((p) => {
              const isSelected = currentProteccion && (currentProteccion.id === p.id || currentProteccion.modelo === p.modelo);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="font-semibold text-white text-sm truncate">
                    {p.modelo}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {p.in_amp}A
                    </span>
                    {isSelected && (
                      <span className="text-emerald-400">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie: Quitar protección si ya tenía una asignada */}
        {currentProteccion && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onSelect(undefined);
                onClose();
              }}
              className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Trash2 size={14} /> Quitar protección
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
