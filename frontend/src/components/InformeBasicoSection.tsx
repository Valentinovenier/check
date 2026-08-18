import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaCalculoBasico } from '../utils/generatePdfMemoriaCalculoBasico';
import { FileDown } from 'lucide-react';

export const InformeBasicoSection = ({ project, caratula }: { project: Project, caratula: DatosCaratula }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-slate-700 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">Informe Técnico de Cálculo (DPMS)</h3>
        <p className="text-sm text-slate-400 mt-1">
          Descargue el informe detallado con todo el procedimiento de cálculo analítico paso a paso, superficies, relevamiento de ambientes, configuración de circuitos y memoria de DPMS.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {/* Botón Descargar PDF */}
        <button
          onClick={() => generatePdfMemoriaCalculoBasico(project, caratula, false)}
          className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
          title="Descargar memoria técnica oficial en formato PDF"
        >
          <FileDown size={18} />
          <span>Descargar Informe Básico (PDF)</span>
        </button>
      </div>
    </div>
  );
};


