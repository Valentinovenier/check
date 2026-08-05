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
  const grado = datos.gradoElectrificacion || 'Minimo';
  
  // Usar funciones de cálculo
  const { potenciaInstalada } = calcularPotencias(datos);
  const { DPMS_Grado, DPMS_Específicas, cargaTotal, advertencias } = calcularDPMS(datos);
  
  // Actualizamos el proyecto
  const actualizarPotencias = () => {
    if (project.datosVivienda) {
        onChange({
            ...project,
            datosVivienda: {
                ...project.datosVivienda,
                potenciaInstalada,
                potenciaMaximaSimultanea: cargaTotal
            }
        });
    }
  };

  // Efecto para actualizar (simulado en render para brevedad)
  if (project.datosVivienda && (project.datosVivienda.potenciaMaximaSimultanea !== cargaTotal)) {
      actualizarPotencias();
  }

  const minCircuitosMap: Record<string, number> = { 'Minimo': 2, 'Medio': 3, 'Elevado': 5, 'Superior': 6 };
  const minCircuitos = minCircuitosMap[grado] || 2;
  
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Resumen Final</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase">Detalle de Circuitos</h3>
          <div className="space-y-2">
            {datos.circuitosCalculados.map((c: any, index: number) => (
              <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{c.nombre}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{c.tipo.replace(/_/g, ' ')}</p>
                  {c.esEspecifico && (
                    <p className="text-[10px] text-indigo-400">{c.siglaEspecifica} - {c.potencia} {c.unidadPotencia}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Demanda Potencia (DPMS)</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>DPMS Grado:</span>
                <span className="text-white font-bold">{DPMS_Grado.toFixed(0)} VA</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>DPMS Específicas:</span>
                <span className="text-white font-bold">{DPMS_Específicas.toFixed(0)} VA</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-white font-bold">
                <span>Carga Total:</span>
                <span className="text-emerald-400 text-lg">{cargaTotal.toFixed(0)} VA</span>
              </div>
            </div>
          </div>

          {advertencias.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-xl flex flex-col gap-2">
              {advertencias.map((adv, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="text-amber-400 shrink-0" size={16} />
                    <p className="text-[11px] text-amber-400">{adv}</p>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
