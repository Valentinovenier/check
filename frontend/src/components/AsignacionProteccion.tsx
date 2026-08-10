import React, { useState } from 'react';
import { Proteccion } from '../types/project';

interface AsignacionProteccionProps {
  label: string;
  proteccion?: Proteccion;
  disponibles: Proteccion[];
  onChange: (p: Proteccion | undefined) => void;
  opcional?: boolean;
  maxAmp?: number; 
  minAmp?: number; // Nueva propiedad
}

export const AsignacionProteccion = ({ label, proteccion, disponibles, onChange, opcional = true, maxAmp, minAmp }: AsignacionProteccionProps) => {
  return (
    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-slate-700 mb-2">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        {opcional && (
          <button 
            onClick={() => onChange(undefined)} 
            className="text-xs text-red-400 hover:text-red-300"
          >
            {proteccion ? 'Eliminar' : ''}
          </button>
        )}
      </div>
      <select 
        className="w-full bg-[var(--bg-primary)] p-2 rounded-lg text-white border border-slate-700"
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
          }
          onChange(selected);
        }}
      >
        <option value="">Seleccionar protección...</option>
        {disponibles.map(p => {
          const isTooHigh = maxAmp && p.in_amp > maxAmp;
          const isTooLow = minAmp && p.in_amp < minAmp;
          const isDisabled = isTooHigh || isTooLow;
          return (
            <option key={p.id} value={p.id} disabled={isDisabled}>
              {p.modelo} - {p.tipo_proteccion} ({p.in_amp}A) {isTooHigh ? '(Excede máx)' : ''} {isTooLow ? '(Inferior a Ib)' : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
};
