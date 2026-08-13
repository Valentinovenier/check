import { useState } from 'react';
import { Project, DatosCaratula } from '../../types/project';
import { ViviendaMemoriaDescriptiva } from './ViviendaMemoriaDescriptiva';
import { ViviendaMemoriaCalculo } from './ViviendaMemoriaCalculo';
import { ShieldCheck, Calculator, FileDown } from 'lucide-react';
import { generatePdfMemoriaDescriptiva } from '../../utils/generatePdfMemoriaDescriptiva';
import { generatePdfMemoriaCalculo } from '../../utils/generatePdfMemoriaCalculo';

export const ViviendaReport = ({ project, isPro, caratula }: { project: Project, isPro: boolean, caratula: DatosCaratula }) => {
  const [activeTab, setActiveTab] = useState<'descriptiva' | 'calculo'>('descriptiva');

  return (
    <div className="space-y-6">
      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 print:hidden justify-between items-center">
        <div className='flex gap-2'>
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
        
        {isPro && (
            <button
                onClick={() => activeTab === 'descriptiva' ? generatePdfMemoriaDescriptiva(project, caratula) : generatePdfMemoriaCalculo(project, caratula)}
                className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shadow"
            >
                <FileDown size={16} />
                <span>Descargar PDF</span>
            </button>
        )}
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
