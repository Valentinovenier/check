import { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProjectList } from './components/ProjectList';
import { NewProjectModal } from './components/NewProjectModal';
import { ProjectSettings } from './components/ProjectSettings';
import { ConductorCalculation } from './components/ConductorCalculation';
import { ProjectReport } from './components/ProjectReport';
import { TablerosSeccionales } from './components/TablerosSeccionales';
import { TablerosVivienda } from './components/TablerosVivienda';
import { Project } from './types/project';
import { useAuth } from './context/AuthContext';
import { useProject } from './context/ProjectDataContext';
import { UnifilarPage } from './components/UnifilarPage';
import { ProteccionesPage } from './components/ProteccionesPage';
import { CanalizacionesPage } from './components/CanalizacionesPage';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { state: selectedProject, setState: setSelectedProject, setLastSaved, lastSavedProject } = useProject();
  const [currentPage, setCurrentPage] = useState('inicio');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const parsed = data.map((p: any) => {
            let projectData;
            try {
              projectData = typeof p.data === 'string' ? JSON.parse(p.data) : p.data;
            } catch (e) {
              console.error("Error al parsear el JSON de un proyecto:", p.id, e);
              projectData = {};
            }
            
            return {
              ...projectData,
              id: p.id,
              name: p.name
            };
          });
          setProjects(parsed);
        } else {
          console.error("La respuesta de /api/projects no es un array:", data);
          setProjects([]);
        }
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    } catch (e) {
      console.error("Error al cargar proyectos:", e);
      setProjects([]);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Cargando...</div>;
  }

  const createProject = async (name: string, projectType: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      projectType,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft',
      tableros: [],
      armonicos: { habilitado: false, modoEntrada: 'porcentaje', h3:0, h5:0, h7:0, h9:0 },
      tableroPrincipal: {
        id: 'root',
        nombre: 'Tablero Principal',
        conductorAlimentacion: { tipo: 'Cable' },
        proteccionCabecera: { 
          id: 'cabecera-principal',
          modelo: 'Estándar',
          tipo_proteccion: 'Termomagnética',
          in_amp: 63,
          polos: 3,
          capacidades: []
        },
        proteccionesSalida: [],
        subTableros: [],
        circuitosTerminales: []
      }
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newProject.id,
          name: newProject.name,
          data: newProject
        })
      });

      if (response.ok) {
        const projectToAdd = { ...newProject, data: newProject };
        setProjects([...projects, projectToAdd]);
        setSelectedProject(newProject);
        setLastSaved(newProject);
        setCurrentPage('parametros'); 
        setIsModalOpen(false);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        window.location.reload();
      } else {
        throw new Error('No se pudo crear el proyecto');
      }
    } catch (error: any) {
      alert(`Error al crear el proyecto: ${error.message}`);
    }
  };


  const deleteProject = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto?')) return;

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ id });
      const response = await fetch(`/api/projects?${params.toString()}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
        if (selectedProject?.id === id) setSelectedProject(null);
      } else {
        alert('No se pudo eliminar el proyecto.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderContent = () => {
    if (!selectedProject) {
      if (currentPage === 'inicio') {
        return (
          <>
            <header className="mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">Mis Proyectos</h2>
              <p className="text-[var(--text-secondary)]">Gestioná tus diseños eléctricos y cálculos de ingeniería.</p>
            </header>
            <ProjectList
              projects={projects}
              onSelectProject={(id) => {
                const proj = projects.find(p => p.id === id);
                if (proj) {
                  setSelectedProject(proj);
                  setLastSaved(proj);
                  setCurrentPage('parametros');
                }
              }}
              onAddNew={() => setIsModalOpen(true)}
              onDelete={deleteProject}
            />
            {isModalOpen && (
              <NewProjectModal
                onClose={() => setIsModalOpen(false)}
                onCreate={createProject}
              />
            )}
          </>
        );
      }
      return <div className="text-white">Selecciona un proyecto desde el inicio.</div>;
    }

    switch (currentPage) {
      case 'parametros':
        return (
          <ProjectSettings
            project={selectedProject}
            onChange={(updated) => setSelectedProject(updated)}
            onSave={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
              setSelectedProject(updated);
              setLastSaved(updated);
            }}
            onDelete={() => deleteProject(selectedProject.id)}
          />
        );
      case 'conductores':
        return (
          <ConductorCalculation 
            project={selectedProject}
            onChange={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
              setSelectedProject(updated);
            }}
          />
        );
      case 'tableros-seccionales':
        return selectedProject.projectType === 'Vivienda' ? (
          <TablerosVivienda
            project={selectedProject}
            onChange={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
              setSelectedProject(updated);
            }}
          />
        ) : (
          <TablerosSeccionales
            project={selectedProject}
            onChange={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
              setSelectedProject(updated);
            }}
          />
        );
      case 'informe':
        return <ProjectReport project={selectedProject} />;
      case 'unifilar':
        return <UnifilarPage />;
      case 'protecciones':
        return <ProteccionesPage />;
      case 'canalizaciones':
        return (
          <CanalizacionesPage 
            project={selectedProject}
            onChange={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
              setSelectedProject(updated);
            }}
          />
        );
      default:
        return <div className="text-white">Sección no implementada.</div>;
    }
  };

  return (
    <DashboardLayout 
      activePage={currentPage} 
      onNavigate={(page) => {
        if (page === 'inicio') setSelectedProject(null);
        setCurrentPage(page);
      }}
      projectSelected={!!selectedProject}
      project={selectedProject}
      lastSaved={lastSavedProject}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
