import React from 'react';
import { Proteccion } from '../types/project';
import { Shield, X } from 'lucide-react';

interface AsignacionProteccionProps {
  label: string;
  proteccion?: Proteccion;
  disponibles: Proteccion[];
  onChange: (p: Proteccion | undefined) => void;
  opcional?: boolean;
  maxAmp?: number; 
  minAmp?: number;
  iccTablero?: number;
}

export const AsignacionProteccion: React.FC<AsignacionProteccionProps> = ({
  label,
  proteccion,
  disponibles,
  onChange,
  opcional = true,
  maxAmp,
  minAmp,
  iccTablero,
}) => {
  return (
    <div className="bg-slate-900/95 p-4 rounded-xl border border-slate-700 shadow-sm transition-all hover:border-slate-600 space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Shield size={16} className="text-blue-400 shrink-0" />
          {label}
        </label>
        {opcional && proteccion && (
          <button 
            onClick={() => onChange(undefined)} 
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
            title="Quitar protección"
          >
            <X size={14} /> Quitar
          </button>
        )}
      </div>

      {/* Selector desplegable */}
      <select 
        className="w-full bg-slate-950 px-3.5 py-3 rounded-xl text-white text-xs sm:text-sm border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-medium"
        value={proteccion?.id || ''}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selected = disponibles.find(p => String(p.id) === selectedId);
          
          if (selected) {
            if (maxAmp && selected.in_amp > maxAmp) {
              alert(`La protección seleccionada excede el máximo permitido para este circuito (${maxAmp} A).`);
              return;
            }
            if (minAmp && selected.in_amp < minAmp) {
              alert(`La protección seleccionada es inferior a la corriente de diseño (${minAmp} A).`);
              return;
            }
            if (iccTablero && selected.capacidades && selected.capacidades.length > 0) {
              const selectedIcn = Math.max(...selected.capacidades.map(c => c.icn_ka));
              if (selectedIcn < iccTablero) {
                alert(`La capacidad de ruptura de esta protección (${selectedIcn} kA) es insuficiente para el cortocircuito del tablero (${iccTablero} kA).`);
                return;
              }
            }
          }
          onChange(selected);
        }}
      >
        <option value="">— Seleccionar protección del catálogo —</option>
        {(disponibles || []).map(p => {
          if (!p) return null;
          const optTooHigh = maxAmp && p.in_amp > maxAmp;
          const optTooLow = minAmp && p.in_amp < minAmp;
          const optIcn = p.capacidades && p.capacidades.length > 0 ? Math.max(...p.capacidades.map(c => c.icn_ka)) : 3;
          const optIcnInsuficiente = iccTablero && optIcn < iccTablero;
          const isDisabled = !!(optTooHigh || optTooLow || optIcnInsuficiente);

          return (
            <option key={p.id} value={p.id} disabled={isDisabled}>
              {p.modelo} • {p.tipo_proteccion || 'Térmica'} | {p.in_amp}A | Icn: {optIcn}kA 
              {optTooHigh ? ' ⚠ Excede calibre máx' : ''} 
              {optTooLow ? ' ⚠ Menor a Ib' : ''}
              {optIcnInsuficiente ? ' ⚠ Icn insuficiente' : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
};
