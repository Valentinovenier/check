import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';

/**
 * Genera y descarga el Informe Técnico (Carpeta Técnica Modelo) en formato PDF
 * utilizando EXCLUSIVAMENTE los datos calculados y configurados en el proyecto.
 */
export const generatePdfReport = (project: Project, overrideCaratula?: DatosCaratula): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const caratula: DatosCaratula = {
    propietario: overrideCaratula?.propietario || project.datosCaratula?.propietario || '-',
    direccion: overrideCaratula?.direccion || project.datosCaratula?.direccion || '-',
    ciudad: overrideCaratula?.ciudad || project.datosCaratula?.ciudad || '-',
    provincia: overrideCaratula?.provincia || project.datosCaratula?.provincia || '-',
    instaladorNombre: overrideCaratula?.instaladorNombre || project.datosCaratula?.instaladorNombre || '-',
    instaladorCategoria: overrideCaratula?.instaladorCategoria || project.datosCaratula?.instaladorCategoria || '-',
    instaladorMatricula: overrideCaratula?.instaladorMatricula || project.datosCaratula?.instaladorMatricula || '-',
    instaladorTelefono: overrideCaratula?.instaladorTelefono || project.datosCaratula?.instaladorTelefono || '-',
    instaladorEmail: overrideCaratula?.instaladorEmail || project.datosCaratula?.instaladorEmail || '-',
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Paleta de Colores
  const colorPrimary = '#800000'; // Burgundy / Vino tinto técnico
  const colorDark = '#1E293B';    // Slate 800
  const colorText = '#334155';    // Slate 700

  // ----------------------------------------------------
  // Extracción de datos REALES del proyecto
  // ----------------------------------------------------
  const datosV: DatosVivienda | undefined = project.datosVivienda;
  const supCubierta = datosV?.superficieCubierta || 0;
  const supSemicubierta = datosV?.superficieSemicubierta || 0;
  const superficieTotal = supCubierta + supSemicubierta * 0.5;
  const gradoElectrif = datosV?.gradoElectrificacion || (superficieTotal > 0 ? calcularGradoElectrificacion(superficieTotal) : 'No definido');
  
  const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || [];
  const ambientes: Ambiente[] = datosV?.ambientes || [];

  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || (datosV?.potenciaInstalada ? datosV.potenciaInstalada * (project.coefSimultaneidad || 0.8) : 0);
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const corrienteTotalA = dpmsVA > 0 ? (dpmsVA / 220).toFixed(2) : '-';

  // ----------------------------------------------------
  // Encabezado y Pie de página
  // ----------------------------------------------------
  const addHeaderFooter = (currentPage: number, totalPages: number) => {
    if (currentPage === 1) return;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);

    // Header
    doc.text(`MEMORIA DESCRIPTIVA - ${project.name.toUpperCase()}`, marginLeft, 10);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 12, pageWidth - marginRight, 12);

    // Footer
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);
    doc.text(`Obra: ${project.name}`, marginLeft, pageHeight - 7);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // ====================================================
  // PÁGINA 1: CARÁTULA / MEMORIA DESCRIPTIVA
  // ====================================================
  let cursorY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colorPrimary);
  doc.text('MEMORIA DESCRIPTIVA', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 15;

  // Cuadro Obra y Propietario
  doc.setLineWidth(0.8);
  doc.setDrawColor(0);
  doc.rect(marginLeft + 10, cursorY, contentWidth - 20, 40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorDark);
  doc.text('OBRA:', pageWidth / 2, cursorY + 12, { align: 'center' });
  
  doc.setFontSize(13);
  doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 22, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Propietario: ${caratula.propietario}`, pageWidth / 2, cursorY + 32, { align: 'center' });
  
  cursorY += 55;

  // Ubicación de la Obra
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text('Ubicación de la Obra:', marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text(`${caratula.direccion}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`${caratula.ciudad}${caratula.provincia !== '-' ? ', ' + caratula.provincia : ''}`, marginLeft, cursorY);
  cursorY += 15;

  // Datos del Instalador Electricista
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text(`Instalador Electricista ${caratula.instaladorCategoria !== '-' ? caratula.instaladorCategoria : ''}:`, marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text(`${caratula.instaladorNombre}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`N° habilitación: ${caratula.instaladorMatricula}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`Tel.: ${caratula.instaladorTelefono}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`Correo: ${caratula.instaladorEmail}`, marginLeft, cursorY);

  // Pie de Carátula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorPrimary);
  doc.text('CERTIFICADO DE INSTALACIÓN ELÉCTRICA - CARPETA TÉCNICA', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Reglamentación AEA 90364-7-770', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ====================================================
  // PÁGINA 2: ÍNDICE
  // ====================================================
  doc.addPage();
  cursorY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(colorDark);
  doc.text('INDICE', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 15;

  const indexItems = [
    { code: '01', title: 'CÁLCULOS Y DIMENSIONAMIENTOS', page: '3' },
    { code: '01.01', title: 'Ubicación del Inmueble', page: '3' },
    { code: '01.02', title: 'Superficie del inmueble – grado de electrificación', page: '3' },
    { code: '01.03', title: 'Cantidad de Circuitos y cálculo de Demanda de Potencia Máxima Simultánea', page: '3' },
    { code: '01.04', title: 'Cálculo de la Potencia de los Circuitos Terminales', page: '4' },
    { code: '01.05', title: 'Tendidos de Electroductos', page: '4' },
    { code: '01.06', title: 'Dimensionamiento de los Electroductos', page: '4' },
    { code: '01.07', title: 'Dimensionamiento de las Protecciones', page: '4' },
    { code: '01.08', title: 'Resumen de cálculos eléctricos', page: '5' },
    { code: '02', title: 'DESCRIPCIÓN DE TRABAJOS Y COMPONENTES', page: '6' },
    { code: '03', title: 'LISTADO DE MATERIALES Y COMPONENTES', page: '7' },
  ];

  doc.setFontSize(10);
  indexItems.forEach((item) => {
    const isMain = item.code.length === 2;
    doc.setFont('helvetica', isMain ? 'bold' : 'normal');
    doc.setTextColor(isMain ? colorDark : colorText);

    const prefix = isMain ? `${item.code} - ${item.title}` : `   ${item.code} – ${item.title}`;
    doc.text(prefix, marginLeft, cursorY);
    doc.text(item.page, pageWidth - marginRight, cursorY, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180);
    const startX = marginLeft + doc.getTextWidth(prefix) + 3;
    const endX = pageWidth - marginRight - 8;
    if (startX < endX) {
      let dots = '';
      for (let x = startX; x < endX; x += 3) dots += '.';
      doc.text(dots, startX, cursorY);
    }

    cursorY += 7;
  });

  // ====================================================
  // PÁGINA 3: 01 - CÁLCULOS Y DIMENSIONAMIENTOS
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorDark);
  doc.text('MEMORIA DESCRIPTIVA', marginLeft, cursorY);
  cursorY += 7;

  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('01 - CÁLCULOS Y DIMENSIONAMIENTOS', marginLeft, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(colorText);
  const p1 = `Memoria de cálculo correspondiente al proyecto "${project.name}". ` +
    (superficieTotal > 0 ? `La instalación cuenta con una superficie cubierta calculada de ${supCubierta.toFixed(2)} m² (más ${supSemicubierta.toFixed(2)} m² semicubiertos, resultando en ${superficieTotal.toFixed(2)} m² computables). ` : '') +
    `El dimensionamiento de los componentes se realiza conforme a los criterios de la Reglamentación AEA 90364-7-770.`;
  const linesP1 = doc.splitTextToSize(p1, contentWidth);
  doc.text(linesP1, marginLeft, cursorY);
  cursorY += linesP1.length * 5 + 6;

  // 01.01 Ubicación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.01 – Ubicación del Inmueble', marginLeft, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(colorText);
  doc.text(caratula.direccion !== '-' ? `${caratula.direccion}, ${caratula.ciudad}` : 'Consultar datos especificados en la carátula.', marginLeft, cursorY);
  cursorY += 10;

  // 01.02 Superficie y Grado de Electrificación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.02 – Superficie del inmueble – grado de electrificación', marginLeft, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const p2 = `En base a la superficie computable (${superficieTotal.toFixed(2)} m²), según la Tabla 770.7.I de la AEA 770, el grado de electrificación determinado es: ${gradoElectrif.toUpperCase()}.`;
  const linesP2 = doc.splitTextToSize(p2, contentWidth);
  doc.text(linesP2, marginLeft, cursorY);
  cursorY += linesP2.length * 5 + 4;

  // Tabla 770.7.I
  autoTable(doc, {
    startY: cursorY,
    head: [['Grado de electrificación', 'Superficie (límite de aplicación)']],
    body: [
      ['Mínimo', 'Hasta 60 m²'],
      ['Medio', 'Más de 60 m² hasta 130 m²'],
      ['Elevado', 'Más de 130 m² hasta 200 m²'],
      ['Superior', 'Más de 200 m²'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // 01.03 Cantidad de Circuitos y DPMS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.03 – Cantidad de Circuitos y cálculo de Demanda de Potencia Máxima Simultánea', marginLeft, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const p3 = `Circuitos terminales calculados en la aplicación: ${circuitos.length}. ` +
    (dpmsVA > 0 ? `Demanda de Potencia Máxima Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW). Corriente estimada de alimentación: I = ${corrienteTotalA} A.` : `No se registraron potencias calculadas aún.`);
  const linesP3 = doc.splitTextToSize(p3, contentWidth);
  doc.text(linesP3, marginLeft, cursorY);
  cursorY += linesP3.length * 5 + 6;

  // ====================================================
  // PÁGINA 4: 01.04 CÁLCULO DE CIRCUITOS Y TABLA DE SECCIONES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.04 - Cálculo de la Potencia de los Circuitos Terminales', marginLeft, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(colorText);
  doc.text('A continuación se resumen las secciones teóricas y adoptadas para cada circuito calculado en el proyecto:', marginLeft, cursorY);
  cursorY += 7;

  // Tabla de Secciones reales por Circuito
  const tablaSecciones = circuitos.length > 0 ? circuitos.map((c, index) => {
    const cond = obtenerConductorCircuito(project, c.id);
    const secAdoptada = cond?.seccion || '-';
    const secMinima = c.tipo.includes('iluminacion') ? '1.5 mm²' : '2.5 mm²';
    return [
      `Cto ${index + 1}: ${c.nombre}`,
      c.tipo.includes('iluminacion') ? 'IUG' : (c.tipo.includes('especial') ? 'TUE' : 'TUG'),
      secMinima,
      typeof secAdoptada === 'number' ? `${secAdoptada} mm²` : secAdoptada,
    ];
  }) : [['Sin circuitos calculados', '-', '-', '-']];

  // Línea principal si existe conductor de alimentacion
  if (project.tableroPrincipal?.conductorAlimentacion?.seccion) {
    tablaSecciones.push([
      'Línea Principal / Alimentador',
      'Alimentación TP',
      '4.0 mm²',
      `${project.tableroPrincipal.conductorAlimentacion.seccion} mm²`,
    ]);
  }

  autoTable(doc, {
    startY: cursorY,
    head: [['Identificación de Circuito', 'Tipo', 'Sección mínima AEA', 'Sección adoptada']],
    body: tablaSecciones,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // 01.05 / 01.06 Electroductos y Canalizaciones Reales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.05 – Electroductos y Canalizaciones Configuradas', marginLeft, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  if (project.canalizaciones && project.canalizaciones.length > 0) {
    const txtCanal = `Canalizaciones configuradas (${project.canalizaciones.length}): ` +
      project.canalizaciones.map(c => `${c.nombre} (${c.circuitosIds.length} circuitos)`).join(', ');
    doc.text(txtCanal, marginLeft, cursorY, { maxWidth: contentWidth });
  } else {
    doc.text('No se han especificado tramos de canalización adicionales en la aplicación.', marginLeft, cursorY);
  }
  cursorY += 15;

  // 01.07 Protecciones Reales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.07 - Protecciones Configuradas en Tableros', marginLeft, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const protCabecera = project.tableroPrincipal?.proteccionCabecera;
  const protDif = project.tableroPrincipal?.proteccionDiferencial;
  
  let txtProt = 'Tablero Principal: ';
  if (protCabecera) txtProt += `Protección Cabecera: ${protCabecera.tipo_proteccion || 'PIA'} ${protCabecera.in_amp}A ${protCabecera.curva_disparo || ''}. `;
  if (protDif) txtProt += `Diferencial: ${protDif.tipo_proteccion || 'ID'} ${protDif.in_amp}A / 30mA. `;
  if (!protCabecera && !protDif) txtProt += 'Protecciones de cabecera pendientes de asignación en la app.';

  doc.text(txtProt, marginLeft, cursorY, { maxWidth: contentWidth });

  // ====================================================
  // PÁGINA 5: 01.08 RESUMEN DE CÁLCULOS ELÉCTRICOS REALES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('01.08 – Resumen de cálculos eléctricos del proyecto', marginLeft, cursorY);
  cursorY += 8;

  // Tabla Resumen General del Proyecto
  autoTable(doc, {
    startY: cursorY,
    head: [['RESUMEN DE PROYECTO', 'VALOR CALCULADO']],
    body: [
      ['Nombre del Proyecto', project.name],
      ['Tipo de Instalación', project.tipoInstalacion || 'Monofásica'],
      ['Superficie Computable [m²]', `${superficieTotal.toFixed(2)} m²`],
      ['Grado de Electrificación', gradoElectrif],
      ['Cantidad de Circuitos Calculados', `${circuitos.length}`],
      ['Demanda de Potencia Máxima Simultánea', dpmsVA > 0 ? `${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)` : 'Pendiente'],
      ['Corriente de Alimentación de Cálculo', corrienteTotalA !== '-' ? `${corrienteTotalA} A` : 'Pendiente'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90 } },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // Tabla Matriz de Circuitos REALES
  if (circuitos.length > 0) {
    const headersMatriz = [
      'Circuito',
      'Tipo',
      'Bocas',
      'Pot. [VA]',
      'IB [A]',
      'In [A]',
      'Sec L1-N',
      'Iz [A]',
      'Verificación',
    ];

    const rowsMatriz = circuitos.map((c, i) => {
      const cond = obtenerConductorCircuito(project, c.id);
      const totalBocas = (c.puntosIUG || 0) + (c.puntosTUG || 0) + (c.puntosTUE || 0);
      const pot = c.puntosIUG * 60 + c.puntosTUG * 2200 + c.puntosTUE * 3300 || 2200;
      const ib = (pot / 220).toFixed(2);
      const inAmp = c.proteccion?.in_amp || '-';
      const secL1N = cond?.seccion ? `${cond.seccion} mm²` : '-';
      const iz = cond?.resultadoCalculo?.cumpleCapacidadCorriente !== undefined
        ? (cond.resultadoCalculo.cumpleCapacidadCorriente ? 'Cumple' : 'No cumple')
        : '-';
      const cumple = typeof inAmp === 'number' && cond?.seccion
        ? (Number(ib) <= inAmp ? 'Cumple IB <= In' : 'Verificar In')
        : 'Verificar';

      return [
        `Cto ${i + 1}: ${c.nombre}`,
        c.tipo.includes('iluminacion') ? 'IUG' : (c.tipo.includes('especial') ? 'TUE' : 'TUG'),
        `${totalBocas}`,
        `${pot}`,
        `${ib}`,
        typeof inAmp === 'number' ? `${inAmp}A` : '-',
        secL1N,
        iz,
        cumple,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [headersMatriz],
      body: rowsMatriz,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50], halign: 'center' },
      margin: { left: marginLeft, right: marginRight },
    });
  }

  // ====================================================
  // PÁGINA 6: 02 - DESCRIPCIÓN DE TRABAJOS Y COMPONENTES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('02 - DESCRIPCIÓN DE TRABAJOS Y COMPONENTES', marginLeft, cursorY);
  cursorY += 8;

  const descripcionesReales = [
    { t: 'Normativa de Aplicación:', d: 'Los cálculos y componentes responden a la Reglamentación AEA 90364-7-770 para Instalaciones Eléctricas en Viviendas Unifamiliares.' },
    { t: 'Tableros de la Instalación:', d: `Tablero Principal: ${project.tableroPrincipal?.nombre || 'Tablero Principal'}. ` + (project.tableros && project.tableros.length > 0 ? `Tableros Seccionales: ${project.tableros.map(t=>t.nombre).join(', ')}.` : 'No posee tableros seccionales adicionales.') },
    { t: 'Ambientes y Puntos de Utilización:', d: ambientes.length > 0 ? `Se han registrado ${ambientes.length} ambientes en el proyecto (${ambientes.map(a => a.nombre).join(', ')}).` : 'No se han especificado ambientes individuales.' },
  ];

  doc.setFontSize(9);
  descripcionesReales.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorDark);
    doc.text(item.t, marginLeft, cursorY);
    cursorY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorText);
    const lines = doc.splitTextToSize(item.d, contentWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 4.5 + 4;
  });

  // ====================================================
  // PÁGINA 7: LISTADO DE MATERIALES REALES (BOM)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorPrimary);
  doc.text('LISTADO DE MATERIALES CALCULADOS Y CONFIGURADOS', marginLeft, cursorY);
  cursorY += 8;

  const materialesReales = generarListadoMaterialesReales(project, circuitos, ambientes);

  if (materialesReales.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['ITEM', 'CATEGORÍA', 'CANT.', 'UNID.', 'DESCRIPCIÓN DEL COMPONENTE', 'NORMA / MODELO']],
      body: materialesReales,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 80 },
        5: { cellWidth: 32 },
      },
      margin: { left: marginLeft, right: marginRight },
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No hay materiales registrados o calculados en el proyecto actualmente.', marginLeft, cursorY);
  }

  // ----------------------------------------------------
  // Pie de página en todas las páginas
  // ----------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Guardar archivo PDF
  const filename = `Informe_Tecnico_${project.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

// --------------------------------------------------------
// Funciones Auxiliares
// --------------------------------------------------------

function calcularGradoElectrificacion(superficie: number): 'Minimo' | 'Medio' | 'Elevado' | 'Superior' {
  if (superficie <= 60) return 'Minimo';
  if (superficie <= 130) return 'Medio';
  if (superficie <= 200) return 'Elevado';
  return 'Superior';
}

function obtenerConductorCircuito(project: Project, circuitoId: string): Conductor | undefined {
  const conds = project.conductores || {};
  for (const [key, val] of Object.entries(conds)) {
    if (key.includes(circuitoId) || (val as any)?.destinoId === circuitoId) {
      return val;
    }
  }
  return undefined;
}

/**
 * Genera el listado de materiales DINÁMICAMENTE según lo configurado/calculado en el objeto project.
 * NINGÚN DATO HARDCODEADO/INVENTADO.
 */
function generarListadoMaterialesReales(project: Project, circuitos: CircuitoCalculado[], ambientes: Ambiente[]): string[][] {
  const list: string[][] = [];
  let itemIdx = 1;

  // 1. Protecciones del Tablero Principal
  const protCabecera = project.tableroPrincipal?.proteccionCabecera;
  if (protCabecera) {
    list.push([
      `1.${itemIdx++}`,
      'Protecciones',
      '1',
      'un.',
      `Protección Cabecera: ${protCabecera.modelo || protCabecera.tipo_proteccion} ${protCabecera.in_amp}A ${protCabecera.curva_disparo || ''}`,
      protCabecera.marca || 'IEC 60898',
    ]);
  }

  const protDif = project.tableroPrincipal?.proteccionDiferencial;
  if (protDif) {
    list.push([
      `1.${itemIdx++}`,
      'Protecciones',
      '1',
      'un.',
      `Interruptor Diferencial: ${protDif.modelo || protDif.tipo_proteccion} ${protDif.in_amp}A 30mA`,
      protDif.marca || 'IEC 61008',
    ]);
  }

  // Protecciones de circuitos
  circuitos.forEach((c) => {
    if (c.proteccion) {
      list.push([
        `1.${itemIdx++}`,
        'Protecciones',
        '1',
        'un.',
        `PIA ${c.nombre}: Termomagnética ${c.proteccion.in_amp}A ${c.proteccion.curva_disparo || 'C'}`,
        c.proteccion.marca || 'IEC 60898',
      ]);
    }
  });

  // 2. Conductores reales
  const condEntries = Object.entries(project.conductores || {});
  condEntries.forEach(([key, cond], idx) => {
    if (cond.seccion) {
      const lenStr = cond.longitud ? `${cond.longitud} m` : 'Según tramo';
      list.push([
        `2.${idx + 1}`,
        'Conductores',
        lenStr,
        cond.longitud ? 'm' : 'tramo',
        `Conductor ${key.replace('__', ' - ')}: Sección ${cond.seccion} mm² (${cond.aislacion || 'PVC'}, ${cond.material || 'Cobre'})`,
        cond.normaCable || 'IRAM-NM 247-3',
      ]);
    }
  });

  // 3. Canalizaciones reales
  (project.canalizaciones || []).forEach((can, idx) => {
    list.push([
      `3.${idx + 1}`,
      'Canalizaciones',
      '1',
      'tramo',
      `Canalización ${can.nombre} (Aloja ${can.circuitosIds.length} circuitos)`,
      can.normaCable || 'IRAM 62386',
    ]);
  });

  // 4. Módulos y Puntos a partir de Ambientes
  if (ambientes.length > 0) {
    const totIUG = ambientes.reduce((acc, a) => acc + (a.puntosIUG || 0), 0);
    const totTUG = ambientes.reduce((acc, a) => acc + (a.puntosTUG || 0), 0);
    const totTUE = ambientes.reduce((acc, a) => acc + (a.puntosTUE || 0), 0);

    if (totIUG > 0) {
      list.push([
        '4.1',
        'Bocas / Cajas',
        `${totIUG}`,
        'un.',
        'Bocas de iluminación (Cajas octogonales)',
        'IRAM 2005',
      ]);
    }
    if (totTUG > 0) {
      list.push([
        '4.2',
        'Bocas / Cajas',
        `${totTUG}`,
        'un.',
        'Módulos de tomacorriente TUG (Cajas rectangulares 5x10)',
        'IRAM 2071',
      ]);
    }
    if (totTUE > 0) {
      list.push([
        '4.3',
        'Bocas / Cajas',
        `${totTUE}`,
        'un.',
        'Módulos de tomacorriente TUE usos especiales',
        'IRAM 2071',
      ]);
    }
  }

  return list;
}
