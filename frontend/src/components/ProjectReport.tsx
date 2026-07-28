import { Project } from '../types/project';
import { getProjectStrategy } from '../engine/factory';
import { generatePdfReport } from '../utils/generatePdfReport';

export const ProjectReport = ({ project }: { project: Project }) => {
  const handlePrint = () => window.print();
  const handleDownloadPdf = () => {
    generatePdfReport(project);
  };
  const strategy = getProjectStrategy(project);
  const ReportComponent = strategy.getInformeComponente();

  return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white">Informe Técnico: {project.name}</h2>
          <p className="text-xs text-slate-400 mt-1">Reglamentación AEA 90364-7-770 / Carpeta Técnica Apta</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPdf}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg"
          >
            <span>Descargar Carpeta Técnica (PDF)</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            Imprimir Pantalla
          </button>
        </div>
      </div>

      <ReportComponent project={project} />
    </div>
  );
};


