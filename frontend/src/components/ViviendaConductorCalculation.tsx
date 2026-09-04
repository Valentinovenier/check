import React, { useState, useMemo } from 'react';
import { Project, Conductor } from '../types/project';
import { useProject } from '../context/ProjectDataContext';
import { ConductorForm } from './ConductorForm';
import { ConductorReportTable } from './ConductorReportTable';
import { ConductorResultCard } from './ConductorResultCard';
import { Cable, Zap, CheckCircle2, Clock, Shield, Network, Layers, ArrowRight } from 'lucide-react';
import { getTableroNominalCurrent } from '../engine/strategies/vivienda/corriente';
import { obtenerProteccionAsignada } from '../engine/strategies/vivienda/helpers';

export const ViviendaConductorCalculation = ({ project, onChange }: { project: Project; onChange: (p: Project) => void }) => {
  const tableros = project.datosVivienda?.tableros || [];
  const circuitos = project.datosVivienda?.circuitosCalculados || [];

  const [tableroOrigenId, setTableroOrigenId] = useState<string>(tableros[0]?.id || '');
  const [tipoTramo, setTipoTramo] = useState<'general_salida' | 'salida_circuito' | 'salida_tablero'>('salida_circuito');
  const [destinoId, setDestinoId] = useState<string>(circuitos[0]?.id || '');

  const tableroOrigen = tableros.find(t => t.id === tableroOrigenId);

  // Tableros seccionales (aquellos alimentados desde otro tablero o definidos como seccionales)
  const tablerosSeccionales = useMemo(() => {
    if (tableros.length <= 1) return [];
    const tp = tableros.find(t => t.tipo === 'Principal') || tableros[0];
    return tableros.filter(t => t.id !== tp?.id || Boolean(t.tableroPadreId) || t.tipo === 'Seccional');
  }, [tableros]);

  // Circuitos de este tablero
  const circuitosDelTablero = useMemo(() => {
    if (!tableroOrigen) return circuitos;
    return circuitos.filter(c => tableroOrigen.circuitosIds?.includes(c.id));
  }, [tableroOrigen, circuitos]);

  // Tableros hijos
  const tablerosHijos = useMemo(() => {
    if (!tableroOrigen) return [];
    return tableros.filter(t => t.tableroPadreId === tableroOrigen.id);
  }, [tableroOrigen, tableros]);

  // Manejo del estado del conductor actual que se está editando
  const [currentConductor, setCurrentConductor] = useState<Conductor>(() => {
    const firstId = circuitos[0]?.id;
    const existing = firstId ? ((project as any).conductores?.[firstId] || project.informeConductores?.find((c: any) => c.destinoId === firstId || c.tramoId === firstId)) : null;
    if (existing) return existing;
    return {
      tipo: 'Cable', material: 'Cobre', aislacion: 'PVC', longitud: 15, caidaMaxPermitida: 3.0,
      tipoTramo: 'CircuitoTerminal', destinoId: firstId, tramoId: firstId,
      tipoCircuito: circuitos[0]?.tipo
    } as any;
  });

  const selectCircuitoDirecto = (circId: string) => {
    const tPadre = tableros.find(t => t.circuitosIds?.includes(circId)) || tableros[0];
    if (tPadre) setTableroOrigenId(tPadre.id);
    setTipoTramo('salida_circuito');
    setDestinoId(circId);

    const circ = circuitos.find(c => c.id === circId);
    const existing = (project as any).conductores?.[circId] || project.informeConductores?.find((c: any) => c.destinoId === circId || c.tramoId === circId);
    if (existing) {
      setCurrentConductor(existing);
    } else {
      setCurrentConductor({
        tipo: 'Cable',
        material: 'Cobre',
        aislacion: 'PVC',
        longitud: 15,
        caidaMaxPermitida: 3.0,
        tipoTramo: 'CircuitoTerminal',
        destinoId: circId,
        tramoId: circId,
        tipoCircuito: circ?.tipo
      } as any);
    }
  };

  const selectTramoSeccionalDirecto = (tableroHijo: any) => {
    const padre = tableros.find(t => t.id === tableroHijo.tableroPadreId) || tableros.find(t => t.tipo === 'Principal') || tableros[0];
    const padreId = padre ? padre.id : (tableros[0]?.id || '');
    setTableroOrigenId(padreId);
    setTipoTramo('salida_tablero');
    setDestinoId(tableroHijo.id);

    const existing = (project as any).conductores?.[tableroHijo.id] || project.informeConductores?.find((c: any) => c.destinoId === tableroHijo.id || c.tramoId === tableroHijo.id);
    if (existing) {
      setCurrentConductor(existing);
    } else {
      setCurrentConductor({
        tipo: 'Cable',
        material: 'Cobre',
        aislacion: 'PVC',
        longitud: 20,
        caidaMaxPermitida: 1.0,
        tipoTramo: 'LineaSeccional',
        destinoId: tableroHijo.id,
        tramoId: tableroHijo.id,
        normaCable: 'IRAM 2178',
        metodoInstalacion: 'B2',
      } as any);
    }
  };

  const handleCalcularYGuardar = () => {
    if (!tableroOrigen) return alert('Seleccione un tablero origen.');
    if (tipoTramo === 'salida_circuito' && !destinoId) return alert('Seleccione un circuito destino.');
    if (tipoTramo === 'salida_tablero' && !destinoId) return alert('Seleccione un tablero destino.');
    const res = currentConductor.resultadoCalculo;
    if (!res) return alert('Debe asignar las protecciones correspondientes en la sección "Protecciones" y completar los datos del tramo antes de agregar el conductor al informe.');

    // Preparamos los nombres para el informe
    let origenNombre = tableroOrigen.nombre;
    let destinoNombre = '';
    let tipoViviendaTramo: any = 'LineaSeccional';

    if (tipoTramo === 'general_salida') {
        destinoNombre = 'Tramo al ' + tableroOrigen.nombre;
        tipoViviendaTramo = 'LineaPrincipal';
    } else if (tipoTramo === 'salida_circuito') {
        destinoNombre = circuitos.find(c => c.id === destinoId)?.nombre || '';
        tipoViviendaTramo = 'CircuitoTerminal';
    } else if (tipoTramo === 'salida_tablero') {
        const destTab = tableros.find(t => t.id === destinoId);
        destinoNombre = destTab?.nombre ? `Alimentación ${destTab.nombre}` : 'Tablero Seccional';
        tipoViviendaTramo = 'LineaSeccional';
    }

    const conductorFinal: Conductor = {
        ...currentConductor,
        tipoTramo: tipoViviendaTramo,
        origenNombre,
        destinoNombre,
        tramoId: destinoId || tableroOrigenId,
        destinoId: destinoId || tableroOrigenId,
    } as any;

    const informe = [...(project.informeConductores || []), conductorFinal];
    const keyConductor = destinoId || tableroOrigenId;

    onChange({
        ...project,
        informeConductores: informe,
        conductores: {
            ...((project as any).conductores || {}),
            [keyConductor]: conductorFinal
        }
    });
    alert('Conductor calculado y añadido al informe exitosamente.');
  };

  const handleDeleteInforme = (index: number) => {
    const informe = [...(project.informeConductores || [])];
    const deleted = informe.splice(index, 1)[0];
    const key = (deleted as any)?.destinoId || (deleted as any)?.tramoId;
    const conductores = { ...((project as any).conductores || {}) };
    if (key && conductores[key]) {
        delete conductores[key];
    }
    onChange({ ...project, informeConductores: informe, conductores });
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <Cable className="text-[var(--accent)]" />
            Cálculo y Dimensionamiento de Conductores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona un circuito para dimensionar la sección comercial por corriente admisible y verificar la caída de tensión según AEA 90364-7-770.
          </p>
        </div>
      </div>

      {/* Tramos a Tableros Seccionales (Líneas Seccionales) */}
      {tablerosSeccionales.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={17} className="text-amber-400" />
              <span>Líneas Seccionales (Alimentación a Tableros Seccionales):</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{tablerosSeccionales.length} alimentadores seccionales</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tablerosSeccionales.map((tHijo) => {
              const isSelected = tipoTramo === 'salida_tablero' && destinoId === tHijo.id;
              const padre = tableros.find(t => t.id === tHijo.tableroPadreId) || tableros.find(t => t.tipo === 'Principal') || tableros[0];
              const enInforme = project.informeConductores?.find((inf: any) => inf.destinoId === tHijo.id || inf.tramoId === tHijo.id);
              const seccionCalculada = enInforme?.resultadoCalculo?.seccionRecomendada || enInforme?.seccion;
              const caidaCalc = enInforme?.resultadoCalculo?.porcentajeCaida ?? enInforme?.resultadoCalculo?.caidaTensionPorcentaje;
              
              // Corriente del tablero seccional
              const baseTableroHijo: any = {
                ...tHijo,
                circuitosTerminales: circuitos.filter(c => tHijo.circuitosIds?.includes(c.id)),
                proteccionesSalida: [],
                subTableros: []
              };
              const iNominal = getTableroNominalCurrent(baseTableroHijo, project);
              const prot = obtenerProteccionAsignada(project, { tipoTramo: 'LineaSeccional', destinoId: tHijo.id } as any, tHijo.id);

              return (
                <button
                  key={tHijo.id}
                  onClick={() => selectTramoSeccionalDirecto(tHijo)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        <span>{padre?.nombre || 'TP'}</span>
                        <ArrowRight size={14} className="text-amber-400 shrink-0" />
                        <span className="text-amber-300 font-extrabold">{tHijo.nombre}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Línea Seccional Alimentadora</p>
                    </div>

                    {/* Badge de estado */}
                    {seccionCalculada ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} /> {seccionCalculada} mm²
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock size={11} /> Pendiente
                      </span>
                    )}
                  </div>

                  {/* Subdatos: Térmica e Ib */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono pt-1 border-t border-slate-800/60 w-full">
                    <span className="flex items-center gap-1">
                      <Shield size={11} className="text-blue-400" />
                      {prot ? `${prot.in_amp}A` : 'Sin prot.'}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      Ib: {iNominal.toFixed(1)}A
                    </span>
                    {caidaCalc !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">ΔV: {caidaCalc.toFixed(1)}%</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cuadrícula interactiva de selección de circuitos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <span>Circuitos Terminales:</span>
          </h3>
          <span className="text-xs text-slate-400">{circuitos.length} circuitos en total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {circuitos.map((c) => {
            const isSelected = tipoTramo === 'salida_circuito' && destinoId === c.id;
            const enInforme = project.informeConductores?.find((inf: any) => inf.destinoId === c.id || inf.tramoId === c.id);
            const seccionCalculada = enInforme?.resultadoCalculo?.seccionRecomendada || enInforme?.seccion;
            const caidaCalc = enInforme?.resultadoCalculo?.porcentajeCaida;
            const canalizacionAsoc = project.canalizaciones?.find(can => can.circuitosIds.includes(c.id));

            return (
              <button
                key={c.id}
                onClick={() => selectCircuitoDirecto(c.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 w-full">
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {c.nombre}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{c.tipo?.replace(/_/g, ' ')}</p>
                  </div>

                  {/* Badge de estado */}
                  {seccionCalculada ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {seccionCalculada} mm²
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock size={11} /> Pendiente
                    </span>
                  )}
                </div>

                {/* Subdatos: Térmica y Canalización */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60 w-full">
                  <span className="flex items-center gap-1">
                    <Shield size={11} className="text-blue-400" />
                    {c.proteccion ? `${c.proteccion.in_amp}A` : 'Sin prot.'}
                  </span>
                  <span>•</span>
                  <span className="truncate flex items-center gap-1">
                    <Network size={11} className={canalizacionAsoc ? 'text-emerald-400' : 'text-slate-500'} />
                    {canalizacionAsoc ? canalizacionAsoc.nombre : 'Sin caño'}
                  </span>
                  {caidaCalc !== undefined && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">ΔV: {caidaCalc.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor y cálculo del conductor activo */}
      {(tableroOrigenId && (tipoTramo === 'general_salida' || destinoId)) && (
        <div className="space-y-6">
          {/* Tarjeta gráfica de resultados si ya está calculado */}
          {currentConductor?.resultadoCalculo && (() => {
            const res = currentConductor.resultadoCalculo as any;
            // Extraer Ib, In, Iz de los pasos de verificación
            const paso1 = res.pasosVerificacion?.find((p: any) => p.numero === 1);
            const paso2 = res.pasosVerificacion?.find((p: any) => p.numero === 2);
            const paso3 = res.pasosVerificacion?.find((p: any) => p.numero === 3);

            // Parsear valores numéricos desde la cadena del paso
            const parsearA = (txt: string = '') => {
              const m = txt.match(/([\d.]+)\s*A\b/);
              return m ? parseFloat(m[1]) : undefined;
            };
            const parsearIz = (txt: string = '') => {
              // "Iz = Iz_base * ... = XX.XX A"
              const m = txt.match(/=\s*([\d.]+)\s*A\s*$/);
              return m ? parseFloat(m[1]) : undefined;
            };
            const parsearIn = (txt: string = '') => {
              const m = txt.match(/In\s*=\s*([\d.]+)\s*A/);
              return m ? parseFloat(m[1]) : undefined;
            };

            const ib = parsearA(paso1?.valor);
            const iz = parsearIz(paso2?.valor);
            const inProt = parsearIn(paso3?.valor);

            return (
              <ConductorResultCard
                seccion={res.seccionRecomendada || res.cable?.seccion}
                caidaPorcentaje={res.caidaTensionPorcentaje ?? res.porcentajeCaida ?? 0}
                caidaMaxPermitida={currentConductor.caidaMaxPermitida || 3.0}
                iNominal={ib}
                iAdmisible={iz}
                iProteccion={inProt}
                norma={(currentConductor as any).normaCable || 'IRAM 2178'}
              />
            );
          })()}

          {/* Formulario de parámetros del conductor */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-slate-700/80 p-6 space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Zap size={18} className="text-blue-400" />
              <span>
                {tipoTramo === 'salida_tablero' 
                  ? `Parámetros de la Línea Seccional (Alimentación a ${tableros.find(t => t.id === destinoId)?.nombre || 'Tablero'})`
                  : tipoTramo === 'general_salida'
                  ? `Parámetros de la Línea Principal (Alimentación a ${tableroOrigen?.nombre || 'Tablero'})`
                  : `Parámetros del Circuito: ${circuitos.find(c => c.id === destinoId)?.nombre || 'Circuito'}`}
              </span>
            </h3>

            <ConductorForm
              label="Configuración de Cable"
              conductor={currentConductor}
              tramoId={destinoId || tableroOrigenId || 'int-general-salida'}
              onChange={c => {
                let updateC: any = { ...c };
                if (tipoTramo === 'salida_circuito') {
                  const tCirc = circuitosDelTablero.find(circ => circ.id === destinoId)?.tipo;
                  if (tCirc) updateC.tipoCircuito = tCirc;
                  updateC.tipoTramo = 'CircuitoTerminal';
                  updateC.destinoId = destinoId;
                } else if (tipoTramo === 'salida_tablero') {
                  updateC.tipoTramo = 'LineaSeccional';
                  updateC.destinoId = destinoId;
                } else {
                  updateC.tipoTramo = 'LineaPrincipal';
                  updateC.destinoId = tableroOrigenId;
                }
                setCurrentConductor(updateC);
              }}
            />

            <button
              onClick={handleCalcularYGuardar}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
            >
              Guardar Conductor en el Informe del Proyecto
            </button>
          </div>
        </div>
      )}

      {/* Tabla del informe de conductores */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Informe de Conductores del Proyecto</h3>
        <ConductorReportTable project={project} onDelete={handleDeleteInforme} />
      </div>
    </div>
  );
};

