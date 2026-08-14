import { useMemo, useEffect } from 'react';
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
  
  // Cálculos memorizados
  const { potenciaInstalada } = useMemo(() => calcularPotencias(datos), [datos]);
  const dpmsData = useMemo(() => calcularDPMS(datos), [datos]);
  
  // Coeficientes
  const minimos = useMemo(() => obtenerCircuitosMinimos(datos.gradoElectrificacion || 'Minimo'), [datos.gradoElectrificacion]);
  const factorSimultaneidadNormativo = useMemo(() => (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimos] || 0.6, [minimos]);
  const cosPhi = project.cosPhi || 0.85;

// Resetear el valor manual si el grado de electrificación cambia
  useEffect(() => {
    if (project.datosVivienda?.coefSimultaneidadManual && 
        project.datosVivienda?.gradoElectrificacion !== datos.gradoElectrificacion) {
        onChange({ ...project, datosVivienda: { ...datos, coefSimultaneidadManual: undefined } });
    }
  }, [datos.gradoElectrificacion]);

  // Mostrar valor: si existe manual, usarlo, si no, usar el normativo
  const factorSimultaneidadVisible = project.datosVivienda?.coefSimultaneidadManual || factorSimultaneidadNormativo;

  // Filtrar todos los circuitos para mostrar detalle
  const circuitos = useMemo(() => datos.circuitosCalculados, [datos.circuitosCalculados]);

  // Actualizar proyecto de forma segura mediante useEffect
  useEffect(() => {
    if (project.datosVivienda && (project.datosVivienda.potenciaMaximaSimultanea !== dpmsData.cargaTotal)) {
        onChange({ ...project, datosVivienda: { ...project.datosVivienda, potenciaInstalada, potenciaMaximaSimultanea: dpmsData.cargaTotal } });
    }
  }, [dpmsData.cargaTotal, potenciaInstalada]);
  
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
                        <th className="p-3">Categoría / Circuito</th>
                        <th className="p-3 text-right">Coef. Util.</th>
                        <th className="p-3 text-right">Coef. Simult.</th>
                        <th className="p-3 text-right">Demanda (VA)</th>
                        <th className="p-3 text-right">Demanda (W)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                    {/* Grado Electrificación */}
                    <tr className="bg-slate-800/20">
                        <td className="p-3 font-semibold">Grado Electrificación (AEA)</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right font-mono">
                            <input 
                                type="number"
                                step="0.05"
                                className="w-16 bg-slate-950 text-white text-xs rounded border border-slate-700 p-1 text-right"
                                value={factorSimultaneidadVisible}
                                min={factorSimultaneidadNormativo}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= factorSimultaneidadNormativo) {
                                        onChange({ ...project, datosVivienda: { ...datos, coefSimultaneidadManual: val } });
                                    }
                                }}
                            />
                        </td>
                        <td className="p-3 text-right font-mono">{dpmsData.DPMS_Grado.toFixed(0)}</td>
                        <td className="p-3 text-right font-mono">{(dpmsData.DPMS_Grado * cosPhi).toFixed(0)}</td>
                    </tr>
                    
                    {/* Todos los Circuitos */}
                    {circuitos.map((c, i) => {
                        // 1. Calcular puntos totales asignados a este circuito desde todos los ambientes
                        const tomasPorAmbiente = datos.tomasPorAmbiente || {};
                        let puntosIUG = 0;
                        let puntosTUG = 0;
                        
                        Object.values(tomasPorAmbiente).forEach(amb => {
                            if (amb[c.id]) {
                                puntosIUG += amb[c.id].IUG || 0;
                                puntosTUG += amb[c.id].TUG || 0;
                            }
                        });

                        // 2. Calcular potencia nominal base si no está definida
                        let nominalVA = c.potencia || 0;
                        if (!c.esEspecifico && nominalVA === 0) {
                            if (c.tipo === 'iluminacion_usos_generales') nominalVA = puntosIUG * 60;
                            else if (c.tipo === 'tomacorrientes_usos_generales') nominalVA = 2200; // Valor fijo normativo
                            else if (c.tipo === 'usos_especiales') nominalVA = 3300;
                        }

                        const potenciaNominalVA = c.unidadPotencia === 'W' ? nominalVA / cosPhi : nominalVA;
                        const demandaVA = potenciaNominalVA * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);
                        return (
                            <tr key={i}>
                                <td className="p-3 pl-6 text-slate-400">
                                    {c.nombre} {c.esEspecifico ? '(Específico)' : '(General)'}
                                </td>
                                <td className="p-3 text-right font-mono">{c.coefUtilizacion || 1}</td>
                                <td className="p-3 text-right font-mono">{c.coefSimultaneidad || 1}</td>
                                <td className="p-3 text-right font-mono">{demandaVA.toFixed(0)}</td>
                                <td className="p-3 text-right font-mono">{(demandaVA * cosPhi).toFixed(0)}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-indigo-900/20 font-bold">
                    <tr>
                        <td className="p-3 text-white" colSpan={3}>Total DPMS</td>
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
