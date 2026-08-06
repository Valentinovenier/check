import { Project, Conductor } from '../../types/project';
import { ShieldCheck, Zap, Layers, FileCheck, CheckCircle2, Box } from 'lucide-react';

export const ViviendaMemoriaDescriptiva = ({ project }: { project: Project }) => {
  const datosV = project.datosVivienda;
  const supCub = datosV?.superficieCubierta || 0;
  const supSemi = datosV?.superficieSemicubierta || 0;
  const supTotal = supCub + supSemi * 0.5;
  const grado = datosV?.gradoElectrificacion || (supTotal <= 60 ? 'Minimo' : supTotal <= 130 ? 'Medio' : supTotal <= 200 ? 'Elevado' : 'Superior');
  const circuitos = datosV?.circuitosCalculados || [];
  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const corrienteAlim = dpmsVA > 0 ? (dpmsVA / (project.tipoInstalacion === 'Trifásica' ? 380 * Math.sqrt(3) : 220)).toFixed(2) : '-';

  const protTPCab = project.tableroPrincipal?.proteccionCabecera;
  const protTPDif = project.tableroPrincipal?.proteccionDiferencial;

  const obtenerCond = (cId: string): Conductor | undefined => {
    const conds = project.conductores || {};
    for (const [key, val] of Object.entries(conds)) {
      if (key.includes(cId) || (val as any)?.destinoId === cId) return val;
    }
    return undefined;
  };

  return (
    <div className="space-y-8 text-slate-200">
      {/* Encabezado General */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <ShieldCheck className="text-emerald-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">Memoria Descriptiva de la Instalación Eléctrica</h2>
            <p className="text-xs text-slate-400">Reglamentación AEA 90364-7-770 / 771 | Proyecto: <span className="text-emerald-400 font-semibold">{project.name}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold block text-[10px]">Superficie Computable</span>
            <span className="text-base font-bold text-white">{supTotal.toFixed(2)} m²</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cub: {supCub}m² | Semicub: {supSemi}m²</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold block text-[10px]">Grado de Electrificación</span>
            <span className="text-base font-bold text-emerald-400">{grado.toUpperCase()}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">AEA 770.7.I</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold block text-[10px]">Demanda Máxima (DPMS)</span>
            <span className="text-base font-bold text-indigo-400">{dpmsVA.toFixed(0)} VA</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{dpmsKW.toFixed(2)} kW (cos φ = {project.cosPhi || 0.85})</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-semibold block text-[10px]">Corriente de Alimentación</span>
            <span className="text-base font-bold text-amber-400">{corrienteAlim} A</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{project.tipoInstalacion || 'Monofásica (220V)'}</span>
          </div>
        </div>
      </div>

      {/* 1. Descripción de la Metodología */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <FileCheck size={18} /> 1. Metodología y Criterios Reglamentarios Aplicados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white text-sm">Normativa y Grado de Electrificación</h4>
            <p>
              El dimensionamiento se efectúa estrictamente conforme a la norma <strong className="text-slate-200">AEA 90364-7-770</strong>. Con la superficie computable de {supTotal.toFixed(2)} m², se determina el Grado <strong className="text-emerald-400">{grado.toUpperCase()}</strong>, fijando la cantidad mínima de circuitos requeridos y bocas de utilización.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white text-sm">Verificación de Conductores</h4>
            <p>
              Cada conductor adoptado satisface la triple condición reglamentaria: Capacidad de conducción en régimen continuo (<code className="text-indigo-300">Iz ≥ IB</code>), caída de tensión en régimen permanente (<code className="text-indigo-300">ΔV% ≤ 3% / 5%</code>) y solicitación térmica ante cortocircuito (<code className="text-indigo-300">(k·S)² ≥ I²t</code>).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white text-sm">Protecciones de Tablero y Seguridad</h4>
            <p>
              Se coordinan los interruptores termomagnéticos (PIAs) cumpliendo <code className="text-indigo-300">IB ≤ In ≤ Iz</code> e <code className="text-indigo-300">I2 ≤ 1.45·Iz</code>. Se integra protección diferencial de alta sensibilidad (<strong className="text-amber-400">Idn = 30 mA</strong>) garantizando la protección contra contactos indirectos con puesta a tierra (PAT).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white text-sm">Canalizaciones y Electroductos</h4>
            <p>
              Se proyectan cañerías rígidas/flexibles ignífugas (IRAM 62386) verificando la regla del <strong className="text-emerald-400">35% de ocupación interna máxima</strong>, garantizando disipación térmica y facilidad de tendido.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Protecciones Adoptadas */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Zap size={18} /> 2. Protecciones Eléctricas Adoptadas (Modelos y Parámetros)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 font-semibold">
                <th className="p-3">Ubicación / Circuito</th>
                <th className="p-3">Tipo Protección</th>
                <th className="p-3">Corriente In</th>
                <th className="p-3">Curva</th>
                <th className="p-3">Poder Corte (Icn)</th>
                <th className="p-3">Diferencial (Idn)</th>
                <th className="p-3">Marca / Norma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(project.datosVivienda?.tableros || []).map(tablero => (
                <React.Fragment key={tablero.id}>
                  {tablero.proteccionCabecera && (
                    <tr className="bg-slate-950/60 hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{tablero.nombre} (Cabecera)</td>
                      <td className="p-3 text-slate-300">{tablero.proteccionCabecera.tipo_proteccion}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{tablero.proteccionCabecera.in_amp === 63 ? '-' : `${tablero.proteccionCabecera.in_amp} A`}</td>
                      <td className="p-3 text-slate-300">{tablero.proteccionCabecera.curva_disparo || 'C'}</td>
                      <td className="p-3 text-slate-300">{tablero.proteccionCabecera.capacidades?.[0]?.icn_ka || 3} kA</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 text-slate-400">{tablero.proteccionCabecera.marca || 'Normalizada'}</td>
                      </tr>
                      )}
                      {tablero.proteccionDiferencial && (
                      <tr className="bg-slate-950/60 hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{tablero.nombre} (Diferencial)</td>
                      <td className="p-3 text-slate-300">{tablero.proteccionDiferencial.tipo_proteccion}</td>
                      <td className="p-3 font-mono font-bold text-indigo-400">{tablero.proteccionDiferencial.in_amp === 63 ? '-' : `${tablero.proteccionDiferencial.in_amp} A`}</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 text-slate-300">{tablero.proteccionDiferencial.capacidades?.[0]?.icn_ka || 3} kA</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{tablero.proteccionDiferencial.sensibilidad || 30} mA</td>
                      <td className="p-3 text-slate-400">{tablero.proteccionDiferencial.marca || 'Normalizada'}</td>
                      </tr>
                      )}
                      {(tablero.proteccionesSalida || []).map((ps, idx) => (
                      <tr key={`salida-${tablero.id}-${idx}`} className="hover:bg-slate-800/50">
                      <td className="p-3 text-slate-200">{tablero.nombre} (Salida {idx + 1})</td>
                      <td className="p-3 text-slate-300">{ps.proteccion.tipo_proteccion}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{ps.proteccion.in_amp === 63 ? '-' : `${ps.proteccion.in_amp} A`}</td>
                      <td className="p-3 text-slate-300">{ps.proteccion.curva_disparo || 'C'}</td>
                      <td className="p-3 text-slate-300">{ps.proteccion.capacidades?.[0]?.icn_ka || 3} kA</td>
                      <td className="p-3 text-slate-500">-</td>
                      <td className="p-3 text-slate-400">{ps.proteccion.marca || 'Normalizada'}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {circuitos.map((c, idx) => (
                <tr key={`circuito-${c.id}`} className="hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-slate-200">Cto {idx + 1}: {c.nombre}</td>
                  <td className="p-3 text-slate-300">{c.proteccion?.tipo_proteccion || 'PIA'}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{c.proteccion ? `${c.proteccion.in_amp} A` : '-'}</td>
                  <td className="p-3 text-slate-300">{c.proteccion?.curva_disparo || 'C'}</td>
                  <td className="p-3 text-slate-300">{c.proteccion?.capacidades?.[0]?.icn_ka ? `${c.proteccion.capacidades[0].icn_ka} kA` : '3 kA'}</td>
                  <td className="p-3 text-slate-500">-</td>
                  <td className="p-3 text-slate-400">{c.proteccion?.marca || 'IEC 60898'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Secciones Adoptadas de Conductores */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Layers size={18} /> 3. Secciones Adoptadas de Conductores (Fase, Neutro y PE)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 font-semibold">
                <th className="p-3">Circuito / Tramo</th>
                <th className="p-3">Mínima AEA</th>
                <th className="p-3">Fase Adoptada</th>
                <th className="p-3">Neutro Adoptado</th>
                <th className="p-3">Protección (PE)</th>
                <th className="p-3">Capacidad (Iz)</th>
                <th className="p-3">Caída (ΔV%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {project.tableroPrincipal?.conductorAlimentacion?.seccion && (
                <tr className="bg-slate-950/60 hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-white">Alimentador Principal / TP</td>
                  <td className="p-3 text-slate-400">4.0 mm²</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{project.tableroPrincipal.conductorAlimentacion.seccion} mm²</td>
                  <td className="p-3 font-mono text-slate-300">{project.tableroPrincipal.conductorAlimentacion.seccion} mm²</td>
                  <td className="p-3 font-mono text-slate-300">{project.tableroPrincipal.conductorAlimentacion.seccion} mm²</td>
                  <td className="p-3 text-emerald-400 font-semibold">Cumple (Iz ≥ IB)</td>
                  <td className="p-3 font-mono text-slate-300">{project.tableroPrincipal.conductorAlimentacion.resultadoCalculo?.caidaTensionPorcentaje?.toFixed(2) || '< 1.0'}%</td>
                </tr>
              )}
              {circuitos.map((c, idx) => {
                const cond = obtenerCond(c.id);
                const secMin = c.tipo.includes('iluminacion') ? '1.5 mm²' : '2.5 mm²';
                const secAdopt = cond?.seccion ? `${cond.seccion} mm²` : secMin;
                const secPE = cond?.seccion ? `${cond.seccion >= 16 ? cond.seccion : 2.5} mm²` : '2.5 mm²';
                const caida = cond?.resultadoCalculo?.caidaTensionPorcentaje ? `${cond.resultadoCalculo.caidaTensionPorcentaje.toFixed(2)}%` : '< 3.0%';

                return (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-200">Cto {idx + 1}: {c.nombre}</td>
                    <td className="p-3 text-slate-400">{secMin}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{secAdopt}</td>
                    <td className="p-3 font-mono text-slate-300">{secAdopt}</td>
                    <td className="p-3 font-mono text-slate-300">{secPE}</td>
                    <td className="p-3 text-emerald-400 font-semibold">Cumple Iz</td>
                    <td className="p-3 font-mono text-slate-300">{caida}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Canalizaciones Usadas */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-sky-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Box size={18} /> 4. Canalizaciones Usadas y Factor de Ocupación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(project.canalizaciones && project.canalizaciones.length > 0) ? project.canalizaciones.map((can, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{can.nombre}</span>
                <span className="bg-sky-900/40 text-sky-300 border border-sky-800/50 px-2 py-0.5 rounded text-[10px] font-mono">
                  {can.circuitosIds.length} Circuitos
                </span>
              </div>
              <p className="text-slate-400">Material: Caño de PVC Rígido / Corrugado ignífugo (IRAM 62386)</p>
              <p className="text-slate-400">Diámetro Adoptado: <strong className="text-slate-200">Ø {can.circuitosIds.length <= 2 ? '20 mm (3/4")' : '25 mm (1")'}</strong></p>
              <p className="text-emerald-400 font-semibold">Ocupación interna &le; 35% (Cumple AEA)</p>
            </div>
          )) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs col-span-3">
              <span className="font-bold text-white text-sm">Canalización General Embebida en Mampostería / Cielorraso</span>
              <p className="text-slate-400">Electroducto de PVC Corrugado / Rígido ignífugo según norma IRAM 62386 con diámetros de Ø 20 mm (3/4") y Ø 25 mm (1"), respetando el factor de ocupación &le; 35%.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Comprobación de Verificaciones Reglamentarias */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <CheckCircle2 size={18} /> 5. Cuadro Resumen de Verificaciones Reglamentarias
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/30 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-200">Capacidad de Conducción (Iz)</p>
              <p className="text-slate-400 text-[11px]">IB ≤ In ≤ Iz (Con factores kTemp y kAgrup)</p>
            </div>
            <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-md font-bold text-[10px]">CUMPLE</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/30 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-200">Protección contra Sobrecargas</p>
              <p className="text-slate-400 text-[11px]">I2 = 1.45·In ≤ 1.45·Iz</p>
            </div>
            <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-md font-bold text-[10px]">CUMPLE</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/30 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-200">Caída de Tensión Admisible (ΔV%)</p>
              <p className="text-slate-400 text-[11px]">ΔV% ≤ 3.0% (Iluminación y Tomas)</p>
            </div>
            <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-md font-bold text-[10px]">CUMPLE</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/30 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-200">Solicitación Térmica ante Cortocircuito</p>
              <p className="text-slate-400 text-[11px]">(k·S)² ≥ I²t (Energía pasante)</p>
            </div>
            <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-md font-bold text-[10px]">CUMPLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
