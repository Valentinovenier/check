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
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Cabecera del gabinete */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <h4 className="text-white font-bold text-sm tracking-tight">Frente de Tablero (Riel DIN): {tableroNombre}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Ocupación:</span>
          <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {totalModulos} / {capacidadGabinete} Módulos DIN
          </span>
        </div>
      </div>

      {/* Riel metálico DIN */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border border-slate-800/90 rounded-xl p-4 overflow-x-auto shadow-inner">
        {/* Líneas simulando el riel metálico omega de fondo */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 bg-slate-800/40 border-y border-slate-700/50 -z-0 pointer-events-none" />

        <div className="relative z-10 flex items-stretch gap-2.5 min-w-max py-2">
          {/* 1. Interruptor General (Cabecera) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Cabecera</span>
            {cabecera ? (
              <div
                onClick={onAssignCabecera}
                className="w-20 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 border-blue-500/50 hover:border-blue-400 rounded-lg p-2 flex flex-col justify-between items-center text-center shadow-lg transition-all group"
                title={`${cabecera.modelo} - ${cabecera.in_amp}A`}
              >
                <div className="w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <span>{cabecera.polos}P</span>
                  <span className="text-emerald-400 font-bold">ON</span>
                </div>
                {/* Palanca visual */}
                <div className="w-10 h-7 my-2 bg-slate-950 border border-slate-700 rounded flex items-center justify-center shadow-inner">
                  <div className="w-5 h-4 bg-red-600 rounded-sm shadow-sm group-hover:brightness-110" />
                </div>
                <div>
                  <p className="text-xs font-black text-white font-mono">{cabecera.curva_disparo || 'C'}{cabecera.in_amp}</p>
                  <p className="text-[9px] text-slate-400 truncate max-w-[70px]">{cabecera.modelo}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onAssignCabecera}
                className="w-20 h-32 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-400 transition-all bg-slate-900/30"
              >
                <Plus size={18} />
                <span className="text-[10px] font-bold">Asignar</span>
              </button>
            )}
          </div>

          {/* Separador DIN */}
          <div className="w-[1px] bg-slate-700/60 my-2 self-stretch" />

          {/* 2. Interruptor Diferencial */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Diferencial</span>
            {diferencial ? (
              <div
                onClick={onAssignDiferencial}
                className="w-20 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 border-amber-500/50 hover:border-amber-400 rounded-lg p-2 flex flex-col justify-between items-center text-center shadow-lg transition-all group"
                title={`${diferencial.modelo} - ${diferencial.in_amp}A ${diferencial.sensibilidad || 30}mA`}
              >
                <div className="w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <span>{diferencial.polos}P</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500 text-[7px] flex items-center justify-center text-slate-300 font-bold">T</span>
                </div>
                {/* Palanca visual con botón de test */}
                <div className="w-10 h-7 my-2 bg-slate-950 border border-slate-700 rounded flex items-center justify-center shadow-inner">
                  <div className="w-5 h-4 bg-slate-200 rounded-sm shadow-sm group-hover:brightness-110" />
                </div>
                <div>
                  <p className="text-xs font-black text-white font-mono">{diferencial.in_amp}A</p>
                  <p className="text-[9px] text-amber-400 font-mono">{diferencial.sensibilidad || 30}mA</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onAssignDiferencial}
                className="w-20 h-32 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-400 transition-all bg-slate-900/30"
              >
                <Plus size={18} />
                <span className="text-[10px] font-bold">Asignar</span>
              </button>
            )}
          </div>

          {/* Separador DIN */}
          <div className="w-[1px] bg-slate-700/60 my-2 self-stretch" />

          {/* 3. Circuitos Terminales (PIAs) */}
          <div className="flex items-center gap-2">
            {circuitos.map((circ, index) => {
              const p = circ.proteccion;
              const hasProt = Boolean(p);
              const isOverload = p && circ.iNominal > p.in_amp;
              const isOverMax = p && circ.maxAmp && p.in_amp > circ.maxAmp;

              return (
                <div key={circ.id} className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 truncate max-w-[84px]">
                    C{index + 1}
                  </span>

                  {hasProt ? (
                    <div
                      onClick={() => onSelectCircuito && onSelectCircuito(circ.id)}
                      className={`w-20 bg-slate-900 hover:bg-slate-850 cursor-pointer border-2 rounded-lg p-2 flex flex-col justify-between items-center text-center shadow-lg transition-all group ${
                        isOverload || isOverMax
                          ? 'border-red-500/70 hover:border-red-400'
                          : 'border-emerald-500/40 hover:border-emerald-400'
                      }`}
                      title={`${circ.nombre} - ${p!.modelo} (${p!.in_amp}A)`}
                    >
                      <div className="w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>{p!.polos || 2}P</span>
                        <span className={`text-[8px] font-bold px-1 rounded ${
                          isOverload ? 'bg-red-950 text-red-400 border border-red-800' : 'text-emerald-400'
                        }`}>
                          {isOverload ? 'ERR' : 'ON'}
                        </span>
                      </div>

                      {/* Palanca visual */}
                      <div className="w-10 h-7 my-2 bg-slate-950 border border-slate-700 rounded flex items-center justify-center shadow-inner">
                        <div className={`w-5 h-4 rounded-sm shadow-sm group-hover:brightness-110 ${
                          isOverload ? 'bg-red-500' : 'bg-slate-700'
                        }`} />
                      </div>

                      <div className="w-full">
                        <p className="text-xs font-black text-white font-mono">
                          {p!.curva_disparo || 'C'}{p!.in_amp}
                        </p>
                        <p className="text-[9px] font-mono text-emerald-400">
                          Ib: {circ.iNominal.toFixed(1)}A
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectCircuito && onSelectCircuito(circ.id)}
                      className="w-20 h-32 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-emerald-400 transition-all bg-slate-900/30"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-bold">Asignar</span>
                      <span className="text-[9px] font-mono text-slate-500">{circ.iNominal.toFixed(1)}A</span>
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400 mt-1 max-w-[80px] truncate text-center" title={circ.nombre}>
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
