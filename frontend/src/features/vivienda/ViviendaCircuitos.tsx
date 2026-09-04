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
  const [bocas, setBocas] = useState(0); // Estado para las bocas
  const [unidadPotencia, setUnidadPotencia] = useState<'W' | 'VA'>('W');
  const [coefUtilizacion, setCoefUtilizacion] = useState(1);
  const [coefSimultaneidad, setCoefSimultaneidad] = useState(1);

  // Lógica de circuitos automáticos vs manuales
  useEffect(() => {
    // 1. Mantener circuitos manuales
    const manuales = datos.circuitosCalculados.filter(c => !c.id.startsWith('auto-'));
    const anteriores = datos.circuitosCalculados.filter(c => c.id.startsWith('auto-'));
    
    // 2. Generar circuitos normativos según la variante
    const automaticos: CircuitoCalculado[] = [];
    
    const crearOActualizar = (id: string, nombre: string, tipo: CircuitoCalculado['tipo']): CircuitoCalculado => {
        const existente = anteriores.find(c => c.id === id);
        return {
            id,
            nombre,
            tipo,
            puntosIUG: existente?.puntosIUG || 0,
            puntosTUG: existente?.puntosTUG || 0,
            puntosTUE: existente?.puntosTUE || 0,
            ambientesIds: existente?.ambientesIds || [],
            tieneTomacorrientesDerivados: existente?.tieneTomacorrientesDerivados
        };
    };

    for (let i = 0; i < configActual.IUG; i++) automaticos.push(crearOActualizar(`auto-iug-${i}`, `Circuito IUG ${i + 1}`, 'iluminacion_usos_generales'));
    for (let i = 0; i < configActual.TUG; i++) automaticos.push(crearOActualizar(`auto-tug-${i}`, `Circuito TUG ${i + 1}`, 'tomacorrientes_usos_generales'));
    if (configActual.CLE) automaticos.push(crearOActualizar('auto-cle', 'Circuito Especial 1', 'usos_especiales'));

    const nuevosCircuitos = [...automaticos, ...manuales];
    
    // Solo actualizar si realmente cambió
    if (JSON.stringify(datos.circuitosCalculados) !== JSON.stringify(nuevosCircuitos)) {
        onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: nuevosCircuitos, varianteElectrificacion: variante } });
    }
  }, [variante, grado]);

  const addCircuito = () => {
    if (!nuevoNombre) return;
    
    // Validación de bocas
    if (nuevoTipo === 'usos_especificos') {
        const maxBocas = circuitoEspecificoSeleccionado.maximoBocas;
        
        if (typeof maxBocas === 'number' && bocas > maxBocas) {
            alert(`La cantidad de bocas excede el máximo permitido (${maxBocas}) para este tipo de circuito.`);
            return;
        } else if (maxBocas === '12 por fase' && bocas > 12) {
            alert(`La cantidad de bocas excede el máximo permitido (12 por fase) para este tipo de circuito.`);
            return;
        } else if (maxBocas === 'N/A' && bocas > 0) {
            alert(`Este circuito no admite bocas.`);
            return;
        }
        // 'Sin límite' no requiere validación
    }
    
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
            bocas: bocas, // Añadir bocas
            condicionProteccion: circuitoEspecificoSeleccionado.proteccionCondicion,
            potencia: potencia,
            unidadPotencia: unidadPotencia,
            coefUtilizacion: coefUtilizacion,
            coefSimultaneidad: coefSimultaneidad
        })
    };
    
    onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: [...datos.circuitosCalculados, nuevoCircuito] } });
    setNuevoNombre('');
    setPotencia(0);
    setBocas(0);
    setCoefUtilizacion(1);
    setCoefSimultaneidad(1);
  };

  const removeCircuito = (id: string) => {
    onChange({ ...project, datosVivienda: { ...datos, circuitosCalculados: datos.circuitosCalculados.filter(c => c.id !== id) } });
  };

  const minCircuitos = configActual.IUG + configActual.TUG + (configActual.CLE ? 1 : 0);

  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Seleccion y configuracion de Circuitos</h2>
        <div className="px-4 py-2 rounded-lg border bg-emerald-900/20 border-emerald-800 text-emerald-400 flex items-center gap-3">
            <Zap size={18} />
            <div>
                <p className="text-xs uppercase font-bold opacity-70">Cantidad mínima de circuitos</p>
                <p className="text-lg font-bold">{datos.circuitosCalculados.length} / {minCircuitos}</p>
            </div>
        </div>
      </div>

      {/* Selector de variante */}
      {configuraciones.length > 1 && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <p className="text-base font-bold text-slate-200 mb-3">Seleccionar Variante</p>
            <div className="flex gap-2 flex-wrap">
                {configuraciones.map(c => (
                    <button 
                        key={c.variante}
                        onClick={() => onChange({ ...project, datosVivienda: { ...datos, varianteElectrificacion: c.variante } })}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold border ${variante === c.variante ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Variante {c.variante}
                    </button>
                ))}
            </div>
            {/* Detalles de la variante */}
            <div className="mt-4 text-sm text-slate-400 flex gap-4">
                <span><strong className="text-white">{configActual.IUG}</strong> IUG</span>
                <span><strong className="text-white">{configActual.TUG}</strong> TUG</span>
                {configActual.CLE && <span><strong className="text-white">1</strong> Especial</span>}
            </div>
        </div>
      )}

      <div className="space-y-3">
        {datos.circuitosCalculados.map(c => (
          <div key={c.id} className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex justify-between items-center">
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
                    <p className="text-xs text-slate-400 uppercase font-medium">{c.tipo.replace(/_/g, ' ')}</p>
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
        <p className="text-base font-bold text-white">Agregar circuito adicional</p>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Nombre" 
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="flex-grow bg-slate-800 p-3 rounded-lg text-white text-base border border-slate-700"
            />
            <select 
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as CircuitoCalculado['tipo'])}
                className="bg-slate-800 p-3 rounded-lg text-white text-base border border-slate-700"
            >
                <option value="iluminacion_usos_generales">Circuito IUG</option>
                <option value="tomacorrientes_usos_generales">Circuito TUG</option>
                <option value="usos_especiales">Circuito Especial</option>
                <option value="usos_especificos">Circuito Específico</option>
            </select>
        </div>

        {nuevoTipo === 'usos_especificos' && (
            <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-800 p-4 rounded-lg">
                <div className="col-span-2">
                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1.5">Tipo de Circuito Específico</label>
                    <select 
                        value={circuitoEspecificoSeleccionado.descripcion}
                        onChange={(e) => setCircuitoEspecificoSeleccionado(CIRCUITOS_ESPECIFICOS.find(c => c.descripcion === e.target.value)!)}
                        className="bg-slate-900 p-2 rounded-lg text-white text-sm border border-slate-700 w-full"
                    >
                        {CIRCUITOS_ESPECIFICOS.map(c => (
                            <option key={c.descripcion} value={c.descripcion}>{c.descripcion}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1.5">Potencia</label>
                    <input 
                        type="number" 
                        value={potencia}
                        onChange={(e) => setPotencia(Number(e.target.value))}
                        className="bg-slate-900 p-2 rounded-lg text-white text-sm border border-slate-700 w-full"
                    />
                </div>
                <div>
                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1.5">Unidad</label>
                    <select 
                        value={unidadPotencia}
                        onChange={(e) => setUnidadPotencia(e.target.value as 'W' | 'VA')}
                        className="bg-slate-900 p-2 rounded-lg text-white text-sm border border-slate-700 w-full"
                    >
                        <option value="W">W</option>
                        <option value="VA">VA</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1.5">Coef. Utilización</label>
                    <input 
                        type="number" 
                        value={coefUtilizacion}
                        onChange={(e) => setCoefUtilizacion(Number(e.target.value))}
                        className="bg-slate-900 p-2 rounded-lg text-white text-sm border border-slate-700 w-full"
                        step="0.1"
                    />
                </div>
                <div>
                    <label className="text-xs uppercase font-bold text-slate-400 block mb-1.5">Coef. Simultaneidad</label>
                    <input 
                        type="number" 
                        value={coefSimultaneidad}
                        onChange={(e) => setCoefSimultaneidad(Number(e.target.value))}
                        className="bg-slate-900 p-2 rounded-lg text-white text-sm border border-slate-700 w-full"
                        step="0.1"
                    />
                </div>
            </div>
        )}

        <button onClick={addCircuito} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg text-base font-bold hover:bg-emerald-500 w-full mt-2">
            <PlusCircle size={16} /> Agregar
        </button>
      </div>
    </div>
  );
};
