import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Zap, Pencil, Layout, ChevronDown, ChevronRight, Wand2, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { ProteccionesForm } from './ProteccionesForm';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectDataContext';
import { AsignacionProteccion } from './AsignacionProteccion';
import { ProteccionesRecomendadas } from './ProteccionesRecomendadas';
import { getTableroNominalCurrent, getCircuitoNominalCurrent } from '../engine/strategies/vivienda/corriente';
import { TableroRielDinView } from './TableroRielDinView';
import { useToast } from '../context/ToastContext';
import { ModalSeleccionProteccion } from './ModalSeleccionProteccion';
import { PROTECCIONES_CATALOGO_DEFAULT } from '../data/catalogoProteccionesDefault';
import { Proteccion } from '../types/project';

interface ModalTarget {
  tipo: 'cabecera' | 'diferencial' | 'circuito';
  tableroId: string;
  tableroNombre: string;
  circuitoId?: string;
  circuitoNombre?: string;
  currentProteccion?: Proteccion;
  minAmp?: number;
  maxAmp?: number;
  iccTablero?: number;
  tipoSugerido?: 'termica' | 'diferencial' | 'todas';
}

export const ProteccionesPage = () => {
  const { isAuthenticated } = useAuth();
  const { state: project, setState: setProject } = useProject();
  const { addToast } = useToast();
  const [protecciones, setProtecciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProteccion, setEditingProteccion] = useState<any>(null);
  const [expandedTableros, setExpandedTableros] = useState<Record<string, boolean>>({});
  const [vistaRielDin, setVistaRielDin] = useState<Record<string, boolean>>({});
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const toggleTablero = (id: string) => {
    setExpandedTableros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVista = (id: string) => {
    setVistaRielDin(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const datosVivienda = project?.datosVivienda;
  const tablerosVivienda = datosVivienda?.tableros || [];
  const circuitosVivienda = datosVivienda?.circuitosCalculados || [];

  // Catálogo unificado: Protecciones guardadas por el usuario + catálogo normativo por defecto
  const todasProteccionesDisponibles = useMemo(() => {
    const backendList = Array.isArray(protecciones) ? (protecciones as Proteccion[]) : [];
    const defaultsFiltrados = PROTECCIONES_CATALOGO_DEFAULT.filter(
      def => !backendList.some((b: any) => b.modelo === def.modelo || b.id === def.id)
    );
    return [...backendList, ...defaultsFiltrados];
  }, [protecciones]);

  const fetchProtecciones = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/guardar-proteccion', { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setProtecciones(data))
      .catch((err) => console.error('Error fetching protecciones:', err));
  };

  useEffect(() => {
    fetchProtecciones();
    // Expandir por defecto el primer tablero
    if (tablerosVivienda.length > 0 && Object.keys(expandedTableros).length === 0) {
      setExpandedTableros({ [tablerosVivienda[0].id]: true });
      setVistaRielDin({ [tablerosVivienda[0].id]: true });
    }
  }, [project]);

  if (!project) return <div className="text-white p-6">Por favor, selecciona un proyecto.</div>;

  const handleSave = async (data: any) => {
    const token = localStorage.getItem('token');
    const method = editingProteccion ? 'PUT' : 'POST';
    const payload = editingProteccion ? { ...data, id: editingProteccion.id } : data;
    await fetch('/api/guardar-proteccion', {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    setShowForm(false);
    setEditingProteccion(null);
    fetchProtecciones();
  };

  const handleDeleteProteccion = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/guardar-proteccion?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProtecciones();
  };

  const saveProject = async (updatedProject: any) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: updatedProject.id, name: updatedProject.name, data: updatedProject })
    });
  };

  const handleUpdateTablero = async (tableroId: string, updates: any) => {
    if (datosVivienda) {
        const nuevosTableros = tablerosVivienda.map((t: any) => t.id === tableroId ? { ...t, ...updates } : t);
        const newProject = { ...project, datosVivienda: { ...datosVivienda, tableros: nuevosTableros } };
        setProject(newProject);
        await saveProject(newProject);
    }
  };

  const handleUpdateCircuito = async (circuitoId: string, updates: any) => {
    if (datosVivienda) {
        const nuevosCircuitos = circuitosVivienda.map((c: any) => c.id === circuitoId ? { ...c, ...updates } : c);
        const newProject = { ...project, datosVivienda: { ...datosVivienda, circuitosCalculados: nuevosCircuitos } };
        setProject(newProject);
        await saveProject(newProject);
    }
  };

  // Mapeo normativo de calibres máximos
  const calibresMaximos: Record<string, number | undefined> = {
    'iluminacion_usos_generales': 16,
    'tomacorrientes_usos_generales': 20,
    'usos_especiales': 32,
    'alimentacion_mbtf': 20,
    'alimentacion_motores': 25,
  };

  // Asignación automática inteligente según AEA
  const handleAutoAsignarProtecciones = async () => {
    if (!datosVivienda || (todasProteccionesDisponibles || []).length === 0) {
      addToast ? addToast('No hay catálogo de protecciones disponible para auto-asignar.', 'error') : alert('No hay protecciones disponibles.');
      return;
    }

    let asignadosCount = 0;
    const nuevosCircuitos = circuitosVivienda.map((circ: any) => {
      const iNom = getCircuitoNominalCurrent(circ, project);
      const maxAmp = calibresMaximos[circ.tipo as string];

      // Filtrar interruptores automáticos disponibles
      const candidatos = (todasProteccionesDisponibles as any[]).filter(p => {
        const esAuto = p.tipo_proteccion?.toLowerCase().includes('autom') || p.tipo_proteccion?.toLowerCase().includes('termo') || p.tipo_proteccion?.toLowerCase().includes('pia');
        if (!esAuto) return false;
        if (p.in_amp < iNom) return false;
        if (maxAmp && p.in_amp > maxAmp) return false;
        return true;
      });

      // Ordenar por menor amperaje que cumpla (el más justo normalizado)
      candidatos.sort((a, b) => a.in_amp - b.in_amp);

      if (candidatos.length > 0) {
        asignadosCount++;
        return { ...circ, proteccion: candidatos[0] };
      }
      return circ;
    });

    // Asignar cabecera y diferencial en tableros si están vacíos
    const nuevosTableros = tablerosVivienda.map((tablero: any) => {
      const baseTablero = {
        ...tablero,
        circuitosTerminales: nuevosCircuitos.filter((c: any) => tablero.circuitosIds.includes(c.id)),
        proteccionesSalida: []
      };
      const corrienteTotal = getTableroNominalCurrent(baseTablero, project);

      let cabecera = tablero.proteccionCabecera;
      if (!cabecera) {
        const candidatosCab = (todasProteccionesDisponibles as any[])
          .filter(p => (p.tipo_proteccion?.toLowerCase().includes('autom') || p.tipo_proteccion?.toLowerCase().includes('termo')) && p.in_amp >= corrienteTotal)
          .sort((a, b) => a.in_amp - b.in_amp);
        if (candidatosCab.length > 0) cabecera = candidatosCab[0];
      }

      let dif = tablero.proteccionDiferencial;
      if (!dif) {
        const candidatosDif = (todasProteccionesDisponibles as any[])
          .filter(p => p.tipo_proteccion?.toLowerCase().includes('diferen') && p.in_amp >= corrienteTotal)
          .sort((a, b) => a.in_amp - b.in_amp);
        if (candidatosDif.length > 0) dif = candidatosDif[0];
      }

      return { ...tablero, proteccionCabecera: cabecera, proteccionDiferencial: dif };
    });

    const newProject = {
      ...project,
      datosVivienda: {
        ...datosVivienda,
        circuitosCalculados: nuevosCircuitos,
        tableros: nuevosTableros,
      }
    };

    setProject(newProject);
    await saveProject(newProject);
    if (addToast) {
      addToast(`¡Listo! Se auto-asignaron ${asignadosCount} protecciones normalizadas según AEA.`, 'success');
    } else {
      alert(`Se auto-asignaron ${asignadosCount} protecciones.`);
    }
  };

  const handleSelectProteccionFromModal = async (proteccionSeleccionada: Proteccion | undefined) => {
    if (!modalTarget) return;

    if (proteccionSeleccionada) {
      const isDif = (proteccionSeleccionada.tipo_proteccion || '').toLowerCase().includes('diferen');
      if (modalTarget.tipo === 'diferencial' && !isDif) {
        alert('Solo puedes asignar interruptores diferenciales a esta posición.');
        return;
      }
      if ((modalTarget.tipo === 'cabecera' || modalTarget.tipo === 'circuito') && isDif) {
        alert('Solo puedes asignar interruptores termomagnéticos/automáticos a esta posición.');
        return;
      }
    }

    if (modalTarget.tipo === 'cabecera') {
      await handleUpdateTablero(modalTarget.tableroId, { proteccionCabecera: proteccionSeleccionada });
      if (addToast) {
        addToast(
          proteccionSeleccionada 
            ? `Protección ${proteccionSeleccionada.modelo} agregada a cabecera de ${modalTarget.tableroNombre}`
            : `Protección de cabecera quitada de ${modalTarget.tableroNombre}`,
          'success'
        );
      }
    } else if (modalTarget.tipo === 'diferencial') {
      await handleUpdateTablero(modalTarget.tableroId, { proteccionDiferencial: proteccionSeleccionada });
      if (addToast) {
        addToast(
          proteccionSeleccionada 
            ? `Diferencial ${proteccionSeleccionada.modelo} agregado a ${modalTarget.tableroNombre}`
            : `Diferencial quitado de ${modalTarget.tableroNombre}`,
          'success'
        );
      }
    } else if (modalTarget.tipo === 'circuito' && modalTarget.circuitoId) {
      await handleUpdateCircuito(modalTarget.circuitoId, { proteccion: proteccionSeleccionada });
      if (addToast) {
        addToast(
          proteccionSeleccionada 
            ? `Protección ${proteccionSeleccionada.modelo} agregada a ${modalTarget.circuitoNombre}`
            : `Protección quitada de ${modalTarget.circuitoNombre}`,
          'success'
        );
      }
    }
    setModalTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado con título y botón de auto-asignación */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Zap className="text-[var(--accent)]" size={32} />
            Gestión de Protecciones por Tablero
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Asigna interruptores termomagnéticos y diferenciales para garantizar la protección según normativa (Ib ≤ In ≤ Iz e Icn ≥ Icc).
          </p>
        </div>

        <button
          onClick={handleAutoAsignarProtecciones}
          className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
          title="Dimensiona y asigna automáticamente protecciones comerciales a todos los circuitos según norma"
        >
          <Sparkles size={18} className="text-amber-300" />
          <span>Dimensionar Protecciones Automáticamente</span>
        </button>
      </div>

      {/* Resumen de corrientes nominales */}
      <div className="bg-slate-950/85 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-lg">
        {tablerosVivienda.map((tablero: any) => {
            const baseTablero = {
                ...tablero,
                circuitosTerminales: circuitosVivienda.filter((c: any) => tablero.circuitosIds.includes(c.id)),
                proteccionesSalida: []
            };
            const corrienteTotal = getTableroNominalCurrent(baseTablero, project);
            return (
                <div key={tablero.id} className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-white font-bold text-sm sm:text-base mb-1">{tablero.nombre}</p>
                      <p className="text-xs text-slate-400 font-medium">{baseTablero.circuitosTerminales.length} circuitos terminales</p>
                    </div>
                    <span className="text-emerald-400 font-mono font-black text-base sm:text-lg bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-800/80 shadow-inner">
                      {corrienteTotal.toFixed(2)} A
                    </span>
                </div>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tableros y Riel DIN */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">Tableros de la Instalación</h3>
            <span className="text-sm font-medium text-slate-300">{tablerosVivienda.length} tableros configurados</span>
          </div>

          {tablerosVivienda.map((tablero: any) => {
            const baseTablero = {
                ...tablero,
                circuitosTerminales: circuitosVivienda.filter((c: any) => tablero.circuitosIds.includes(c.id)),
                proteccionesSalida: []
            };
            const corrienteTotal = getTableroNominalCurrent(baseTablero, project);
            const circuitosFormateados = baseTablero.circuitosTerminales.map((c: any) => ({
              id: c.id,
              nombre: c.nombre,
              tipo: c.tipo,
              proteccion: c.proteccion,
              iNominal: getCircuitoNominalCurrent(c, project),
              maxAmp: calibresMaximos[c.tipo as string]
            }));
            const showRiel = vistaRielDin[tablero.id] !== false;
            
            return (
              <div key={tablero.id} className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-5">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleTablero(tablero.id)}>
                  <h4 className="text-white font-bold flex items-center gap-3 text-lg">
                    {expandedTableros[tablero.id] ? <ChevronDown size={22} className="text-blue-400" /> : <ChevronRight size={22} className="text-slate-400" />}
                    <Layout size={22} className="text-blue-400" /> 
                    <span>{tablero.nombre}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 shadow-sm">
                      I nominal: {corrienteTotal.toFixed(2)} A
                    </span>
                  </div>
                </div>
                
                {expandedTableros[tablero.id] && (
                  <div className="space-y-6 pt-3">
                    {/* Vista frente de tablero Riel DIN con interactividad para agregar protecciones */}
                    <TableroRielDinView 
                      tableroNombre={tablero.nombre}
                      cabecera={tablero.proteccionCabecera}
                      diferencial={tablero.proteccionDiferencial}
                      circuitos={circuitosFormateados}
                      onAssignCabecera={() => {
                        setModalTarget({
                          tipo: 'cabecera',
                          tableroId: tablero.id,
                          tableroNombre: tablero.nombre,
                          currentProteccion: tablero.proteccionCabecera,
                          minAmp: corrienteTotal,
                          iccTablero: tablero.Ik,
                          tipoSugerido: 'termica'
                        });
                      }}
                      onAssignDiferencial={() => {
                        setModalTarget({
                          tipo: 'diferencial',
                          tableroId: tablero.id,
                          tableroNombre: tablero.nombre,
                          currentProteccion: tablero.proteccionDiferencial,
                          minAmp: corrienteTotal,
                          tipoSugerido: 'diferencial'
                        });
                      }}
                      onSelectCircuito={(circuitoId) => {
                        const circ = baseTablero.circuitosTerminales.find((c: any) => c.id === circuitoId);
                        const iNom = circ ? getCircuitoNominalCurrent(circ, project) : undefined;
                        const maxA = circ ? calibresMaximos[circ.tipo as string] : undefined;
                        setModalTarget({
                          tipo: 'circuito',
                          tableroId: tablero.id,
                          tableroNombre: tablero.nombre,
                          circuitoId: circuitoId,
                          circuitoNombre: circ?.nombre || 'Circuito',
                          currentProteccion: circ?.proteccion,
                          minAmp: iNom,
                          maxAmp: maxA,
                          iccTablero: tablero.Ik,
                          tipoSugerido: 'termica'
                        });
                      }}
                      onOpenAgregarGeneral={() => {
                        const primerSinProt = baseTablero.circuitosTerminales.find((c: any) => !c.proteccion);
                        if (!tablero.proteccionCabecera) {
                          setModalTarget({
                            tipo: 'cabecera',
                            tableroId: tablero.id,
                            tableroNombre: tablero.nombre,
                            currentProteccion: undefined,
                            minAmp: corrienteTotal,
                            iccTablero: tablero.Ik,
                            tipoSugerido: 'termica'
                          });
                        } else if (!tablero.proteccionDiferencial) {
                          setModalTarget({
                            tipo: 'diferencial',
                            tableroId: tablero.id,
                            tableroNombre: tablero.nombre,
                            currentProteccion: undefined,
                            minAmp: corrienteTotal,
                            tipoSugerido: 'diferencial'
                          });
                        } else if (primerSinProt) {
                          const iNom = getCircuitoNominalCurrent(primerSinProt, project);
                          const maxA = calibresMaximos[primerSinProt.tipo as string];
                          setModalTarget({
                            tipo: 'circuito',
                            tableroId: tablero.id,
                            tableroNombre: tablero.nombre,
                            circuitoId: primerSinProt.id,
                            circuitoNombre: primerSinProt.nombre,
                            currentProteccion: undefined,
                            minAmp: iNom,
                            maxAmp: maxA,
                            iccTablero: tablero.Ik,
                            tipoSugerido: 'termica'
                          });
                        } else {
                          setModalTarget({
                            tipo: 'cabecera',
                            tableroId: tablero.id,
                            tableroNombre: tablero.nombre,
                            currentProteccion: tablero.proteccionCabecera,
                            minAmp: corrienteTotal,
                            iccTablero: tablero.Ik,
                            tipoSugerido: 'termica'
                          });
                        }
                      }}
                    />

                    {/* Asignación detallada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <AsignacionProteccion 
                          label="Protección General (Cabecera)"
                          proteccion={tablero.proteccionCabecera}
                          disponibles={todasProteccionesDisponibles.filter(p => !(p.tipo_proteccion || '').toLowerCase().includes('diferen'))}
                          onChange={(p) => handleUpdateTablero(tablero.id, { proteccionCabecera: p })}
                          iccTablero={tablero.Ik}
                          minAmp={corrienteTotal}
                        />
                        {tablero.proteccionCabecera && (
                            <div className="p-2.5 bg-emerald-950/40 rounded-xl text-xs sm:text-sm text-emerald-300 border border-emerald-800/80 font-medium">
                                Asignado: {tablero.proteccionCabecera.modelo} | {tablero.proteccionCabecera.in_amp}A | Icn: {tablero.proteccionCabecera.capacidades?.[0]?.icn_ka || 3}kA
                            </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <AsignacionProteccion 
                          label="Protección Diferencial"
                          proteccion={tablero.proteccionDiferencial}
                          disponibles={todasProteccionesDisponibles.filter(p => (p.tipo_proteccion || '').toLowerCase().includes('diferen'))}
                          onChange={(p) => handleUpdateTablero(tablero.id, { proteccionDiferencial: p })}
                          minAmp={corrienteTotal}
                        />
                        {tablero.proteccionDiferencial && (
                            <div className="p-2.5 bg-emerald-950/40 rounded-xl text-xs sm:text-sm text-emerald-300 border border-emerald-800/80 font-medium">
                                Asignado: {tablero.proteccionDiferencial.modelo} | {tablero.proteccionDiferencial.in_amp}A | Icn: {tablero.proteccionDiferencial.capacidades?.[0]?.icn_ka || 3}kA
                            </div>
                        )}
                      </div>

                      {/* Nuevas protecciones de salida - Lógica de Sincronización */}
                      {(() => {
                          const hijos = tablerosVivienda.filter(t => t.tableroPadreId === tablero.id);
                          
                          // Sincronizar: Asegurar que existan entradas en proteccionesSalida para cada hijo
                          const salidasActuales = tablero.proteccionesSalida || [];
                          const nuevasSalidas = hijos.map(hijo => {
                              const existente = salidasActuales.find((s: any) => s.tableroDestinoId === hijo.id);
                              return existente || { id: Date.now().toString() + hijo.id, tableroDestinoId: hijo.id, proteccion: undefined as any };
                          });

                          // Actualizar estado si cambió
                          if (JSON.stringify(salidasActuales) !== JSON.stringify(nuevasSalidas)) {
                              handleUpdateTablero(tablero.id, { proteccionesSalida: nuevasSalidas });
                              return null; // Forzar re-render en siguiente ciclo
                          }

                          return nuevasSalidas.map((ps: any, index: number) => {
                              const hijo = hijos.find(h => h.id === ps.tableroDestinoId);
                              return (
                                <div key={ps.id} className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-2">
                                   <p className="text-sm font-bold text-white">Tramo al: {hijo?.nombre || 'Desconocido'}</p>
                                   <AsignacionProteccion 
                                        label="Asignar Protección"
                                        proteccion={ps.proteccion}
                                        disponibles={todasProteccionesDisponibles.filter(p => !(p.tipo_proteccion || '').toLowerCase().includes('diferen'))}
                                        iccTablero={tablero.Ik}
                                        onChange={(p) => {
                                            const nuevasSalidas = [...(tablero.proteccionesSalida || [])];
                                            nuevasSalidas[index] = { ...ps, proteccion: p! };
                                            handleUpdateTablero(tablero.id, { proteccionesSalida: nuevasSalidas });
                                        }}
                                    />
                                </div>
                              );
                          });
                      })()}
                    </div>

                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">Circuitos Terminales:</h5>
                      {baseTablero.circuitosTerminales.map((circuito: any) => {
                        const iNominal = getCircuitoNominalCurrent(circuito, project);
                        const maxAmp = calibresMaximos[circuito.tipo as string];

                        return (
                          <div key={circuito.id} className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-base font-bold text-white">{circuito.nombre}</p>
                                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-700">
                                    Ib: {iNominal.toFixed(2)} A
                                </span>
                            </div>
                            <AsignacionProteccion 
                              label="Protección del Circuito"
                              proteccion={circuito.proteccion}
                              disponibles={todasProteccionesDisponibles.filter(p => !(p.tipo_proteccion || '').toLowerCase().includes('diferen'))}
                              onChange={(p) => handleUpdateCircuito(circuito.id, { proteccion: p })}
                              maxAmp={maxAmp}
                              minAmp={iNominal} // Validar que la protección sea >= Ib
                              iccTablero={tablero.Ik}
                            />
                            {circuito.proteccion && (
                                <div className="p-2.5 bg-emerald-950/40 rounded-xl text-xs sm:text-sm text-emerald-300 border border-emerald-800/80 font-medium">
                                    Asignado: {circuito.proteccion.modelo} - {circuito.proteccion.in_amp}A
                                </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Catálogo */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold text-white">Catálogo de Protecciones</h3>
             <button onClick={() => { setEditingProteccion(null); setShowForm(true); }} className="bg-[var(--accent)] hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-bold shadow-md cursor-pointer transition-all">
                <Plus size={16} /> Nueva
             </button>
          </div>
          
          {(protecciones || []).map((p: any) => (
            <div key={p.id} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-white font-bold text-base">{p.modelo}</p>
                <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5">{p.tipo_proteccion} | {p.in_amp}A</p>
              </div>
              <button onClick={() => { 
                console.log('DEBUG: Protección seleccionada para editar:', p);
                setEditingProteccion(p); 
                setShowForm(true); 
              }} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <Pencil size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <ProteccionesForm 
          onClose={() => { setShowForm(false); setEditingProteccion(null); }} 
          onSave={handleSave}
          onDelete={handleDeleteProteccion}
          initialData={editingProteccion} 
        />
      )}

      {modalTarget && (
        <ModalSeleccionProteccion 
          isOpen={Boolean(modalTarget)}
          onClose={() => setModalTarget(null)}
          title={
            modalTarget.tipo === 'cabecera'
              ? 'Seleccionar Protección General (Cabecera)'
              : modalTarget.tipo === 'diferencial'
              ? 'Seleccionar Interruptor Diferencial'
              : `Seleccionar Protección para ${modalTarget.circuitoNombre}`
          }
          subtitle={`Tablero: ${modalTarget.tableroNombre}`}
          protecciones={todasProteccionesDisponibles}
          currentProteccion={modalTarget.currentProteccion}
          onSelect={handleSelectProteccionFromModal}
          onCrearNueva={() => {
            setModalTarget(null);
            setEditingProteccion(null);
            setShowForm(true);
          }}
          minAmp={modalTarget.minAmp}
          maxAmp={modalTarget.maxAmp}
          iccTablero={modalTarget.iccTablero}
          tipoExclusivo={modalTarget.tipo === 'diferencial' ? 'diferencial' : 'termica'}
        />
      )}
    </div>
  );
};

