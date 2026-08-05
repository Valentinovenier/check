import React, { useState, useMemo } from 'react';
import { Project, Conductor } from '../types/project';
import { useProject } from '../context/ProjectDataContext';
import { ConductorForm } from './ConductorForm';
import { ConductorReportTable } from './ConductorReportTable';

export const ViviendaConductorCalculation = ({ project, onChange }: { project: Project; onChange: (p: Project) => void }) => {
  const tableros = project.datosVivienda?.tableros || [];
  const circuitos = project.datosVivienda?.circuitosCalculados || [];

  const [tableroOrigenId, setTableroOrigenId] = useState<string>('');
  const [tipoTramo, setTipoTramo] = useState<'general_salida' | 'salida_circuito' | 'salida_tablero'>('general_salida');
  const [destinoId, setDestinoId] = useState<string>('');

  const tableroOrigen = tableros.find(t => t.id === tableroOrigenId);

  // Circuitos de este tablero
  const circuitosDelTablero = useMemo(() => {
    if (!tableroOrigen) return [];
    return circuitos.filter(c => tableroOrigen.circuitosIds?.includes(c.id));
  }, [tableroOrigen, circuitos]);

  // Tableros hijos
  const tablerosHijos = useMemo(() => {
    if (!tableroOrigen) return [];
    return tableros.filter(t => t.tableroPadreId === tableroOrigen.id);
  }, [tableroOrigen, tableros]);

  // Manejo del estado del conductor actual que se está editando
  const [currentConductor, setCurrentConductor] = useState<Conductor>({
    tipo: 'Cable', material: 'Cobre', aislacion: 'PVC', longitud: 0
  });

  const getTramoKey = () => {
    if (!tableroOrigen) return '';
    if (tipoTramo === 'general_salida') return `${tableroOrigen.id}_general_salida`;
    if (tipoTramo === 'salida_circuito') return `${tableroOrigen.id}_circuito_${destinoId}`;
    if (tipoTramo === 'salida_tablero') return `${tableroOrigen.id}_tablero_${destinoId}`;
    return '';
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
        tipoViviendaTramo = 'LineaPrincipal'; // o dependiente
    } else if (tipoTramo === 'salida_circuito') {
        destinoNombre = circuitosDelTablero.find(c => c.id === destinoId)?.nombre || '';
        tipoViviendaTramo = 'CircuitoTerminal';
    } else if (tipoTramo === 'salida_tablero') {
        destinoNombre = tablerosHijos.find(t => t.id === destinoId)?.nombre || '';
        tipoViviendaTramo = 'LineaSeccional';
    }

    const conductorFinal: Conductor = {
        ...currentConductor,
        tipoTramo: tipoViviendaTramo,
        origenNombre,
        destinoNombre,
    } as any;

    const informe = [...(project.informeConductores || []), conductorFinal];

    onChange({ ...project, informeConductores: informe });
    alert('Conductor calculado y añadido al informe exitosamente.');
    };

    const handleDeleteInforme = (index: number) => {
    const informe = [...(project.informeConductores || [])];
    informe.splice(index, 1);
    onChange({ ...project, informeConductores: informe });
    };

    return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Cálculo de Conductores</h2>
      </div>

      {/* Flujo paso a paso */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">1. Configuración del Tramo y Método</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Tablero de Origen</label>
                <select
                    className="mt-1 bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 w-full"
                    value={tableroOrigenId}
                    onChange={e => {
                        setTableroOrigenId(e.target.value);
                        setDestinoId('');
                    }}
                >
                    <option value="">— Seleccionar Tablero —</option>
                    {tableros.map(t => (
                        <option key={t.id} value={t.id}>{t.tipo}: {t.nombre}</option>
                    ))}
                </select>
            </div>

            {tableroOrigenId && (
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Tramo a Calcular</label>
                    <select
                        className="mt-1 bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 w-full"
                        value={tipoTramo}
                        onChange={e => {
                            setTipoTramo(e.target.value as any);
                            setDestinoId('');
                        }}
                    >
                        <option value="general_salida">Int. General - Tramo al Tablero</option>
                        <option value="salida_circuito">Tramo al Circuito Terminal</option>
                        {tablerosHijos.length > 0 && (
                            <option value="salida_tablero">Tramo al Tablero Seccional/Sub-seccional</option>
                        )}
                    </select>
                </div>
            )}

            {tipoTramo === 'salida_circuito' && tableroOrigenId && (
                <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Circuito Terminal</label>
                    <select
                        className="mt-1 bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 w-full"
                        value={destinoId}
                        onChange={e => setDestinoId(e.target.value)}
                    >
                        <option value="">— Seleccionar Circuito —</option>
                        {circuitosDelTablero.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                        ))}
                    </select>
                </div>
            )}

            {tipoTramo === 'salida_tablero' && tableroOrigenId && (
                <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Tablero Destino</label>
                    <select
                        className="mt-1 bg-slate-950 text-white text-sm rounded-lg p-3 border border-slate-700 w-full"
                        value={destinoId}
                        onChange={e => setDestinoId(e.target.value)}
                    >
                        <option value="">— Seleccionar Tablero —</option>
                        {tablerosHijos.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </div>

      {(tableroOrigenId && (tipoTramo === 'general_salida' || destinoId)) && (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-slate-700 p-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">2. Configuración Técnica y Cálculo</h3>
            
            <ConductorForm
                label={`Configuración de Cable`}
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
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg font-bold transition-colors"
            >
                Agregar Cable al Informe
            </button>
        </div>
      )}

      <div className="pt-8">
        <h3 className="text-xl font-bold text-white mb-4">Informe de Conductores</h3>
        <ConductorReportTable project={project} onDelete={handleDeleteInforme} />
      </div>
    </div>
  );
};
