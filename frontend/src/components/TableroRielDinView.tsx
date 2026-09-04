import React from 'react';
import { Proteccion } from '../types/project';
import { Shield, Zap, AlertCircle, Plus } from 'lucide-react';

interface Props {
  tableroNombre: string;
  cabecera?: Proteccion;
  diferencial?: Proteccion;
  circuitos: {
    id: string;
    nombre: string;
    tipo?: string;
    proteccion?: Proteccion;
    iNominal: number;
    maxAmp?: number;
  }[];
  onSelectCircuito?: (circuitoId: string) => void;
  onAssignCabecera?: () => void;
  onAssignDiferencial?: () => void;
}

export const TableroRielDinView: React.FC<Props> = ({
  tableroNombre,
  cabecera,
  diferencial,
  circuitos,
  onSelectCircuito,
  onAssignCabecera,
  onAssignDiferencial,
}) => {
  // Cálculo de módulos DIN (polos aproximados: cabecera polos, diferencial polos, y 2 polos por circuito)
  const polosCabecera = cabecera?.polos || 2;
  const polosDif = diferencial?.polos || 2;
  const polosCircuitos = circuitos.reduce((sum, c) => sum + (c.proteccion?.polos || 2), 0);
  const totalModulos = polosCabecera + polosDif + polosCircuitos;
  const capacidadGabinete = Math.max(12, Math.ceil(totalModulos / 6) * 6); // Estándares múltiplos de 6/8/12

  return (
    <div className="bg-slate-950/85 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Cabecera del gabinete */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
          <h4 className="text-white font-bold text-lg tracking-tight">Frente de Tablero (Riel DIN): {tableroNombre}</h4>
        </div>
        <div className="flex items-center gap-2.5 text-base text-slate-300">
          <span className="font-semibold text-sm text-slate-400">Ocupación:</span>
          <span className="font-mono font-bold text-amber-300 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700 text-sm shadow-inner">
            {totalModulos} / {capacidadGabinete} Módulos DIN
          </span>
        </div>
      </div>

      {/* Riel metálico DIN */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-6 overflow-x-auto shadow-inner">
        {/* Líneas simulando el riel metálico omega de fondo */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-slate-800/60 border-y border-slate-700/70 -z-0 pointer-events-none" />

        <div className="relative z-10 flex items-stretch gap-4 min-w-max py-4">
          {/* 1. Interruptor General (Cabecera) */}
          <div className="flex flex-col items-center">
            <span className="text-xs sm:text-sm font-black text-blue-400 uppercase tracking-wider mb-2.5">Cabecera</span>
            {cabecera ? (
              <div
                onClick={onAssignCabecera}
                className="w-28 sm:w-32 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 border-blue-500 hover:border-blue-400 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-xl transition-all group"
                title={`${cabecera.modelo} - ${cabecera.in_amp}A`}
              >
                <div className="w-full flex justify-between items-center text-xs text-slate-300 font-mono font-bold">
                  <span>{cabecera.polos}P</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">ON</span>
                </div>
                {/* Palanca visual */}
                <div className="w-16 h-10 my-2.5 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center shadow-inner">
                  <div className="w-8 h-6 bg-red-600 rounded shadow group-hover:brightness-110 transition-transform" />
                </div>
                <div className="w-full">
                  <p className="text-base sm:text-lg font-black text-white font-mono">{cabecera.curva_disparo || 'C'}{cabecera.in_amp}</p>
                  <p className="text-xs text-slate-300 truncate max-w-[105px] mt-0.5">{cabecera.modelo}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onAssignCabecera}
                className="w-28 sm:w-32 h-44 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-400 transition-all bg-slate-900/40 cursor-pointer"
              >
                <Plus size={24} />
                <span className="text-sm font-bold">Asignar</span>
              </button>
            )}
          </div>

          {/* Separador DIN */}
          <div className="w-[2px] bg-slate-700/80 my-2 self-stretch" />

          {/* 2. Interruptor Diferencial */}
          <div className="flex flex-col items-center">
            <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider mb-2.5">Diferencial</span>
            {diferencial ? (
              <div
                onClick={onAssignDiferencial}
                className="w-28 sm:w-32 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 border-amber-500 hover:border-amber-400 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-xl transition-all group"
                title={`${diferencial.modelo} - ${diferencial.in_amp}A ${diferencial.sensibilidad || 30}mA`}
              >
                <div className="w-full flex justify-between items-center text-xs text-slate-300 font-mono font-bold">
                  <span>{diferencial.polos}P</span>
                  <span className="w-4 h-4 rounded-full bg-slate-700 border border-slate-500 text-[10px] flex items-center justify-center text-white font-bold">T</span>
                </div>
                {/* Palanca visual con botón de test */}
                <div className="w-16 h-10 my-2.5 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center shadow-inner">
                  <div className="w-8 h-6 bg-slate-200 rounded shadow group-hover:brightness-110 transition-transform" />
                </div>
                <div className="w-full">
                  <p className="text-base sm:text-lg font-black text-white font-mono">{diferencial.in_amp}A</p>
                  <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">{diferencial.sensibilidad || 30}mA</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onAssignDiferencial}
                className="w-28 sm:w-32 h-44 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-400 transition-all bg-slate-900/40 cursor-pointer"
              >
                <Plus size={24} />
                <span className="text-sm font-bold">Asignar</span>
              </button>
            )}
          </div>

          {/* Separador DIN */}
          <div className="w-[2px] bg-slate-700/80 my-2 self-stretch" />

          {/* 3. Circuitos Terminales (PIAs) */}
          <div className="flex items-center gap-3">
            {circuitos.map((circ, index) => {
              const p = circ.proteccion;
              const hasProt = Boolean(p);
              const isOverload = p && circ.iNominal > p.in_amp;
              const isOverMax = p && circ.maxAmp && p.in_amp > circ.maxAmp;

              return (
                <div key={circ.id} className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-wider mb-2.5 truncate max-w-[115px]">
                    C{index + 1}
                  </span>

                  {hasProt ? (
                    <div
                      onClick={() => onSelectCircuito && onSelectCircuito(circ.id)}
                      className={`w-28 sm:w-32 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-xl transition-all group ${
                        isOverload || isOverMax
                          ? 'border-red-500 hover:border-red-400 shadow-red-500/20'
                          : 'border-emerald-500/70 hover:border-emerald-400 shadow-emerald-500/10'
                      }`}
                      title={`${circ.nombre} - ${p!.modelo} (${p!.in_amp}A)`}
                    >
                      <div className="w-full flex justify-between items-center text-xs text-slate-300 font-mono font-bold">
                        <span>{p!.polos || 2}P</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          isOverload ? 'bg-red-950 text-red-300 border-red-700' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        }`}>
                          {isOverload ? 'ERR' : 'ON'}
                        </span>
                      </div>

                      {/* Palanca visual */}
                      <div className="w-16 h-10 my-2.5 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center shadow-inner">
                        <div className={`w-8 h-6 rounded shadow transition-transform ${
                          isOverload ? 'bg-red-500' : 'bg-slate-700 group-hover:bg-slate-600'
                        }`} />
                      </div>

                      <div className="w-full">
                        <p className="text-base sm:text-lg font-black text-white font-mono">
                          {p!.curva_disparo || 'C'}{p!.in_amp}
                        </p>
                        <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          Ib: {circ.iNominal.toFixed(1)}A
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectCircuito && onSelectCircuito(circ.id)}
                      className="w-28 sm:w-32 h-44 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 transition-all bg-slate-900/40 cursor-pointer"
                    >
                      <Plus size={24} />
                      <span className="text-sm font-bold">Asignar</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{circ.iNominal.toFixed(1)}A</span>
                    </button>
                  )}

                  <span className="text-xs sm:text-sm font-medium text-slate-200 mt-2 max-w-[115px] truncate text-center" title={circ.nombre}>
                    {circ.nombre}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
