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
  let tensionDisplay = project.tipoInstalacion || (isVivienda ? 'Monofásica (220V)' : 'Trifásica (380V)');

  if (isVivienda) {
    const totalVA = circuitos.reduce((sum, c) => sum + (Number(c.potencia) || 0), 0);
    if (totalVA > 0) {
      potenciaDisplay = `${(totalVA / 1000).toFixed(1)} kVA`;
    }
  } else if (project.transformador?.potencia) {
    potenciaDisplay = `${project.transformador.potencia} kVA`;
  }

  const totalCircuitos = circuitos.length;
  const proteccionesAsignadas = circuitos.filter(c => c.proteccion).length;
  const conductoresCalculados = informeConductores.length;

  return (
    <div className="flex-1 flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Nombre y tipo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
          <Zap size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-tight">{project.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {project.projectType || 'General'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {tensionDisplay} • Potencia: <span className="text-amber-400 font-medium">{potenciaDisplay}</span>
          </p>
        </div>
      </div>

      {/* Indicadores de avance */}
      <div className="flex items-center gap-4 text-slate-300">
        {isVivienda && totalCircuitos > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium uppercase text-[10px]">Circuitos:</span>
              <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {totalCircuitos}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium uppercase text-[10px]">Protecciones:</span>
              <span className={`font-semibold px-2 py-0.5 rounded border ${
                proteccionesAsignadas === totalCircuitos && totalCircuitos > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {proteccionesAsignadas}/{totalCircuitos}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium uppercase text-[10px]">Canalizaciones:</span>
              <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {canalizaciones.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium uppercase text-[10px]">Cables:</span>
              <span className={`font-semibold px-2 py-0.5 rounded border ${
                conductoresCalculados >= totalCircuitos && totalCircuitos > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {conductoresCalculados}/{totalCircuitos}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
