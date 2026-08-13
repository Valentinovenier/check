import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '../types/project';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  state: Project | null;
  lastSavedProject: Project | null;
  setState: React.Dispatch<React.SetStateAction<Project | null>>;
  setLastSaved: (p: Project) => void;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<Project | null>(null);
  const [lastSavedProject, setLastSavedProject] = useState<Project | null>(null);

  // Resetear proyecto cuando cambia o se destruye el usuario autenticado
  useEffect(() => {
    if (!user) {
      setState(null);
      setLastSavedProject(null);
    }
  }, [user?.id]);

  const setLastSaved = (p: Project) => setLastSavedProject(JSON.parse(JSON.stringify(p)));
  const clearProject = () => {
    setState(null);
    setLastSavedProject(null);
  };

  // Auto-save logic
  useEffect(() => {
    if (!state) return;
    
    // Si no hay proyecto guardado, no iniciamos auto-guardado automático sin intervención inicial
    if (!lastSavedProject) return;

    // Asegurar que state y lastSavedProject correspondan al mismo proyecto por ID
    if (state.id !== lastSavedProject.id) return;

    const isDirty = JSON.stringify(state) !== JSON.stringify(lastSavedProject);
    if (!isDirty) return;

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
            id: state.id,
            name: state.name,
            data: state
            })
        });
        if (response.ok) {
            setLastSaved(state);
            console.log('Auto-guardado exitoso');
        }
      } catch (error) {
        console.error('Error en auto-guardado:', error);
      }
    }, 2000); // 2 segundos de debounce

    return () => clearTimeout(timer);
  }, [state, lastSavedProject]);

  return (
    <ProjectContext.Provider value={{ state, lastSavedProject, setState, setLastSaved, clearProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
