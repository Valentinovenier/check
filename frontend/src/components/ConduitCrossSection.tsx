import React from 'react';
import { Network, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  canalizacionNombre: string;
  cantidadCircuitos: number;
  norma?: string;
}

export const ConduitCrossSection: React.FC<Props> = ({
  canalizacionNombre,
  cantidadCircuitos,
  norma = 'IRAM 2178',
}) => {
  // Cantidad estimada de conductores: 2 activos + 1 PE por circuito monofásico
  const totalConductores = Math.max(0, cantidadCircuitos * 3);

  // Estimación visual del factor de llenado (35% máximo normativo AEA para > 3 conductores)
  // Cada circuito monofásico suele ocupar ~10-12% de un caño estándar de 3/4" (RS19 / RL20)
  const porcentajeLlenado = Math.min(100, Math.round(cantidadCircuitos * 11));
  const esLlenadoExcesivo = porcentajeLlenado > 35;
  const esLlenadoAlLimite = porcentajeLlenado > 30 && porcentajeLlenado <= 35;

  // Diámetro comercial recomendado según AEA
  let diametroSugerido = 'RS 19 (3/4") - Ø 19 mm';
  if (cantidadCircuitos === 2) diametroSugerido = 'RS 19 / RL 20 - Ø 20 mm';
  else if (cantidadCircuitos === 3) diametroSugerido = 'RL 22 - Ø 22 mm';
  else if (cantidadCircuitos > 3) diametroSugerido = 'RL 25 (1") - Ø 25 mm';

  // Generar posiciones para los círculos de cables dentro del caño (distribución polar concéntrica)
  const cables = Array.from({ length: totalConductores }).map((_, i) => {
    const angle = (i / Math.max(1, totalConductores)) * 2 * Math.PI;
    // Radio concéntrico dentro del caño (radio del caño = 42)
    const distance = totalConductores > 4 ? (i % 2 === 0 ? 18 : 28) : 18;
    const cx = 50 + distance * Math.cos(angle);
    const cy = 50 + distance * Math.sin(angle);

    // Tipos de conductor: 0=Fase (Marrón), 1=Neutro (Celeste), 2=Tierra (Verde)
    const tipoColor = i % 3;
    let colorFill = '#b45309'; // Fase (marrón ámbar)
    let strokeColor = '#d97706';
    if (tipoColor === 1) {
      colorFill = '#0284c7'; // Neutro (celeste)
      strokeColor = '#38bdf8';
    } else if (tipoColor === 2) {
      colorFill = '#15803d'; // Tierra (verde)
      strokeColor = '#4ade80';
    }

    return { cx, cy, colorFill, strokeColor, id: i };
  });

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
      {/* Gráfico SVG del corte transversal del caño */}
      <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Pared exterior del caño */}
          <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          {/* Pared interior del caño */}
          <circle cx="50" cy="50" r="42" fill="#020617" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

          {/* Conductores en su interior */}
          {cables.map(c => (
            <circle
              key={c.id}
              cx={c.cx}
              cy={c.cy}
              r={totalConductores > 6 ? 4.5 : 5.5}
              fill={c.colorFill}
              stroke={c.strokeColor}
              strokeWidth="1.2"
              className="transition-all duration-300"
            />
          ))}

          {/* Si está vacío */}
          {totalConductores === 0 && (
            <text x="50" y="53" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
              Vacío
            </text>
          )}
        </svg>

        {/* Badge flotante de porcentaje */}
        {totalConductores > 0 && (
          <span className={`absolute bottom-0 right-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
            esLlenadoExcesivo
              ? 'bg-red-950 text-red-300 border-red-800'
              : esLlenadoAlLimite
              ? 'bg-amber-950 text-amber-300 border-amber-800'
              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
          }`}>
            {porcentajeLlenado}%
          </span>
        )}
      </div>

      {/* Datos técnicos del corte */}
      <div className="flex-1 space-y-2 text-xs w-full">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Network size={14} className="text-blue-400" />
            Corte de Cañería
          </span>
          <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
            {norma}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Conductores</p>
            <p className="text-white font-bold">{totalConductores} cables ({cantidadCircuitos} circ.)</p>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase">Caño Comercial Sugerido</p>
            <p className="text-amber-400 font-bold truncate" title={diametroSugerido}>{diametroSugerido}</p>
          </div>
        </div>

        {/* Mensaje de estado de ocupación */}
        {totalConductores > 0 && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium p-1.5 rounded-lg border ${
            esLlenadoExcesivo
              ? 'bg-red-950/40 text-red-300 border-red-800/60'
              : esLlenadoAlLimite
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
              : 'bg-emerald-950/30 text-emerald-300 border-emerald-800/50'
          }`}>
            {esLlenadoExcesivo ? (
              <>
                <AlertTriangle size={13} className="shrink-0 text-red-400" />
                <span>Ocupación &gt; 35%. Recomendable usar cañería de mayor diámetro o dividir circuitos.</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                <span>Factor de llenado dentro del límite reglamentario AEA (≤ 35%).</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
