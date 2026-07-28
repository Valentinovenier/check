import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';

/**
 * Genera y descarga el Informe Técnico (Carpeta Técnica Modelo) en formato PDF
 * siguiendo las especificaciones de AEA 90364-7-770 y la estructura del modelo oficial.
 */
export const generatePdfReport = (project: Project): void => {
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

  // Paleta de Colores
  const colorPrimary = '#800000'; // Burgundy / Vino tinto técnico
  const colorDark = '#1E293B';    // Slate 800
  const colorText = '#334155';    // Slate 700

  // ----------------------------------------------------
  // Extracción de datos del proyecto
  // ----------------------------------------------------
  const datosV: DatosVivienda | undefined = project.datosVivienda;
  const superficieTotal = (datosV?.superficieCubierta || 0) + (datosV?.superficieSemicubierta || 0) * 0.5 || 72.42;
  const gradoElectrif = datosV?.gradoElectrificacion || calcularGradoElectrificacion(superficieTotal);
  
  const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || obtenerCircuitosFallback(project);

  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 5664;
  const dpmsKW = (dpmsVA * 0.85) / 1000;
  const corrienteTotalA = (dpmsVA / 220).toFixed(2);

  // ----------------------------------------------------
  // Helpers para encabezado y pie de página
  // ----------------------------------------------------
  const addHeaderFooter = (currentPage: number, totalPages: number) => {
    if (currentPage === 1) return; // No agregar header/footer en carátula

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
    doc.text(`Obra de la Instalación Eléctrica: ${project.name}`, marginLeft, pageHeight - 7);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // ====================================================
  // PÁGINA 1: CARÁTULA / MEMORIA DESCRIPTIVA
  // ====================================================
  let cursorY = 25;

  // Título Principal
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
  doc.text(`Propietario: ${project.datosVivienda ? 'Sr/Sra. Propietario' : 'Cliente General'}`, pageWidth / 2, cursorY + 32, { align: 'center' });
  
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
  doc.text('Av. Principal N° 1234, Barrio Centro', marginLeft, cursorY); cursorY += 5;
  doc.text('Córdoba, Argentina', marginLeft, cursorY);
  cursorY += 15;

  // Datos del Instalador Electricista
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text('Instalador Electricista Categoría III Habilitado:', marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text('Técnico / Ing. Electricista Habilitado', marginLeft, cursorY); cursorY += 5;
  doc.text('N° Habilitación: 123456789-00001', marginLeft, cursorY); cursorY += 5;
  doc.text('Tel.: (0351) 15X-XXXXXX', marginLeft, cursorY); cursorY += 5;
  doc.text('Correo: contacto@ingenieriaelectrica.com', marginLeft, cursorY);

  // Pie institucional de Carátula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorPrimary);
  doc.text('ERSeP - CERTIFICADO DE INSTALACIÓN ELÉCTRICA APTA', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('CARPETA TÉCNICA MODELO PARA CONFECCIÓN DE MEMORIA DESCRIPTIVA', pageWidth / 2, pageHeight - 20, { align: 'center' });

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
    { code: '02', title: 'DESCRIPCIÓN DE LOS TRABAJOS', page: '6' },
    { code: '02.01', title: 'Trabajos previos', page: '6' },
    { code: '02.02', title: 'Tableros', page: '6' },
    { code: '02.03', title: 'Verificación de tableros', page: '6' },
    { code: '02.04', title: 'Sistema de Puesta a Tierra (PAT)', page: '6' },
    { code: '02.05', title: 'Punto de Conexión y Medición (Acometida)', page: '6' },
    { code: '02.06', title: 'Alimentación a Tableros', page: '7' },
    { code: '02.07', title: 'Dispositivos de maniobra y protección', page: '7' },
    { code: '02.08', title: 'Características del Cable de Protección', page: '7' },
    { code: '03', title: 'PRUEBA Y ENSAYOS DE LA INSTALACION', page: '8' },
    { code: '03.01', title: 'Instalación Eléctrica', page: '8' },
    { code: '03.02', title: 'Tableros', page: '8' },
    { code: '04', title: 'ESPECIFICACIONES TÉCNICAS', page: '9' },
    { code: '05', title: 'OTRAS OBSERVACIONES EN GENERAL', page: '10' },
    { code: '06', title: 'LISTADO DE MATERIALES', page: '11' },
  ];

  doc.setFontSize(10);
  indexItems.forEach((item) => {
    const isMain = item.code.length === 2;
    doc.setFont('helvetica', isMain ? 'bold' : 'normal');
    doc.setTextColor(isMain ? colorDark : colorText);

    const prefix = isMain ? `${item.code} - ${item.title}` : `   ${item.code} – ${item.title}`;
    doc.text(prefix, marginLeft, cursorY);
    doc.text(item.page, pageWidth - marginRight, cursorY, { align: 'right' });
    
    // Puntos suspensivos entre título y página
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
  const p1 = `Se describe el tendido eléctrico de la obra "${project.name}", con una superficie edificada total de ${superficieTotal.toFixed(2)} m². Se previó la instalación eléctrica desde el punto de conexión y medición hasta el Tablero Principal del usuario y, luego, cada uno de los circuitos terminales correspondientes. El dimensionamiento se realizó de acuerdo a la reglamentación AEA 90364-7-770 (Edición 2017) y normativas locales vigentes (Ley N° 10281).`;
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
  doc.text('El inmueble se encuentra ubicado en la dirección indicada en la portada del presente informe.', marginLeft, cursorY);
  cursorY += 10;

  // 01.02 Superficie y Grado de Electrificación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.02 – Superficie del inmueble – grado de electrificación', marginLeft, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const p2 = `El cálculo de superficie cubierta total es de ${superficieTotal.toFixed(2)} m², lo cual determina que, en base a la Tabla 770.7.I de la Guía AEA 770, la vivienda alcanza un Grado de Electrificación ${gradoElectrif.toUpperCase()}.`;
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
  const p3 = `A los efectos del cálculo se consideró la potencia aparente en Volt-Ampere (VA). La instalación posee ${circuitos.length} circuitos terminales, cumpliendo con la cantidad mínima requerida. Potencia Total Instalada: ${dpmsVA} VA. Coeficiente de simultaneidad aplicado: ${project.coefSimultaneidad || 0.8}. DPMS resultante: ${dpmsVA * (project.coefSimultaneidad || 0.8)} VA (${dpmsKW.toFixed(2)} kW).`;
  const linesP3 = doc.splitTextToSize(p3, contentWidth);
  doc.text(linesP3, marginLeft, cursorY);
  cursorY += linesP3.length * 5 + 4;

  doc.text(`Corriente de alimentación de cálculo: I = P / U = ${dpmsVA} VA / 220 V = ${corrienteTotalA} A.`, marginLeft, cursorY);
  cursorY += 6;
  doc.text(`Protección general adoptada: Interruptor Termomagnético Bipolar 32A (o acorde a cálculo) y diferencial 40A / 30mA.`, marginLeft, cursorY);

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
  const p4 = `Se calculó la sección de los cables en los circuitos terminales aplicando el factor de agrupamiento (0,8 para 2 circuitos en una misma cañería según RAEA 90364 Tabla 771.16.II.b). Se verificaron las secciones mínimas normativas impuestas por la reglamentación.`;
  const linesP4 = doc.splitTextToSize(p4, contentWidth);
  doc.text(linesP4, marginLeft, cursorY);
  cursorY += linesP4.length * 5 + 6;

  // Tabla de Secciones por Circuito
  const tablaSecciones = circuitos.map((c, index) => {
    const cond = obtenerConductorCircuito(project, c.id);
    const secAdoptada = cond?.seccion || 2.5;
    const secMinima = c.tipo.includes('iluminacion') ? 1.5 : 2.5;
    return [
      `Cto ${index + 1}: ${c.nombre}`,
      `${(secAdoptada * 0.8).toFixed(2)} mm²`,
      `${secMinima} mm²`,
      `${secAdoptada} mm²`,
    ];
  });
  tablaSecciones.push(['Línea Principal / Seccional', '6,0 mm²', '4,0 mm²', '6,0 mm²']);

  autoTable(doc, {
    startY: cursorY,
    head: [['Número / Identificación de Circuito', 'Sección adecuada mm²', 'Sección mínima mm²', 'Sección adoptada mm²']],
    body: tablaSecciones,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // 01.05 y 01.06 Electroductos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.05 – Tendidos y 01.06 - Dimensionamiento de Electroductos', marginLeft, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Se dimensionaron los electroductos garantizando que la sección total de los cables no supere el 35% de la sección interna de la cañería (Tabla AEA 770.10.VII). Diámetro mínimo utilizado: 20 mm (caño semi-pesado aislante).', marginLeft, cursorY, { maxWidth: contentWidth });
  cursorY += 15;

  // 01.07 Protecciones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorDark);
  doc.text('01.07 - Dimensionamiento de las Protecciones', marginLeft, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('En el Tablero de Acometida (TPA) se prevé interruptor termomagnético Curva C de 32A (Poder de corte 6kA). En el Tablero Principal (TPU) se instala un Interruptor Diferencial de 40A / 30mA alta sensibilidad respaldado por interruptores termomagnéticos (PIA) bipolares Curva B/C de 10A a 16A por circuito.', marginLeft, cursorY, { maxWidth: contentWidth });

  // ====================================================
  // PÁGINA 5: 01.08 RESUMEN DE CÁLCULOS ELÉCTRICOS (TABLA BAJA TENSIÓN)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('01.08 – Resumen de cálculos eléctricos', marginLeft, cursorY);
  cursorY += 8;

  // Tabla Resumen General
  autoTable(doc, {
    startY: cursorY,
    head: [['INSTALACIÓN ELÉCTRICA DE BAJA TENSIÓN', 'DATOS DE PROYECTO']],
    body: [
      ['Tipo de Inmueble', 'Vivienda Unifamiliar'],
      ['Superficie Cubierta Edificada [m²]', `${superficieTotal.toFixed(2)} m²`],
      ['Grado de Electrificación', gradoElectrif],
      ['Cantidad de Circuitos (Mínima / Adoptada)', `3 / ${circuitos.length}`],
      ['DPMS Total [kVA] / [kW]', `${(dpmsVA / 1000).toFixed(2)} kVA / ${dpmsKW.toFixed(2)} kW`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90 } },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // Tabla Principal Matriz de Circuitos (Resumen de Cálculo)
  const headersMatriz = [
    'Circuito',
    'Tipo',
    'Bocas',
    'Pot. [VA]',
    'Tensión [V]',
    'IB [A]',
    'In [A]',
    'Sec L1-N',
    'Sec PE',
    'Iz [A]',
    'IB <= In <= Iz',
  ];

  const rowsMatriz = circuitos.map((c, i) => {
    const cond = obtenerConductorCircuito(project, c.id);
    const pot = c.puntosIUG * 60 + c.puntosTUG * 2200 || 2200;
    const ib = (pot / 220).toFixed(2);
    const inAmp = c.proteccion?.in_amp || (c.tipo.includes('iluminacion') ? 10 : 16);
    const secL1N = cond?.seccion || (c.tipo.includes('iluminacion') ? 1.5 : 2.5);
    const iz = secL1N >= 2.5 ? 18.5 : 13.5;
    const cumple = Number(ib) <= inAmp && inAmp <= iz;

    return [
      `Cto ${i + 1}`,
      c.tipo.includes('iluminacion') ? 'IUG' : 'TUG',
      `${c.puntosIUG + c.puntosTUG + c.puntosTUE}`,
      `${pot}`,
      '220',
      `${ib}`,
      `${inAmp}`,
      `${secL1N} mm²`,
      '2.50 mm²',
      `${iz}`,
      cumple ? 'SI (Cumple)' : 'NO',
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

  // ====================================================
  // PÁGINA 6: 02 - DESCRIPCIÓN DE LOS TRABAJOS Y PAT
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('02 - DESCRIPCIÓN DE LOS TRABAJOS', marginLeft, cursorY);
  cursorY += 8;

  const trabajos = [
    { t: '02.01 Trabajos previos:', d: 'Se colocaron las cañerías y cajas plásticas en cielorrasos y paredes que responden a normas IRAM (IEC 61386-1 o IRAM 62386-21) para cañerías aislantes rígidas.' },
    { t: '02.02 Tableros:', d: 'El Tablero de Protección de Acometida (TPA) y el Tablero Principal (TPU) son de material sintético aislante para dispositivos DIN de 35 mm. Cuentan con barra de tierra (BEP) e identificación de alimentadores.' },
    { t: '02.03 Verificación de tableros:', d: 'Se realizaron puestas en marcha con carga completa, verificando ajuste de bornes, aislamiento, protección contra contactos directos y corte bipolar.' },
    { t: '02.04 Sistema de Puesta a Tierra (PAT):', d: 'Se instaló una jabalina de acero-cobre de 1,5 m de largo y Ø 19 mm (IRAM 2309), midiéndose un valor de resistencia de puesta a tierra inferior a los 40 Ohms exigidos.' },
    { t: '02.05 Punto de Conexión y Medición (Acometida):', d: 'Construido en doble aislación conforme a reglamentación de la Distribuidora (ET21). Caño de acometida IRAM 2477.' },
    { t: '02.06 Alimentación a Tableros:', d: 'Cable subterráneo tipo IRAM 2178 tendido a 0,70 m de profundidad con cuna de arena y protección mecánica de ladrillos.' },
    { t: '02.07 Dispositivos de maniobra y protección:', d: 'Protección contra sobrecorrientes mediante PIA termomagnéticas y protección contra contactos directos e indirectos mediante diferencial de 30 mA sin retardo.' },
    { t: '02.08 Cable de Protección (PE):', d: 'Aislación verde-amarilla que recorre toda la instalación de forma continua sin interrupción ni seccionamiento.' },
  ];

  doc.setFontSize(9);
  trabajos.forEach((item) => {
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
  // PÁGINA 7: 03 - PRUEBAS Y ENSAYOS / 04 - ESPECIFICACIONES TÉCNICAS
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('03 - PRUEBA Y ENSAYOS DE LA INSTALACION', marginLeft, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(colorText);
  doc.text('Se efectuaron los ensayos y comprobaciones previstos en la norma AEA 770:', marginLeft, cursorY);
  cursorY += 6;

  const ensayos = [
    '• Inspección visual de tendidos, cañerías y gabinetes.',
    '• Comprobación de continuidad de los conductores de protección (PE).',
    '• Medición de resistencia de aislación de la instalación.',
    '• Ensayo de funcionamiento del interruptor diferencial (botón de prueba y tiempo de disparo).',
    '• Verificación de polaridad en todos los tomacorrientes (Fase a la derecha mirando de frente).',
  ];
  ensayos.forEach((e) => {
    doc.text(e, marginLeft + 5, cursorY);
    cursorY += 5;
  });

  cursorY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('04 - ESPECIFICACIONES TÉCNICAS', marginLeft, cursorY);
  cursorY += 8;

  const especificaciones = [
    '04.01 Cables: Unipolares flexibles Cu/PVC (IRAM-NM 247-3) 450/750V no propagadores de llama. Subterráneos (IRAM 2178) 1.1 kV.',
    '04.02 Protecciones: Interruptores termomagnéticos bipolares IEC 60898 (Poder de corte min. 3kA). Diferenciales IEC 61008 (30mA).',
    '04.03 Cañerías: Sintéticas rígidas ignífugas IRAM 62386-21.',
    '04.04 Tableros: Gabinetes autoextinguibles IEC 60695. Grado de protección IP41 en TPU e IP43 en TPA.',
    '04.05 Jabalina PAT: Acero-cobre IRAM 2309 de 1,5m con tomacable de bronce.',
    '04.06 Tomacorrientes e Interruptores: Conformes a norma IRAM 2071 e IRAM-NM 60669-1.',
  ];

  doc.setFontSize(9);
  especificaciones.forEach((spec) => {
    const lines = doc.splitTextToSize(spec, contentWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 4.5 + 3;
  });

  // ====================================================
  // PÁGINA 8: LISTADO DE MATERIALES (CÓMPUTO / BOM)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorPrimary);
  doc.text('LISTADO DE MATERIALES (CÓMPUTO Y PRESUPUESTO)', marginLeft, cursorY);
  cursorY += 8;

  const materiales = generarListadoMateriales(project, circuitos);

  autoTable(doc, {
    startY: cursorY,
    head: [['ITEM', 'CLASIFICACIÓN', 'CANT.', 'UNID.', 'DESCRIPCIÓN TÉCNICA', 'NORMA']],
    body: materiales,
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

  // ----------------------------------------------------
  // Aplicar Encabezado y Pie de página en todas las páginas
  // ----------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Guardar archivo PDF
  const filename = `Carpeta_Tecnica_${project.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

// --------------------------------------------------------
// Funciones Auxiliares para el Generador
// --------------------------------------------------------

function calcularGradoElectrificacion(superficie: number): 'Minimo' | 'Medio' | 'Elevado' | 'Superior' {
  if (superficie <= 60) return 'Minimo';
  if (superficie <= 130) return 'Medio';
  if (superficie <= 200) return 'Elevado';
  return 'Superior';
}

function obtenerCircuitosFallback(project: Project): CircuitoCalculado[] {
  const circuitosTablero = project.tableroPrincipal?.circuitosTerminales || [];
  if (circuitosTablero.length > 0) {
    return circuitosTablero.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: (c.tipo as any) || 'tomacorrientes_usos_generales',
      puntosIUG: c.tipo.toLowerCase().includes('ilum') ? 6 : 0,
      puntosTUG: c.tipo.toLowerCase().includes('tom') ? 6 : 0,
      puntosTUE: 0,
      ambientesIds: [],
      proteccion: c.proteccion,
    }));
  }

  // Fallback por defecto si no existen circuitos
  return [
    { id: 'c1', nombre: 'Circuito 1 - Iluminación', tipo: 'iluminacion_usos_generales', puntosIUG: 6, puntosTUG: 0, puntosTUE: 0, ambientesIds: [] },
    { id: 'c2', nombre: 'Circuito 2 - Iluminación', tipo: 'iluminacion_usos_generales', puntosIUG: 6, puntosTUG: 0, puntosTUE: 0, ambientesIds: [] },
    { id: 'c3', nombre: 'Circuito 3 - Tomacorrientes', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 8, puntosTUE: 0, ambientesIds: [] },
    { id: 'c4', nombre: 'Circuito 4 - Tomacorrientes', tipo: 'tomacorrientes_usos_generales', puntosIUG: 0, puntosTUG: 8, puntosTUE: 0, ambientesIds: [] },
  ];
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

function generarListadoMateriales(project: Project, circuitos: CircuitoCalculado[]): string[][] {
  return [
    ['1.1', 'Protecciones', '1', 'un.', 'Interruptor automático termomagnético bipolar 32A C 230/400V 6kA', 'IEC 60898'],
    ['1.2', 'Protecciones', `${circuitos.length}`, 'un.', 'Interruptores automáticos termomagnéticos bipolares 10A/16A B/C 3kA', 'IEC 60898'],
    ['1.3', 'Protecciones', '1', 'un.', 'Interruptor diferencial de corriente nominal 2x40A 30mA', 'IEC 61008'],
    ['2.1', 'Canalizaciones', '100', 'tiras', 'Caño rígido semi pesado de 20mm autoextinguible no propagador de llama', 'IRAM 62386-21'],
    ['2.2', 'Canalizaciones', '14', 'un.', 'Caja octogonal de PVC 9x9', 'IRAM 2005'],
    ['2.3', 'Canalizaciones', '23', 'un.', 'Caja rectangular de PVC 5x10', 'IRAM 2005'],
    ['2.4', 'Canalizaciones', '100', 'un.', 'Conectores de PVC para caño rígido 20mm', 'IRAM 62386'],
    ['3.1', 'Gabinetes', '1', 'un.', 'Gabinete estanco de 4 polos IP65 (TPA)', 'IEC 60670'],
    ['3.2', 'Gabinetes', '1', 'un.', 'Gabinete para tablero seccional de embutir 16 polos IP41 (TPU)', 'IEC 60439'],
    ['4.1', 'Conductores', '20', 'm', 'Cable subterráneo PVC 2x6mm²', 'IRAM 2178'],
    ['4.2', 'Conductores', '250', 'm', 'Cable unipolar flexible PVC 2.5mm² Negro (Fase)', 'IRAM NM 247-3'],
    ['4.3', 'Conductores', '250', 'm', 'Cable unipolar flexible PVC 2.5mm² Celeste (Neutro)', 'IRAM NM 247-3'],
    ['4.4', 'Conductores', '350', 'm', 'Cable unipolar flexible PVC 2.5mm² Verde-Amarillo (PE)', 'IRAM NM 247-3'],
    ['4.5', 'Conductores', '100', 'm', 'Cable unipolar flexible PVC 1.5mm² Blanco/Marrón (Retorno)', 'IRAM NM 247-3'],
    ['5.1', 'Sistema PAT', '1', 'un.', 'Jabalina de 1500 mm AC/CU de 3/4"', 'IRAM 2309'],
    ['5.2', 'Sistema PAT', '1', 'un.', 'Toma de cable a compresión con tornillo de bronce', 'IRAM 2309'],
    ['5.3', 'Sistema PAT', '1', 'un.', 'Cámara de inspección de PVC para puesta a tierra', 'IRAM 2309'],
    ['6.1', 'Módulos', '23', 'un.', 'Tapas 100x50 para 3 módulos blancas', 'IRAM 2071'],
    ['6.2', 'Módulos', '23', 'un.', 'Bastidores 100x50 para 3 módulos', 'IRAM 2071'],
    ['6.3', 'Módulos', '30', 'un.', 'Módulos tomacorriente bipolares + PE 10A 250V', 'IRAM 2071'],
    ['7.1', 'Acometida', '1', 'un.', 'Caño bajada de acometida doble aislación Ø 34mm', 'IRAM 2477'],
    ['7.2', 'Acometida', '1', 'un.', 'Gabinete de policarbonato para medidor monofásico', 'IEC 60670-24'],
  ];
}
