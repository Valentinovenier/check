import { Project } from '../../types/project';
import { obtenerConfiguracionCircuitos } from '../../engine/strategies/vivienda/normas770';
import { Zap, Trash2, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CircuitoCalculado } from '../../types/vivienda';
import { DISTRIBUCION_CIRCUITOS } from '../../data/vivienda/circuitosDistribucion';
import { CIRCUITOS_ESPECIFICOS } from '../../data/vivienda/circuitosEspecificos';

interface Props {
  project: Project;
  onChange: (p: Project) => void;
}

export const ViviendaCircuitos = ({ project, onChange }: Props) => {
  const datos = project.datosVivienda || { superficieCubierta: 0, superficieSemicubierta: 0, ambientes: [], circuitosCalculados: [], gradoElectrificacion: 'Minimo' };
  
  const grado = datos.gradoElectrificacion || 'Minimo';
  const configuraciones = obtenerConfiguracionCircuitos(grado as any);
  
  // Establecer variante por defecto si no existe
  const variantePorDefecto = grado === 'Minimo' ? 'Única' : 'a)';
  const variante = datos.varianteElectrificacion || variantePorDefecto;
  
  const configActual = configuraciones.find(c => c.variante === variante) || configuraciones[0];

  // Estados para formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<CircuitoCalculado['tipo']>('iluminacion_usos_generales');
  const [circuitoEspecificoSeleccionado, setCircuitoEspecificoSeleccionado] = useState(CIRCUITOS_ESPECIFICOS[0]);
  const [potencia, setPotencia] = useState(0);
  const [unidadPotencia, setUnidadPotencia] = useState<'kW' | 'kVA'>('kW');

  // Lógica de circuitos automáticos vs manuales
  useEffect(() => {
    // 1. Mantener circuitos manuales
    const manuales = datos.circuitosCalculados.filter(c => !c.id.startsWith('auto-'));
    
    // 2. Generar circuitos normativos según la variante
    const automaticos: CircuitoCalculado[] = [];
    for (let i = 0; i < configActual.IUG; i++) automaticos.push({ id: `auto-iug-${i}`, nombre: `Circuito IUG ${i + 1}`, tipo: 'iluminacion_usos_generales', puntosIUG: 0, puntosTUG: 0, puntosTUE: 0, ambientesIds: [] });
    for (let i = 0; i < configActual.TUG; i++) automaticos.push({ id: `auto-tug-${i}`, nombre: `Circuito TUG ${i + 1}`, tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 0, puntosTUE: 0, ambientesIds: [] });
    if (configActual.CLE) automaticos.push({ id: 'auto-cle', nombre: 'Circuito Especial 1', tipo: 'usos_especiales', puntosIUG: 0, puntosTUG: 0, puntosTUE: 0, ambientesIds: [] });

    const nuevosCircuitos = [...automaticos, ...manuales];
    
    // Solo actualizar si realmente cambió
    if (JSON.stringify(datos.circuitosCalculados) !== JSON.stringify(nuevosCircuitos)) {
        onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos, varianteElectrificacion: variante } });
    }
  }, [variante, grado]);

  const addCircuito = () => {
    if (!nuevoNombre) return;
    
    const nuevoCircuito: CircuitoCalculado = {
        id: `custom-${Date.now()}`,
        nombre: nuevoNombre,
        tipo: nuevoTipo,
        puntosIUG: 0,
        puntosTUG: 0,
        puntosTUE: 0,
        ambientesIds: [],
        ...(nuevoTipo === 'usos_especificos' && {
            esEspecifico: true,
            siglaEspecifica: circuitoEspecificoSeleccionado.sigla,
            maximoBocas: circuitoEspecificoSeleccionado.maximoBocas,
            condicionProteccion: circuitoEspecificoSeleccionado.proteccionCondicion,
            potencia: potencia,
            unidadPotencia: unidadPotencia
        })
    };
    
    onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: [...datos.circuitosCalculados, nuevoCircuito] } });
    setNuevoNombre('');
    setPotencia(0);
  };

  const removeCircuito = (id: string) => {
    onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: datos.circuitosCalculados.filter(c => c.id !== id) } });
  };

  const minCircuitos = configActual.IUG + configActual.TUG + (configActual.CLE ? 1 : 0);

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Configuracion Circuitos</h2>
        <div className="px-4 py-2 rounded-lg border bg-emerald-900/20 border-emerald-800 text-emerald-400 flex items-center gap-3">
            <Zap size={18} />
            <div>
                <p className="text-[10px] uppercase font-bold opacity-70">Cantidad mínima de circuitos</p>
                <p className="text-lg font-bold">{datos.circuitosCalculados.length} / {minCircuitos}</p>
            </div>
        </div>
      </div>

      {/* Selector de variante */}
      {configuraciones.length > 1 && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <p className="text-sm font-bold text-slate-300 mb-3">Seleccionar Variante</p>
            <div className="flex gap-2 flex-wrap">
                {configuraciones.map(c => (
                    <button 
                        key={c.variante}
                        onClick={() => onChange({ ...project, datosVivienda: { ...datos, varianteElectrificacion: c.variante } })}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border ${variante === c.variante ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Variante {c.variante}
                    </button>
                ))}
            </div>
            {/* Detalles de la variante */}
            <div className="mt-4 text-xs text-slate-500 flex gap-4">
                <span><strong className="text-white">{configActual.IUG}</strong> IUG</span>
                <span><strong className="text-white">{configActual.TUG}</strong> TUG</span>
                {configActual.CLE && <span><strong className="text-white">1</strong> Especial</span>}
            </div>
        </div>
      )}

      <div className="space-y-3">
        {datos.circuitosCalculados.map(c => (
          <div key={c.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-bold text-white">{c.nombre} {c.id.startsWith('auto-') && <span className="text-[10px] text-emerald-500">(Normativo)</span>}</p>
                {c.esEspecifico ? (
                    <p className="text-xs text-indigo-400 font-bold">{c.siglaEspecifica} - {c.potencia} {c.unidadPotencia}</p>
                ) : c.id === 'auto-cle' ? (
                    <select 
                        value={c.tipo}
                        onChange={(e) => {
                            const nuevoTipo = e.target.value as CircuitoCalculado['tipo'];
                            let nuevoNombre = 'Circuito Especial';
                            if (nuevoTipo === 'iluminacion_usos_generales') nuevoNombre = 'Circuito IUG Especial';
                            if (nuevoTipo === 'tomacorrientes_usos_generales') nuevoNombre = 'Circuito TUG Especial';
                            
                            const nuevosCircuitos = datos.circuitosCalculados.map(circ => 
                                circ.id === c.id ? { ...circ, tipo: nuevoTipo, nombre: nuevoNombre } : circ
                            );
                            onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos } });
                        }}
                        className="bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700 mt-1"
                    >
                        <option value="iluminacion_usos_generales">Circuito IUG</option>
                        <option value="tomacorrientes_usos_generales">Circuito TUG</option>
                        <option value="usos_especiales">Circuito Especial</option>
                    </select>
                ) : (
                    <p className="text-[10px] text-slate-500 uppercase">{c.tipo.replace(/_/g, ' ')}</p>
                )}
              </div>

              {c.tipo === 'iluminacion_usos_generales' && (
                  <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!c.tieneTomacorrientesDerivados}
                      onChange={(e) => {
                          const nuevosCircuitos = datos.circuitosCalculados.map(circ =>
                              circ.id === c.id ? { ...circ, tieneTomacorrientesDerivados: e.target.checked } : circ
                          );
                          onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos } });
                      }}
                      className="bg-slate-800 border-slate-600 rounded h-5 w-5 cursor-pointer accent-indigo-500"
                    />
                    TUG Derivados
                  </label>
              )}
            </div>
            {!c.id.startsWith('auto-') && (
                <button onClick={() => removeCircuito(c.id)} className="text-red-400 p-1">
                    <Trash2 size={16} />
                </button>
            )}
          </div>
        ))}
      </div>

      {/* Formulario nuevo circuito */}
      <div className="bg-slate-900 p-4 rounded-lg border border-dashed border-slate-700 flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Agregar circuito adicional</p>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Nombre" 
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="flex-grow bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700"
            />
            <select 
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as CircuitoCalculado['tipo'])}
                className="bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700"
            >
                <option value="iluminacion_usos_generales">Circuito IUG</option>
                <option value="tomacorrientes_usos_generales">Circuito TUG</option>
                <option value="usos_especiales">Circuito Especial</option>
                <option value="usos_especificos">Circuito Específico</option>
            </select>
        </div>

        {nuevoTipo === 'usos_especificos' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
                <select 
                    value={circuitoEspecificoSeleccionado.descripcion}
                    onChange={(e) => setCircuitoEspecificoSeleccionado(CIRCUITOS_ESPECIFICOS.find(c => c.descripcion === e.target.value)!)}
                    className="bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700"
                >
                    {CIRCUITOS_ESPECIFICOS.map(c => (
                        <option key={c.descripcion} value={c.descripcion}>{c.descripcion}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        placeholder="Potencia"
                        value={potencia}
                        onChange={(e) => setPotencia(Number(e.target.value))}
                        className="w-full bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700"
                    />
                    <select 
                        value={unidadPotencia}
                        onChange={(e) => setUnidadPotencia(e.target.value as 'kW' | 'kVA')}
                        className="bg-slate-800 p-2 rounded-lg text-white text-sm border border-slate-700"
                    >
                        <option value="kW">kW</option>
                        <option value="kVA">kVA</option>
                    </select>
                </div>
            </div>
        )}

        <button onClick={addCircuito} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500 w-full mt-2">
            <PlusCircle size={16} /> Agregar
        </button>
      </div>
    </div>
  );
};
