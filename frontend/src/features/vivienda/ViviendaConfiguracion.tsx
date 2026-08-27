import { useEffect } from 'react';
import { Project } from '../../types/project';
import { 
  calcularSuperficieLimite, 
  determinarGradoElectrificacion, 
  obtenerCircuitosMinimos 
} from '../../engine/strategies/vivienda/normas770';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaConfiguracion = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [] };
  
  // Calcular valores normativos derivados
  const superficieLimite = calcularSuperficieLimite(datos);
  const grado = determinarGradoElectrificacion(superficieLimite);
  const circuitosMinimos = obtenerCircuitosMinimos(grado);

  // Sincronizar el grado calculado con el proyecto
  useEffect(() => {
    if (datos.gradoElectrificacion !== grado) {
      onChange({ 
        ...project, 
        datosVivienda: { 
          ...datos, 
          gradoElectrificacion: grado 
        } 
      });
    }
  }, [grado]);

  const handleUpdate = (updates: Partial<typeof datos>) => {
    onChange({ 
      ...project, 
      datosVivienda: { ...datos, ...updates } 
    });
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4">Grado de Electrificacion</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-[13px] font-semibold uppercase text-slate-500 mb-1">Superficie Cubierta (m²)</label>
          <input 
            type="number" 
            className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
            value={datos.superficieCubierta ?? ''}
            onChange={(e) => handleUpdate({ superficieCubierta: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold uppercase text-slate-500 mb-1">Superficie Semicubierta (m²)</label>
          <input 
            type="number" 
            className="w-full bg-slate-950 text-white text-sm rounded-lg p-2.5 border border-slate-700"
            value={datos.superficieSemicubierta ?? ''}
            onChange={(e) => handleUpdate({ superficieSemicubierta: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[13px] text-slate-500 uppercase">Superficie Límite</p>
          <p className="text-lg font-bold text-[var(--accent)]">{superficieLimite.toFixed(1)} m²</p>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 uppercase">Grado Electrificación</p>
          <p className="text-lg font-bold text-white">{grado}</p>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 uppercase">Circuitos Mínimos</p>
          <p className="text-lg font-bold text-white">{circuitosMinimos}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-[13px] font-semibold uppercase text-slate-500 mb-2">Tipo de Suministro</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleUpdate({ supplyType: 'monophasic' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              datos.supplyType !== 'trifasic'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className="font-bold">Monofásico</div>
          </button>
          <button
            type="button"
            onClick={() => handleUpdate({ supplyType: 'trifasic' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              datos.supplyType === 'trifasic'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className="font-bold">Trifásico</div>
          </button>
        </div>
      </div>
    </div>
  );
};
