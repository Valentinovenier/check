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
    <div className="bg-slate-950/90 border border-slate-700/90 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Cabecera del resultado */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <Cable size={22} />
          </div>
          <div>
            <h4 className="text-white font-bold text-base sm:text-lg tracking-tight">Dimensionamiento de Conductor Resultante</h4>
            <p className="text-xs sm:text-sm text-slate-300">Verificado según reglamentación AEA 90364-7-770</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-sm">
          <ShieldCheck size={16} /> Conductor Apto
        </span>
      </div>

      {/* Grid de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Sección Nominal Recomendada */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Sección Recomendada
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
              {seccion}
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-300">mm²</span>
          </div>
          <span className="text-xs text-slate-300 font-semibold mt-1">Cobre • {norma}</span>
        </div>

        {/* 2. Tacómetro / Barra de Caída de Tensión */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge size={16} className="text-blue-400" /> Caída de Tensión (ΔV)
            </span>
            <span className={`text-base font-black font-mono ${
              esCaidaExcesiva ? 'text-red-400' : esCaidaAlLimite ? 'text-amber-300' : 'text-emerald-400'
            }`}>
              {porcentajeCaidaNum.toFixed(2)}%
            </span>
          </div>

          {/* Barra visual de caída */}
          <div className="my-3">
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
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
            <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-mono font-medium">
              <span>0%</span>
              <span>Límite: {caidaMaxPermitida}%</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-300 truncate">
            {esCaidaExcesiva ? '⚠️ Supera el límite normativo' : '✓ Dentro del margen reglamentario'}
          </p>
        </div>

        {/* 3. Margen de Corriente Admisible */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={16} className="text-amber-400" /> Corriente Admisible
          </span>

          <div className="space-y-1.5 my-2 text-xs sm:text-sm font-mono">
            {iNominal !== undefined && (
              <div className="flex justify-between text-slate-300">
                <span>Diseño (Ib):</span>
                <span className="font-bold text-white">{iNominal.toFixed(1)} A</span>
              </div>
            )}
            {iProteccion !== undefined && (
              <div className="flex justify-between text-slate-300">
                <span>Térmica (In):</span>
                <span className="font-bold text-blue-400">{iProteccion} A</span>
              </div>
            )}
            {iAdmisible !== undefined && (
              <div className="flex justify-between text-emerald-300 border-t border-slate-800 pt-1.5">
                <span>Admisible (Iz):</span>
                <span className="font-bold">{iAdmisible.toFixed(1)} A</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 font-semibold truncate">
            Condición: Ib ≤ In ≤ Iz
          </p>
        </div>
      </div>
    </div>
  );
};
