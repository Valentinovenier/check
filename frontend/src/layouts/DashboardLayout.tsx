import React from 'react';
import { LayoutDashboard, Settings, Zap, FileText, Server, Cable, ClipboardList, Network, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types/project';
import { SaveIndicator } from '../components/SaveIndicator';
import { usePlanAccess } from '../hooks/usePlanAccess';

export const DashboardLayout = ({ 
  children, 
  activePage, 
  onNavigate,
  projectSelected,
  project,
  lastSaved
}: { 
  children: React.ReactNode,
  activePage: string,
  onNavigate: (page: string) => void,
  projectSelected: boolean,
  project: Project | null,
  lastSaved: Project | null
}) => {
  const { user, logout } = useAuth();
  const { canAccessFullFeatures } = usePlanAccess();

  // Menú global lateral
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Inicio', id: 'inicio' },
  ];

  // Menú contextual superior (solo si hay proyecto)
  const headerItems = projectSelected 
    ? canAccessFullFeatures() 
      ? [
          { icon: Settings, label: 'Parámetros', id: 'parametros' },
          { icon: Server, label: 'Tableros', id: 'tableros-seccionales' },
          { icon: Network, label: 'Canalizaciones', id: 'canalizaciones' },
          { icon: Zap, label: 'Protecciones', id: 'protecciones' },
          { icon: Cable, label: 'Conductores', id: 'conductores' },
          { icon: FileText, label: 'Informe', id: 'informe' },
        ]
      : [
          { icon: Zap, label: 'Calculadora DPMS', id: 'parametros' },
        ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar Global */}
      <aside className="w-64 bg-[var(--bg-secondary)] border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 text-[var(--accent)] mb-10 px-2">
          <Zap size={48} fill="currentColor" />
          <h1 className="text-lg font-black tracking-tighter text-white font-sans lowercase">electrocheck</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activePage === item.id 
                  ? 'bg-[var(--bg-primary)] text-white' 
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-primary)]'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Logout button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-primary)] transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Contextual (Solo si hay proyecto) */}
        {projectSelected && (
          <header className="bg-[var(--bg-secondary)] border-b border-slate-800 p-4 flex items-center justify-between">
            <nav className="flex items-center gap-2">
              {headerItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activePage === item.id 
                      ? 'bg-[var(--bg-primary)] text-white' 
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
            <SaveIndicator project={project} lastSaved={lastSaved} />
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
