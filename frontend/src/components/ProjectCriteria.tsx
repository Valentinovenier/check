import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

export const ProjectCriteria = () => {
  const [criteria, setCriteria] = useState({
    transformerReserve: 20, // %
    currentAcceptanceMargin: 10, // %
    voltageDropMargin: 5, // %
    shortCircuitMargin: 10, // %
    powerFactor: 0.85,
  });

  const handleChange = (key: string, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  const fields = [
    { label: 'Reserva transformador (%)', key: 'transformerReserve', step: 1 },
    { label: 'Margen Corriente Adm. (%)', key: 'currentAcceptanceMargin', step: 0.1 },
    { label: 'Margen Caída Tensión (%)', key: 'voltageDropMargin', step: 0.1 },
    { label: 'Margen Cortocircuito (%)', key: 'shortCircuitMargin', step: 0.1 },
    { label: 'Factor de potencia (cos φ)', key: 'powerFactor', step: 0.01 },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-slate-800 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <Sliders className="text-[var(--accent)]" />
        <h3 className="text-xl font-semibold text-white">Criterios de Proyectista</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((item) => (
          <div key={item.key}>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              {item.label}
            </label>
            <input
              type="number"
              step={item.step}
              value={criteria[item.key as keyof typeof criteria]}
              onChange={(e) => handleChange(item.key, parseFloat(e.target.value))}
              className="w-full bg-[var(--bg-primary)] border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[var(--accent)] outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
