import { Project } from '../../types/project';
import { AlertTriangle } from 'lucide-react';
import { calcularPotencias } from '../../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../../engine/strategies/vivienda/calculoPotencia';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../../data/vivienda/factoresSimultaneidad';
import { obtenerCircuitosMinimos } from '../../engine/strategies/vivienda/normas770';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaResumen = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], gradoElectrificacion: 'Minimo' };
  
  // Cálculos
  const { potenciaInstalada } = calcularPotencias(datos);
  const dpmsData = calcularDPMS(datos);
  
  // Coeficientes
  const minimos = obtenerCircuitosMinimos(datos.gradoElectrificacion || 'Minimo');
  const factorSimultaneidadGrado = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimos] || 0.6;
  const cosPhi = project.cosPhi || 0.85;

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
        <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="bg-slate-950/50 text-slate-400">
                        <th className="p-3">Categoría</th>
                        <th className="p-3 text-right">Coef. Simult.</th>
                        <th className="p-3 text-right">Demanda (VA)</th>
                        <th className="p-3 text-right">Demanda (W)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                        <td className="p-3">Grado Electrificación (AEA)</td>
                        <td className="p-3 text-right font-mono">{factorSimultaneidadGrado.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono">{dpmsData.DPMS_Grado.toFixed(0)}</td>
                        <td className="p-3 text-right font-mono">{(dpmsData.DPMS_Grado * cosPhi).toFixed(0)}</td>
                    </tr>
                    <tr>
                        <td className="p-3">Circuitos Específicos</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right font-mono">{dpmsData.DPMS_Específicas.toFixed(0)}</td>
                        <td className="p-3 text-right font-mono">{(dpmsData.DPMS_Específicas * cosPhi).toFixed(0)}</td>
                    </tr>
                </tbody>
                <tfoot className="bg-indigo-900/20 font-bold">
                    <tr>
                        <td className="p-3 text-white">Total DPMS</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right text-emerald-400 font-mono text-base">{dpmsData.cargaTotal.toFixed(0)} VA</td>
                        <td className="p-3 text-right text-emerald-400 font-mono text-base">{(dpmsData.cargaTotal * cosPhi).toFixed(0)} W</td>
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
