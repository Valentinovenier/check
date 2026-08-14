import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaCalculoBasico } from '../utils/generatePdfMemoriaCalculoBasico';
import { generateDocxMemoriaCalculoBasico } from '../utils/generateDocxMemoriaCalculoBasico';
import { FileDown, FileText } from 'lucide-react';

export const InformeBasicoSection = ({ project, caratula }: { project: Project, caratula: DatosCaratula }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-slate-700 space-y-4">
      <h3 className="text-lg font-bold text-white">Informe Técnico de Cálculo (DPMS)</h3>
      <p className="text-sm text-slate-400">
        Descargue el informe con todo el procedimiento de cálculo analítico paso a paso, superficies, relevamiento de ambientes, configuración de circuitos y memoria de DPMS.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => generatePdfMemoriaCalculoBasico(project, caratula)}
          className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
        >
          <FileDown size={18} />
          <span>Descargar Informe Básico (PDF)</span>
        </button>

        <button
          onClick={() => generateDocxMemoriaCalculoBasico(project, caratula)}
          className="bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
          title="Conserva todas las tablas como tablas editables en Google Docs y Microsoft Word"
        >
          <FileText size={18} />
          <span>Descargar Editable (.docx / Google Docs)</span>
        </button>
      </div>
    </div>
  );
};

