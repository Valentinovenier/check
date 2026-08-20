import { Project } from '../../types/project';
import { Ambiente, CircuitoCalculado, TomasCircuito } from '../../types/vivienda';
import { calcularPuntosMinimosAmbiente } from '../../engine/strategies/vivienda/normas770';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaAsignacion = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], tomasPorAmbiente: {} };
  
  if (!datos.tomasPorAmbiente) {
      datos.tomasPorAmbiente = {};
  }

  const [modoAutomatico, setModoAutomatico] = useState(false);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const toggleExpandido = (ambienteId: string) => {
      setExpandidos(prev => ({ ...prev, [ambienteId]: !prev[ambienteId] }));
  };

  useEffect(() => {
    if (modoAutomatico) {
        let nuevosCircuitos = [...datos.circuitosCalculados];
        let nuevasTomas = { ...datos.tomasPorAmbiente };

        datos.ambientes.forEach(ambiente => {
            nuevosCircuitos = nuevosCircuitos.map(circuito => {
                if (!circuito.ambientesIds.includes(ambiente.id)) {
                    const necesitaIUG = ambiente.puntosIUG > 0 && circuito.tipo === 'iluminacion_usos_generales';
                    const necesitaTUG = ambiente.puntosTUG > 0 && circuito.tipo === 'tomacorrientes_usos_generales';
                    
                    if (necesitaIUG || necesitaTUG) {
                        return { ...circuito, ambientesIds: [...circuito.ambientesIds, ambiente.id] };
                    }
                }
                return circuito;
            });

            const tiposTomas = ['IUG', 'TUG'] as const;
            tiposTomas.forEach(tipo => {
                const puntosTotales = ambiente[tipo === 'IUG' ? 'puntosIUG' : 'puntosTUG'] || 0;
                if (puntosTotales === 0) return;

                const circuitosTipo = nuevosCircuitos.filter(c => 
                    c.ambientesIds.includes(ambiente.id) && 
                    (tipo === 'IUG' ? c.tipo === 'iluminacion_usos_generales' : c.tipo === 'tomacorrientes_usos_generales')
                );

                let puntosRestantes = puntosTotales;
                
                circuitosTipo.forEach(circuito => {
                    if (puntosRestantes <= 0) return;

                    const totalActualCircuito = Object.values(nuevasTomas).reduce((acc, amb) => 
                        acc + (amb[circuito.id]?.[tipo] || 0), 0
                    );

                    const capacidadDisponible = Math.max(0, 15 - totalActualCircuito); 
                    const aAsignar = Math.min(puntosRestantes, capacidadDisponible);

                    if (aAsignar > 0) {
                        if (!nuevasTomas[ambiente.id]) nuevasTomas[ambiente.id] = {};
                        if (!nuevasTomas[ambiente.id][circuito.id]) nuevasTomas[ambiente.id][circuito.id] = { IUG: 0, TUG: 0, TUE: 0, bocas: 0 };
                        
                        nuevasTomas[ambiente.id][circuito.id][tipo] = aAsignar;
                        puntosRestantes -= aAsignar;
                    }
                });
            });
        });

        onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos, tomasPorAmbiente: nuevasTomas } });
        setModoAutomatico(false);
    }
  }, [modoAutomatico]);

  const toggleAmbienteEnCircuito = (ambiente: Ambiente, circuitoId: string) => {
    const nuevosCircuitos = datos.circuitosCalculados.map(c => {
      if (c.id === circuitoId) {
        const estaAsignado = c.ambientesIds.includes(ambiente.id);
        const nuevosAmbientes = estaAsignado 
            ? c.ambientesIds.filter(id => id !== ambiente.id)
            : [...c.ambientesIds, ambiente.id];
        return { ...c, ambientesIds: nuevosAmbientes };
      }
      return c;
    });

    onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos } });
  };

  const getCircuitoTotalTomas = (circuito: CircuitoCalculado): number => {
    const tomasPorAmbiente = datos.tomasPorAmbiente || {};
    return Object.values(tomasPorAmbiente).reduce((acc: number, amb: Record<string, TomasCircuito>) => {
        const tomas = amb[circuito.id];
        if (!tomas) return acc;
        if (circuito.tipo === 'iluminacion_usos_generales') return acc + (tomas.IUG || 0);
        if (circuito.tipo === 'tomacorrientes_usos_generales') return acc + (tomas.TUG || 0);
        if (circuito.tipo === 'usos_especiales') return acc + (tomas.TUE || 0);
        if (circuito.tipo === 'usos_especificos') return acc + (tomas.bocas !== undefined ? tomas.bocas : (tomas.TUE || 0));
        return acc + (tomas.IUG || 0) + (tomas.TUG || 0) + (tomas.TUE || 0) + (tomas.bocas || 0);
    }, 0);
  };

  const updateTomas = (ambienteId: string, circuitoId: string, tipo: 'IUG' | 'TUG' | 'TUE' | 'bocas', valor: number) => {
      const ambiente = datos.ambientes.find(a => a.id === ambienteId);
      if (!ambiente) return;

      const circuito = datos.circuitosCalculados.find(c => c.id === circuitoId);
      if (!circuito) return;

      let valorFinal = Math.max(0, valor);

      if (tipo === 'IUG') {
          const limite = ambiente.puntosIUG;
          const tomasAmbiente = datos.tomasPorAmbiente?.[ambienteId] || {};
          const asignadoOtroCircuito = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
              if (cId !== circuitoId) return acc + (tomas.IUG || 0);
              return acc;
          }, 0);
          valorFinal = Math.min(valorFinal, Math.max(0, limite - asignadoOtroCircuito));
      } else if (tipo === 'TUG') {
          const limite = ambiente.puntosTUG;
          const tomasAmbiente = datos.tomasPorAmbiente?.[ambienteId] || {};
          const asignadoOtroCircuito = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
              if (cId !== circuitoId) return acc + (tomas.TUG || 0);
              return acc;
          }, 0);
          valorFinal = Math.min(valorFinal, Math.max(0, limite - asignadoOtroCircuito));
      }

      const nuevasTomas = { ...datos.tomasPorAmbiente };
      if (!nuevasTomas[ambienteId]) nuevasTomas[ambienteId] = {};
      if (!nuevasTomas[ambienteId][circuitoId]) nuevasTomas[ambienteId][circuitoId] = { IUG: 0, TUG: 0, TUE: 0, bocas: 0 };
      nuevasTomas[ambienteId][circuitoId][tipo] = valorFinal;
      
      onChange({ ...project, datosVivienda: { ...datos, tomasPorAmbiente: nuevasTomas } });
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-8">
      {/* Barra superior de carga de circuitos */}
      <div className="bg-slate-900 p-5 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Carga de Circuitos</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {datos.circuitosCalculados.map(c => {
                const isCargaUnica = c.maximoBocas === 'N/A' || c.siglaEspecifica === 'ACU';
                
                if (isCargaUnica) {
                    const isAsignado = c.ambientesIds.length > 0;
                    return (
                        <div key={c.id} className={`p-3 rounded border flex justify-between items-center ${isAsignado ? 'border-slate-700 bg-slate-950' : 'border-amber-900/50 bg-amber-950/20'}`}>
                            <div>
                                <div className="text-white text-xs font-bold truncate">{c.nombre}</div>
                                <div className="text-[10px] text-slate-400">{c.potencia || 0} {c.unidadPotencia || 'VA'}</div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded ${isAsignado ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                                {isAsignado ? 'Asignado' : 'Sin asignar'}
                            </div>
                        </div>
                    );
                }

                const totalTomas = getCircuitoTotalTomas(c);
                const maxBocas = c.maximoBocas !== undefined ? c.maximoBocas : 15;
                const limiteNumerico = typeof maxBocas === 'number' ? maxBocas : (maxBocas === '12 por fase' ? 12 : 9999);
                const superaLimite = maxBocas !== 'Sin límite' && maxBocas !== 'N/A' && totalTomas > limiteNumerico;
                
                return (
                    <div key={c.id} className={`p-3 rounded border flex justify-between items-center ${superaLimite ? 'border-red-900 bg-red-950/30' : 'border-slate-700 bg-slate-950'}`}>
                        <div className="text-white text-xs font-bold truncate">{c.nombre}</div>
                        <div className={`text-xl font-black ${superaLimite ? 'text-red-500' : 'text-emerald-500'}`}>
                            {totalTomas}<span className="text-sm text-slate-500 font-normal">/{maxBocas === 'Sin límite' ? '∞' : (maxBocas === '12 por fase' ? '12/fase' : maxBocas)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Lista de Ambientes */}
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-slate-800 pb-2">
            <h2 className="text-xl font-bold text-white">Ambientes</h2>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Puntos de utilización</h3>
        </div>
        {datos.ambientes.map((ambiente) => {
            const tomasAmbiente = datos.tomasPorAmbiente?.[ambiente.id] || {};
            const asignadoIUG = Object.values(tomasAmbiente).reduce((acc: number, c: TomasCircuito) => acc + (c.IUG || 0), 0);
            const asignadoTUG = Object.values(tomasAmbiente).reduce((acc: number, c: TomasCircuito) => acc + (c.TUG || 0), 0);
            const asignadoTUE = Object.values(tomasAmbiente).reduce((acc: number, c: TomasCircuito) => acc + (c.TUE || 0), 0);
            const isExpandido = expandidos[ambiente.id];

            // Circuitos asignados a este ambiente
            const circuitosAsignados = datos.circuitosCalculados.filter(c => c.ambientesIds.includes(ambiente.id));

          return (
            <div key={ambiente.id} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => toggleExpandido(ambiente.id)} className="text-slate-400 hover:text-white">
                            {isExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        <h3 className="text-md font-semibold text-white">{ambiente.nombre}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold bg-slate-900 p-2 rounded border border-slate-800">
                        <span className={asignadoIUG >= ambiente.puntosIUG ? 'text-emerald-400' : 'text-amber-400'}>IUG: {asignadoIUG}/{ambiente.puntosIUG}</span>
                        <span className={asignadoTUG >= ambiente.puntosTUG ? 'text-emerald-400' : 'text-amber-400'}>TUG: {asignadoTUG}/{ambiente.puntosTUG}</span>
                        {asignadoTUE > 0 && <span className="text-cyan-400">TUE: {asignadoTUE}</span>}
                    </div>
                </div>
                
                {isExpandido && (
                <div className="col-span-2 space-y-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                        {datos.circuitosCalculados.map(circuito => {
                            const isSelected = circuito.ambientesIds.includes(ambiente.id);
                            return (
                                <button
                                    key={circuito.id}
                                    onClick={() => toggleAmbienteEnCircuito(ambiente, circuito.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                                        isSelected 
                                        ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                                >
                                    {circuito.nombre}
                                </button>
                            )
                        })}
                    </div>

                    <div className="space-y-2">
                    {circuitosAsignados.map(circuito => {
                        const tomasAsignadas = datos.tomasPorAmbiente?.[ambiente.id]?.[circuito.id] || { IUG: 0, TUG: 0, TUE: 0, bocas: 0 };
                        const totalCircuito = getCircuitoTotalTomas(circuito);
                        
                        const maxBocas = circuito.maximoBocas !== undefined ? circuito.maximoBocas : 15;
                        const limiteCircuito = typeof maxBocas === 'number' ? maxBocas : (maxBocas === '12 por fase' ? 12 : 9999);
                        const circuitoLleno = maxBocas !== 'Sin límite' && maxBocas !== 'N/A' && totalCircuito >= limiteCircuito;

                        // IUG / TUG limit checking
                        const tomasAmbiente = datos.tomasPorAmbiente?.[ambiente.id] || {};
                        const asignadoOtroCircuitoIUG = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
                            if (cId !== circuito.id) return acc + (tomas.IUG || 0);
                            return acc;
                        }, 0);
                        const asignadoOtroCircuitoTUG = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
                            if (cId !== circuito.id) return acc + (tomas.TUG || 0);
                            return acc;
                        }, 0);

                        const disabledIUG = (tomasAsignadas.IUG + asignadoOtroCircuitoIUG) >= ambiente.puntosIUG || circuitoLleno;
                        const disabledTUG = (tomasAsignadas.TUG + asignadoOtroCircuitoTUG) >= ambiente.puntosTUG || circuitoLleno;

                        const isCargaUnica = circuito.maximoBocas === 'N/A' || circuito.siglaEspecifica === 'ACU';

                        return (
                            <div key={`input-${circuito.id}`} className="flex items-center justify-between bg-black/20 p-2.5 rounded text-xs border border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{circuito.nombre}</span>
                                    <span className="text-[10px] text-slate-400 uppercase">
                                        ({circuito.siglaEspecifica || (circuito.tipo === 'iluminacion_usos_generales' ? 'IUG' : circuito.tipo === 'tomacorrientes_usos_generales' ? 'TUG' : circuito.tipo === 'usos_especiales' ? 'TUE' : 'ESP')})
                                    </span>
                                </div>

                                {isCargaUnica ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded">
                                        <Zap size={13} />
                                        <span>Carga Única ({circuito.potencia || 0} {circuito.unidadPotencia || 'VA'})</span>
                                    </div>
                                ) : circuito.tipo === 'iluminacion_usos_generales' ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">IUG</span>
                                            <button 
                                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                                onClick={() => updateTomas(ambiente.id, circuito.id, 'IUG', Math.max(0, tomasAsignadas.IUG - 1))}
                                            >-</button>
                                            <input type="number" className="w-12 bg-slate-800 p-1 rounded text-center text-white font-bold" 
                                                value={tomasAsignadas.IUG}
                                                onChange={(e) => updateTomas(ambiente.id, circuito.id, 'IUG', Math.max(parseInt(e.target.value) || 0, 0))} />
                                            <button 
                                                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${disabledIUG ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                                onClick={() => updateTomas(ambiente.id, circuito.id, 'IUG', tomasAsignadas.IUG + 1)}
                                                disabled={disabledIUG}
                                            >+</button>
                                        </div>
                                        {circuito.tieneTomacorrientesDerivados && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">TUG</span>
                                                <button 
                                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                                    onClick={() => updateTomas(ambiente.id, circuito.id, 'TUG', Math.max(0, tomasAsignadas.TUG - 1))}
                                                >-</button>
                                                <input type="number" className="w-12 bg-slate-800 p-1 rounded text-center text-white font-bold" 
                                                    value={tomasAsignadas.TUG || 0}
                                                    onChange={(e) => updateTomas(ambiente.id, circuito.id, 'TUG', Math.max(parseInt(e.target.value) || 0, 0))} />
                                                <button 
                                                    className={`w-6 h-6 rounded flex items-center justify-center font-bold ${disabledTUG ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                                    onClick={() => updateTomas(ambiente.id, circuito.id, 'TUG', (tomasAsignadas.TUG || 0) + 1)}
                                                    disabled={disabledTUG}
                                                >+</button>
                                            </div>
                                        )}
                                    </div>
                                ) : circuito.tipo === 'tomacorrientes_usos_generales' ? (
                                    <div className="flex items-center gap-1">
                                        <button 
                                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'TUG', Math.max(0, tomasAsignadas.TUG - 1))}
                                        >-</button>
                                        <input type="number" className="w-14 bg-slate-800 p-1 rounded text-center text-white font-bold" 
                                            value={tomasAsignadas.TUG}
                                            onChange={(e) => updateTomas(ambiente.id, circuito.id, 'TUG', Math.max(parseInt(e.target.value) || 0, 0))} />
                                        <button 
                                            className={`w-6 h-6 rounded flex items-center justify-center font-bold ${disabledTUG ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'TUG', tomasAsignadas.TUG + 1)}
                                            disabled={disabledTUG}
                                        >+</button>
                                    </div>
                                ) : circuito.tipo === 'usos_especiales' ? (
                                    <div className="flex items-center gap-1">
                                        <button 
                                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'TUE', Math.max(0, tomasAsignadas.TUE - 1))}
                                        >-</button>
                                        <input type="number" className="w-14 bg-slate-800 p-1 rounded text-center text-white font-bold" 
                                            value={tomasAsignadas.TUE}
                                            onChange={(e) => updateTomas(ambiente.id, circuito.id, 'TUE', Math.max(parseInt(e.target.value) || 0, 0))} />
                                        <button 
                                            className={`w-6 h-6 rounded flex items-center justify-center font-bold ${circuitoLleno ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'TUE', tomasAsignadas.TUE + 1)}
                                            disabled={circuitoLleno}
                                        >+</button>
                                    </div>
                                ) : (
                                    /* Circuito específico multi-boca (APM, MBTF, ATE, ITE, OCE, MBTS) */
                                    <div className="flex items-center gap-1">
                                        <button 
                                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'bocas', Math.max(0, (tomasAsignadas.bocas || 0) - 1))}
                                        >-</button>
                                        <input type="number" className="w-14 bg-slate-800 p-1 rounded text-center text-white font-bold" 
                                            value={tomasAsignadas.bocas || 0}
                                            onChange={(e) => updateTomas(ambiente.id, circuito.id, 'bocas', Math.max(parseInt(e.target.value) || 0, 0))} />
                                        <button 
                                            className={`w-6 h-6 rounded flex items-center justify-center font-bold ${circuitoLleno ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'bocas', (tomasAsignadas.bocas || 0) + 1)}
                                            disabled={circuitoLleno}
                                        >+</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    </div>
                </div>
                )}
            </div>
        )})}
      </div>
    </div>
  );
};

