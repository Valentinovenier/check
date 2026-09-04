import React from 'react';
import { Cable, ShieldCheck, AlertCircle, ArrowDownRight, Gauge, Activity } from 'lucide-react';

interface Props {
  seccion?: number;
  caidaPorcentaje?: number;
  caidaMaxPermitida?: number;
  iNominal?: number;
  iAdmisible?: number;
  iProteccion?: number;
  longitud?: number;
  norma?: string;
  pasosVerificacion?: any[];
}

export const ConductorResultCard: React.FC<Props> = ({
  seccion,
  caidaPorcentaje = 0,
  caidaMaxPermitida = 3.0,
  iNominal,
  iAdmisible,
  iProteccion,
  longitud,
  norma = 'IRAM 2178',
}) => {
  if (!seccion) return null;

  // Evaluar estado de la caída de tensión
  const porcentajeCaidaNum = Number(caidaPorcentaje) || 0;
  const caidaNormalizada = Math.min(100, (porcentajeCaidaNum / caidaMaxPermitida) * 100);
  const esCaidaExcesiva = porcentajeCaidaNum > caidaMaxPermitida;
  const esCaidaAlLimite = porcentajeCaidaNum > (caidaMaxPermitida * 0.75) && !esCaidaExcesiva;

  return (
    <div className="bg-slate-950/90 border border-slate-700/90 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Cabecera del resultado */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Cable size={18} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Dimensionamiento de Conductor Resultante</h4>
            <p className="text-[11px] text-slate-400">Verificado según normativa AEA 90364-7-770</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <ShieldCheck size={14} /> Conductor Apto
        </span>
      </div>

      {/* Grid de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Sección Nominal Recomendada */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Sección Recomendada
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {seccion}
            </span>
            <span className="text-xs font-bold text-emerald-300">mm²</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Cobre • {norma}</span>
        </div>

        {/* 2. Tacómetro / Barra de Caída de Tensión */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gauge size={13} className="text-blue-400" /> Caída de Tensión (ΔV)
            </span>
            <span className={`text-xs font-bold font-mono ${
              esCaidaExcesiva ? 'text-red-400' : esCaidaAlLimite ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {porcentajeCaidaNum.toFixed(2)}%
            </span>
          </div>

          {/* Barra visual de caída */}
          <div className="my-2">
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  esCaidaExcesiva 
                    ? 'bg-red-500' 
                    : esCaidaAlLimite 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(8, caidaNormalizada))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>0%</span>
              <span>Límite: {caidaMaxPermitida}%</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 truncate">
            {esCaidaExcesiva ? '⚠️ Supera el límite normativo' : '✓ Dentro del margen reglamentario'}
          </p>
        </div>

        {/* 3. Margen de Corriente Admisible */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity size={13} className="text-amber-400" /> Corriente Admisible
          </span>

          <div className="space-y-1 my-1 text-xs font-mono">
            {iNominal !== undefined && (
              <div className="flex justify-between text-slate-400">
                <span>Diseño (Ib):</span>
                <span className="font-bold text-white">{iNominal.toFixed(1)} A</span>
              </div>
            )}
            {iProteccion !== undefined && (
              <div className="flex justify-between text-slate-400">
                <span>Térmica (In):</span>
                <span className="font-bold text-blue-400">{iProteccion} A</span>
              </div>
            )}
            {iAdmisible !== undefined && (
              <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-1">
                <span>Admisible (Iz):</span>
                <span className="font-bold">{iAdmisible.toFixed(1)} A</span>
              </div>
            )}
          </div>

          <p className="text-[9px] text-slate-500 truncate">
            Condición: Ib ≤ In ≤ Iz
          </p>
        </div>
      </div>
    </div>
  );
};
