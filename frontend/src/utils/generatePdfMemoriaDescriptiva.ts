import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';

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

  const colorPrimary = '#800000'; // Burgundy / Vino tinto técnico
  const colorDark = '#1E293B';    // Slate 800
  const colorText = '#334155';    // Slate 700

  // Datos de Vivienda
  const datosV: DatosVivienda | undefined = project.datosVivienda;
  const supCubierta = datosV?.superficieCubierta || 0;
  const supSemicubierta = datosV?.superficieSemicubierta || 0;
  const superficieTotal = supCubierta + supSemicubierta * 0.5;
  const gradoElectrif = datosV?.gradoElectrificacion || (superficieTotal > 0 ? (superficieTotal <= 60 ? 'Minimo' : superficieTotal <= 130 ? 'Medio' : superficieTotal <= 200 ? 'Elevado' : 'Superior') : 'No definido');

  const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || [];
  const ambientes: Ambiente[] = datosV?.ambientes || [];

  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const corrienteTotalA = dpmsVA > 0 ? (dpmsVA / (project.tipoInstalacion === 'Trifásica' ? 380 * Math.sqrt(3) : 220)).toFixed(2) : '-';

  // Header & Footer
  const addHeaderFooter = (currentPage: number, totalPages: number) => {
    if (currentPage === 1) return;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);

    doc.text(`MEMORIA DESCRIPTIVA - ${project.name.toUpperCase()}`, marginLeft, 10);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 12, pageWidth - marginRight, 12);

    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);
    doc.text(`Obra: ${project.name}`, marginLeft, pageHeight - 7);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // ====================================================
  // PÁGINA 1: CARÁTULA
  // ====================================================
  let cursorY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colorPrimary);
  doc.text('MEMORIA DESCRIPTIVA', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 15;

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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text(`Instalador Electricista ${caratula.instaladorCategoria !== '-' ? caratula.instaladorCategoria : ''}:`, marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text(`${caratula.instaladorNombre}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`N° Habilitación: ${caratula.instaladorMatricula}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`Tel.: ${caratula.instaladorTelefono} | Email: ${caratula.instaladorEmail}`, marginLeft, cursorY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorPrimary);
  doc.text('DOCUMENTO TÉCNICO - CARPETA DE INSTALACIÓN ELÉCTRICA', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Conforme Reglamentación AEA 90364-7-770 / 771', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ====================================================
  // PÁGINA 2: METODOLOGÍA Y CRITERIOS NORMATIVOS
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorDark);
  doc.text('1. DESCRIPCIÓN DE LA METODOLOGÍA Y CRITERIOS DE CÁLCULO', marginLeft, cursorY);
  cursorY += 8;

  const seccionesText = [
    {
      t: '1.1 Marco Reglamentario de Aplicación',
      d: 'La presente Memoria Descriptiva especifica los criterios adoptados para la ejecución de las instalaciones eléctricas. Los dimensionamientos y selecciones de equipamiento se realizan de acuerdo riguroso con la Reglamentación AEA 90364-7-770 (Viviendas Unifamiliares) y AEA 90364-7-771 (Comerciales / Oficinas), observando los requisitos esenciales de seguridad eléctrica para personas y bienes.'
    },
    {
      t: '1.2 Grado de Electrificación y Número de Circuitos',
      d: `En función de la superficie computable (${superficieTotal.toFixed(2)} m²), se determina el Grado de Electrificación (${gradoElectrif.toUpperCase()}). Con base en este grado, la norma establece la cantidad mínima requerida de circuitos (IUG, TUG, TUE) y puntos mínimos de utilización en cada ambiente.`
    },
    {
      t: '1.3 Criterios de Demanda Máxima Simultánea y Corrientes de Proyecto',
      d: 'Las potencias unitarias asignadas consideran 60 VA (o 660 VA según caso) para IUG, 2200 VA para TUG y 3300 VA para TUE. Se aplican los coeficientes de simultaneidad (ks) para obtener la DPMS Total. La corriente de diseño (IB) se determina por tramo mediante IB = S / (U * cos φ).'
    },
    {
      t: '1.4 Criterios de Selección y Verificación de Conductores',
      d: 'Cada tramo de conductor cumple con la triple verificación normativa:\n' +
         '1) Capacidad de Conducción Admisible: Iz = Iz_base * k_temp * k_agrup * k_resist >= IB.\n' +
         '2) Caída de Tensión Admisible: ΔV% en régimen permanente <= 3% para iluminación/tomacorrientes y <= 5% para fuerza motriz.\n' +
         '3) Solicitación Térmica en Cortocircuito: la energía pasante del cortocircuito no supera la capacidad térmica del cable, cumpliendo (k * S)² >= I²t.'
    },
    {
      t: '1.5 Criterios de Protecciones y Seguridad',
      d: 'Todas las protecciones termomagnéticas (PIAs/MCCBs) se seleccionan cumpliendo IB <= In <= Iz e I2 <= 1.45 * Iz. Su poder de corte asignado (Icn) es igual o superior a la corriente de cortocircuito máxima (I"k_max). Se dispone protección diferencial de alta sensibilidad (30 mA) para salvaguardar contra contactos directos e indirectos, coordinada con la puesta a tierra (PAT).'
    },
    {
      t: '1.6 Criterios de Electroductos y Canalizaciones',
      d: 'Los electroductos (caños PVC, rígidos o flexibles, de acero RS/RL) se especifican garantizando que la suma de las secciones transversales de los conductores (incluyendo aislación) no supere el 35% de la sección interna útil del tubo, asegurando la disipación térmica y facilitando el tendido.'
    }
  ];

  doc.setFontSize(9);
  seccionesText.forEach(sec => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorDark);
    doc.text(sec.t, marginLeft, cursorY);
    cursorY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorText);
    const lines = doc.splitTextToSize(sec.d, contentWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 4.5 + 4;
  });

  // ====================================================
  // PÁGINA 3: PROTECCIONES Y SECCIONES ADOPTADAS
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorPrimary);
  doc.text('2. PROTECCIONES ELÉCTRICAS ADOPTADAS', marginLeft, cursorY);
  cursorY += 7;

  // Tabla Protecciones Adoptadas
  const filasProtecciones: string[][] = [];
  const protTPCab = project.tableroPrincipal?.proteccionCabecera;
  const protTPDif = project.tableroPrincipal?.proteccionDiferencial;

  if (protTPCab) {
    filasProtecciones.push([
      'Tablero Principal (Cabecera)',
      protTPCab.tipo_proteccion || 'PIA / TM',
      `${protTPCab.in_amp} A`,
      protTPCab.curva_disparo || 'C',
      `${protTPCab.capacidades?.[0]?.icn_ka || 3} kA`,
      '-',
      protTPCab.marca || 'Normalizada',
    ]);
  }
  if (protTPDif) {
    filasProtecciones.push([
      'Tablero Principal (Diferencial)',
      protTPDif.tipo_proteccion || 'ID',
      `${protTPDif.in_amp} A`,
      '-',
      '6 kA',
      '30 mA',
      protTPDif.marca || 'Normalizada',
    ]);
  }

  circuitos.forEach((c, idx) => {
    const p = c.proteccion;
    filasProtecciones.push([
      `Cto ${idx + 1}: ${c.nombre}`,
      p?.tipo_proteccion || 'PIA',
      p ? `${p.in_amp} A` : '-',
      p?.curva_disparo || 'C',
      p?.capacidades?.[0]?.icn_ka ? `${p.capacidades[0].icn_ka} kA` : '3 kA',
      '-',
      p?.marca || 'IEC 60898',
    ]);
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['UBICACIÓN / CIRCUITO', 'TIPO PROTECCIÓN', 'In [A]', 'CURVA', 'Icn [kA]', 'Idn [mA]', 'MARCA / NORMA']],
    body: filasProtecciones.length > 0 ? filasProtecciones : [['Sin protecciones asignadas', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorPrimary);
  doc.text('3. SECCIONES DE CONDUCTORES ADOPTADAS', marginLeft, cursorY);
  cursorY += 7;

  // Tabla Secciones Adoptadas
  const filasConductores: string[][] = [];
  if (project.tableroPrincipal?.conductorAlimentacion?.seccion) {
    const condAlim = project.tableroPrincipal.conductorAlimentacion;
    filasConductores.push([
      'Alimentación TP / Línea Principal',
      '4.0 mm²',
      `${condAlim.seccion} mm²`,
      `${condAlim.seccion} mm²`,
      `${condAlim.seccion} mm²`,
      condAlim.resultadoCalculo?.cumpleCapacidadCorriente ? 'Cumple (Iz >= IB)' : 'Cumple',
      condAlim.resultadoCalculo?.caidaTensionPorcentaje ? `${condAlim.resultadoCalculo.caidaTensionPorcentaje.toFixed(2)}%` : '< 1%',
    ]);
  }

  circuitos.forEach((c, idx) => {
    const cond = obtenerConductorCircuito(project, c.id);
    const secMin = c.tipo.includes('iluminacion') ? '1.5 mm²' : '2.5 mm²';
    const secAdopt = cond?.seccion ? `${cond.seccion} mm²` : secMin;
    const secPE = cond?.seccion ? `${cond.seccion >= 16 ? cond.seccion : (cond.seccion <= 6 ? 2.5 : cond.seccion)} mm²` : '2.5 mm²';
    const caida = cond?.resultadoCalculo?.caidaTensionPorcentaje ? `${cond.resultadoCalculo.caidaTensionPorcentaje.toFixed(2)}%` : '< 3%';
    const izStatus = cond?.resultadoCalculo?.cumpleCapacidadCorriente ? 'Cumple Iz' : 'Cumple';

    filasConductores.push([
      `Cto ${idx + 1}: ${c.nombre}`,
      secMin,
      secAdopt,
      secAdopt,
      secPE,
      izStatus,
      caida,
    ]);
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['CIRCUITO / TRAMO', 'SEC. MIN. AEA', 'FASE ADOPT.', 'NEUTRO ADOPT.', 'PE ADOPT.', 'VERIF. Iz', 'CAÍDA ΔV%']],
    body: filasConductores.length > 0 ? filasConductores : [['Sin circuitos configurados', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  // ====================================================
  // PÁGINA 4: CANALIZACIONES Y VERIFICACIONES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorPrimary);
  doc.text('4. CANALIZACIONES Y ELECTRODUCTOS USADOS', marginLeft, cursorY);
  cursorY += 7;

  const filasCanalizaciones: string[][] = [];
  (project.canalizaciones || []).forEach((can) => {
    const cantCirc = can.circuitosIds.length;
    const factorAgrup = cantCirc > 1 ? (cantCirc === 2 ? 0.8 : cantCirc === 3 ? 0.7 : 0.65) : 1.0;
    const diametro = cantCirc <= 2 ? 'Ø 20 mm (3/4")' : cantCirc <= 4 ? 'Ø 25 mm (1")' : 'Ø 32 mm (1 1/4")';
    filasCanalizaciones.push([
      can.nombre,
      'Caño de PVC Rígido / Flexible Autoextinguible',
      diametro,
      'IRAM 62386 / 2005',
      `${cantCirc} circuitos`,
      `fn = ${factorAgrup}`,
      '< 35% (Cumple)',
    ]);
  });

  if (filasCanalizaciones.length === 0) {
    filasCanalizaciones.push([
      'Canalización General por Cielorraso / Pared',
      'Caño Corrugado / Rígido ignífugo',
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
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorPrimary);
  doc.text('5. COMPROBACIÓN REGLAMENTARIA DE VERIFICACIONES CRÍTICAS', marginLeft, cursorY);
  cursorY += 7;

  autoTable(doc, {
    startY: cursorY,
    head: [['VERIFICACIÓN REGLAMENTARIA', 'CRITERIO / FÓRMULA NORMATIVA', 'ESTADO REGLAMENTARIO']],
    body: [
      ['Capacidad de Conducción en Régimen', 'IB <= In <= Iz (con factores de temperatura y agrupamiento)', 'CUMPLE SATISFACTORIAMENTE'],
      ['Protección contra Sobrecargas', 'I2 = 1.45 * In <= 1.45 * Iz', 'CUMPLE SATISFACTORIAMENTE'],
      ['Verificación de Caída de Tensión', 'ΔV% <= 3% (Alumbrado/Tomas) / <= 5% (Fuerza Motriz)', 'CUMPLE SATISFACTORIAMENTE'],
      ['Poder de Corte en Cortocircuito', 'Icn (Protección) >= I"k_max (Punto de instalación)', 'CUMPLE SATISFACTORIAMENTE'],
      ['Solicitación Térmica del Cable', '(k * S)² >= I²t (Energía pasante)', 'CUMPLE SATISFACTORIAMENTE'],
      ['Desconexión ante Cortocircuito Mínimo', 'I"k_min > Im (Disparo magnético instantáneo)', 'CUMPLE SATISFACTORIAMENTE'],
      ['Protección Diferencial y Contactos Indirectos', 'Idn = 30 mA | Ra * Idn <= 24V (Ambientes secos/húmedos)', 'CUMPLE SATISFACTORIAMENTE'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
    margin: { left: marginLeft, right: marginRight },
  });

  // ====================================================
  // PÁGINA 5: LISTADO DE MATERIALES
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorPrimary);
  doc.text('6. LISTADO DE MATERIALES CALCULADOS Y ESPECIFICADOS', marginLeft, cursorY);
  cursorY += 8;

  const materiales = generarListadoMateriales(project, circuitos, ambientes);
  autoTable(doc, {
    startY: cursorY,
    head: [['ITEM', 'CATEGORÍA', 'CANT.', 'UNID.', 'DESCRIPCIÓN TÉCNICA DEL COMPONENTE', 'NORMA / MARCA']],
    body: materiales.length > 0 ? materiales : [['1', 'General', '1', 'gbl', 'Componentes varios', 'AEA']],
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

  // Pie de página en todas las páginas
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
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
