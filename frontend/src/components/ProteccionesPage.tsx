import React, { useState, useEffect } from 'react';
import { Plus, Zap, Pencil, Layout, ChevronDown, ChevronRight, Wand2, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { ProteccionesForm } from './ProteccionesForm';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectDataContext';
import { AsignacionProteccion } from './AsignacionProteccion';
import { ProteccionesRecomendadas } from './ProteccionesRecomendadas';
import { getTableroNominalCurrent, getCircuitoNominalCurrent } from '../engine/strategies/vivienda/corriente';
import { TableroRielDinView } from './TableroRielDinView';
import { useToast } from '../context/ToastContext';

export const ProteccionesPage = () => {
  const { isAuthenticated } = useAuth();
  const { state: project, setState: setProject } = useProject();
  const { addToast } = useToast();
  const [protecciones, setProtecciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProteccion, setEditingProteccion] = useState<any>(null);
  const [expandedTableros, setExpandedTableros] = useState<Record<string, boolean>>({});
  const [vistaRielDin, setVistaRielDin] = useState<Record<string, boolean>>({});

  const toggleTablero = (id: string) => {
    setExpandedTableros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVista = (id: string) => {
    setVistaRielDin(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const datosVivienda = project?.datosVivienda;
  const tablerosVivienda = datosVivienda?.tableros || [];
  const circuitosVivienda = datosVivienda?.circuitosCalculados || [];

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
    if (!datosVivienda || (protecciones || []).length === 0) {
      addToast ? addToast('No hay catálogo de protecciones disponible para auto-asignar.', 'error') : alert('No hay protecciones disponibles.');
      return;
    }

    let asignadosCount = 0;
    const nuevosCircuitos = circuitosVivienda.map((circ: any) => {
      const iNom = getCircuitoNominalCurrent(circ, project);
      const maxAmp = calibresMaximos[circ.tipo as string];

      // Filtrar interruptores automáticos disponibles
      const candidatos = (protecciones as any[]).filter(p => {
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
        const candidatosCab = (protecciones as any[])
          .filter(p => p.tipo_proteccion?.toLowerCase().includes('autom') && p.in_amp >= corrienteTotal)
          .sort((a, b) => a.in_amp - b.in_amp);
        if (candidatosCab.length > 0) cabecera = candidatosCab[0];
      }

      let dif = tablero.proteccionDiferencial;
      if (!dif) {
        const candidatosDif = (protecciones as any[])
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

  return (
    <div className="space-y-6">
      {/* Encabezado con título y botón de auto-asignación */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <Zap className="text-[var(--accent)]" />
            Gestión de Protecciones por Tablero
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Asigna interruptores termomagnéticos y diferenciales para garantizar la protección según normativa (Ib ≤ In ≤ Iz e Icn ≥ Icc).
          </p>
        </div>

        <button
          onClick={handleAutoAsignarProtecciones}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          title="Dimensiona y asigna automáticamente protecciones comerciales a todos los circuitos según norma"
        >
          <Sparkles size={16} className="text-amber-300" />
          <span>Dimensionar Protecciones Automáticamente</span>
        </button>
      </div>

      {/* Resumen de corrientes nominales */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        {tablerosVivienda.map((tablero: any) => {
            const baseTablero = {
                ...tablero,
                circuitosTerminales: circuitosVivienda.filter((c: any) => tablero.circuitosIds.includes(c.id)),
                proteccionesSalida: []
            };
            const corrienteTotal = getTableroNominalCurrent(baseTablero, project);
            return (
                <div key={tablero.id} className="text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">{tablero.nombre}</p>
                      <p className="text-[11px] text-slate-500">{baseTablero.circuitosTerminales.length} circuitos terminales</p>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-900/60">
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
            <h3 className="text-lg font-semibold text-white tracking-tight">Tableros de la Instalación</h3>
            <span className="text-xs text-slate-400">{tablerosVivienda.length} tableros configurados</span>
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
              <div key={tablero.id} className="bg-[var(--bg-secondary)] p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleTablero(tablero.id)}>
                  <h4 className="text-white font-bold flex items-center gap-2.5 text-base">
                    {expandedTableros[tablero.id] ? <ChevronDown size={18} className="text-blue-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <Layout size={18} className="text-blue-400" /> 
                    <span>{tablero.nombre}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-900">
                      I nominal: {corrienteTotal.toFixed(2)} A
                    </span>
                  </div>
                </div>
                
                {expandedTableros[tablero.id] && (
                  <div className="space-y-5 pt-2">
                    {/* Vista frente de tablero Riel DIN */}
                    <TableroRielDinView 
                      tableroNombre={tablero.nombre}
                      cabecera={tablero.proteccionCabecera}
                      diferencial={tablero.proteccionDiferencial}
                      circuitos={circuitosFormateados}
                    />

                    {/* Asignación detallada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <AsignacionProteccion 
                        label="Protección General (Cabecera)"
                        proteccion={tablero.proteccionCabecera}
                        disponibles={protecciones}
                        onChange={(p) => handleUpdateTablero(tablero.id, { proteccionCabecera: p })}
                        iccTablero={tablero.Ik}
                        minAmp={corrienteTotal}
                      />
                      {tablero.proteccionCabecera && (
                          <div className="p-2 bg-emerald-900/30 rounded text-xs text-emerald-400 border border-emerald-800">
                              Asignado: {tablero.proteccionCabecera.modelo} | {tablero.proteccionCabecera.in_amp}A | Icn: {tablero.proteccionCabecera.capacidades?.[0]?.icn_ka || 3}kA
                          </div>
                      )}
                      
                      <AsignacionProteccion 
                        label="Protección Diferencial"
                        proteccion={tablero.proteccionDiferencial}
                        disponibles={protecciones}
                        onChange={(p) => handleUpdateTablero(tablero.id, { proteccionDiferencial: p })}
                        minAmp={corrienteTotal}
                      />
                      {tablero.proteccionDiferencial && (
                          <div className="p-2 bg-emerald-900/30 rounded text-xs text-emerald-400 border border-emerald-800">
                              Asignado: {tablero.proteccionDiferencial.modelo} | {tablero.proteccionDiferencial.in_amp}A | Icn: {tablero.proteccionDiferencial.capacidades?.[0]?.icn_ka || 3}kA
                          </div>
                      )}

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
                                <div key={ps.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                   <p className="text-sm text-white">Tramo al: {hijo?.nombre || 'Desconocido'}</p>
                                   <AsignacionProteccion 
                                        label="Asignar Protección"
                                        proteccion={ps.proteccion}
                                        disponibles={protecciones}
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

                    <div className="space-y-3">
                      {baseTablero.circuitosTerminales.map((circuito: any) => {
                        const iNominal = getCircuitoNominalCurrent(circuito, project);
                        
                        // Mapeo de tipos de circuitos a calibres máximos (Amperes)
                        // Ajustado según normativa AEA para circuitos de uso general, especial y específicos.
                        const calibresMaximos: Record<string, number | undefined> = {
                            'iluminacion_usos_generales': 16,
                            'tomacorrientes_usos_generales': 20,
                            'usos_especiales': 32,
                            'alimentacion_mbtf': 20, // MBTF
                            'alimentacion_motores': 25, // APM
                            // Otros circuitos específicos son responsabilidad del proyectista (sin restricción automática)
                        };
                        const maxAmp = calibresMaximos[circuito.tipo as string];

                        return (
                          <div key={circuito.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-white">{circuito.nombre}</p>
                                <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                                    {iNominal.toFixed(2)} A
                                </span>
                            </div>
                            <AsignacionProteccion 
                              label="Asignar Protección"
                              proteccion={circuito.proteccion}
                              disponibles={protecciones}
                              onChange={(p) => handleUpdateCircuito(circuito.id, { proteccion: p })}
                              maxAmp={maxAmp}
                              minAmp={iNominal} // Validar que la protección sea >= Ib
                              iccTablero={tablero.Ik}
                            />
                            {circuito.proteccion && (
                                <div className="mt-2 p-2 bg-emerald-900/30 rounded text-xs text-emerald-400 border border-emerald-800">
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
             <h3 className="text-lg font-semibold text-white">Catálogo de Protecciones</h3>
             <button onClick={() => { setEditingProteccion(null); setShowForm(true); }} className="bg-[var(--accent)] text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                <Plus size={14} /> Nueva
             </button>
          </div>
          
          {(protecciones || []).map((p: any) => (
            <div key={p.id} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-white text-sm">{p.modelo}</p>
                <p className="text-[var(--text-secondary)] text-xs">{p.tipo_proteccion} | {p.in_amp}A</p>
              </div>
              <button onClick={() => { 
                console.log('DEBUG: Protección seleccionada para editar:', p);
                setEditingProteccion(p); 
                setShowForm(true); 
              }} className="text-[var(--text-secondary)] hover:text-white">
                <Pencil size={16} />
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
    </div>
  );
};
