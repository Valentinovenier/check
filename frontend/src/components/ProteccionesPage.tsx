import React, { useState, useEffect } from 'react';
import { Plus, Zap, Pencil, Layout, ChevronDown, ChevronRight } from 'lucide-react';
import { ProteccionesForm } from './ProteccionesForm';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectDataContext';
import { AsignacionProteccion } from './AsignacionProteccion';
import { ProteccionesRecomendadas } from './ProteccionesRecomendadas';
import { getTableroNominalCurrent, getCircuitoNominalCurrent } from '../engine/strategies/vivienda/corriente';

export const ProteccionesPage = () => {
  const { isAuthenticated } = useAuth();
  const { state: project, setState: setProject } = useProject();
  const [protecciones, setProtecciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProteccion, setEditingProteccion] = useState<any>(null);
  const [expandedTableros, setExpandedTableros] = useState<Record<string, boolean>>({});

  const toggleTablero = (id: string) => {
    setExpandedTableros(prev => ({ ...prev, [id]: !prev[id] }));
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
    console.log('DEBUG: Full Project State:', project);
    console.log('DEBUG: Datos Vivienda:', datosVivienda);
    console.log('DEBUG: Tableros:', tablerosVivienda);
    console.log('DEBUG: Circuitos:', circuitosVivienda);
    fetchProtecciones();
  }, [project]);

  if (!project) return <div className="text-white p-6">Por favor, selecciona un proyecto.</div>;

  const handleSave = async (data: any) => {
    console.log('DEBUG: Payload enviado al backend:', data);
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Zap className="text-[var(--accent)]" />
        Gestión de Protecciones por Tablero
      </h2>
      
      {/* Resumen de corrientes nominales */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {tablerosVivienda.map((tablero: any) => {
            const baseTablero = {
                ...tablero,
                circuitosTerminales: circuitosVivienda.filter((c: any) => tablero.circuitosIds.includes(c.id)),
                proteccionesSalida: []
            };
            const corrienteTotal = getTableroNominalCurrent(baseTablero, project);
            return (
                <div key={tablero.id} className="text-xs">
                    <p className="text-slate-400 font-bold mb-1">{tablero.nombre}</p>
                    <p className="text-emerald-500 font-bold">{corrienteTotal.toFixed(2)} A</p>
                </div>
            )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Tableros</h3>
          {tablerosVivienda.map((tablero: any) => {
            const baseTablero = {
                ...tablero,
                circuitosTerminales: circuitosVivienda.filter((c: any) => tablero.circuitosIds.includes(c.id)),
                proteccionesSalida: []
            };
            const corrienteTotal = getTableroNominalCurrent(baseTablero, project);
            
            return (
              <div key={tablero.id} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleTablero(tablero.id)}>
                  <h4 className="text-white font-medium flex items-center gap-2">
                    {expandedTableros[tablero.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Layout size={16} /> {tablero.nombre}
                  </h4>
                  <span className="text-sm font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                    {corrienteTotal.toFixed(2)} A
                  </span>
                </div>
                
                {expandedTableros[tablero.id] && (
                  <>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <AsignacionProteccion 
                        label="Protección General (Cabecera)"
                        proteccion={tablero.proteccionCabecera}
                        disponibles={protecciones}
                        onChange={(p) => handleUpdateTablero(tablero.id, { proteccionCabecera: p })}
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
                  </>
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
              <button onClick={() => { setEditingProteccion(p); setShowForm(true); }} className="text-[var(--text-secondary)] hover:text-white">
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
