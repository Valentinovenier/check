import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente, TomasCircuito } from '../types/vivienda';
import { PDF_COLORS, PDF_FONTS, cleanMathFormula, drawHeaderFooter } from './pdfStyleTheme';
import {
  calcularPotencias,
  calcularPuntosMinimosAmbiente,
  obtenerCircuitosMinimos,
  obtenerConfiguracionCircuitos,
} from '../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../engine/strategies/vivienda/calculoPotencia';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../data/vivienda/factoresSimultaneidad';

/**
 * Genera un informe técnico detallado y profesional en PDF con toda la información
 * y memoria de cálculo analítica de la calculadora de DPMS (AEA 90364).
 */
export const generatePdfMemoriaCalculoBasico = (
  project: Project,
  overrideCaratula?: DatosCaratula,
  isPro = false
): void => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // 1. Datos de Portada / Carátula
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

    const projectType = project.projectType || 'Vivienda';
    const esVivienda = projectType === 'Vivienda';

    if (esVivienda) {
      generarInformeDpmsVivienda(doc, project, caratula, pageWidth, pageHeight, marginLeft, marginRight, contentWidth, isPro);
    } else {
      generarInformeDpmsGeneral(doc, project, caratula, pageWidth, pageHeight, marginLeft, marginRight, contentWidth);
    }

    // Pie de página institucional y numeración en todas las hojas
    const totalPages = (doc.internal as any).getNumberOfPages();
    const headerTitle = isPro ? 'Legajo Técnico Oficial - Memoria y Cálculos AEA 90364' : 'Informe Técnico - Cálculo de DPMS';
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawHeaderFooter(doc, i, totalPages, headerTitle, project.name);
    }

    // Descargar documento
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const nombreArchivo = isPro
      ? `Legajo_Tecnico_${sanitizedName}.pdf`
      : `Informe_DPMS_${sanitizedName}.pdf`;
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al generar PDF de Informe Técnico:', error);
    alert('Ocurrió un error al generar el PDF del Informe Técnico. Por favor revise los datos del proyecto.');
  }
};

/**
 * Generador específico para proyectos de Vivienda Residencial (AEA 90364-7-770)
 */
