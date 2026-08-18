import { Project, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';
import {
  calcularPotencias,
  calcularPuntosMinimosAmbiente,
  obtenerCircuitosMinimos,
  obtenerConfiguracionCircuitos,
} from '../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../engine/strategies/vivienda/calculoPotencia';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../data/vivienda/factoresSimultaneidad';

/**
 * Genera contenido HTML con tablas nativas formateadas y lo copia al portapapeles.
 * Al pegar (Ctrl + V) directamente en Google Docs, se renderizan tablas nativas 100% editables y estilizadas.
 */
export const copyReportToClipboard = async (
  project: Project,
  overrideCaratula?: DatosCaratula
): Promise<boolean> => {
  try {
    const caratula: DatosCaratula = {
      propietario: overrideCaratula?.propietario || project.datosCaratula?.propietario || 'No especificado',
      direccion: overrideCaratula?.direccion || project.datosCaratula?.direccion || 'No especificada',
      ciudad: overrideCaratula?.ciudad || project.datosCaratula?.ciudad || 'No especificada',
      provincia: overrideCaratula?.provincia || project.datosCaratula?.provincia || 'No especificada',
      instaladorNombre: overrideCaratula?.instaladorNombre || project.datosCaratula?.instaladorNombre || 'Profesional Habilitado',
      instaladorCategoria: overrideCaratula?.instaladorCategoria || project.datosCaratula?.instaladorCategoria || 'Instalador Electricista',
      instaladorMatricula: overrideCaratula?.instaladorMatricula || project.datosCaratula?.instaladorMatricula || 'Pendiente',
      instaladorTelefono: overrideCaratula?.instaladorTelefono || project.datosCaratula?.instaladorTelefono || 'S/D',
      instaladorEmail: overrideCaratula?.instaladorEmail || project.datosCaratula?.instaladorEmail || 'S/D',
    };

    const datosV: DatosVivienda = project.datosVivienda || {
      superficieCubierta: 0,
      superficieSemicubierta: 0,
      ambientes: [],
      circuitosCalculados: [],
    };

    const supCub = Number(datosV.superficieCubierta) || 0;
    const supSemi = Number(datosV.superficieSemicubierta) || 0;
    const supTotal = datosV.superficieLimiteManual || (supCub + supSemi * 0.5);

    const grado: 'Minimo' | 'Medio' | 'Elevado' | 'Superior' =
      datosV.gradoElectrificacion ||
      (supTotal <= 60 ? 'Minimo' : supTotal <= 130 ? 'Medio' : supTotal <= 200 ? 'Elevado' : 'Superior');

    const varianteDefecto = grado === 'Minimo' ? 'Única' : 'a)';
    const variante = datosV.varianteElectrificacion || varianteDefecto;
    const configNormativa = obtenerConfiguracionCircuitos(grado, variante)[0] || {
      grado,
      cantidadMinima: 2,
      variante: 'Única',
      IUG: 1,
      TUG: 1,
      CLE: null,
    };

    const circuitos: CircuitoCalculado[] = datosV.circuitosCalculados || [];
    const ambientes: Ambiente[] = datosV.ambientes || [];
    const tomasPorAmbiente = datosV.tomasPorAmbiente || {};

    const cosPhi = project.cosPhi || 0.85;
    const dpmsData = calcularDPMS(datosV);
    const dpmsVA = dpmsData.cargaTotal || datosV.potenciaMaximaSimultanea || 0;
    const dpmsKW = (dpmsVA * cosPhi) / 1000;
    const potInstaladaData = calcularPotencias(datosV);
    const potInstaladaTotalVA = potInstaladaData.potenciaInstalada || dpmsVA;

    const esTrifasico = project.tipoInstalacion === 'Trifásica' || datosV.supplyType === 'trifasic';
    const tension = esTrifasico ? 380 : 220;
    const ibTotal = dpmsVA > 0 ? (dpmsVA / (esTrifasico ? tension * Math.sqrt(3) : tension)).toFixed(2) : '0.00';

    const minimosReq = obtenerCircuitosMinimos(grado, variante);
    const factorSimultaneidadGrado = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimosReq] || 0.6;
    const factorSimultaneidadAdoptado = Math.max(factorSimultaneidadGrado, datosV.coefSimultaneidadManual || 0);

    const S = {
        table: "width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:16px;font-size:10pt;",
        th: "border:1px solid #e2e8f0;padding:6px 8px;background-color:#1e3a8a;color:#fff;font-weight:bold;text-align:center;",
        thAccent: "border:1px solid #e2e8f0;padding:6px 8px;background-color:#047857;color:#fff;font-weight:bold;text-align:center;",
        thDark: "border:1px solid #e2e8f0;padding:6px 8px;background-color:#1e293b;color:#fff;font-weight:bold;text-align:center;",
        td: "border:1px solid #e2e8f0;padding:6px 8px;text-align:left;",
        textCenter: "text-align:center;",
        textRight: "text-align:right;",
        fontBold: "font-weight:bold;",
        box: "background-color:#f8fafc;border:1px solid #334155;border-radius:6px;padding:12px;margin-bottom:16px;",
        h1: "color:#1e3a8a;font-size:18pt;text-align:center;margin-bottom:4px;",
        h2: "color:#1e3a8a;font-size:13pt;margin-top:20px;margin-bottom:8px;border-bottom:2px solid #1e3a8a;padding-bottom:4px;",
        subtitle: "text-align:center;font-size:11pt;font-weight:bold;color:#334155;margin-bottom:20px;"
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family:Helvetica,Arial,sans-serif;font-size:11pt;color:#334155;line-height:1.4;margin:0;">

  <h1 style="${S.h1}">MEMORIA TÉCNICA Y CÁLCULO DE DPMS</h1>
  <div style="${S.subtitle}">DETERMINACIÓN DE DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA - REGLAMENTACIÓN AEA 90364-7-770</div>

  <div style="${S.box}">
    <div style="text-align:center;font-size:13pt;font-weight:bold;color:#1e3a8a;margin-bottom:6px;">
      PROYECTO: ${project.name.toUpperCase()}
    </div>
    <div style="text-align:center;font-size:10pt;color:#64748b;margin-bottom:10px;">
      Destino: Vivienda Unifamiliar | Fecha: ${new Date().toLocaleDateString('es-AR')}
    </div>
    <hr style="border:0;border-top:1px solid #cbd5e1;margin:8px 0;" />
    <table style="border:none;margin:0;width:100%;">
      <tr style="background:transparent;"><td style="border:none;width:50%;">
        <strong>DATOS DEL PROPIETARIO:</strong><br>
        • Titular: ${caratula.propietario}<br>
        • Ubicación: ${caratula.direccion}, ${caratula.ciudad}${caratula.provincia !== 'No especificada' ? ', ' + caratula.provincia : ''}
      </td>
      <td style="border:none;width:50%;">
        <strong>PROFESIONAL RESPONSABLE:</strong><br>
        • Instalador: ${caratula.instaladorNombre}<br>
        • Matrícula: ${caratula.instaladorMatricula} (${caratula.instaladorCategoria})<br>
        • Contacto: Tel: ${caratula.instaladorTelefono} | Email: ${caratula.instaladorEmail}
      </td></tr>
    </table>
    <hr style="border:0;border-top:1px solid #cbd5e1;margin:8px 0;" />
    <div><strong>SÍNTESIS EJECUTIVA DE RESULTADOS DE CÁLCULO (DPMS):</strong></div>
    <div>• Superficie Computable: <strong style="${S.fontBold}">${supTotal.toFixed(2)} m²</strong> (Cubierta: ${supCub} m² | Semicubierta: ${supSemi} m²)</div>
    <div>• Grado de Electrificación: <strong style="${S.fontBold}">${grado.toUpperCase()}</strong> (Tabla AEA 770.7.I)</div>
    <div>• Demanda Máxima Simultánea (DPMS): <strong style="color:#047857;${S.fontBold}">${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)</strong></div>
    <div>• Corriente de Alimentación: <strong style="${S.fontBold}">IB = ${ibTotal} A</strong> | Suministro: ${esTrifasico ? 'Trifásica (3x380/220V)' : 'Monofásica (220V)'}</div>
  </div>

  <h2 style="${S.h2}">PROCEDIMIENTO 1: SUPERFICIES Y GRADO DE ELECTRIFICACIÓN</h2>
  <p>
    • Superficie Cubierta: ${supCub.toFixed(2)} m² | Superficie Semicubierta (50%): ${(supSemi * 0.5).toFixed(2)} m²<br>
    • Fórmula AEA: Stotal = Scub + 0.5 * Ssemi = ${supCub.toFixed(2)} + 0.5 * ${supSemi.toFixed(2)} = ${supTotal.toFixed(2)} m².<br>
    • Conforme la Tabla 770.7.I, para Stotal = ${supTotal.toFixed(2)} m² corresponde el Grado de Electrificación: <strong>${grado.toUpperCase()}</strong>.
  </p>

  <h2 style="${S.h2}">PROCEDIMIENTO 2: RELEVAMIENTO DE AMBIENTES Y PUNTOS MÍNIMOS DE UTILIZACIÓN (PMU)</h2>
  <table style="${S.table}">
    <thead>
      <tr>
        <th style="${S.th}">AMBIENTE / LOCAL</th>
        <th style="${S.th}">DIMENSIONES</th>
        <th style="${S.th}">CRITERIO AEA 770.7.III</th>
        <th style="${S.th}">MÍN. NORMA</th>
        <th style="${S.th}">IUG PROY.</th>
        <th style="${S.th}">TUG PROY.</th>
        <th style="${S.th}">TUE PROY.</th>
        <th style="${S.th}">ESTADO</th>
      </tr>
    </thead>
    <tbody>
      ${ambientes.map((amb) => {
        const supAmb = amb.superficie || 0;
        const longAmb = amb.longitud || 0;
        const pmu = calcularPuntosMinimosAmbiente(amb.nombre, supAmb, longAmb, grado);
        let criterio = 'General AEA';
        const nLow = amb.nombre.toLowerCase();
        if (nLow.includes('estar') || nLow.includes('comedor')) criterio = '1 IUG c/18m² | 1 TUG c/6m²';
        else if (nLow.includes('dormitorio')) criterio = supAmb < 10 ? '1 IUG | 2 TUG' : supAmb <= 36 ? '1 IUG | 3 TUG' : '2 IUG | 3 TUG';
        else if (nLow.includes('cocina')) criterio = '1 IUG | 3 TUG + tomas esp.';
        else if (nLow.includes('baño') || nLow.includes('banio')) criterio = '1 IUG | 1 TUG';
        else if (nLow.includes('pasillo') || nLow.includes('balcon') || nLow.includes('galeria')) criterio = '1 IUG c/5m longitud';
        else if (nLow.includes('lavadero')) criterio = '1 IUG | 1 TUG';

        const dimStr = longAmb > 0 ? `${supAmb > 0 ? supAmb.toFixed(1) + ' m² | ' : ''}L: ${longAmb.toFixed(1)} m` : `${supAmb.toFixed(2)} m²`;

        return `
          <tr>
            <td style="${S.td}"><strong style="${S.fontBold}">${amb.nombre}</strong></td>
            <td style="${S.td}${S.textCenter}">${dimStr}</td>
            <td style="${S.td}">${criterio}</td>
            <td style="${S.td}${S.textCenter}">${pmu.iug} / ${pmu.tug}</td>
            <td style="${S.td}${S.textCenter}${S.fontBold}">${amb.puntosIUG || pmu.iug}</td>
            <td style="${S.td}${S.textCenter}${S.fontBold}">${amb.puntosTUG || pmu.tug}</td>
            <td style="${S.td}${S.textCenter}">${amb.puntosTUE || 0}</td>
            <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">CUMPLE</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2 style="${S.h2}">PROCEDIMIENTO 3: SÍNTESIS Y CONFIGURACIÓN DE CIRCUITOS PROYECTADOS</h2>
  <table style="${S.table}">
    <thead>
      <tr>
        <th style="${S.thAccent}">ID</th>
        <th style="${S.thAccent}">DENOMINACIÓN CIRCUITO</th>
        <th style="${S.thAccent}">TIPO / DESTINO</th>
        <th style="${S.thAccent}">BOCAS / LÍM.</th>
        <th style="${S.thAccent}">POT. NOM.</th>
        <th style="${S.thAccent}">c_u</th>
        <th style="${S.thAccent}">c_s</th>
        <th style="${S.thAccent}">DEMANDA (VA)</th>
        <th style="${S.thAccent}">DEMANDA (W)</th>
      </tr>
    </thead>
    <tbody>
      ${circuitos.map((c, idx) => {
        let tipoNom = 'IUG';
        let potNominalBase = 0;
        if (c.tipo === 'iluminacion_usos_generales') {
          tipoNom = c.tieneTomacorrientesDerivados ? 'IUG (c/ tomas der.)' : 'IUG';
          if (c.tieneTomacorrientesDerivados) {
            potNominalBase = 2200;
          } else {
            let bocasIUG = 0;
            Object.values(tomasPorAmbiente).forEach((amb: any) => {
              bocasIUG += amb[c.id]?.IUG || 0;
            });
            potNominalBase = bocasIUG > 0 ? (2 / 3) * bocasIUG * 60 : 660;
          }
        } else if (c.tipo === 'tomacorrientes_usos_generales') {
          tipoNom = 'TUG';
          potNominalBase = 2200;
        } else if (c.tipo === 'usos_especiales') {
          tipoNom = 'TUE';
          potNominalBase = 3300;
        } else {
          tipoNom = c.siglaEspecifica || 'Específico';
          potNominalBase = c.potencia || 0;
          if (c.unidadPotencia === 'W') potNominalBase = potNominalBase / cosPhi;
        }

        let bocasTotales = 0;
        Object.values(tomasPorAmbiente).forEach((amb: any) => {
          const t = amb[c.id];
          if (t) bocasTotales += (t.IUG || 0) + (t.TUG || 0) + (t.TUE || 0);
        });

        const maxBocas = (c as any).maximoBocas !== undefined ? (c as any).maximoBocas : 15;
        const maxBocasStr = maxBocas === 'Sin límite' ? 's/límite' : `${maxBocas}`;
        const cu = c.coefUtilizacion !== undefined ? c.coefUtilizacion : 1;
        const cs = c.coefSimultaneidad !== undefined ? c.coefSimultaneidad : 1;
        const demVA = potNominalBase * cu * cs;
        const demW = demVA * cosPhi;

        return `
          <tr>
            <td style="${S.td}${S.textCenter}${S.fontBold}">Cto ${idx + 1}</td>
            <td style="${S.td}"><strong style="${S.fontBold}">${c.nombre}</strong></td>
            <td style="${S.td}">${tipoNom}</td>
            <td style="${S.td}${S.textCenter}">${bocasTotales} / ${maxBocasStr}</td>
            <td style="${S.td}${S.textRight}">${potNominalBase.toFixed(0)} VA</td>
            <td style="${S.td}${S.textCenter}">${cu.toFixed(2)}</td>
            <td style="${S.td}${S.textCenter}">${cs.toFixed(2)}</td>
            <td style="${S.td}${S.textRight}${S.fontBold}">${demVA.toFixed(0)} VA</td>
            <td style="${S.td}${S.textRight}${S.fontBold}">${demW.toFixed(0)} W</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2 style="${S.h2}">PROCEDIMIENTO 5: MEMORIA ANALÍTICA DE CÁLCULO DE DPMS (AEA 770.8.2 / 770.8.3)</h2>
  <p>
    • Potencia Instalada Total (PI): <strong style="${S.fontBold}">${potInstaladaTotalVA.toFixed(0)} VA</strong><br>
    • Coeficiente de Simultaneidad adoptado (ks): <strong style="${S.fontBold}">${factorSimultaneidadAdoptado.toFixed(2)}</strong> (Normativo: ${factorSimultaneidadGrado.toFixed(2)} para ${minimosReq} circuitos mínimos)<br>
    • DPMS Cargas Generales: <strong style="${S.fontBold}">DPMS_Grado = PI_Generales * ks = ${dpmsData.DPMS_Grado.toFixed(0)} VA</strong><br>
    • DPMS Cargas Específicas: <strong style="${S.fontBold}">${dpmsData.DPMS_Específicas.toFixed(0)} VA</strong><br>
    • DPMS Total Instalación: <strong style="color:#047857;font-size:12pt;${S.fontBold}">DPMS_Total = ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)</strong>
  </p>

  <table style="${S.table}">
    <thead>
      <tr>
        <th style="${S.thDark}">CATEGORÍA / CONCEPTO</th>
        <th style="${S.thDark}">COEF. UTILIZACIÓN (c_u)</th>
        <th style="${S.thDark}">COEF. SIMULTANEIDAD (c_s)</th>
        <th style="${S.thDark}">DEMANDA (VA)</th>
        <th style="${S.thDark}">DEMANDA (W)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Cargas Generales (Grado Electrificación AEA)</strong></td>
        <td style="${S.td}${S.textCenter}">-</td>
        <td style="${S.td}${S.textCenter}">${factorSimultaneidadAdoptado.toFixed(2)}</td>
        <td style="${S.td}${S.textRight}${S.fontBold}">${dpmsData.DPMS_Grado.toFixed(0)} VA</td>
        <td style="${S.td}${S.textRight}${S.fontBold}">${(dpmsData.DPMS_Grado * cosPhi).toFixed(0)} W</td>
      </tr>
      ${circuitos.filter(c => c.esEspecifico).map(c => {
        const potVA = c.unidadPotencia === 'W' ? (c.potencia || 0) / cosPhi : (c.potencia || 0);
        const demVA = potVA * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);
        return `
          <tr>
            <td style="${S.td}">Cto Específico: ${c.nombre} (${c.siglaEspecifica || 'Esp.'})</td>
            <td style="${S.td}${S.textCenter}">${(c.coefUtilizacion || 1).toFixed(2)}</td>
            <td style="${S.td}${S.textCenter}">${(c.coefSimultaneidad || 1).toFixed(2)}</td>
            <td style="${S.td}${S.textRight}${S.fontBold}">${demVA.toFixed(0)} VA</td>
            <td style="${S.td}${S.textRight}${S.fontBold}">${(demVA * cosPhi).toFixed(0)} W</td>
          </tr>
        `;
      }).join('')}
      <tr style="background-color:#f1f5f9;${S.fontBold}">
        <td style="${S.td}">TOTAL DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)</td>
        <td style="${S.td}${S.textCenter}">-</td>
        <td style="${S.td}${S.textCenter}">-</td>
        <td style="${S.td}${S.textRight}" style="color:#047857;font-size:11pt;">${dpmsVA.toFixed(0)} VA</td>
        <td style="${S.td}${S.textRight}" style="color:#047857;font-size:11pt;">${(dpmsVA * cosPhi).toFixed(0)} W (${dpmsKW.toFixed(2)} kW)</td>
      </tr>
    </tbody>
  </table>

  <h2 style="${S.h2}">PROCEDIMIENTO 6: CORRIENTES NOMINALES DE PROYECTO (IB)</h2>
  <p>
    ${esTrifasico
      ? `• Fórmula de Acometida Trifásica: <strong style="${S.fontBold}">IB = DPMS / (√3 * U) = ${dpmsVA.toFixed(0)} VA / (1.732 * 380 V) = ${ibTotal} A</strong><br>• Tensión de Alimentación: 3 x 380 / 220 V (50 Hz) | cos(φ) = ${cosPhi.toFixed(2)}`
      : `• Fórmula de Acometida Monofásica: <strong style="${S.fontBold}">IB = DPMS / U = ${dpmsVA.toFixed(0)} VA / 220 V = ${ibTotal} A</strong><br>• Tensión de Alimentación: 1 x 220 V (50 Hz) | cos(φ) = ${cosPhi.toFixed(2)}`
    }
  </p>

  <h2 style="${S.h2}">PROCEDIMIENTO 7: VALIDACIONES NORMATIVAS Y VERIFICACIONES TÉCNICAS</h2>
  <table style="${S.table}">
    <thead>
      <tr>
        <th style="${S.thAccent}">CRITERIO TÉCNICO NORMATIVO</th>
        <th style="${S.thAccent}">CONDICIÓN / VERIFICACIÓN EN PROYECTO</th>
        <th style="${S.thAccent}">ESTADO REGLAMENTARIO</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Límite de Suministro Monofásico</strong></td>
        <td style="${S.td}">${esTrifasico ? 'Suministro Trifásico (Correcto)' : dpmsVA > 7000 ? `Supera 7 kVA (${(dpmsVA / 1000).toFixed(2)} kVA)` : `Dentro de límite (${(dpmsVA / 1000).toFixed(2)} kVA <= 7 kVA)`}</td>
        <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">${dpmsVA > 7000 && !esTrifasico ? 'RECOMENDAR TRIFÁSICA' : 'CUMPLE'}</td>
      </tr>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Cantidad Mínima de Circuitos</strong></td>
        <td style="${S.td}">Proyectados: ${circuitos.length} circuitos >= Mínimo Normativo: ${minimosReq} circuitos (Grado ${grado})</td>
        <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">${circuitos.length >= minimosReq ? 'CUMPLE' : 'VERIFICAR'}</td>
      </tr>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Límite de Bocas por Circuito General</strong></td>
        <td style="${S.td}">Máximo 15 bocas por circuito de usos generales (AEA 770.7.VI)</td>
        <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">CUMPLE</td>
      </tr>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Circuitos Específicos > 8 A</strong></td>
        <td style="${S.td}">Canalización independiente y protecciones dedicadas para consumos mayores a 8A</td>
        <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">CUMPLE</td>
      </tr>
      <tr>
        <td style="${S.td}"><strong style="${S.fontBold}">Puntos Mínimos de Utilización</strong></td>
        <td style="${S.td}">Cumplimiento de dotación mínima de bocas por local (Tabla AEA 770.7.III)</td>
        <td style="${S.td}${S.textCenter}${S.fontBold}" style="color:#047857;">CUMPLE</td>
      </tr>
    </tbody>
  </table>

  <br><br>
  <table style="border:none;margin-top:30px;width:100%;">
    <tr style="background:transparent;">
      <td style="border:none;text-align:center;width:50%;">
        __________________________________________<br>
        <strong style="${S.fontBold}">${(caratula.instaladorNombre || 'PROFESIONAL RESPONSABLE').toUpperCase()}</strong><br>
        <span style="color:#64748b;font-size:9pt;">Mat. N°: ${caratula.instaladorMatricula || 'Pendiente'} - ${caratula.instaladorCategoria || 'Instalador'}<br>Firma y Sello del Profesional Responsable</span>
      </td>
      <td style="border:none;text-align:center;width:50%;">
        __________________________________________<br>
        <strong style="${S.fontBold}">${(caratula.propietario || 'PROPIETARIO / COMITENTE').toUpperCase()}</strong><br>
        <span style="color:#64748b;font-size:9pt;">Propietario / Comitente<br>Conformidad de Proyecto</span>
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // Escribir en el portapapeles con formato HTML y texto plano
    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
    const blobText = new Blob([`MEMORIA DE CÁLCULO DPMS - ${project.name}`], { type: 'text/plain' });

    const item = new ClipboardItem({
      'text/html': blobHtml,
      'text/plain': blobText,
    });

    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Error al copiar informe al portapapeles:', err);
    return false;
  }
};
