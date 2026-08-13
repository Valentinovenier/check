import { useState } from 'react';
import { Project, DatosCaratula } from '../types/project';
import { getProjectStrategy } from '../engine/factory';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { InformeBasicoSection } from './InformeBasicoSection';
import { Edit3, FileDown } from 'lucide-react';

export const ProjectReport = ({ project }: { project: Project }) => {
  const [showCaratulaForm, setShowCaratulaForm] = useState(false);
  const [caratula, setCaratula] = useState<DatosCaratula>({
    propietario: project.datosCaratula?.propietario || '',
    direccion: project.datosCaratula?.direccion || '',
    ciudad: project.datosCaratula?.ciudad || '',
    provincia: project.datosCaratula?.provincia || '',
    instaladorNombre: project.datosCaratula?.instaladorNombre || '',
    instaladorCategoria: project.datosCaratula?.instaladorCategoria || '',
    instaladorMatricula: project.datosCaratula?.instaladorMatricula || '',
    instaladorTelefono: project.datosCaratula?.instaladorTelefono || '',
    instaladorEmail: project.datosCaratula?.instaladorEmail || '',
  });

  const { canAccessFullFeatures } = usePlanAccess();
  const isPro = canAccessFullFeatures();

  const handleInputChange = (field: keyof DatosCaratula, value: string) => {
    setCaratula(prev => ({ ...prev, [field]: value }));
  };

  const strategy = getProjectStrategy(project);
  const ReportComponent = strategy.getInformeComponente();

  return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 print:hidden flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Informe Técnico: {project.name}</h2>
          <p className="text-xs text-slate-400 mt-1">Generación e inspección de Informes.</p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setShowCaratulaForm(prev => !prev)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={15} />
            <span>{showCaratulaForm ? 'Ocultar Portada' : 'Editar Datos Portada'}</span>
          </button>
        </div>
      </div>

      {/* Formulario desplegable para datos de la portada/carátula */}
      {showCaratulaForm && (
        <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-slate-700 space-y-4 print:hidden">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Datos Específicos para la Carátula del Informe (Modelo ERSeP / AEA)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Propietario / Cliente</label>
              <input
                type="text"
                value={caratula.propietario}
                onChange={(e) => handleInputChange('propietario', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Sr. Juan PEREZ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Dirección / Ubicación</label>
              <input
                type="text"
                value={caratula.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Av. Emilio Olmos 5130"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ciudad / Provincia</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={caratula.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ciudad"
                />
                <input
                  type="text"
                  value={caratula.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Provincia"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Instalador</label>
              <input
                type="text"
                value={caratula.instaladorNombre}
                onChange={(e) => handleInputChange('instaladorNombre', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Nombre y Apellido"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría / Matrícula</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={caratula.instaladorCategoria}
                  onChange={(e) => handleInputChange('instaladorCategoria', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Categoría III"
                />
                <input
                  type="text"
                  value={caratula.instaladorMatricula}
                  onChange={(e) => handleInputChange('instaladorMatricula', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="N° Habilitación"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono / Correo de Contacto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={caratula.instaladorTelefono}
                  onChange={(e) => handleInputChange('instaladorTelefono', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Teléfono"
                />
                <input
                  type="email"
                  value={caratula.instaladorEmail}
                  onChange={(e) => handleInputChange('instaladorEmail', e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Correo"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isPro ? (
        <ReportComponent project={project} />
      ) : (
        <InformeBasicoSection project={project} caratula={caratula} />
      )}
    </div>
  );
};
