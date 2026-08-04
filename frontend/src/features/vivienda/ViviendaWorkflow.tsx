import { useState } from 'react';
import { Project } from '../../types/project';
import { ViviendaConfiguracion } from './ViviendaConfiguracion';
import { ViviendaAmbientes } from './ViviendaAmbientes';
import { ViviendaCircuitos } from './ViviendaCircuitos';
import { ViviendaAsignacion } from './ViviendaAsignacion';
import { ViviendaResumen } from './ViviendaResumen';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
  onSave?: (p: Project) => void;
}

export const ViviendaWorkflow = ({ project, onChange, onSave }: Props) => {
  if (!project) return null;

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ViviendaConfiguracion project={project} onChange={onChange} />;
      case 2:
        return <ViviendaAmbientes project={project} onChange={onChange} />;
      case 3:
        return <ViviendaCircuitos project={project} onChange={onChange} />;
      case 4:
        return <ViviendaAsignacion project={project} onChange={onChange} />;
      case 5:
        return <ViviendaResumen project={project} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stepper / Indicador de progreso */}
      <div className="flex justify-center items-center gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step === s ? 'bg-[var(--accent)] text-black' : 
              step > s ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 5 && (
              <div className={`w-12 h-1 bg-slate-800 rounded ${step > s ? 'bg-emerald-500' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso actual */}
      <div className="transition-all duration-300 ease-in-out">
        {renderStep()}
      </div>

      {/* Navegación */}
      <div className="flex justify-between items-center pt-6">
        <button 
          onClick={prevStep} 
          disabled={step === 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
            step === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-white bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        
        {step < totalSteps && (
          <button 
            onClick={nextStep} 
            className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-black rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Siguiente <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
