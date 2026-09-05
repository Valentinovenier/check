import React from 'react';
import { Project } from '../types/project';
import { Zap } from 'lucide-react';

interface Props {
  project: Project | null;
}

export const ProjectSummaryBar: React.FC<Props> = ({ project }) => {
  if (!project) return null;

  const isVivienda = project.projectType === 'Vivienda';

  // Datos contextuales
  const circuitos = project.datosVivienda?.circuitosCalculados || [];
  const canalizaciones = project.canalizaciones || [];
  const informeConductores = project.informeConductores || [];

  // Potencia estimada
  let potenciaDisplay = '—';
  let tensionDisplay: string;

  if (isVivienda) {
    const supplyType = project.datosVivienda?.supplyType;
    tensionDisplay = supplyType === 'trifasic' ? 'Trifásica (380V)' : 'Monofásica (220V)';
    
    const potenciaMaximaVA = project.datosVivienda?.potenciaMaximaSimultanea || 0;
    const cosPhi = project.cosPhi || 0.92; // Valor por defecto si no está definido
    
    if (potenciaMaximaVA > 0) {
      const potenciaKW = (potenciaMaximaVA * cosPhi) / 1000;
      potenciaDisplay = `${potenciaKW.toFixed(1)} kW`;
    }
  } else {
    tensionDisplay = project.tipoInstalacion || 'Trifásica (380V)';
    if (project.transformador?.potencia) {
      potenciaDisplay = `${project.transformador.potencia} kVA`;
    }
  }

  return (
    <div className="flex-1 flex flex-wrap items-center justify-between gap-4 text-base">
      {/* Nombre y tipo */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg tracking-tight">{project.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {project.projectType || 'General'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {tensionDisplay} • Potencia: <span className="text-amber-400 font-bold">{potenciaDisplay}</span>
          </p>
        </div>
      </div>

      {/* Indicadores de avance */}
      <div className="flex items-center gap-5 text-slate-300">
        {/* Indicadores eliminados */}
      </div>
    </div>
  );
};
