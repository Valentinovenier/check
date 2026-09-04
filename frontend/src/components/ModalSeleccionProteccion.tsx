import React, { useState, useMemo } from 'react';
import { Proteccion } from '../types/project';
import { 
  X, 
  Shield, 
  Zap, 
  Search, 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  SlidersHorizontal 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  protecciones: Proteccion[];
  currentProteccion?: Proteccion;
  onSelect: (proteccion: Proteccion | undefined) => void;
  onCrearNueva?: () => void;
  minAmp?: number;
  maxAmp?: number;
  iccTablero?: number;
  tipoExclusivo?: 'termica' | 'diferencial';
}

export const ModalSeleccionProteccion: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  protecciones,
  currentProteccion,
  onSelect,
  onCrearNueva,
  minAmp,
  maxAmp,
  iccTablero,
  tipoExclusivo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPolos, setFilterPolos] = useState<number | 'todos'>('todos');

  React.useEffect(() => {
    setSearchTerm('');
    setFilterPolos('todos');
  }, [tipoExclusivo, isOpen]);

  const proteccionesFiltradas = useMemo(() => {
    return protecciones.filter(p => {
      if (!p) return false;
      const tipoLower = (p.tipo_proteccion || '').toLowerCase();
      const isDif = tipoLower.includes('diferen');

      // Restricción estricta según el tipo requerido:
      // Si se requiere diferencial, SOLO se permiten diferenciales
      if (tipoExclusivo === 'diferencial' && !isDif) return false;
      // Si se requiere interruptor automático/termomagnética, SOLO se permiten termomagnéticas/automáticos
      if (tipoExclusivo === 'termica' && isDif) return false;

      // Filtro de polos
      if (filterPolos !== 'todos' && p.polos !== filterPolos) return false;

      // Búsqueda por texto
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchModelo = p.modelo?.toLowerCase().includes(term);
        const matchMarca = p.marca?.toLowerCase().includes(term);
        const matchAmp = String(p.in_amp).includes(term);
        const matchCurva = p.curva_disparo?.toLowerCase().includes(term);
        if (!matchModelo && !matchMarca && !matchAmp && !matchCurva) {
          return false;
        }
      }

      return true;
    });
  }, [protecciones, tipoExclusivo, filterPolos, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 ml-10 font-medium">{subtitle}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Parámetros de diseño vigentes (Ib, Calibre max, etc.) */}
        {(minAmp !== undefined || maxAmp !== undefined || iccTablero !== undefined) && (
          <div className="bg-slate-950/40 px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
            {minAmp !== undefined && (
              <span className="text-slate-300">
                Corriente de diseño (<span className="text-emerald-400 font-bold">Ib</span>): <strong className="text-white">{minAmp.toFixed(1)}A</strong>
              </span>
            )}
            {maxAmp !== undefined && (
              <span className="text-slate-300">
                Calibre máx (<span className="text-amber-400 font-bold">In max</span>): <strong className="text-white">{maxAmp}A</strong>
              </span>
            )}
            {iccTablero !== undefined && (
              <span className="text-slate-300">
                Icc tablero: <strong className="text-white">{iccTablero} kA</strong>
              </span>
            )}
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text"
              placeholder="Buscar por modelo, calibre (ej: 16, 25), curva o marca..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 text-white placeholder-slate-400 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              autoFocus
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {tipoExclusivo === 'diferencial' ? (
                <span className="bg-amber-950/80 text-amber-300 border border-amber-800/80 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                  <Shield size={13} className="text-amber-400" /> Solo Interruptores Diferenciales
                </span>
              ) : (
                <span className="bg-blue-950/80 text-blue-300 border border-blue-800/80 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                  <Zap size={13} className="text-blue-400" /> Solo Interruptores Automáticos (PIAs)
                </span>
              )}
              <span className="text-slate-400 text-xs font-medium">({proteccionesFiltradas.length} disponibles)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] px-1 font-semibold">Polos:</span>
              <button
                type="button"
                onClick={() => setFilterPolos('todos')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterPolos === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterPolos(2)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterPolos === 2 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2P
              </button>
              <button
                type="button"
                onClick={() => setFilterPolos(4)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterPolos === 4 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                4P
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Protecciones Disponibles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {proteccionesFiltradas.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <SlidersHorizontal className="mx-auto text-slate-500" size={36} />
              <p className="text-slate-300 text-sm font-medium">No se encontraron protecciones con los filtros aplicados.</p>
              {onCrearNueva && (
                <button
                  onClick={onCrearNueva}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus size={16} /> Crear Nueva Protección en Catálogo
                </button>
              )}
            </div>
          ) : (
            proteccionesFiltradas.map((p) => {
              const isSelected = currentProteccion && (currentProteccion.id === p.id || currentProteccion.modelo === p.modelo);
              const isDif = (p.tipo_proteccion || '').toLowerCase().includes('diferen');

              // Validaciones normativas
              const isTooLow = minAmp !== undefined && p.in_amp < minAmp;
              const isTooHigh = maxAmp !== undefined && p.in_amp > maxAmp;
              const maxIcn = p.capacidades && p.capacidades.length > 0 
                ? Math.max(...p.capacidades.map(c => c.icn_ka)) 
                : 3;
              const isIcnBajo = iccTablero !== undefined && maxIcn < iccTablero;
              const hasWarnings = isTooLow || isTooHigh || isIcnBajo;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-850/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Badge visual de calibre */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 border shadow-inner ${
                      isDif
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}>
                      <span className="text-base leading-none">
                        {!isDif && (p.curva_disparo || 'C')}{p.in_amp}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase mt-0.5">
                        {p.polos}P {isDif ? 'ID' : 'PIA'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-blue-300 transition-colors">
                          {p.modelo}
                        </h4>
                        {isSelected && (
                          <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={12} /> Asignada
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                        <span className="font-medium text-slate-400">{p.tipo_proteccion || 'Termomagnética'}</span>
                        <span>•</span>
                        <span className="font-mono">In: <strong>{p.in_amp}A</strong></span>
                        {p.sensibilidad && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono font-bold">Δn: {p.sensibilidad}mA</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-slate-300">Icn: <strong>{maxIcn}kA</strong></span>
                        {p.marca && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 font-medium">{p.marca}</span>
                          </>
                        )}
                      </div>

                      {/* Advertencias de cálculo normativo */}
                      {hasWarnings && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-amber-300">
                          {isTooLow && (
                            <span className="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                              <AlertTriangle size={12} /> Menor a Ib ({minAmp?.toFixed(1)}A)
                            </span>
                          )}
                          {isTooHigh && (
                            <span className="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                              <AlertTriangle size={12} /> Supera calibre máx ({maxAmp}A)
                            </span>
                          )}
                          {isIcnBajo && (
                            <span className="flex items-center gap-1 bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-800">
                              <AlertTriangle size={12} /> Icn insuficiente ({maxIcn}kA &lt; {iccTablero}kA)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(undefined);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Quitar protección del riel DIN"
                      >
                        <Trash2 size={14} /> Quitar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(p);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md group-hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Plus size={14} /> Agregar al Riel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          {onCrearNueva ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCrearNueva();
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Plus size={16} /> ¿No encuentras tu modelo? Crear nueva en catálogo
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
