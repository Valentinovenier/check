import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { obtenerEnergiaPasanteInterruptor } from '../engine/strategies/protecciones/helpers';

export const ProteccionesForm = ({ onClose, onSave, onDelete, initialData }: { onClose: () => void, onSave: (data: any) => void, onDelete?: (id: string) => void, initialData?: any }) => {
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    capacidades: initialData.capacidades || [],
    tipo_interruptor: initialData.tipo_interruptor || 'compacto',
    energia_pasante: initialData.energia_pasante || null,
    sensibilidad: initialData.sensibilidad || 30,
  } : {
    marca_id: 1,
    modelo: '',
    tipo_proteccion: 'Interruptor Automatico',
    in_amp: 25,
    curva_disparo: 'C',
    polos: 2,
    specs_tecnicas: {},
    capacidades: [{ tension_v: 230, icn_ka: 3, clase_limitacion: 1 }],
    tipo_interruptor: 'compacto',
    energia_pasante: null,
    sensibilidad: 30,
  });

  const [saving, setSaving] = useState(false);

  const updateCapacidad = (index: number, field: string, value: number) => {
    const caps = [...formData.capacidades];
    caps[index] = { ...caps[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, capacidades: caps }));
  };

  const isCompacto = formData.in_amp <= 32;

  const computeEnergiaPasante = () => {
    if (formData.tipo_proteccion === 'Interruptor Diferencial') return null;
    if (isCompacto && formData.capacidades.length > 0) {
      const capacidad = formData.capacidades[0];
      // Solo clase 2 y 3 están soportadas por la función de cálculo
      if (capacidad.clase_limitacion === 2 || capacidad.clase_limitacion === 3) {
        // Solo curvas B y C están soportadas
        if (formData.curva_disparo === 'B' || formData.curva_disparo === 'C') {
          const energia = obtenerEnergiaPasanteInterruptor(
            formData.in_amp,
            capacidad.clase_limitacion as 2 | 3,
            formData.curva_disparo as 'B' | 'C'
          );
          return energia ?? null;
        }
      }
    }
    return formData.energia_pasante;
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
        onDelete(initialData.id);
        onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const energia = computeEnergiaPasante();
      const payload = { 
        ...formData, 
        energia_pasante: energia,
        tipo_interruptor: isCompacto ? 'compacto' : 'abierto'
      };
      await onSave(payload);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la proteccion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <h3 className="text-2xl font-bold text-white">{initialData ? 'Editar Proteccion' : 'Nueva Proteccion'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
          <label className="text-sm font-bold text-white mb-3 block">Seleccione el tipo de protección:</label>
          <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFormData((p: any) => ({ ...p, tipo_proteccion: 'Interruptor Automatico' }))}
                className={`p-3 rounded-lg border ${formData.tipo_proteccion === 'Interruptor Automatico' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                Interruptor Automático
              </button>
              <button 
                onClick={() => setFormData((p: any) => ({ ...p, tipo_proteccion: 'Interruptor Diferencial' }))}
                className={`p-3 rounded-lg border ${formData.tipo_proteccion === 'Interruptor Diferencial' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                Interruptor Diferencial
              </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Modelo</label>
            <input className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={formData.modelo} placeholder="Ej: iC60N" onChange={e => setFormData({ ...formData, modelo: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Corriente Nominal (In)</label>
            <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={formData.in_amp} onChange={e => setFormData({ ...formData, in_amp: Number(e.target.value) })}>
              {formData.tipo_proteccion === 'Interruptor Diferencial' ? (
                [25, 40, 63].map(val => (<option key={val} value={val}>{val} A</option>))
              ) : (
                [1,2,3,4,6,10,16,20,25,32,40,50,63].map(val => (<option key={val} value={val}>{val} A</option>))
              )}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Polos</label>
            <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={formData.polos} onChange={e => setFormData({ ...formData, polos: Number(e.target.value) })}>
              <option value={2}>2 Polos</option>
              <option value={4}>4 Polos</option>
            </select>
          </div>
          
          {formData.tipo_proteccion === 'Interruptor Automatico' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Curva</label>
              <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={formData.curva_disparo} onChange={e => setFormData({ ...formData, curva_disparo: e.target.value })}>
                <option value="B">Curva B</option>
                <option value="C">Curva C</option>
                <option value="D">Curva D</option>
              </select>
            </div>
          )}

          {formData.tipo_proteccion === 'Interruptor Diferencial' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Sensibilidad</label>
              <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={formData.sensibilidad} onChange={e => setFormData({ ...formData, sensibilidad: Number(e.target.value) })}>
                <option value={30}>30 mA</option>
                <option value={300}>300 mA</option>
              </select>
            </div>
          )}
        </div>
        
        {formData.tipo_proteccion === 'Interruptor Automatico' && (
          <div className="grid grid-cols-3 gap-6 mt-8">
            {formData.capacidades.map((cap: any, i: number) => (
              <React.Fragment key={i}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Ue (V)</label>
                  <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={cap.tension_v} onChange={e => updateCapacidad(i, 'tension_v', Number(e.target.value))}>
                    <option value={230}>230 V</option>
                    <option value={400}>400 V</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Icn (kA)</label>
                  <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={cap.icn_ka} onChange={e => updateCapacidad(i, 'icn_ka', Number(e.target.value))}>
                    <option value={3}>3 kA</option>
                    <option value={4.5}>4.5 kA</option>
                    <option value={6}>6 kA</option>
                    <option value={10}>10 kA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Clase Lim.</label>
                  <select className="w-full bg-[var(--bg-primary)] p-3 rounded-lg text-white border border-slate-700" value={cap.clase_limitacion} onChange={e => updateCapacidad(i, 'clase_limitacion', Number(e.target.value))}>
                    <option value={1}>Clase 1</option>
                    <option value={2}>Clase 2</option>
                    <option value={3}>Clase 3</option>
                  </select>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            {initialData && onDelete ? (
                <button onClick={handleDelete} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-4 py-2 rounded-lg hover:bg-red-900/20">
                    <Trash2 size={18} /> Eliminar Proteccion
                </button>
            ) : <div></div>}
            
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 text-white hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all">
                {saving ? 'Guardando...' : (initialData ? 'Actualizar Proteccion' : 'Guardar Proteccion')}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
