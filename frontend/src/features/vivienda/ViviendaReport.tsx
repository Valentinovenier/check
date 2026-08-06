import { useState } from 'react';
import { Project } from '../../types/project';
import { ViviendaMemoriaDescriptiva } from './ViviendaMemoriaDescriptiva';
import { ViviendaMemoriaCalculo } from './ViviendaMemoriaCalculo';
import { ShieldCheck, Calculator } from 'lucide-react';

export const ViviendaReport = ({ project }: { project: Project }) => {
  const [activeTab, setActiveTab] = useState<'descriptiva' | 'calculo'>('descriptiva');

  return (
    <div className="space-y-6">
      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 print:hidden">
        <button
          onClick={() => setActiveTab('descriptiva')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'descriptiva'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Memoria Descriptiva</span>
        </button>

        <button
          onClick={() => setActiveTab('calculo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'calculo'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Calculator size={18} />
          <span>Memoria de Cálculo (Paso a Paso)</span>
        </button>
      </div>

      {/* Renderizado del Informe Seleccionado */}
      {activeTab === 'descriptiva' ? (
        <ViviendaMemoriaDescriptiva project={project} />
      ) : (
        <ViviendaMemoriaCalculo project={project} />
      )}
    </div>
  );
};
