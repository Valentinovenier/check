import { Project } from '../../types/project';
import { Ambiente, CircuitoCalculado, TipoCircuito, TomasCircuito } from '../../types/vivienda';
import { calcularPuntosMinimosAmbiente } from '../../engine/strategies/vivienda/normas770';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaAsignacion = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], tomasPorAmbiente: {} };
  
  const autocompletarMinimos = () => {
      const nuevosAmbientes = datos.ambientes.map(a => {
        if (a.nombre.toLowerCase().includes('otro')) return a;
        const pmu = calcularPuntosMinimosAmbiente(a.nombre, a.superficie, a.longitud);
        return { ...a, puntosIUG: pmu.iug, puntosTUG: pmu.tug };
      });
      onChange({ ...project, datosVivienda: { ...datos, ambientes: nuevosAmbientes } });
  };

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

                    const capacidadDisponible = Math.max(0, 12 - totalActualCircuito); 
                    const aAsignar = Math.min(puntosRestantes, capacidadDisponible);

                    if (aAsignar > 0) {
                        if (!nuevasTomas[ambiente.id]) nuevasTomas[ambiente.id] = {};
                        if (!nuevasTomas[ambiente.id][circuito.id]) nuevasTomas[ambiente.id][circuito.id] = { IUG: 0, TUG: 0, TUE: 0 };
                        
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

  const updateTomas = (ambienteId: string, circuitoId: string, tipo: 'IUG' | 'TUG' | 'TUE', valor: number) => {
      const ambiente = datos.ambientes.find(a => a.id === ambienteId);
      if (!ambiente) return;

      const limite = tipo === 'IUG' ? ambiente.puntosIUG : tipo === 'TUG' ? ambiente.puntosTUG : 999;
      
      // Calcular total asignado a otros circuitos para este mismo tipo y ambiente
      const tomasAmbiente = datos.tomasPorAmbiente?.[ambienteId] || {};
      const asignadoOtroCircuito = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
          if (cId !== circuitoId) return acc + (tomas[tipo] || 0);
          return acc;
      }, 0);
      
      const valorFinal = Math.min(valor, Math.max(0, limite - asignadoOtroCircuito));

      const nuevasTomas = { ...datos.tomasPorAmbiente };
      if (!nuevasTomas[ambienteId]) nuevasTomas[ambienteId] = {};
      if (!nuevasTomas[ambienteId][circuitoId]) nuevasTomas[ambienteId][circuitoId] = { IUG: 0, TUG: 0, TUE: 0 };
      nuevasTomas[ambienteId][circuitoId][tipo] = valorFinal;
      
      onChange({ ...project, datosVivienda: { ...datos, tomasPorAmbiente: nuevasTomas } });
  };

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-8">
      <div className="bg-slate-900 p-5 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Carga de Circuitos</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {datos.circuitosCalculados.map(c => {
                const tomasPorAmbiente = datos.tomasPorAmbiente || {};
                let totalTomas = Object.values(tomasPorAmbiente).reduce((acc: number, amb: Record<string, TomasCircuito>) => {
                    const tomas = amb[c.id];
                    if (!tomas) return acc;
                    return acc + (tomas.IUG || 0) + (tomas.TUG || 0) + (tomas.TUE || 0);
                }, 0);
                
                const superaLimite = totalTomas > 15;
                return (
                    <div key={c.id} className={`p-3 rounded border flex justify-between items-center ${superaLimite ? 'border-red-900 bg-red-950/30' : 'border-slate-700 bg-slate-950'}`}>
                        <div className="text-white text-xs font-bold truncate">{c.nombre}</div>
                        <div className={`text-xl font-black ${superaLimite ? 'text-red-500' : 'text-emerald-500'}`}>
                            {totalTomas}<span className="text-sm text-slate-500 font-normal">/15</span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

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

          return (
            <div key={ambiente.id} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => toggleExpandido(ambiente.id)} className="text-slate-400 hover:text-white">
                            {isExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        <h3 className="text-md font-semibold text-white">{ambiente.nombre}</h3>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold bg-slate-900 p-2 rounded border border-slate-800">
                        <span className={asignadoIUG >= ambiente.puntosIUG ? 'text-emerald-400' : 'text-amber-400'}>IUG: {asignadoIUG}/{ambiente.puntosIUG}</span>
                        <span className={asignadoTUG >= ambiente.puntosTUG ? 'text-emerald-400' : 'text-amber-400'}>TUG: {asignadoTUG}/{ambiente.puntosTUG}</span>
                        <span className={asignadoTUE >= ambiente.puntosTUE ? 'text-emerald-400' : 'text-amber-400'}>TUE: {asignadoTUE}/{ambiente.puntosTUE}</span>
                    </div>
                </div>
                
                {isExpandido && (
                <div className="col-span-2 space-y-3">
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
                    {datos.circuitosCalculados.filter(c => c.ambientesIds.includes(ambiente.id)).map(circuito => {
                        const tomasAsignadas = datos.tomasPorAmbiente?.[ambiente.id]?.[circuito.id] || { IUG: 0, TUG: 0, TUE: 0 };
                        
                        // Calcular total asignado a otros circuitos para este mismo tipo y ambiente
                        const tomasAmbiente = datos.tomasPorAmbiente?.[ambiente.id] || {};
                        const asignadoOtroCircuitoIUG = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
                            if (cId !== circuito.id) return acc + (tomas.IUG || 0);
                            return acc;
                        }, 0);
                        const asignadoOtroCircuitoTUG = Object.entries(tomasAmbiente).reduce((acc: number, [cId, tomas]: [string, TomasCircuito]) => {
                            if (cId !== circuito.id) return acc + (tomas.TUG || 0);
                            return acc;
                        }, 0);

                        const disabledIUG = (tomasAsignadas.IUG + asignadoOtroCircuitoIUG) >= ambiente.puntosIUG;
                        const disabledTUG = (tomasAsignadas.TUG + asignadoOtroCircuitoTUG) >= ambiente.puntosTUG;

                        return (
                            <div key={`input-${circuito.id}`} className="flex items-center gap-3 bg-black/20 p-2 rounded text-[10px]">
                                <span className="font-bold text-white w-20">{circuito.nombre}</span>
                                {circuito.tipo === 'iluminacion_usos_generales' && (
                                    <div className="flex items-center">
                                        <input type="number" placeholder="IUG" className="w-16 bg-slate-800 p-1 rounded text-center text-white" 
                                            value={tomasAsignadas.IUG}
                                            onChange={(e) => updateTomas(ambiente.id, circuito.id, 'IUG', Math.max(parseInt(e.target.value) || 0, 0))} />
                                        <button 
                                            className={`ml-1 rounded w-6 h-6 flex items-center justify-center font-bold ${disabledIUG ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'IUG', tomasAsignadas.IUG + 1)}
                                            disabled={disabledIUG}
                                        >+</button>
                                    </div>
                                )}
                                {(circuito.tipo === 'tomacorrientes_usos_generales') && (
                                    <div className="flex items-center">
                                        <input type="number" placeholder="TUG" className="w-16 bg-slate-800 p-1 rounded text-center text-white" 
                                            value={tomasAsignadas.TUG}
                                            onChange={(e) => updateTomas(ambiente.id, circuito.id, 'TUG', Math.max(parseInt(e.target.value) || 0, 0))} />
                                        <button 
                                            className={`ml-1 rounded w-6 h-6 flex items-center justify-center font-bold ${disabledTUG ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                            onClick={() => updateTomas(ambiente.id, circuito.id, 'TUG', tomasAsignadas.TUG + 1)}
                                            disabled={disabledTUG}
                                        >+</button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                )}
            </div>
        )})}
      </div>
    </div>
  );
};
