import { useState } from 'react';
import { X, Home, Building2, Factory } from 'lucide-react';

type ProjectType = 'Vivienda' | 'Oficina' | 'Industria';

interface TypeOption {
  id: ProjectType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PROJECT_TYPES: TypeOption[] = [
  { id: 'Vivienda', label: 'Vivienda', description: 'Desde casas hasta deptos.', icon: <Home size={24} /> },
  { id: 'Oficina', label: 'Oficina o Comercio', description: 'Locales, estudios, etc.', icon: <Building2 size={24} /> },
  { id: 'Industria', label: 'Industria o Taller', description: 'Motores, fuerza motriz.', icon: <Factory size={24} /> },
];

export const NewProjectModal = ({ onClose, onCreate }: { onClose: () => void, onCreate: (name: string, type: string) => void }) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-secondary)] border border-slate-700 p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Nuevo Proyecto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="mb-8">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
            Nombre del Proyecto
          </label>
          <input 
            autoFocus
            className="w-full bg-[var(--bg-primary)] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-all"
            placeholder="Ej: Casa de campo - Familia Pérez..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-8">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block ml-1">
            Seleccioná el tipo de instalación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PROJECT_TYPES.map((option) => {
              const isComingSoon = option.id !== 'Vivienda';
              return (
                <div 
                  key={option.id}
                  onClick={() => !isComingSoon && setSelectedType(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-3 ${
                    isComingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    selectedType === option.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white shadow-lg ring-1 ring-[var(--accent)]' 
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500 hover:bg-slate-900'
                  }`}
                >
                  {isComingSoon && (
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-full text-white">
                      Próximamente...
                    </span>
                  )}
                  <div className={`${selectedType === option.id ? 'text-[var(--accent)]' : 'text-slate-500'}`}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{option.label}</p>
                    <p className="text-[10px] opacity-70">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          className="w-full bg-[var(--accent)] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!name || !selectedType}
          onClick={() => onCreate(name, selectedType!)}
        >
          Crear Proyecto
        </button>
      </div>
    </div>
  );
};
