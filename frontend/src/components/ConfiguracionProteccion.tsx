import React, { useState } from 'react';
import { Proteccion } from '../types/project';
import { ProteccionesForm } from './ProteccionesForm';
import { Plus, Trash2, Edit2, Shield } from 'lucide-react';

interface Props {
  proteccionesMaestras: Proteccion[]; // Lista maestra del proyecto
  proteccionCabeceraId?: string;
  proteccionesSalidaIds: string[];
  onChange: (data: { proteccionCabeceraId?: string; proteccionesSalidaIds: string[]; nuevaProteccion?: Proteccion }) => void;
  esSeccional?: boolean; // Para saber si la cabecera es opcional
}

export const ConfiguracionProteccion = ({ proteccionesMaestras, proteccionCabeceraId, proteccionesSalidaIds, onChange, esSeccional = false }: Props) => {
  const [editingProteccion, setEditingProteccion] = useState<{tipo: 'cabecera' | 'salida', index?: number, data?: Proteccion} | null>(null);

  // Helper para buscar protección
  const getProteccion = (id?: string) => proteccionesMaestras.find(p => p.id === id);

  const handleSave = (proteccion: Proteccion) => {
    // Comunicamos la nueva protección al padre para que la actualice en la lista maestra
    // y también actualizamos las referencias (IDs)
    if (editingProteccion?.tipo === 'cabecera') {
      onChange({ 
        proteccionCabeceraId: proteccion.id, 
        proteccionesSalidaIds: proteccionesSalidaIds,
        nuevaProteccion: proteccion // Pasamos el objeto completo para actualizar la lista maestra
      });
    } else {
      if (editingProteccion?.index !== undefined) {
        const nuevas = [...proteccionesSalidaIds];
        nuevas[editingProteccion.index] = proteccion.id;
        onChange({ 
          proteccionCabeceraId, 
          proteccionesSalidaIds: nuevas,
          nuevaProteccion: proteccion 
        });
      } else {
        onChange({ 
          proteccionCabeceraId, 
          proteccionesSalidaIds: [...proteccionesSalidaIds, proteccion.id],
          nuevaProteccion: proteccion 
        });
      }
    }
    setEditingProteccion(null);
  };

  const eliminarSalida = (index: number) => {
    const nuevas = proteccionesSalidaIds.filter((_, i) => i !== index);
    onChange({ proteccionCabeceraId, proteccionesSalidaIds: nuevas });
  };

  const cabecera = getProteccion(proteccionCabeceraId);
  const salidas = proteccionesSalidaIds.map(id => getProteccion(id)).filter(p => !!p) as Proteccion[];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-slate-700">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Shield size={16} /> Protección Cabecera
        </h4>
        {cabecera ? (
          <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-sm text-white">{cabecera.modelo} - {cabecera.in_amp}A</span>
            <button onClick={() => setEditingProteccion({tipo: 'cabecera', data: cabecera})} className="text-blue-400"><Edit2 size={16} /></button>
          </div>
        ) : (
            <button onClick={() => setEditingProteccion({tipo: 'cabecera'})} className="text-sm text-[var(--accent)]">+ Configurar Cabecera</button>
        )}
      </div>

      {/* Salidas */}
      <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-slate-700">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Shield size={16} /> Protecciones por Salida
        </h4>
        <div className="space-y-2">
            {salidas.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-sm text-white">{p.modelo} - {p.in_amp}A</span>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingProteccion({tipo: 'salida', index: i, data: p})} className="text-blue-400"><Edit2 size={16} /></button>
                        <button onClick={() => eliminarSalida(i)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={() => setEditingProteccion({tipo: 'salida'})} className="mt-3 text-sm text-[var(--accent)]">+ Agregar Salida</button>
      </div>

      {/* Modal Form */}
      {editingProteccion && (
        <ProteccionesForm 
            onClose={() => setEditingProteccion(null)}
            onSave={handleSave}
            initialData={editingProteccion.data}
        />
      )}
    </div>
  );
};
