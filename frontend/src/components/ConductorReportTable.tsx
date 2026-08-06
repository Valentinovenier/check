import React from 'react';
import { Project, Conductor } from '../types/project';

interface Props {
  project: Project;
  onDelete?: (index: number) => void;
}

export const ConductorReportTable: React.FC<Props> = ({ project, onDelete }) => {
  const conductores = project.informeConductores || [];

  if (conductores.length === 0) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-center text-slate-400">
        No hay conductores calculados guardados en el informe.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase bg-slate-950 text-slate-400">
          <tr>
            <th className="px-4 py-3">Tramo</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3">Destino</th>
            <th className="px-4 py-3">Cable</th>
            <th className="px-4 py-3">Sección</th>
            <th className="px-4 py-3">I. Adm.</th>
            <th className="px-4 py-3">Caída V.</th>
            {onDelete && <th className="px-4 py-3 text-right">Acción</th>}
            </tr>
            </thead>
            <tbody>
            {conductores.map((c, index) => {
            const res = c.resultadoCalculo;
            return (
              <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.tipoTramo || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{(c as any).origenNombre || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{(c as any).destinoNombre || '—'}</td>
                <td className="px-4 py-3 text-amber-400">{c.aislacion} {c.material} {c.normaCable || ''}</td>
                <td className="px-4 py-3 font-bold text-emerald-400">{res?.cable?.seccion ? `${res.cable.seccion} mm²` : '—'}</td>
                <td className="px-4 py-3">{res?.I_adm_corregida?.toFixed(1)} A</td>
                <td className="px-4 py-3">{res?.porcentajeCaida?.toFixed(2)}%</td>
                {onDelete && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(index)}
                      className="text-red-400 hover:text-red-300 text-xs uppercase font-bold"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            );
            })}
        </tbody>
      </table>
    </div>
  );
};
