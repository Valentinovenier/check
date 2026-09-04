import React from 'react';
import { Settings, Server, Shield, Network, Cable, FileText, Check } from 'lucide-react';
import { Project } from '../types/project';

interface Props {
  activePage: string;
  onNavigate: (pageId: string) => void;
  project: Project | null;
}

export const ProjectStepper: React.FC<Props> = ({ activePage, onNavigate, project }) => {
  const isVivienda = project?.projectType === 'Vivienda';
  const circuitos = project?.datosVivienda?.circuitosCalculados || [];
  const tableros = project?.datosVivienda?.tableros || [];
  const canalizaciones = project?.canalizaciones || [];
  const informeConductores = project?.informeConductores || [];

  // Verificaciones visuales de avance (solo presentación)
  const stepStatus = {
    parametros: Boolean(project && (circuitos.length > 0 || project.transformador)),
    tableros: tableros.length > 0 && tableros.some(t => t.circuitosIds && t.circuitosIds.length > 0),
    protecciones: circuitos.length > 0 && circuitos.some(c => Boolean(c.proteccion)),
    canalizaciones: canalizaciones.length > 0,
    conductores: informeConductores.length > 0 || Boolean((project as any)?.conductores && Object.keys((project as any).conductores).length > 0),
    informe: false,
  };

  const steps = [
    {
      id: 'parametros',
      stepNumber: 1,
      label: 'Parámetros',
      sublabel: 'Cargas y DPMS',
      icon: Settings,
      isDone: stepStatus.parametros,
    },
    {
      id: 'tableros-seccionales',
      stepNumber: 2,
      label: 'Tableros',
      sublabel: 'Distribución',
      icon: Server,
      isDone: stepStatus.tableros,
    },
    {
      id: 'protecciones',
      stepNumber: 3,
      label: 'Protecciones',
      sublabel: 'Térmicas y Dif.',
      icon: Shield,
      isDone: stepStatus.protecciones,
    },
    {
      id: 'canalizaciones',
      stepNumber: 4,
      label: 'Canalizaciones',
      sublabel: 'Cañerías y Normas',
      icon: Network,
      isDone: stepStatus.canalizaciones,
    },
    {
      id: 'conductores',
      stepNumber: 5,
      label: 'Conductores',
      sublabel: 'Sección y Caída V',
      icon: Cable,
      isDone: stepStatus.conductores,
    },
    {
      id: 'informe',
      stepNumber: 6,
      label: 'Informe',
      sublabel: 'Memoria Técnica',
      icon: FileText,
      isDone: false,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/90 px-4 py-3 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        {steps.map((step, idx) => {
          const isActive = activePage === step.id;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onNavigate(step.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-left min-w-fit ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {/* Indicador de número / check */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : step.isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}
                >
                  {step.isDone && !isActive ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    step.stepNumber
                  )}
                </div>

                {/* Texto */}
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        isActive
                          ? 'text-white'
                          : step.isDone
                          ? 'text-slate-200'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{step.sublabel}</p>
                </div>
              </button>

              {/* Separador entre pasos */}
              {idx < steps.length - 1 && (
                <div
                  className={`hidden md:block flex-1 h-[2px] mx-1 rounded transition-colors ${
                    step.isDone ? 'bg-emerald-500/40' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
