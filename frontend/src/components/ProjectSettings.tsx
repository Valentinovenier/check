import { useState } from 'react';
import { Project, TableroSeccional, Proteccion, Canalizacion } from '../types/project';
import { Trash2, Plus } from 'lucide-react';
import { IndustrialSettings } from '../features/industrial/IndustrialSettings';
import { ViviendaWorkflow } from '../features/vivienda/ViviendaWorkflow';
import { ComercialSettings } from '../features/comercial/ComercialSettings';

export const ProjectSettings = ({ project, onChange, onSave, onDelete }: { project: Project, onChange: (p: Project) => void, onSave: (p: Project) => void, onDelete: () => void }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          data: project
        })
      });

      if (response.ok) {
        onSave(project);
        alert('Proyecto guardado exitosamente');
      } else {
        alert('Error al guardar el proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const renderSettings = () => {
    switch (project.projectType) {
        case 'Industria':
        case 'i': 
            return <IndustrialSettings project={project} onChange={onChange} />;
        case 'Vivienda': 
            return <ViviendaWorkflow project={project} onChange={onChange} onSave={handleSave} />;
        case 'Oficina': 
            return <ComercialSettings project={project} onChange={onChange} />;
        default: return null;
    }
  }

  return (
    <div className="space-y-8 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Parametros: {project.name}</h2>
        <div className="flex items-center gap-4">
            {project.projectType !== 'Vivienda' && (
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-[var(--accent)] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            )}
        </div>
      </div>
      
      {project.projectType !== 'Vivienda' && (
        <section className="bg-[var(--bg-primary)] p-4 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Canalizaciones</h3>
            <div className="space-y-2">
                {(project.canalizaciones || []).map((can: Canalizacion) => (
                    <div key={can.id} className="flex gap-2 items-center">
                        <input 
                            className="bg-[var(--bg-secondary)] p-2 rounded border border-slate-700 text-white flex-1"
                            value={can.nombre}
                            onChange={(e) => {
                                const updated = project.canalizaciones?.map(c => c.id === can.id ? {...c, nombre: e.target.value} : c);
                                onChange({...project, canalizaciones: updated});
                            }}
                        />
                        <button 
                            onClick={() => onChange({...project, canalizaciones: project.canalizaciones?.filter(c => c.id !== can.id)})}
                            className="text-red-400 p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => onChange({
                        ...project,
                        canalizaciones: [...(project.canalizaciones || []), { id: Date.now().toString(), nombre: 'Nueva Canalización', circuitosIds: [] }]
                    })}
                    className="text-[var(--accent)] flex items-center gap-2 text-sm"
                >
                    <Plus size={16} /> Añadir Canalización
                </button>
            </div>
        </section>
      )}

      {renderSettings()}
    </div>
  );
};

