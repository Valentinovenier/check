import { useState } from 'react';
import { Project } from '../../types/project';
import { ViviendaMemoriaDescriptiva } from './ViviendaMemoriaDescriptiva';
import { ViviendaMemoriaCalculo } from './ViviendaMemoriaCalculo';
import { ShieldCheck, Calculator, FileDown, FileText, ClipboardCopy } from 'lucide-react';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { generatePdfMemoriaDescriptiva } from '../../utils/generatePdfMemoriaDescriptiva';
import { generatePdfMemoriaCalculo } from '../../utils/generatePdfMemoriaCalculo';
import { generateDocxMemoriaCalculoBasico } from '../../utils/generateDocxMemoriaCalculoBasico';
import { copyReportToClipboard } from '../../utils/copyReportToClipboard';

export const ViviendaReport = ({ project }: { project: Project }) => {
  const [activeTab, setActiveTab] = useState<'descriptiva' | 'calculo'>('descriptiva');
  const { canAccessFullFeatures } = usePlanAccess();
  const isPro = canAccessFullFeatures();

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
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => copyReportToClipboard(project)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shadow"
              title="Copiar informe con tablas nativas para pegar directo en Google Docs con Ctrl+V"
            >
              <ClipboardCopy size={16} />
              <span>Copiar para Docs (Ctrl+V)</span>
            </button>
            <button
              onClick={() => generateDocxMemoriaCalculoBasico(project)}
              className="bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-600 px-3 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shadow"
              title="Descargar versión editable compatible con Google Docs y Microsoft Word"
            >
              <FileText size={16} />
              <span>Google Docs (.docx)</span>
            </button>
            <button
              onClick={() => generatePdfMemoriaDescriptiva(project)}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shadow"
            >
              <FileDown size={16} />
              <span>Memoria Descriptiva</span>
            </button>
            <button
              onClick={() => generatePdfMemoriaCalculo(project)}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shadow"
            >
              <FileDown size={16} />
              <span>Memoria de Cálculo</span>
            </button>
          </div>
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
