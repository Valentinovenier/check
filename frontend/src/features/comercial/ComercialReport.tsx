import { Project, DatosCaratula } from '../../types/project';
import { FileDown } from 'lucide-react';
import { generatePdfReport } from '../../utils/generatePdfReport';

export const ComercialReport = ({ project, isPro, caratula }: { project: Project, isPro: boolean, caratula: DatosCaratula }) => (
    <div className="space-y-6">
        <div className='flex justify-between items-center'>
            <h1 className="text-2xl font-bold text-white mb-4">Memoria de Cálculo: Comercial (AEA 771)</h1>
            {isPro && (
                <button
                    onClick={() => generatePdfReport(project, caratula)}
                    className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 px-4 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shadow"
                >
                    <FileDown size={16} />
                    <span>Descargar Carpeta Técnica (PDF)</span>
                </button>
            )}
        </div>
        
        <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">Resultados de Tramos</h3>
            <div className="space-y-3">
                {Object.entries(project.conductores || {}).map(([key, cond]) => (
                    <div key={key} className="p-3 bg-slate-900 rounded border border-slate-800 text-sm">
                        <p className="font-semibold text-white">{key.replace('__', ' - ')}</p>
                        <p className="text-xs text-slate-400">Sección: {cond.seccion || 'N/A'} mm²</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
