import { useState } from 'react';
import { Plus, Folder, Calendar, Trash2, MoreVertical } from 'lucide-react';
import { Project } from '../types/project';

export const ProjectList = ({ projects = [], onSelectProject, onAddNew, onDelete }: { projects?: Project[], onSelectProject: (id: string) => void, onAddNew: () => void, onDelete: (id: string) => void }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Botón Nuevo Proyecto */}
      <button 
        className="h-48 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-[var(--accent)] hover:text-white transition-all"
        onClick={onAddNew}
      >
        <div className="bg-slate-800 p-4 rounded-full">
          <Plus size={32} />
        </div>
        <span className="font-semibold">Nuevo Proyecto</span>
      </button>

      {/* Tarjetas de Proyectos */}
      {projects?.map((project) => (
        <div
          key={project.id}
          className="relative w-full h-48 bg-[var(--bg-secondary)] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between text-left hover:border-[var(--accent)] transition-all group"
        >
          <div className="flex justify-between items-start">
            <button
              onClick={() => onSelectProject(project.id)}
              className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--accent)]"
            >
              <Folder size={24} />
            </button>
            <button 
              className="text-slate-500 hover:text-white"
              onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
            >
              <MoreVertical size={20} />
            </button>
            {openMenuId === project.id && (
              <div className="absolute top-12 right-6 bg-[var(--bg-primary)] border border-slate-700 rounded-lg shadow-xl z-10">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full"
                  onClick={() => {
                    onDelete(project.id);
                    setOpenMenuId(null);
                  }}
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
          <button onClick={() => onSelectProject(project.id)} className="text-left">
            <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors">{project.name}</h3>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
              <Calendar size={14} />
              <span>{project.createdAt}</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};
