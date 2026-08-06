import React, { useState } from 'react';
import { Proteccion } from '../types/project';

interface AsignacionProteccionProps {
  label: string;
  proteccion?: Proteccion;
  disponibles: Proteccion[];
  onChange: (p: Proteccion | undefined) => void;
  opcional?: boolean;
}

export const AsignacionProteccion = ({ label, proteccion, disponibles, onChange, opcional = true }: AsignacionProteccionProps) => {
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
          onChange(selected);
        }}
      >
        <option value="">Seleccionar protección...</option>
        {disponibles.map(p => (
          <option key={p.id} value={p.id}>
            {p.modelo} - {p.tipo_proteccion} ({p.in_amp}A)
          </option>
        ))}
      </select>
    </div>
  );
};