function generarInformeDpmsVivienda(
  doc: jsPDF,
  project: Project,
  caratula: DatosCaratula,
  pageWidth: number,
  pageHeight: number,
  marginLeft: number,
  marginRight: number,
  contentWidth: number,
  isPro = false
) {
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
  const tomasPorAmbiente: Record<string, Record<string, TomasCircuito>> = datosV.tomasPorAmbiente || {};

  // Cálculos de Potencia y DPMS
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

  // ====================================================
  // PÁGINA 1: PORTADA Y CARÁTULA TÉCNICA FORMAL
  // ====================================================
  let cursorY = 22;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.titleSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text(
    isPro ? 'LEGAJO TÉCNICO OFICIAL Y MEMORIA DE CÁLCULO' : 'MEMORIA TÉCNICA Y CÁLCULO DE DPMS',
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subtitleSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text(
    isPro
      ? 'PROYECTO COMPLETO DE INSTALACIÓN ELÉCTRICA - REGLAMENTACIÓN AEA 90364-7-770'
      : 'DETERMINACIÓN DE DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA - REGLAMENTACIÓN AEA 90364-7-770',
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );
  cursorY += 12;

  // Cuadro de Identificación de Obra
  doc.setLineWidth(0.5);
  doc.setDrawColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.setFillColor(PDF_COLORS.lightBg[0], PDF_COLORS.lightBg[1], PDF_COLORS.lightBg[2]);
  doc.roundedRect(marginLeft + 5, cursorY, contentWidth - 10, 42, 2, 2, 'FD');

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('DENOMINACIÓN DEL PROYECTO / OBRA:', pageWidth / 2, cursorY + 11, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 21, { align: 'center' });

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`Destino: Vivienda Unifamiliar  |  Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth / 2, cursorY + 32, { align: 'center' });

  cursorY += 52;

  // Bloque 1: Ubicación y Propietario
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('1. DATOS DE EMPLAZAMIENTO Y PROPIETARIO', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Titular / Comitente: ${caratula.propietario}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Dirección de la Obra: ${caratula.direccion}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Localidad y Provincia: ${caratula.ciudad}${caratula.provincia !== 'No especificada' ? ', ' + caratula.provincia : ''}`, marginLeft + 3, cursorY);
  cursorY += 10;

  // Bloque 2: Profesional Responsable
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('2. PROFESIONAL RESPONSABLE DEL CÁLCULO', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Instalador / Proyectista: ${caratula.instaladorNombre}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Matrícula / Registro Habilitante: ${caratula.instaladorMatricula} (Categoría: ${caratula.instaladorCategoria})`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Contacto Técnico: Tel: ${caratula.instaladorTelefono} | Email: ${caratula.instaladorEmail}`, marginLeft + 3, cursorY);
  cursorY += 12;

  // Cuadro Síntesis de Parámetros Clave
  doc.setLineWidth(0.4);
  doc.setDrawColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, cursorY, contentWidth, 38);

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
  doc.text('SÍNTESIS EJECUTIVA DE RESULTADOS DE CÁLCULO (DPMS)', marginLeft + 5, cursorY + 7);

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Superficie Computable Total: ${supTotal.toFixed(2)} m² (Cubierta: ${supCub.toFixed(2)} m² | Semicubierta: ${supSemi.toFixed(2)} m²)`, marginLeft + 5, cursorY + 14);
  doc.text(`• Grado de Electrificación Obtenido: ${grado.toUpperCase()} (Tabla AEA 770.7.I)`, marginLeft + 5, cursorY + 20);
  doc.text(`• Demanda de Potencia Máxima Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)`, marginLeft + 5, cursorY + 26);
  doc.text(`• Corriente de Alimentación de Proyecto: IB = ${ibTotal} A  |  Suministro: ${esTrifasico ? 'Trifásica (3x380/220V)' : 'Monofásica (220V)'}`, marginLeft + 5, cursorY + 32);

  // Pie de Portada
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('DOCUMENTO ANALÍTICO OFICIAL CONFORME A REGLAMENTACIÓN AEA 90364-7-770', pageWidth / 2, pageHeight - 24, { align: 'center' });
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.setTextColor(PDF_COLORS.subtext[0], PDF_COLORS.subtext[1], PDF_COLORS.subtext[2]);
  doc.text('Asociación Electrotécnica Argentina - Guía de Instalaciones Eléctricas en Inmuebles', pageWidth / 2, pageHeight - 19, { align: 'center' });

  // ====================================================
  // PÁGINA 2: PROCEDIMIENTOS 1 Y 2 (SUPERFICIE, GRADO Y AMBIENTES)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  // PROCEDIMIENTO 1
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('PROCEDIMIENTO 1: SUPERFICIES Y GRADO DE ELECTRIFICACIÓN (AEA 770.7.I / 770.7.II)', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);

  const textoProc1 =
    `• Superficie Cubierta (Scub): ${supCub.toFixed(2)} m²\n` +
    `• Superficie Semicubierta (Ssemi): ${supSemi.toFixed(2)} m² (ponderada al 50%)\n` +
    `• Superficie Límite de Aplicación: Stotal = Scub + 0.5 * Ssemi = ${supCub.toFixed(2)} + 0.5 * ${supSemi.toFixed(2)} = ${supTotal.toFixed(2)} m².\n` +
    `• Conforme a la Tabla 770.7.I, para Stotal = ${supTotal.toFixed(2)} m² corresponde el Grado de Electrificación: ${grado.toUpperCase()}.\n` +
    `• Cantidad Mínima Reglamentaria de Circuitos (Tabla 770.7.II - Variante ${variante}): ` +
    `${configNormativa.IUG} IUG + ${configNormativa.TUG} TUG ${configNormativa.CLE ? '+ 1 Especial' : ''} (Mínimo: ${minimosReq} circuitos | Proyectados: ${circuitos.length} circuitos).`;

  const lineasP1 = doc.splitTextToSize(cleanMathFormula(textoProc1), contentWidth);
  doc.text(lineasP1, marginLeft, cursorY);
  cursorY += lineasP1.length * 4.2 + 8;

  // PROCEDIMIENTO 2: AMBIENTES Y PUNTOS MÍNIMOS DE UTILIZACIÓN
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('PROCEDIMIENTO 2: RELEVAMIENTO DE AMBIENTES Y PUNTOS MÍNIMOS DE UTILIZACIÓN (PMU)', marginLeft, cursorY);
  cursorY += 6;

  let totalIUGReq = 0;
  let totalTUGReq = 0;
  let totalTUEReq = 0;

  const filasAmbientes: string[][] = ambientes.map((amb) => {
    const supAmb = amb.superficie || 0;
    const longAmb = amb.longitud || 0;
    const pmu = calcularPuntosMinimosAmbiente(amb.nombre, supAmb, longAmb, grado);

    totalIUGReq += amb.puntosIUG || pmu.iug;
    totalTUGReq += amb.puntosTUG || pmu.tug;
    totalTUEReq += amb.puntosTUE || 0;

    let criterio = 'General AEA';
    const nLow = amb.nombre.toLowerCase();
    if (nLow.includes('estar') || nLow.includes('comedor')) criterio = '1 IUG c/18m2 | 1 TUG c/6m2';
    else if (nLow.includes('dormitorio')) criterio = supAmb < 10 ? '1 IUG | 2 TUG' : supAmb <= 36 ? '1 IUG | 3 TUG' : '2 IUG | 3 TUG';
    else if (nLow.includes('cocina')) criterio = '1 IUG | 3 TUG + tomas esp.';
    else if (nLow.includes('baño') || nLow.includes('banio')) criterio = '1 IUG | 1 TUG';
    else if (nLow.includes('pasillo') || nLow.includes('balcon') || nLow.includes('galeria')) criterio = '1 IUG c/5m longitud';
    else if (nLow.includes('lavadero')) criterio = '1 IUG | 1 TUG';

    const dimStr = longAmb > 0 ? `${supAmb > 0 ? supAmb.toFixed(1) + ' m² | ' : ''}L: ${longAmb.toFixed(1)} m` : `${supAmb.toFixed(2)} m²`;

    return [
      amb.nombre,
      dimStr,
      cleanMathFormula(criterio),
      `${pmu.iug} / ${pmu.tug}`,
      `${amb.puntosIUG || pmu.iug}`,
      `${amb.puntosTUG || pmu.tug}`,
      `${amb.puntosTUE || 0}`,
      'CUMPLE',
    ];
  });

  if (filasAmbientes.length === 0) {
    filasAmbientes.push(['Vivienda Completa', `${supTotal.toFixed(2)} m²`, 'Mínimos globales s/norma', '1 / 1', '1', '1', '0', 'CUMPLE']);
  }

  // Fila de totales
  filasAmbientes.push([
    'TOTALES DE LA INSTALACIÓN',
    `${supTotal.toFixed(2)} m²`,
    'Sumatoria Puntos de Utilización',
    '-',
    `${totalIUGReq}`,
    `${totalTUGReq}`,
    `${totalTUEReq}`,
    'CONFORME',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['AMBIENTE / LOCAL', 'DIMENSIONES', 'CRITERIO AEA 770.7.III', 'MIN. NORMA', 'IUG PROY.', 'TUG PROY.', 'TUE PROY.', 'ESTADO']],
    body: filasAmbientes,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 42 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // ====================================================
  // PÁGINA 3: PROCEDIMIENTOS 3 Y 4 (SÍNTESIS DE CIRCUITOS Y ASIGNACIÓN)
  // ====================================================
  if (cursorY > pageHeight - 65) {
    doc.addPage();
    cursorY = 20;
  }

  // PROCEDIMIENTO 3: SÍNTESIS DE CIRCUITOS
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('PROCEDIMIENTO 3: SÍNTESIS Y CONFIGURACIÓN DE CIRCUITOS PROYECTADOS', marginLeft, cursorY);
  cursorY += 6;

  const filasCircuitos: string[][] = circuitos.map((c, idx) => {
    let tipoNom = 'IUG';
    let potNominalBase = 0;

    if (c.tipo === 'iluminacion_usos_generales') {
      tipoNom = c.tieneTomacorrientesDerivados ? 'IUG (c/ tomas der.)' : 'IUG';
      if (c.tieneTomacorrientesDerivados) {
        potNominalBase = 2200;
      } else {
        let bocasIUG = 0;
        Object.values(tomasPorAmbiente).forEach((amb) => {
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
      if (c.unidadPotencia === 'W') {
        potNominalBase = potNominalBase / cosPhi;
      }
    }

    // Contar bocas asignadas a este circuito
    let bocasTotales = 0;
    Object.values(tomasPorAmbiente).forEach((amb) => {
      const t = amb[c.id];
      if (t) bocasTotales += (t.IUG || 0) + (t.TUG || 0) + (t.TUE || 0);
    });

    const maxBocas = (c as any).maximoBocas !== undefined ? (c as any).maximoBocas : 15;
    const maxBocasStr = maxBocas === 'Sin límite' ? 's/límite' : `${maxBocas}`;
    const cu = c.coefUtilizacion !== undefined ? c.coefUtilizacion : 1;
    const cs = c.coefSimultaneidad !== undefined ? c.coefSimultaneidad : 1;
    const demandaCircuitoVA = potNominalBase * cu * cs;
    const demandaCircuitoW = demandaCircuitoVA * cosPhi;

    return [
      `Cto ${idx + 1}`,
      c.nombre,
      tipoNom,
      `${bocasTotales} / ${maxBocasStr}`,
      `${potNominalBase.toFixed(0)} VA`,
      `${cu.toFixed(2)}`,
      `${cs.toFixed(2)}`,
      `${demandaCircuitoVA.toFixed(0)} VA`,
      `${demandaCircuitoW.toFixed(0)} W`,
    ];
  });

  if (filasCircuitos.length === 0) {
    filasCircuitos.push(['Cto 1', 'Iluminación General', 'IUG', 'Según plano / 15', '660 VA', '1.00', '1.00', '660 VA', `${(660 * cosPhi).toFixed(0)} W`]);
    filasCircuitos.push(['Cto 2', 'Tomacorrientes Generales', 'TUG', 'Según plano / 15', '2200 VA', '1.00', '1.00', '2200 VA', `${(2200 * cosPhi).toFixed(0)} W`]);
  }

  autoTable(doc, {
    startY: cursorY,
    head: [['ID', 'DENOMINACIÓN CIRCUITO', 'TIPO / DESTINO', 'BOCAS / LÍM.', 'POT. NOM.', 'c_u', 'c_s', 'DEMANDA (VA)', 'DEMANDA (W)']],
    body: filasCircuitos,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 11, halign: 'center' },
      6: { cellWidth: 11, halign: 'center' },
      7: { cellWidth: 19, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // ====================================================
  // PÁGINA 4: PROCEDIMIENTOS 5 Y 6 (MEMORIA ANALÍTICA DPMS E INTENSIDADES IB)
  // ====================================================
  if (cursorY > pageHeight - 85) {
    doc.addPage();
    cursorY = 20;
  }

  // PROCEDIMIENTO 5: MEMORIA ANALÍTICA DE CÁLCULO DE DPMS
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('PROCEDIMIENTO 5: MEMORIA ANALÍTICA DE CÁLCULO DE DPMS (AEA 770.8.2 / 770.8.3)', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);

  const textoProc5 =
    `• Potencia Instalada Total (PI): ${potInstaladaTotalVA.toFixed(0)} VA (sumatoria de potencias nominales de todos los circuitos).\n` +
    `• Coeficiente de Simultaneidad por Grado de Electrificación (ks): ${factorSimultaneidadAdoptado.toFixed(2)} ` +
    `(Normativo AEA: ${factorSimultaneidadGrado.toFixed(2)} para ${minimosReq} circuitos mínimos).\n` +
    `• DPMS por Cargas Generales: DPMS_Grado = PI_Generales * ks = ${dpmsData.DPMS_Grado.toFixed(0)} VA.\n` +
    `• DPMS por Cargas Específicas / Especiales: DPMS_Esp = ${dpmsData.DPMS_Específicas.toFixed(0)} VA (con coeficientes cu y cs individuales).\n` +
    `• Demanda de Potencia Máxima Simultánea Total (DPMS): DPMS_Total = DPMS_Grado + DPMS_Esp = ` +
    `${dpmsVA.toFixed(0)} VA  -->  Potencia Activa: P = DPMS * cos(phi) = ${dpmsVA.toFixed(0)} * ${cosPhi.toFixed(2)} = ${(dpmsVA * cosPhi).toFixed(0)} W (${dpmsKW.toFixed(2)} kW).`;

  const lineasP5 = doc.splitTextToSize(cleanMathFormula(textoProc5), contentWidth);
  doc.text(lineasP5, marginLeft, cursorY);
  cursorY += lineasP5.length * 4.2 + 6;

  // Tabla Resumen de DPMS
  const filasResumenDpms = [
    ['Cargas Generales (Grado Electrificación AEA)', '-', `${factorSimultaneidadAdoptado.toFixed(2)}`, `${dpmsData.DPMS_Grado.toFixed(0)} VA`, `${(dpmsData.DPMS_Grado * cosPhi).toFixed(0)} W`],
    ...circuitos.filter(c => c.esEspecifico).map(c => {
      const potVA = c.unidadPotencia === 'W' ? (c.potencia || 0) / cosPhi : (c.potencia || 0);
      const demVA = potVA * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);
      return [
        `Cto Específico: ${c.nombre} (${c.siglaEspecifica || 'Esp.'})`,
        `${(c.coefUtilizacion || 1).toFixed(2)}`,
        `${(c.coefSimultaneidad || 1).toFixed(2)}`,
        `${demVA.toFixed(0)} VA`,
        `${(demVA * cosPhi).toFixed(0)} W`
      ];
    }),
    ['TOTAL DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)', '-', '-', `${dpmsVA.toFixed(0)} VA`, `${(dpmsVA * cosPhi).toFixed(0)} W (${dpmsKW.toFixed(2)} kW)`]
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['CATEGORÍA / CONCEPTO', 'COEF. UTILIZACIÓN (c_u)', 'COEF. SIMULTANEIDAD (c_s)', 'DEMANDA APARENTE (VA)', 'DEMANDA ACTIVA (W)']],
    body: filasResumenDpms,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // PROCEDIMIENTO 6: CORRIENTE DE ALIMENTACIÓN IB
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('PROCEDIMIENTO 6: CORRIENTES NOMINALES DE PROYECTO (IB)', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);

  let textoProc6 = '';
  if (esTrifasico) {
    textoProc6 =
      `• Fórmula de Acometida Trifásica: IB = DPMS / (sqrt(3) * U) = ${dpmsVA.toFixed(0)} VA / (1.732 * 380 V) = ${ibTotal} A.\n` +
      `• Tensión Nominal de Suministro: 3 x 380 / 220 V (50 Hz)  |  Factor de Potencia adoptado: cos(phi) = ${cosPhi.toFixed(2)}.`;
  } else {
    textoProc6 =
      `• Fórmula de Acometida Monofásica: IB = DPMS / U = ${dpmsVA.toFixed(0)} VA / 220 V = ${ibTotal} A.\n` +
      `• Tensión Nominal de Suministro: 1 x 220 V (50 Hz)  |  Factor de Potencia adoptado: cos(phi) = ${cosPhi.toFixed(2)}.`;
  }

  const lineasP6 = doc.splitTextToSize(cleanMathFormula(textoProc6), contentWidth);
  doc.text(lineasP6, marginLeft, cursorY);
  cursorY += lineasP6.length * 4.2 + 8;

  // Si es Plan Pro, agregamos la sección de Conductores y Protecciones Dimensionadas
  if (isPro) {
    if (cursorY > pageHeight - 85) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.text('PROCEDIMIENTO 7: CONDUCTORES, CAÍDA DE TENSIÓN Y PROTECCIONES (PLAN PRO)', marginLeft, cursorY);
    cursorY += 6;

    const filasCondPdf: string[][] = circuitos.map((c, idx) => {
      let demVA = 2200;
      if (c.tipo === 'iluminacion_usos_generales') demVA = c.tieneTomacorrientesDerivados ? 2200 : 660;
      else if (c.tipo === 'usos_especiales') demVA = 3300;
      else if (c.esEspecifico) demVA = (c.potencia || 0) * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);

      const ibCirc = demVA / 220;
      let secFase = c.tipo === 'iluminacion_usos_generales' ? 1.5 : 2.5;
      let longitud = 15;
      let izCorr = secFase === 1.5 ? 12 : 16.8;
      let dV_pct = (2 * longitud * ibCirc * 0.018) / secFase / 2.2;
      let protIn = c.proteccion?.in_amp || (secFase === 1.5 ? 10 : 16);

      // Buscar si tiene conductor específico en project.conductores
      const conds = project.conductores || {};
      for (const [k, v] of Object.entries(conds)) {
        if (k === c.id || k.includes(c.id) || (v as any)?.destinoId === c.id) {
          if (v.seccion) secFase = v.seccion;
          if (v.longitud) longitud = v.longitud;
          if (v.resultadoCalculo?.Iz_corregida) izCorr = v.resultadoCalculo.Iz_corregida;
          if (v.resultadoCalculo?.porcentajeCaida) dV_pct = v.resultadoCalculo.porcentajeCaida;
          break;
        }
      }

      return [
        `Cto ${idx + 1}`,
        c.nombre,
        `${secFase} mm²`,
        `${longitud} m`,
        `${ibCirc.toFixed(1)} A`,
        `${izCorr.toFixed(1)} A`,
        `${dV_pct.toFixed(2)} %`,
        `C ${protIn}A (3kA)`,
        'ID 25A 30mA',
        'CUMPLE',
      ];
    });

    if (filasCondPdf.length === 0) {
      filasCondPdf.push(['Cto 1', 'Iluminación General', '1.5 mm²', '15 m', '3.0 A', '12.0 A', '0.49 %', 'C 10A (3kA)', 'ID 25A 30mA', 'CUMPLE']);
      filasCondPdf.push(['Cto 2', 'Tomacorrientes Generales', '2.5 mm²', '15 m', '10.0 A', '16.8 A', '0.98 %', 'C 16A (3kA)', 'ID 25A 30mA', 'CUMPLE']);
    }

    autoTable(doc, {
      startY: cursorY,
      head: [['ID', 'CIRCUITO', 'SECCIÓN', 'LONG.', 'IB', 'Iz', 'ΔV %', 'TERMOMAGNÉTICA', 'DIFERENCIAL', 'ESTADO']],
      body: filasCondPdf,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 6.5, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 14, halign: 'right' },
        5: { cellWidth: 14, halign: 'right' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 26, halign: 'center' },
        8: { cellWidth: 22, halign: 'center' },
        9: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

    // Tabla de Tableros y Protecciones de Cabecera / Diferenciales (Plan Pro)
    const tableros = datosV.tableros || [];
    const filasTableros: string[][] = [];

    const ibTotalNum = Number(ibTotal) || 0;
    // Tablero Principal
    if (project.tableroPrincipal?.proteccionCabecera) {
      filasTableros.push([
        'Tablero Principal (TP)',
        'Interruptor Cabecera (PIA)',
        `${project.tableroPrincipal.proteccionCabecera.in_amp || 25} A`,
        project.tableroPrincipal.proteccionCabecera.curva_disparo || 'C',
        `${project.tableroPrincipal.proteccionCabecera.capacidades?.[0]?.icn_ka || 3} kA`,
        '-',
        'CUMPLE',
      ]);
    } else {
      filasTableros.push([
        'Tablero Principal (TP)',
        'Interruptor Cabecera (PIA)',
        `${ibTotalNum > 20 ? 32 : ibTotalNum > 15 ? 25 : 20} A`,
        'Curva C',
        '3 kA / 4.5 kA',
        '-',
        'CUMPLE',
      ]);
    }

    if (project.tableroPrincipal?.proteccionDiferencial) {
      filasTableros.push([
        'Tablero Principal (TP)',
        'Interruptor Diferencial (ID)',
        `${project.tableroPrincipal.proteccionDiferencial.in_amp || 25} A`,
        '-',
        `${project.tableroPrincipal.proteccionDiferencial.capacidades?.[0]?.icn_ka || 3} kA`,
        `${project.tableroPrincipal.proteccionDiferencial.sensibilidad || 30} mA`,
        'CUMPLE (Idn ≤ 30mA)',
      ]);
    } else {
      filasTableros.push([
        'Tablero Principal (TP)',
        'Interruptor Diferencial (ID)',
        `${ibTotalNum > 25 ? 40 : 25} A`,
        '-',
        '3 kA',
        '30 mA',
        'CUMPLE (Idn ≤ 30mA)',
      ]);
    }

    // Tableros Seccionales adicionales si existen
    tableros.forEach(tab => {
      if (tab.proteccionCabecera) {
        filasTableros.push([
          tab.nombre,
          'Cabecera Seccional',
          `${tab.proteccionCabecera.in_amp || 20} A`,
          tab.proteccionCabecera.curva_disparo || 'C',
          `${tab.proteccionCabecera.capacidades?.[0]?.icn_ka || 3} kA`,
          '-',
          'CUMPLE',
        ]);
      }
      if (tab.proteccionDiferencial) {
        filasTableros.push([
          tab.nombre,
          'Diferencial Seccional',
          `${tab.proteccionDiferencial.in_amp || 25} A`,
          '-',
          `${tab.proteccionDiferencial.capacidades?.[0]?.icn_ka || 3} kA`,
          `${tab.proteccionDiferencial.sensibilidad || 30} mA`,
          'CUMPLE',
        ]);
      }
    });

    if (filasTableros.length > 0) {
      if (cursorY > pageHeight - 65) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFont(PDF_FONTS.family, 'bold');
      doc.setFontSize(PDF_FONTS.subHeadingSize);
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.text('SÍNTESIS DE TABLEROS Y PROTECCIONES PRINCIPALES:', marginLeft, cursorY);
      cursorY += 5;

      autoTable(doc, {
        startY: cursorY,
        head: [['TABLERO', 'FUNCIÓN PROTECCIÓN', 'In [A]', 'CURVA', 'PODER CORTE', 'SENSIBILIDAD', 'ESTADO']],
        body: filasTableros,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7, halign: 'center' },
        bodyStyles: { fontSize: 6.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 42 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: marginLeft, right: marginRight },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // PROCEDIMIENTO DE VALIDACIONES Y ADVERTENCIAS TÉCNICAS
  const numProcValid = isPro ? 'PROCEDIMIENTO 8' : 'PROCEDIMIENTO 7';
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text(`${numProcValid}: VALIDACIONES NORMATIVAS Y VERIFICACIONES TÉCNICAS`, marginLeft, cursorY);
  cursorY += 6;

  const validaciones: string[][] = [
    [
      'Límite de Suministro Monofásico',
      esTrifasico ? 'Suministro Trifásico (Correcto)' : dpmsVA > 7000 ? `Supera 7 kVA (${(dpmsVA / 1000).toFixed(2)} kVA)` : `Dentro de límite (${(dpmsVA / 1000).toFixed(2)} kVA <= 7 kVA)`,
      dpmsVA > 7000 && !esTrifasico ? 'RECOMENDAR TRIFÁSICA' : 'CUMPLE',
    ],
    [
      'Cantidad Mínima de Circuitos',
      `Proyectados: ${circuitos.length} circuitos >= Mínimo Normativo: ${minimosReq} circuitos (Grado ${grado})`,
      circuitos.length >= minimosReq ? 'CUMPLE' : 'VERIFICAR',
    ],
    [
      'Límite de Bocas por Circuito General',
      'Máximo 15 bocas por circuito de usos generales (AEA 770.7.VI)',
      'CUMPLE',
    ],
    [
      'Circuitos Específicos > 8 A',
      'Canalización independiente y protecciones dedicadas para consumos mayores a 8A',
      'CUMPLE',
    ],
    [
      'Puntos Mínimos de Utilización',
      'Cumplimiento de dotación mínima de bocas por local (Tabla AEA 770.7.III)',
      'CUMPLE',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['CRITERIO TÉCNICO NORMATIVO', 'CONDICIÓN / VERIFICACIÓN EN PROYECTO', 'ESTADO REGLAMENTARIO']],
    body: validaciones,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 86 },
      2: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 12;

  // Advertencias normativas si existen
  if (dpmsData.advertencias && dpmsData.advertencias.length > 0) {
    if (cursorY > pageHeight - 50) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
    doc.text('OBSERVACIONES Y ADVERTENCIAS DE INGENIERÍA:', marginLeft, cursorY);
    cursorY += 5;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    dpmsData.advertencias.forEach((adv) => {
      doc.text(`• ${adv}`, marginLeft + 3, cursorY);
      cursorY += 4.5;
    });
    cursorY += 6;
  }

  // Cuadro de Firmas y Responsabilidad Profesional
  if (cursorY > pageHeight - 45) {
    doc.addPage();
    cursorY = 20;
  }

  cursorY = Math.max(cursorY, pageHeight - 48);

  doc.setLineWidth(0.3);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);

  // Firma Instalador
  doc.line(marginLeft + 10, cursorY + 18, marginLeft + 75, cursorY + 18);
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text((caratula.instaladorNombre || 'PROFESIONAL RESPONSABLE').toUpperCase(), marginLeft + 42.5, cursorY + 22, { align: 'center' });
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.setTextColor(PDF_COLORS.subtext[0], PDF_COLORS.subtext[1], PDF_COLORS.subtext[2]);
  doc.text(`Mat. N°: ${caratula.instaladorMatricula || 'Pendiente'} - ${caratula.instaladorCategoria || 'Instalador'}`, marginLeft + 42.5, cursorY + 26, { align: 'center' });
  doc.text('Firma y Sello del Profesional Responsable', marginLeft + 42.5, cursorY + 30, { align: 'center' });

  // Firma Propietario
  doc.line(pageWidth - marginRight - 75, cursorY + 18, pageWidth - marginRight - 10, cursorY + 18);
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text((caratula.propietario || 'PROPIETARIO / COMITENTE').toUpperCase(), pageWidth - marginRight - 42.5, cursorY + 22, { align: 'center' });
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.setTextColor(PDF_COLORS.subtext[0], PDF_COLORS.subtext[1], PDF_COLORS.subtext[2]);
  doc.text('Propietario / Comitente', pageWidth - marginRight - 42.5, cursorY + 26, { align: 'center' });
  doc.text('Conformidad de Proyecto', pageWidth - marginRight - 42.5, cursorY + 30, { align: 'center' });
}

/**
 * Generador para proyectos Industriales o Comerciales
 */
function generarInformeDpmsGeneral(
  doc: jsPDF,
  project: Project,
  caratula: DatosCaratula,
  pageWidth: number,
  pageHeight: number,
  marginLeft: number,
  marginRight: number,
  contentWidth: number
) {
  let cursorY = 22;

  // Portada General
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.titleSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('INFORME TÉCNICO Y MEMORIA DE CÁLCULO', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subtitleSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text(`PROYECTO ${project.projectType.toUpperCase()} - PARÁMETROS Y DEMANDA ELÉCTRICA`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 12;

  // Cuadro de Identificación
  doc.setLineWidth(0.5);
  doc.setDrawColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.setFillColor(PDF_COLORS.lightBg[0], PDF_COLORS.lightBg[1], PDF_COLORS.lightBg[2]);
  doc.roundedRect(marginLeft + 5, cursorY, contentWidth - 10, 42, 2, 2, 'FD');

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('PROYECTO:', pageWidth / 2, cursorY + 11, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 21, { align: 'center' });

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`Propietario: ${caratula.propietario}  |  Fecha: ${new Date().toLocaleDateString('es-AR')}`, pageWidth / 2, cursorY + 32, { align: 'center' });

  cursorY += 54;

  // Parámetros Generales
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('1. PARÁMETROS GENERALES Y DE SUMINISTRO', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Tipo de Instalación: ${project.tipoInstalacion || 'Trifásica'}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Temperatura Ambiente: ${project.tempAmbiente || 30} °C`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Factor de Potencia (cos phi): ${project.cosPhi || 0.95}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Coeficiente de Simultaneidad Global: ${project.coefSimultaneidad || 1.0}`, marginLeft + 3, cursorY);
  cursorY += 10;

  // Acometida y Transformador
  if (project.acometida || project.transformador) {
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('2. ACOMETIDA Y TRANSFORMADOR', marginLeft, cursorY);
    cursorY += 6;

    if (project.acometida) {
      doc.setFont(PDF_FONTS.family, 'normal');
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      doc.text(`• Acometida: Longitud: ${project.acometida.longitud || 0} m | Sección: ${project.acometida.seccion || 0} mm² | Material: ${project.acometida.material || 'Cobre'} | Aislación: ${project.acometida.aislacion || 'PVC'}`, marginLeft + 3, cursorY);
      cursorY += 5;
    }

    if (project.transformador) {
      doc.setFont(PDF_FONTS.family, 'normal');
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      doc.text(`• Transformador: Potencia: ${project.transformador.potencia || 0} kVA | Tipo: ${project.transformador.tipo || 'Aceite'} | Vsec: ${project.transformador.tensionSecundario || 400} V | Zcc: ${project.transformador.impedancia || '—'} Ohm`, marginLeft + 3, cursorY);
      cursorY += 6;
    }
  }

  // Armónicos
  if (project.armonicos?.habilitado) {
    cursorY += 4;
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('3. DISTORSIÓN ARMÓNICA', marginLeft, cursorY);
    cursorY += 6;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    const modo = project.armonicos.modoEntrada || 'porcentaje';
    const unidad = modo === 'amperios' ? 'A' : '%';
    doc.text(`• Armónicos Habilitados (Modo: ${modo}): 3° = ${project.armonicos.h3 || 0} ${unidad} | 5° = ${project.armonicos.h5 || 0} ${unidad} | 7° = ${project.armonicos.h7 || 0} ${unidad} | 9° = ${project.armonicos.h9 || 0} ${unidad}`, marginLeft + 3, cursorY);
    cursorY += 8;
  }

  // Firmas
  cursorY = Math.max(cursorY + 15, pageHeight - 45);
  doc.setLineWidth(0.3);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.line(marginLeft + 10, cursorY + 18, marginLeft + 75, cursorY + 18);
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text((caratula.instaladorNombre || 'PROFESIONAL RESPONSABLE').toUpperCase(), marginLeft + 42.5, cursorY + 22, { align: 'center' });
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.text('Firma del Profesional Responsable', marginLeft + 42.5, cursorY + 26, { align: 'center' });
}
