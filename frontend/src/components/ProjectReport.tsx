import { useState } from 'react';
import { Project, DatosCaratula } from '../types/project';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { generatePdfMemoriaCalculoBasico } from '../utils/generatePdfMemoriaCalculoBasico';
import { Edit3, FileDown } from 'lucide-react';

interface ProjectReportProps {
  project: Project;
  onChange?: (updated: Project) => void;
}

export const ProjectReport = ({ project, onChange }: ProjectReportProps) => {
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
    const updated = { ...caratula, [field]: value };
    setCaratula(updated);
    if (onChange) {
      onChange({
        ...project,
        datosCaratula: updated,
      });
    }
  };

  const handleDownload = () => {
    generatePdfMemoriaCalculoBasico(project, caratula, isPro);
  };

  return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Informe Técnico: {project.name}</h2>
          <p className="text-xs text-slate-400 mt-1">Generación y descarga de la documentación técnica oficial.</p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <button
            onClick={() => setShowCaratulaForm(prev => !prev)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 border ${
              showCaratulaForm
                ? 'bg-slate-700 text-white border-slate-600 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Edit3 size={16} />
            <span>{showCaratulaForm ? 'Ocultar Portada' : 'Editar Datos Portada'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            title="Descargar informe oficial en formato PDF"
          >
            <FileDown size={16} className="text-slate-950" />
            <span>Descargar Informe (PDF)</span>
          </button>
        </div>
      </div>

      {/* Formulario desplegable para datos de la portada/carátula */}
      {showCaratulaForm && (
        <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-slate-700 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Datos Específicos para la Carátula del Informe (Modelo ERSeP / AEA)
            </h3>
            <span className="text-[11px] text-slate-400">Se guardan automáticamente en el informe</span>
          </div>
          
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
    </div>
  );
};
