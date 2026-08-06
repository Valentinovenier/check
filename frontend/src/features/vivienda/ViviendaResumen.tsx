import { Project } from '../../types/project';
import { AlertTriangle, Zap, Info } from 'lucide-react';
import { calcularPotencias } from '../../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../../engine/strategies/vivienda/calculoPotencia';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../../data/vivienda/factoresSimultaneidad';
import { obtenerCircuitosMinimos } from '../../engine/strategies/vivienda/normas770';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaResumen = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [] };
  const grado = datos.gradoElectrificacion || 'Minimo';
  
  // Cálculos
  const { potenciaInstalada } = calcularPotencias(datos);
  const { DPMS_Grado, DPMS_Específicas, cargaTotal, advertencias } = calcularDPMS(datos);
  
  // Coeficiente utilizado para el grado
  const minimos = obtenerCircuitosMinimos(grado);
  const factorSimultaneidadGrado = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimos] || 0.6;

  // Actualizar proyecto
  if (project.datosVivienda && (project.datosVivienda.potenciaMaximaSimultanea !== cargaTotal)) {
      onChange({ ...project, datosVivienda: { ...project.datosVivienda, potenciaInstalada, potenciaMaximaSimultanea: cargaTotal } });
  }
  
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Resumen Final de Demanda</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de Grado */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Zap size={16} /> DPMS (IUG-TUG-C.Especial) ({grado})
            </h3>
            <div className="text-sm text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Potencia Instalada:</span> <span>{potenciaInstalada.toFixed(0)} VA</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-2"><span>Factor Simultaneidad:</span> <span>{factorSimultaneidadGrado}</span></div>
                <div className="flex justify-between font-bold pt-2 text-white"><span>DPMS1:</span> <span>{DPMS_Grado.toFixed(0)} VA</span></div>
            </div>
        </div>

        {/* Desglose Específicas */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <Info size={16} /> DPMS (Cargas Específicas)
            </h3>
            <div className="space-y-2">
                {datos.circuitosCalculados.filter(c => c.esEspecifico).map((c, i) => (
                    <div key={i} className="text-[11px] bg-slate-800 p-2 rounded flex justify-between">
                        <span className="text-slate-300">{c.siglaEspecifica}</span>
                        <span className="text-indigo-300 font-mono">
                            {c.potencia} {c.unidadPotencia} × {c.coefUtilizacion} × {c.coefSimultaneidad} = {(
                                (c.unidadPotencia === 'W' ? (c.potencia || 0) / 0.8 : (c.potencia || 0)) * 
                                (c.coefUtilizacion || 1) * 
                                (c.coefSimultaneidad || 1)
                            ).toFixed(0)} VA
                        </span>
                    </div>
                ))}
                {datos.circuitosCalculados.filter(c => c.esEspecifico).length === 0 && <span className="text-xs text-slate-500 italic">No hay cargas específicas.</span>}
                <div className="flex justify-between font-bold pt-2 border-t border-slate-700 text-white"><span>DPMS2:</span> <span>{DPMS_Específicas.toFixed(0)} VA</span></div>
            </div>
        </div>
      </div>

      {/* Carga Total y Advertencias */}
      <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-800 flex justify-between items-center">
        <span className="text-lg font-bold text-white">DPMS Total:</span>
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
