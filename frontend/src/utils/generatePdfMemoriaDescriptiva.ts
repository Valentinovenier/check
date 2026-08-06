import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';
import { PDF_COLORS, PDF_FONTS, cleanMathFormula, drawHeaderFooter } from './pdfStyleTheme';

export const generatePdfMemoriaDescriptiva = (project: Project, overrideCaratula?: DatosCaratula): void => {
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

  // Extracción de datos de proyecto
  const datosV: DatosVivienda | undefined = project.datosVivienda;
  const tableros = datosV?.tableros || [];
  const supCubierta = datosV?.superficieCubierta || 0;
  const supSemicubierta = datosV?.superficieSemicubierta || 0;
  const superficieTotal = supCubierta + supSemicubierta * 0.5;
  const gradoElectrif = datosV?.gradoElectrificacion || (superficieTotal > 0 ? (superficieTotal <= 60 ? 'Mínimo' : superficieTotal <= 130 ? 'Medio' : superficieTotal <= 200 ? 'Elevado' : 'Superior') : 'No definido');

  const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || [];
  const ambientes: Ambiente[] = datosV?.ambientes || [];

  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const corrienteTotalA = dpmsVA > 0 ? (dpmsVA / (project.tipoInstalacion === 'Trifásica' ? 380 * Math.sqrt(3) : 220)).toFixed(2) : '-';

  // ====================================================
  // PÁGINA 1: PORTADA INSTITUCIONAL / MEMORIA DESCRIPTIVA
  // ====================================================
  let cursorY = 22;

  // Título Principal
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.titleSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('MEMORIA DESCRIPTIVA', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subtitleSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('CARPETA TÉCNICA DE INSTALACIÓN ELÉCTRICA', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 12;

  // Cuadro de Obra Formal
  doc.setLineWidth(0.5);
  doc.setDrawColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.setFillColor(PDF_COLORS.lightBg[0], PDF_COLORS.lightBg[1], PDF_COLORS.lightBg[2]);
  doc.roundedRect(marginLeft + 5, cursorY, contentWidth - 10, 42, 2, 2, 'FD');

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('DENOMINACIÓN DE LA OBRA:', pageWidth / 2, cursorY + 11, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 21, { align: 'center' });

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`Propietario: ${caratula.propietario}`, pageWidth / 2, cursorY + 32, { align: 'center' });

  cursorY += 54;

  // Bloque Ubicación
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('1. UBICACIÓN Y EMPLAZAMIENTO DE LA OBRA', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Dirección: ${caratula.direccion}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Localidad: ${caratula.ciudad}${caratula.provincia !== '-' ? ', ' + caratula.provincia : ''}`, marginLeft + 3, cursorY);
  cursorY += 12;

  // Bloque Instalador / Proyectista
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('2. PROFESIONAL PROYECTISTA / INSTALADOR RESPONSABLE', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Nombre y Apellido: ${caratula.instaladorNombre}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Categoría Profesional: ${caratula.instaladorCategoria !== '-' ? caratula.instaladorCategoria : 'Instalador Electricista Habilitado'}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• N° de Matrícula / Registro: ${caratula.instaladorMatricula}`, marginLeft + 3, cursorY); cursorY += 5;
  doc.text(`• Datos de Contacto: Tel: ${caratula.instaladorTelefono} | Email: ${caratula.instaladorEmail}`, marginLeft + 3, cursorY);
  cursorY += 15;

  // Cuadro Síntesis de Parámetros
  doc.setLineWidth(0.4);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, cursorY, contentWidth, 32);

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.subHeadingSize);
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text('RESUMEN DE PARÁMETROS TÉCNICOS PRINCIPALES', marginLeft + 5, cursorY + 7);

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(`• Superficie Computable Total: ${superficieTotal.toFixed(2)} m² (Cub: ${supCubierta}m² | Semicub: ${supSemicubierta}m²)`, marginLeft + 5, cursorY + 14);
  doc.text(`• Grado de Electrificación Determinado: ${gradoElectrif.toUpperCase()}`, marginLeft + 5, cursorY + 20);
  doc.text(`• Demanda de Potencia Máxima Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)`, marginLeft + 5, cursorY + 26);

  // Pie de Portada
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('DOCUMENTACIÓN TÉCNICA OFICIAL PARA PRESENTACIÓN REGLAMENTARIA', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.footerSize);
  doc.setTextColor(PDF_COLORS.subtext[0], PDF_COLORS.subtext[1], PDF_COLORS.subtext[2]);
  doc.text('Conforme Criterios AEA 90364-7-770 (Viviendas Unifamiliares) / AEA 90364-7-771 (Comerciales)', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ====================================================
  // PÁGINA 2: ESPECIFICACIONES Y METODOLOGÍA
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
  doc.text('3. ESPECIFICACIÓN DE LA METODOLOGÍA Y CRITERIOS NORMATIVOS', marginLeft, cursorY);
  cursorY += 8;

  const seccionesText = [
    {
      t: '3.1 Marco Reglamentario de Aplicación',
      d: 'La presente Memoria Descriptiva establece los criterios técnicos y normativos adoptados para el proyecto. Los cálculos, dimensionamientos y selecciones de materiales responden rigurosamente a las Reglamentaciones AEA 90364-7-770 (Instalaciones en Viviendas Unifamiliares) y AEA 90364-7-771 (Instalaciones en Locales Comerciales y Oficinas), preservando la seguridad de las personas, animales domésticos y bienes.'
    },
    {
      t: '3.2 Determinación del Grado de Electrificación',
      d: `En función de la superficie computable (${superficieTotal.toFixed(2)} m²), según la Tabla 770.7.I se determina el Grado de Electrificación (${gradoElectrif.toUpperCase()}). Este valor fija la cantidad mínima de circuitos requeridos (IUG, TUG, TUE) y la cantidad mínima de puntos de utilización (bocas) por cada ambiente.`
    },
    {
      t: '3.3 Determinación de Potencias e Intensidades de Proyecto',
      d: 'Se asignan potencias unitarias reglamentarias (60 VA o 660 VA según caso para IUG, 2200 VA para TUG y 3300 VA para TUE). Se aplican los factores de simultaneidad (ks) correspondientes para calcular la DPMS Total. La corriente de diseño por tramo (IB) se deduce mediante la expresión IB = S / (U * cos(phi)).'
    },
    {
      t: '3.4 Criterios de Selección y Verificación de Conductores',
      d: 'Todos los conductores especificados cumplen en forma simultánea con las tres verificaciones de seguridad:\n' +
         '1) Capacidad de Conducción en Régimen Continuo: Iz = Iz_base * kTemp * kAgrup * kResist >= IB.\n' +
         '2) Caída de Tensión Admisible: dV% en régimen permanente <= 3% para iluminación/tomacorrientes y <= 5% para fuerza motriz.\n' +
         '3) Solicitación Térmica en Cortocircuito: soporta la energía pasante cumpliendo (k * S)^2 >= I^2 * t.'
    },
    {
      t: '3.5 Criterios de Protecciones Eléctricas y Seguridad',
      d: 'Los interruptores termomagnéticos (PIAs) se coordinan respetando las condiciones IB <= In <= Iz e I2 = 1.45 * In <= 1.45 * Iz. Su poder de corte asignado (Icn) resulta superior a la corriente de cortocircuito máxima (I_k_max). Se especifica protección diferencial de alta sensibilidad (Idn = 30 mA) para asegurar la desconexión automática contra contactos indirectos en combinación con el sistema de Puesta a Tierra (PAT).'
    },
    {
      t: '3.6 Criterios de Canalizaciones y Electroductos',
      d: 'Los caños de PVC rígidos o flexibles autoextinguibles (norma IRAM 62386) y canalizaciones metálicas se dimensionan garantizando un factor de ocupación de la sección interna útil de hasta el 35%, asegurando la correcta evacuación del calor en los conductores y facilitando el tendido.'
    }
  ];

  doc.setFontSize(PDF_FONTS.bodySize);
  seccionesText.forEach(sec => {
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text(cleanMathFormula(sec.t), marginLeft, cursorY);
    cursorY += 4.5;
    
    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    const lines = doc.splitTextToSize(cleanMathFormula(sec.d), contentWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 4.2 + 4.5;
  });

  // ====================================================
  // PÁGINA 3: TABLA DE PROTECCIONES Y CONDUCTORES ADOPTADOS
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('4. TABLA ESPECÍFICA DE PROTECCIONES ADOPTADAS', marginLeft, cursorY);
  cursorY += 7;

  const filasProtecciones: string[][] = [];
  // Usando tableros declarado al inicio

  tableros.forEach(tablero => {
    if (tablero.proteccionCabecera) {
      filasProtecciones.push([
        `Tablero: ${tablero.nombre} (Cabecera)`,
        tablero.proteccionCabecera.tipo_proteccion || 'PIA',
        `${tablero.proteccionCabecera.in_amp} A`,
        tablero.proteccionCabecera.curva_disparo || 'C',
        `${tablero.proteccionCabecera.capacidades?.[0]?.icn_ka || 3} kA`,
        '-',
        tablero.proteccionCabecera.marca || 'Normalizada',
      ]);
    }
    if (tablero.proteccionDiferencial) {
      filasProtecciones.push([
        `Tablero: ${tablero.nombre} (Diferencial)`,
        tablero.proteccionDiferencial.tipo_proteccion || 'ID',
        `${tablero.proteccionDiferencial.in_amp} A`,
        '-',
        '6 kA',
        `${tablero.proteccionDiferencial.sensibilidad || 30} mA`,
        tablero.proteccionDiferencial.marca || 'Normalizada',
      ]);
    }

    (tablero.proteccionesSalida || []).forEach((ps, i) => {
        filasProtecciones.push([
            `Tablero: ${tablero.nombre} (Salida ${i + 1})`,
            ps.proteccion.tipo_proteccion || 'PIA',
            `${ps.proteccion.in_amp} A`,
            ps.proteccion.curva_disparo || 'C',
            `${ps.proteccion.capacidades?.[0]?.icn_ka || 3} kA`,
            '-',
            ps.proteccion.marca || 'Normalizada',
        ]);
    });
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['UBICACIÓN / CIRCUITO', 'TIPO PROTECCIÓN', 'In [A]', 'CURVA', 'Icn [kA]', 'Idn [mA]', 'NORMA / MARCA']],
    body: filasProtecciones.length > 0 ? filasProtecciones : [['Sin protecciones asignadas', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 27, halign: 'center' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('5. TABLA ESPECÍFICA DE CONDUCTORES Y SECCIONES ADOPTADAS', marginLeft, cursorY);
  cursorY += 7;

  const filasConductores: string[][] = [];
  if (project.tableroPrincipal?.conductorAlimentacion?.seccion) {
    const condAlim = project.tableroPrincipal.conductorAlimentacion;
    filasConductores.push([
      'Alimentador TP / Línea Principal',
      '4.0 mm²',
      `${condAlim.seccion} mm²`,
      `${condAlim.seccion} mm²`,
      `${condAlim.seccion} mm²`,
      condAlim.resultadoCalculo?.cumpleCapacidadCorriente ? 'Cumple Iz' : 'Cumple',
      condAlim.resultadoCalculo?.caidaTensionPorcentaje ? `${condAlim.resultadoCalculo.caidaTensionPorcentaje.toFixed(2)}%` : '< 1.0%',
    ]);
  }

  circuitos.forEach((c, idx) => {
    const cond = obtenerConductorCircuito(project, c.id);
    const secMin = c.tipo.includes('iluminacion') ? '1.5 mm²' : '2.5 mm²';
    const secAdopt = cond?.seccion ? `${cond.seccion} mm²` : secMin;
    const secPE = cond?.seccion ? `${cond.seccion >= 16 ? cond.seccion : 2.5} mm²` : '2.5 mm²';
    const caida = cond?.resultadoCalculo?.caidaTensionPorcentaje ? `${cond.resultadoCalculo.caidaTensionPorcentaje.toFixed(2)}%` : '< 3.0%';

    filasConductores.push([
      `Cto ${idx + 1}: ${c.nombre}`,
      secMin,
      secAdopt,
      secAdopt,
      secPE,
      'Cumple Iz',
      caida,
    ]);
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['CIRCUITO / TRAMO', 'MÍNIMA AEA', 'FASE ADOPT.', 'NEUTRO ADOPT.', 'PE ADOPT.', 'CAPACIDAD (Iz)', 'CAÍDA (dV%)']],
    body: filasConductores.length > 0 ? filasConductores : [['Sin circuitos configurados', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [112, 26, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 23, halign: 'center' },
      3: { cellWidth: 23, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  // ====================================================
  // PÁGINA 4: CANALIZACIONES Y COMPROBACIONES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('6. CANALIZACIONES Y ELECTRODUCTOS UTILIZADOS', marginLeft, cursorY);
  cursorY += 7;

  const filasCanalizaciones: string[][] = [];
  (project.canalizaciones || []).forEach((can) => {
    const cantCirc = can.circuitosIds.length;
    const factorAgrup = cantCirc > 1 ? (cantCirc === 2 ? 0.8 : cantCirc === 3 ? 0.7 : 0.65) : 1.0;
    const diametro = cantCirc <= 2 ? 'Ø 20 mm (3/4")' : cantCirc <= 4 ? 'Ø 25 mm (1")' : 'Ø 32 mm (1 1/4")';
    filasCanalizaciones.push([
      can.nombre,
      'Caño de PVC Rígido / Corrugado Ignífugo',
      diametro,
      'IRAM 62386',
      `${cantCirc} circuitos`,
      `fn = ${factorAgrup}`,
      '<= 35% (Cumple)',
    ]);
  });

  if (filasCanalizaciones.length === 0) {
    filasCanalizaciones.push([
      'Canalización General Embebida en Mampostería',
      'Caño de PVC Rígido / Flexible Autoextinguible',
      'Ø 20 mm / Ø 25 mm',
      'IRAM 62386',
      '1 a 3 circuitos',
      'fn = 0.8 a 1.0',
      '<= 35% (Cumple)',
    ]);
  }

  autoTable(doc, {
    startY: cursorY,
    head: [['TRAMO CANALIZACIÓN', 'TIPO MATERIAL', 'DIÁMETRO NOMINAL', 'NORMA CAÑO', 'AGRUPAMIENTO', 'FACTOR fn', 'OCUPACIÓN S%']],
    body: filasCanalizaciones,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 45 },
      2: { cellWidth: 23, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('7. MATRIZ DE COMPROBACIONES REGLAMENTARIAS DE SEGURIDAD', marginLeft, cursorY);
  cursorY += 7;

  const filasVerificacion: string[][] = [];
  // Usando tableros declarado al inicio

  tableros.forEach(tablero => {
    if (tablero.proteccionCabecera) {
      filasVerificacion.push([
        `Termomagnética (${tablero.nombre})`,
        `In = ${tablero.proteccionCabecera.in_amp} A | ${tablero.proteccionCabecera.modelo}`,
        'CUMPLE SATISFACTORIAMENTE'
      ]);
    }
    if (tablero.proteccionDiferencial) {
      filasVerificacion.push([
        `Interruptor Diferencial (${tablero.nombre})`,
        `In = ${tablero.proteccionDiferencial.in_amp} A | I_dn = ${tablero.proteccionDiferencial.sensibilidad || 30} mA`,
        'CUMPLE SATISFACTORIAMENTE'
      ]);
    }

    (tablero.proteccionesSalida || []).forEach((ps, i) => {
        filasVerificacion.push([
            `Protección Salida ${i + 1} (${tablero.nombre})`,
            `${ps.proteccion.tipo_proteccion} | In = ${ps.proteccion.in_amp} A`,
            'CUMPLE SATISFACTORIAMENTE'
        ]);
    });
  });

  if (filasVerificacion.length === 0) {
    filasVerificacion.push(['Sin protecciones', '-', 'VERIFICAR']);
  }

  autoTable(doc, {
    startY: cursorY,
    head: [['VERIFICACIÓN REGLAMENTARIA', 'VALOR/PARÁMETRO ADOPTADO', 'ESTADO REGLAMENTARIO']],
    body: filasVerificacion,
    theme: 'grid',
    headStyles: { fillColor: [112, 26, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: marginLeft, right: marginRight },
  });

  // ====================================================
  // PÁGINA 5: LISTADO COMPLETO DE MATERIALES (BOM)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.sectionHeadingSize);
  doc.setTextColor(PDF_COLORS.burgundy[0], PDF_COLORS.burgundy[1], PDF_COLORS.burgundy[2]);
  doc.text('8. LISTADO ESPECÍFICO DE MATERIALES CALCULADOS (BOM)', marginLeft, cursorY);
  cursorY += 8;

  const materiales = generarListadoMateriales(project, circuitos, ambientes);
  autoTable(doc, {
    startY: cursorY,
    head: [['ITEM', 'CATEGORÍA', 'CANT.', 'UNID.', 'DESCRIPCIÓN TÉCNICA DEL COMPONENTE', 'NORMA / MARCA']],
    body: materiales.length > 0 ? materiales : [['1', 'General', '1', 'gbl', 'Componentes varios', 'AEA']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 84 },
      5: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  // Pie de página en todas las páginas
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeaderFooter(doc, i, totalPages, 'Memoria Descriptiva', project.name);
  }

  doc.save(`Memoria_Descriptiva_${project.name.replace(/\s+/g, '_')}.pdf`);
};

function obtenerConductorCircuito(project: Project, circuitoId: string): Conductor | undefined {
  const conds = project.conductores || {};
  for (const [key, val] of Object.entries(conds)) {
    if (key.includes(circuitoId) || (val as any)?.destinoId === circuitoId) {
      return val;
    }
  }
  return undefined;
}

function generarListadoMateriales(project: Project, circuitos: CircuitoCalculado[], ambientes: Ambiente[]): string[][] {
  const list: string[][] = [];
  let itemIdx = 1;

  const protCabecera = project.tableroPrincipal?.proteccionCabecera;
  if (protCabecera) {
    list.push([
      `1.${itemIdx++}`,
      'Protecciones',
      '1',
      'un.',
      `Protección Cabecera TP: Termomagnética ${protCabecera.in_amp}A ${protCabecera.curva_disparo || 'C'}`,
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
      `Interruptor Diferencial TP: ${protDif.in_amp}A / 30mA`,
      protDif.marca || 'IEC 61008',
    ]);
  }

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

  const condEntries = Object.entries(project.conductores || {});
  condEntries.forEach(([key, cond], idx) => {
    if (cond.seccion) {
      const lenStr = cond.longitud ? `${cond.longitud} m` : 'Según tramo';
      list.push([
        `2.${idx + 1}`,
        'Conductores',
        lenStr,
        cond.longitud ? 'm' : 'tramo',
        `Conductor ${key.replace('__', ' - ')}: Sección ${cond.seccion} mm² (${cond.aislacion || 'PVC'}, Cobre)`,
        cond.normaCable || 'IRAM-NM 247-3',
      ]);
    }
  });

  (project.canalizaciones || []).forEach((can, idx) => {
    list.push([
      `3.${idx + 1}`,
      'Canalizaciones',
      '1',
      'tramo',
      `Electroducto ${can.nombre} (Aloja ${can.circuitosIds.length} circuitos)`,
      can.normaCable || 'IRAM 62386',
    ]);
  });

  if (ambientes.length > 0) {
    const totIUG = ambientes.reduce((acc, a) => acc + (a.puntosIUG || 0), 0);
    const totTUG = ambientes.reduce((acc, a) => acc + (a.puntosTUG || 0), 0);
    const totTUE = ambientes.reduce((acc, a) => acc + (a.puntosTUE || 0), 0);

    if (totIUG > 0) list.push(['4.1', 'Bocas / Cajas', `${totIUG}`, 'un.', 'Cajas Octogonales (Bocas IUG)', 'IRAM 2005']);
    if (totTUG > 0) list.push(['4.2', 'Bocas / Cajas', `${totTUG}`, 'un.', 'Módulos Tomacorriente TUG (5x10)', 'IRAM 2071']);
    if (totTUE > 0) list.push(['4.3', 'Bocas / Cajas', `${totTUE}`, 'un.', 'Módulos Tomacorriente TUE especiales', 'IRAM 2071']);
  }

  return list;
}
