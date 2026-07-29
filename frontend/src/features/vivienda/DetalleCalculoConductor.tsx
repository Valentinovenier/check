import { ResultadoCalculoResidencial } from '../../types/vivienda';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
  resultado?: ResultadoCalculoResidencial;
}

export const DetalleCalculoConductor = ({ resultado }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Validación robusta: verificar existencia de los arrays antes de renderizar
  const pasos = resultado?.pasosVerificacion;
  const tienePasos = pasos && Array.isArray(pasos) && pasos.length > 0;
  
  if (!resultado || !tienePasos) {
    return null;
  }

  const advertencias = Array.isArray(resultado.advertencias) ? resultado.advertencias : [];

  return (
    <div className="mt-4 border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <span className="font-semibold text-sm text-white">Memoria de Cálculo AEA 770 (8 Pasos)</span>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">
          <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
             <p className="text-sm">
                <span className="text-slate-400">Sección recomendada: </span>
                <span className="font-bold text-[var(--accent)]">{resultado.seccionRecomendada} mm²</span>
             </p>
             {advertencias.map((adv, idx) => (
                <p key={idx} className="text-xs text-amber-400 mt-1">{adv}</p>
             ))}
          </div>

          <div className="space-y-2">
            {pasos.filter(paso => paso !== null && paso !== undefined).map((paso, idx) => (
              <div key={idx} className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-2 ${paso.cumple ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                        {paso.cumple ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-200">
                            Paso {paso.numero}: {paso.nombre}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Valor: <span className="text-slate-300 font-mono">
                                {paso.numero === 2 ? paso.valor.replace(/ \* F.Resist: 1.00/g, '') : paso.valor}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Condición</p>
                    <p className="text-xs font-mono text-slate-400">{paso.condicion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
