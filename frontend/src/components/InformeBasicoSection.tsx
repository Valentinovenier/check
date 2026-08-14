import { useState } from 'react';
import { Project, DatosCaratula } from '../types/project';
import { generatePdfMemoriaCalculoBasico } from '../utils/generatePdfMemoriaCalculoBasico';
import { generateDocxMemoriaCalculoBasico } from '../utils/generateDocxMemoriaCalculoBasico';
import { copyReportToClipboard } from '../utils/copyReportToClipboard';
import { FileDown, FileText, ClipboardCopy, Check } from 'lucide-react';

export const InformeBasicoSection = ({ project, caratula }: { project: Project, caratula: DatosCaratula }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReportToClipboard(project, caratula);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

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
          onClick={() => generatePdfMemoriaCalculoBasico(project, caratula)}
          className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
        >
          <FileDown size={18} />
          <span>Descargar Informe Básico (PDF)</span>
        </button>

        {/* Botón Descargar DOCX */}
        <button
          onClick={() => generateDocxMemoriaCalculoBasico(project, caratula)}
          className="bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-600 px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow"
          title="Descarga archivo .docx con columnas y tablas nativas listas para Google Docs y Word"
        >
          <FileText size={18} />
          <span>Descargar Word / Docs (.docx)</span>
        </button>

        {/* Botón Copiar Directo para Google Docs */}
        <button
          onClick={handleCopy}
          className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border shadow ${
            copied
              ? 'bg-emerald-700 border-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
          }`}
          title="Copia el informe con tablas completas. Abre Google Docs y pega directamente con Ctrl + V"
        >
          {copied ? <Check size={18} className="text-emerald-300" /> : <ClipboardCopy size={18} />}
          <span>{copied ? '¡Copiado! Pega con Ctrl + V en Docs' : 'Copiar para Google Docs (Ctrl+V)'}</span>
        </button>
      </div>

      {copied && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs px-4 py-2.5 rounded-xl animate-fade-in">
          ✓ <strong>Informe copiado con tablas nativas:</strong> Ve a tu documento de Google Docs y presiona <strong>Ctrl + V</strong> (o Cmd + V en Mac) para pegar todas las tablas formateadas.
        </div>
      )}
    </div>
  );
};


