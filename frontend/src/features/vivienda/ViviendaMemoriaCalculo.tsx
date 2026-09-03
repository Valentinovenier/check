import { Project, Conductor } from '../../types/project';
import { DetalleCalculoConductor } from './DetalleCalculoConductor';
import { Calculator, Zap, Home, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { calcularDPMS } from '../../engine/strategies/vivienda/calculoPotencia';

export const ViviendaMemoriaCalculo = ({ project }: { project: Project }) => {
  const datosV = project.datosVivienda;
  const supCub = datosV?.superficieCubierta || 0;
  const supSemi = datosV?.superficieSemicubierta || 0;
  const supTotal = supCub + supSemi * 0.5;
  const grado = datosV?.gradoElectrificacion || (supTotal <= 60 ? 'Mínimo' : supTotal <= 130 ? 'Medio' : supTotal <= 200 ? 'Elevado' : 'Superior');
  const circuitos = datosV?.circuitosCalculados || [];
  const ambientes = datosV?.ambientes || [];
  
  // Agregar uso del motor de cálculo
  const valoresDPMS = datosV ? calcularDPMS(datosV) : { DPMS_Grado: 0, DPMS_Específicas: 0, cargaTotal: 0 };
  
  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const ibAlim = dpmsVA > 0 ? (dpmsVA / (project.tipoInstalacion === 'Trifásica' ? 380 * Math.sqrt(3) : 220)).toFixed(2) : '-';

  const [procedimientosAbiertos, setProcedimientosAbiertos] = useState<Record<string, boolean>>({
    proc1: true,
    proc2: true,
    proc3: true,
    proc4: true,
    proc5: true,
    proc6: true,
    proc7: true,
  });

  const toggleProc = (id: string) => {
    setProcedimientosAbiertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const obtenerConductor = (cId: string): Conductor | undefined => {
    const fromInforme = project.informeConductores?.find(
      (c: any) => c.destinoId === cId || c.tramoId === cId || (c as any).id === cId
    );
    if (fromInforme) return fromInforme;
    const conds = (project as any).conductores || {};
    for (const [key, val] of Object.entries(conds)) {
      if (key.includes(cId) || (val as any)?.destinoId === cId || (val as any)?.tramoId === cId) return val as Conductor;
    }
    return undefined;
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Memoria de Cálculo */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 flex justify-between items-center flex-wrap gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-emerald-400" size={24} />
            Memoria de Cálculo Paso a Paso (Toda la Aplicación)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Desglose analítico de procedimientos, fórmulas numéricas sustituidas y matrices de verificación AEA 90364.
          </p>
        </div>
        <div className="bg-emerald-950/60 border border-emerald-800/60 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] text-emerald-400 font-semibold uppercase block">DPMS Calculada</span>
          <span className="text-lg font-bold text-white">{dpmsVA.toFixed(0)} VA ({dpmsKW.toFixed(2)} kW)</span>
        </div>
      </div>

      {/* PROC 1: Superficie y Grado */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => toggleProc('proc1')}
          className="w-full flex justify-between items-center p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
            <Home size={16} /> Procedimiento 1: Superficie Computable y Grado de Electrificación
          </span>
          {procedimientosAbiertos.proc1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {procedimientosAbiertos.proc1 && (
          <div className="p-5 space-y-3 text-xs text-slate-300 bg-slate-950/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Superficie Cubierta</span>
                <span className="text-sm font-bold text-white">{supCub.toFixed(2)} m²</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Superficie Semicubierta (50%)</span>
                <span className="text-sm font-bold text-white">{supSemi.toFixed(2)} m² &times; 0.5 = {(supSemi * 0.5).toFixed(2)} m²</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Superficie Computable Total</span>
                <span className="text-sm font-bold text-emerald-400">{supTotal.toFixed(2)} m²</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1 font-mono">
              <p className="text-slate-200">
                <strong>Fórmula AEA 770.7.I:</strong> S<sub>total</sub> = S<sub>cubierta</sub> + 0.5 &times; S<sub>semicubierta</sub> = {supCub.toFixed(2)} + {(supSemi * 0.5).toFixed(2)} = <strong className="text-emerald-400">{supTotal.toFixed(2)} m²</strong>.
              </p>
              <p className="text-slate-400 text-[11px]">
                Resultado: Para S<sub>total</sub> = {supTotal.toFixed(2)} m² corresponde el Grado de Electrificación <strong className="text-emerald-400">{grado.toUpperCase()}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PROC 2: Ambientes y Bocas Mínimas */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => toggleProc('proc2')}
          className="w-full flex justify-between items-center p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
            <CheckCircle2 size={16} /> Procedimiento 2: Puntos Mínimos de Utilización y Bocas por Ambiente
          </span>
          {procedimientosAbiertos.proc2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {procedimientosAbiertos.proc2 && (
          <div className="p-5 space-y-3 text-xs bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                    <th className="p-2.5">Ambiente</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Superficie</th>
                    <th className="p-2.5">Bocas IUG</th>
                    <th className="p-2.5">Bocas TUG</th>
                    <th className="p-2.5">Bocas TUE</th>
                    <th className="p-2.5">Verificación Norma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ambientes.length > 0 ? ambientes.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-white">{a.nombre}</td>
                      <td className="p-2.5 text-slate-400">Residencial</td>
                      <td className="p-2.5 font-mono text-slate-300">{a.superficie ? `${a.superficie.toFixed(2)} m²` : '-'}</td>
                      <td className="p-2.5 font-mono text-emerald-400">{a.puntosIUG || 0}</td>
                      <td className="p-2.5 font-mono text-indigo-400">{a.puntosTUG || 0}</td>
                      <td className="p-2.5 font-mono text-amber-400">{a.puntosTUE || 0}</td>
                      <td className="p-2.5 font-semibold text-emerald-400">Cumple AEA 770.7.IV</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500 italic">No se han registrado ambientes individuales.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PROC 3 y 4: Potencia, DPMS y Corriente de Alimentación */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => toggleProc('proc3')}
          className="w-full flex justify-between items-center p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
            <Zap size={16} /> Procedimiento 3 y 4: Demanda de Potencia Máxima Simultánea y Corrientes de Alimentación
          </span>
          {procedimientosAbiertos.proc3 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {procedimientosAbiertos.proc3 && (
          <div className="p-5 space-y-4 text-xs text-slate-300 bg-slate-950/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Cálculo de DPMS por Cargas Generales</h4>
                <p className="text-slate-400">
                  Potencias unitarias asignadas: Bocas IUG = 60 VA (o 660 VA por cto), Bocas TUG = 2200 VA, Bocas TUE = 3300 VA.
                </p>
                <div className="pt-2 font-mono flex justify-between border-t border-slate-800 text-white">
                  <span>DPMS Total Instalación:</span>
                  <span className="font-bold text-emerald-400">{dpmsVA.toFixed(0)} VA ({dpmsKW.toFixed(2)} kW)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Corriente de Diseño de Alimentación (IB)</h4>
                <p className="font-mono text-slate-300">
                  I<sub>B</sub> = S / (U &times; cos φ) = {dpmsVA.toFixed(0)} VA / ({project.tipoInstalacion === 'Trifásica' ? '380 &times; &radic;3' : '220 V'} &times; {project.cosPhi || 0.85})
                </p>
                <div className="pt-2 font-mono flex justify-between border-t border-slate-800 text-white">
                  <span>Corriente de Alimentación IB:</span>
                  <span className="font-bold text-amber-400">{ibAlim} A</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROC 5: Resumen DPMS por Circuitos */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => toggleProc('proc5')}
          className="w-full flex justify-between items-center p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
            <Zap size={16} /> Procedimiento 5: Resumen de DPMS (Motor de Cálculo)
          </span>
          {procedimientosAbiertos.proc5 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {procedimientosAbiertos.proc5 && (
            <div className="p-5 bg-slate-950/40 text-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                                <th className="p-3">Categoría</th>
                                <th className="p-3">Potencia (VA)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                            <tr>
                                <td className="p-3">Grado Electrificación (AEA)</td>
                                <td className="p-3 font-mono">{valoresDPMS.DPMS_Grado.toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td className="p-3">Circuitos Específicos</td>
                                <td className="p-3 font-mono">{valoresDPMS.DPMS_Específicas.toFixed(0)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-800/50 font-bold text-white">
                            <tr>
                                <td className="p-3">Total DPMS</td>
                                <td className="p-3 text-emerald-400 font-mono">
                                    {valoresDPMS.cargaTotal.toFixed(0)} VA
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* PROC 6: Paso a Paso Detallado por Conductor/Circuito (8 Pasos) */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => toggleProc('proc6')}
          className="w-full flex justify-between items-center p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
            <Calculator size={16} /> Procedimiento 6: Verificación Paso a Paso por Conductor (Los 8 Pasos AEA 770)
          </span>
          {procedimientosAbiertos.proc6 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {procedimientosAbiertos.proc6 && (
          <div className="p-5 space-y-4 bg-slate-950/40">
            {circuitos.length > 0 ? circuitos.map((c, idx) => {
              const cond = obtenerConductor(c.id);
              return (
                <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-bold text-white text-sm">Circuito {idx + 1}: {c.nombre}</span>
                    <span className="bg-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-0.5 rounded border border-slate-700">
                      Tipo: {c.tipo.includes('iluminacion') ? 'IUG' : c.tipo.includes('especial') ? 'TUE' : 'TUG'}
                    </span>
                  </div>

                  <DetalleCalculoConductor resultado={cond?.resultadoCalculo} />
                </div>
              );
            }) : (
              <div className="text-center p-6 text-slate-500 italic">No hay circuitos terminales calculados para mostrar sus 8 pasos.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
