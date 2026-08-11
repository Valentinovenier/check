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
  const dpmsData = calcularDPMS(datos);
  
  // Actualizar proyecto
  if (project.datosVivienda && (project.datosVivienda.potenciaMaximaSimultanea !== dpmsData.cargaTotal)) {
      onChange({ ...project, datosVivienda: { ...project.datosVivienda, potenciaInstalada, potenciaMaximaSimultanea: dpmsData.cargaTotal } });
  }
  
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Resumen de Demanda</h2>
      </div>

      {/* Carga Total Desglosada */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <span className="text-sm font-bold text-white">Desglose de DPMS</span>
        </div>
        <div className="p-0">
            <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800">
                    <tr>
                        <td className="p-4 text-slate-400">Demanda por Grado (AEA 90364)</td>
                        <td className="p-4 font-mono text-white text-right">{dpmsData.DPMS_Grado.toFixed(0)} VA</td>
                    </tr>
                    <tr>
                        <td className="p-4 text-slate-400">Demanda Circuitos Específicos</td>
                        <td className="p-4 font-mono text-white text-right">{dpmsData.DPMS_Específicas.toFixed(0)} VA</td>
                    </tr>
                </tbody>
                <tfoot className="bg-indigo-900/20">
                    <tr>
                        <td className="p-4 font-bold text-white">Demanda Máxima de Potencia (DPMS Total)</td>
                        <td className="p-4 font-bold text-2xl text-emerald-400 text-right">{dpmsData.cargaTotal.toFixed(0)} VA</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>

      {dpmsData.advertencias.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-xl space-y-2">
          {dpmsData.advertencias.map((adv, i) => (
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
