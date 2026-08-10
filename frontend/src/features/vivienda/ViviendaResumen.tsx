import { Project } from '../../types/project';
import { AlertTriangle } from 'lucide-react';
import { calcularPotencias } from '../../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../../engine/strategies/vivienda/calculoPotencia';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaResumen = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [] };
  
  // Cálculos
  const { potenciaInstalada } = calcularPotencias(datos);
  const { cargaTotal, advertencias } = calcularDPMS(datos);
  
  // Actualizar proyecto
  if (project.datosVivienda && (project.datosVivienda.potenciaMaximaSimultanea !== cargaTotal)) {
      onChange({ ...project, datosVivienda: { ...project.datosVivienda, potenciaInstalada, potenciaMaximaSimultanea: cargaTotal } });
  }
  
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Resumen de Demanda</h2>
      </div>

      {/* Carga Total */}
      <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-800 flex justify-between items-center">
        <span className="text-lg font-bold text-white">Demanda Máxima de Potencia (DPMS Total):</span>
        <span className="text-2xl font-bold text-emerald-400">{cargaTotal.toFixed(0)} VA</span>
      </div>

      {advertencias.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-xl space-y-2">
          {advertencias.map((adv, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="text-amber-400 shrink-0" size={16} />
                <p className="text-xs text-amber-400">{adv}</p>
              </div>
          ))}
        </div>
      )}
    </div>
  );
};
