import React from 'react';
import { LayoutDashboard, Settings, Zap, FileText, Server, Cable, Network, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types/project';
import { SaveIndicator } from '../components/SaveIndicator';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { ProjectSummaryBar } from '../components/ProjectSummaryBar';
import { ProjectStepper } from '../components/ProjectStepper';

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar Global */}
      <aside className="w-56 bg-[var(--bg-secondary)] border-r border-slate-800 p-5 flex flex-col shrink-0">
        <div className="flex items-center gap-2 text-[var(--accent)] mb-10 px-2">
          <Zap size={36} fill="currentColor" />
          <h1 className="text-2xl font-black tracking-tighter text-white font-sans lowercase">ElectroCheck</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activePage === item.id 
                  ? 'bg-blue-600/20 text-white border border-blue-500/30' 
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-primary)]'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-base">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Plan Badge */}
        <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-sm">
          <span className="text-slate-400 font-medium text-sm">Plan Activo:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${user?.planType === 'pro' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
            {user?.planType === 'pro' ? 'PRO' : 'BASIC'}
          </span>
        </div>
        
        {/* Logout button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-primary)] transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium text-base">Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header & Stepper Contextual (Solo si hay proyecto) */}
        {projectSelected && (
          <header className="flex flex-col border-b border-slate-800 bg-[var(--bg-secondary)] sticky top-0 z-30">
            {/* Barra superior con resumen de proyecto y SaveIndicator */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/60 bg-slate-950/40">
              <ProjectSummaryBar project={project} />
              <div className="shrink-0 ml-4">
                <SaveIndicator project={project} lastSaved={lastSaved} />
              </div>
            </div>

            {/* Stepper Guiado de Navegación */}
            {canAccessFullFeatures() ? (
              <ProjectStepper 
                activePage={activePage} 
                onNavigate={onNavigate} 
                project={project} 
              />
            ) : (
              <nav className="flex items-center gap-2 p-3 px-6">
                <button
                  onClick={() => onNavigate('parametros')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    activePage === 'parametros' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap size={16} /> Calculadora DPMS
                </button>
                <button
                  onClick={() => onNavigate('informe')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    activePage === 'informe' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={16} /> Informe
                </button>
              </nav>
            )}
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto bg-[var(--bg-primary)]">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
