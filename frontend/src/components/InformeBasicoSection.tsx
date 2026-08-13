import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaCalculoBasico } from '../utils/generatePdfMemoriaCalculoBasico';
import { FileDown } from 'lucide-react';

export const InformeBasicoSection = ({ project, caratula }: { project: Project, caratula: DatosCaratula }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-slate-700 space-y-4">
      <h3 className="text-lg font-bold text-white">Informe Técnico</h3>
      <p className="text-sm text-slate-400">
        Descargue el informe detallado con el procedimiento de cálculo paso a paso.
      </p>
      <button
        onClick={() => generatePdfMemoriaCalculoBasico(project, caratula)}
        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
      >
        <FileDown size={18} />
        <span>Descargar Informe Básico (PDF)</span>
      </button>
    </div>
  );
};
