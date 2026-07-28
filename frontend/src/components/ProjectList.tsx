import { Plus, Folder, Calendar, Trash2 } from 'lucide-react';
import { Project } from '../types/project';

export const ProjectList = ({ projects = [], onSelectProject, onAddNew, onDelete }: { projects?: Project[], onSelectProject: (id: string) => void, onAddNew: () => void, onDelete: (id: string) => void }) => {
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
        <button
          key={project.id}
          onClick={() => onSelectProject(project.id)}
          className="w-full h-48 bg-[var(--bg-secondary)] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between text-left hover:border-[var(--accent)] transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--accent)]">
              <Folder size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors">{project.name}</h3>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
              <Calendar size={14} />
              <span>{project.createdAt}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
