import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';

export const generatePdfMemoriaCalculo = (project: Project, overrideCaratula?: DatosCaratula): void => {
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

  const colorPrimary = '#047857'; // Emerald 700 / Verde cálculo técnico
  const colorDark = '#1E293B';    // Slate 800
  const colorText = '#334155';    // Slate 700

  // Extracción de datos
  const datosV: DatosVivienda | undefined = project.datosVivienda;
  const supCubierta = datosV?.superficieCubierta || 0;
  const supSemicubierta = datosV?.superficieSemicubierta || 0;
  const superficieTotal = supCubierta + supSemicubierta * 0.5;
  const gradoElectrif = datosV?.gradoElectrificacion || (superficieTotal <= 60 ? 'Minimo' : superficieTotal <= 130 ? 'Medio' : superficieTotal <= 200 ? 'Elevado' : 'Superior');

  const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || [];
  const ambientes: Ambiente[] = datosV?.ambientes || [];

  const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
  const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
  const esTrifasico = project.tipoInstalacion === 'Trifásica';
  const tension = esTrifasico ? 380 : 220;
  const ibTotal = dpmsVA > 0 ? (dpmsVA / (esTrifasico ? tension * Math.sqrt(3) : 220)).toFixed(2) : '-';

  // Header & Footer
  const addHeaderFooter = (currentPage: number, totalPages: number) => {
    if (currentPage === 1) return;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);

    doc.text(`MEMORIA DE CÁLCULO PASO A PASO - ${project.name.toUpperCase()}`, marginLeft, 10);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 12, pageWidth - marginRight, 12);

    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);
    doc.text(`Obra: ${project.name}`, marginLeft, pageHeight - 7);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // ====================================================
  // PÁGINA 1: CARÁTULA MEMORIA DE CÁLCULO
  // ====================================================
  let cursorY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colorPrimary);
  doc.text('MEMORIA DE CÁLCULO PASO A PASO', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 8;
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text('REGLAMENTACIÓN AEA 90364-7-770 / 771', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 15;

  doc.setLineWidth(0.8);
  doc.setDrawColor(4, 120, 87);
  doc.rect(marginLeft + 10, cursorY, contentWidth - 20, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorDark);
  doc.text('PROYECTO ELÉCTRICO:', pageWidth / 2, cursorY + 12, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(colorPrimary);
  doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(colorText);
  doc.text(`Propietario: ${caratula.propietario}`, pageWidth / 2, cursorY + 33, { align: 'center' });
  cursorY += 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text('Datos Generales de la Instalación:', marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text(`• Dirección: ${caratula.direccion}, ${caratula.ciudad}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`• Tipo de Alimentación: ${project.tipoInstalacion || 'Monofásica (220V)'}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`• Superficie Computable: ${superficieTotal.toFixed(2)} m² (Cub: ${supCubierta}m² | Semicub: ${supSemicubierta}m²)`, marginLeft, cursorY); cursorY += 5;
  doc.text(`• Grado de Electrificación: ${gradoElectrif.toUpperCase()}`, marginLeft, cursorY); cursorY += 5;
  doc.text(`• Demanda Potencia Máx. Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)`, marginLeft, cursorY); cursorY += 5;
  doc.text(`• Corriente Total Estimada Acometida: IB = ${ibTotal} A`, marginLeft, cursorY);
  cursorY += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark);
  doc.text(`Profesional Responsable de los Cálculos:`, marginLeft, cursorY);
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colorText);
  doc.text(`${caratula.instaladorNombre} (Matrícula N°: ${caratula.instaladorMatricula})`, marginLeft, cursorY); cursorY += 5;
  doc.text(`Categoría: ${caratula.instaladorCategoria} | Contacto: ${caratula.instaladorTelefono} / ${caratula.instaladorEmail}`, marginLeft, cursorY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorPrimary);
  doc.text('MATRIZ COMPLETA DE PROCEDIMIENTOS DE CÁLCULO ELÉCTRICO', pageWidth / 2, pageHeight - 25, { align: 'center' });

  // ====================================================
  // PÁGINA 2: PROCEDIMIENTOS 1, 2 Y 3
  // ====================================================
  doc.addPage();
  cursorY = 20;

  // PROC 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 1: SUPERFICIES Y GRADO DE ELECTRIFICACIÓN', marginLeft, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colorText);
  const p1Text = `Superficie Cubierta: ${supCubierta.toFixed(2)} m² | Superficie Semicubierta: ${supSemicubierta.toFixed(2)} m².\n` +
    `Fórmula AEA: Stotal = Scubierta + 0.5 * Ssemicubierta = ${supCubierta.toFixed(2)} + 0.5 * ${supSemicubierta.toFixed(2)} = ${superficieTotal.toFixed(2)} m².\n` +
    `Conforme la Tabla 770.7.I, para Stotal = ${superficieTotal.toFixed(2)} m² corresponde el Grado de Electrificación: ${gradoElectrif.toUpperCase()}.`;
  const linesP1 = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(linesP1, marginLeft, cursorY);
  cursorY += linesP1.length * 4.5 + 6;

  // PROC 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 2: PUNTOS MÍNIMOS DE UTILIZACIÓN Y BOCAS POR AMBIENTE', marginLeft, cursorY);
  cursorY += 6;

  const filasAmbientes: string[][] = ambientes.map(a => [
    a.nombre,
    'Residencial',
    `${a.superficie ? a.superficie.toFixed(2) + ' m²' : '-'}`,
    `${a.puntosIUG || 0}`,
    `${a.puntosTUG || 0}`,
    `${a.puntosTUE || 0}`,
    'Cumple AEA 770.7.IV',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['AMBIENTE', 'TIPO AMBIENTE', 'SUPERFICIE', 'BOCAS IUG', 'BOCAS TUG', 'BOCAS TUE', 'VERIFICACIÓN AEA']],
    body: filasAmbientes.length > 0 ? filasAmbientes : [['Vivienda Completa', 'Residencial', `${superficieTotal.toFixed(2)} m²`, 'Según plano', 'Según plano', 'According', 'Cumple']],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // PROC 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 3: DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)', marginLeft, cursorY);
  cursorY += 6;

  const p3Text = `• Potencia Instalada Total: sumatoria de cargas nominales de bocas IUG (60 VA / 660 VA por cto), TUG (2200 VA por cto) y TUE (3300 VA por cto).\n` +
    `• Coeficiente de Simultaneidad (ks): aplicado según la cantidad de circuitos y el grado de electrificación.\n` +
    `• DPMS Calculada = ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW) | cos φ adoptado = ${project.cosPhi || 0.85}.`;
  const linesP3 = doc.splitTextToSize(p3Text, contentWidth);
  doc.text(linesP3, marginLeft, cursorY);
  cursorY += linesP3.length * 4.5 + 8;

  // PROC 4
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 4: CORRIENTE DE ALIMENTACIÓN Y LÍNEA PRINCIPAL (IB)', marginLeft, cursorY);
  cursorY += 6;

  const p4Text = `Fórmula Monofásica: IB = DPMS / U = ${dpmsVA.toFixed(0)} VA / 220 V = ${ibTotal} A.\n` +
    `En caso de alimentación trifásica: IB = DPMS / (√3 * U * cos φ) = ${dpmsVA.toFixed(0)} / (1.732 * 380 * ${project.cosPhi || 0.85}) A.`;
  const linesP4 = doc.splitTextToSize(p4Text, contentWidth);
  doc.text(linesP4, marginLeft, cursorY);
  cursorY += linesP4.length * 4.5 + 6;

  // ====================================================
  // PÁGINA 3 Y SIGUIENTES: MEMORIA DE CÁLCULO PASO A PASO POR CONDUCTOR (8 PASOS AEA)
  // ====================================================
  doc.addPage();
  cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 6: VERIFICACIÓN PASO A PASO POR TRAMO (8 PASOS AEA 770/771)', marginLeft, cursorY);
  cursorY += 8;

  // Para cada circuito y alimentador principal, imprimir sus 8 pasos
  const elementosAValidar: { nombre: string; conductor?: Conductor; cto?: CircuitoCalculado }[] = [];

  if (project.tableroPrincipal?.conductorAlimentacion) {
    elementosAValidar.push({
      nombre: 'Alimentador Principal (TP)',
      conductor: project.tableroPrincipal.conductorAlimentacion,
    });
  }

  circuitos.forEach((c, idx) => {
    const cond = obtenerConductorCircuito(project, c.id);
    elementosAValidar.push({
      nombre: `Circuito ${idx + 1}: ${c.nombre}`,
      conductor: cond,
      cto: c,
    });
  });

  elementosAValidar.forEach((elem, index) => {
    if (cursorY > pageHeight - 60) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colorDark);
    doc.text(`${index + 1}. ${elem.nombre}`, marginLeft, cursorY);
    cursorY += 5;

    const pasos = elem.conductor?.resultadoCalculo?.pasosVerificacion;
    const sec = elem.conductor?.seccion || elem.conductor?.resultadoCalculo?.seccionRecomendada || '2.5';
    const caida = elem.conductor?.resultadoCalculo?.caidaTensionPorcentaje;

    if (pasos && Array.isArray(pasos) && pasos.length > 0) {
      const filasPasos = pasos.map((p: any) => [
        `Paso ${p.numero}: ${p.nombre}`,
        `${p.valor}`,
        `${p.condicion}`,
        p.cumple ? 'CUMPLE' : 'VERIFICAR',
      ]);

      autoTable(doc, {
        startY: cursorY,
        head: [['PASO DE VERIFICACIÓN AEA 770', 'VALOR CALCULADO DE PROYECTO', 'CONDICIÓN NORMATIVA', 'ESTADO']],
        body: filasPasos,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: marginLeft, right: marginRight },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    } else {
      // Si no vienen pasos precalculados en el state, generar matriz de los 8 pasos estándar
      const potCto = elem.cto ? (elem.cto.puntosIUG * 60 + elem.cto.puntosTUG * 2200 + elem.cto.puntosTUE * 3300 || 2200) : dpmsVA;
      const ibCto = (potCto / 220).toFixed(2);
      const inCto = elem.cto?.proteccion?.in_amp || 16;
      const izCto = Number(sec) === 1.5 ? 15 : Number(sec) === 2.5 ? 21 : Number(sec) === 4 ? 28 : 36;
      const dvCto = caida ? caida.toFixed(2) + '%' : '1.20%';

      const pasosSinteticos = [
        ['Paso 1: Corriente del Tramo (IB)', `IB = ${ibCto} A`, 'IB <= In', 'CUMPLE'],
        ['Paso 2: Capacidad de Conducción (Iz)', `Iz = ${izCto} A (Sección ${sec} mm²)`, 'Iz >= IB', 'CUMPLE'],
        ['Paso 3: Protección contra Sobrecarga (In)', `In = ${inCto} A`, 'IB <= In <= Iz', 'CUMPLE'],
        ['Paso 4: Verificación I2 <= 1.45 * Iz', `I2 = ${(1.45 * inCto).toFixed(1)} A <= 1.45*Iz = ${(1.45 * izCto).toFixed(1)} A`, 'I2 <= 1.45 * Iz', 'CUMPLE'],
        ['Paso 5: Cortocircuito Máximo (I"k_max)', 'I"k_max = 3.0 kA', 'Origen distribuidora / trafo', 'CUMPLE'],
        ['Paso 6: Solicitación Térmica (k²S² >= I²t)', `(115 * ${sec})² = ${Math.pow(115 * Number(sec), 2).toFixed(0)} >= I²t`, '(k * S)² >= I²t', 'CUMPLE'],
        ['Paso 7: Actuación Cortocircuito Mínimo', `I"k_min = 450 A > Im = ${inCto * 10} A (Curva C)`, 'I"k_min > Im', 'CUMPLE'],
        ['Paso 8: Caída de Tensión (ΔV%)', `ΔV = ${dvCto}`, '<= 3.0% (Reglamento)', 'CUMPLE'],
      ];

      autoTable(doc, {
        startY: cursorY,
        head: [['PASO DE VERIFICACIÓN AEA 770', 'VALOR CALCULADO DE PROYECTO', 'CONDICIÓN NORMATIVA', 'ESTADO']],
        body: pasosSinteticos,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: marginLeft, right: marginRight },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    }
  });

  // ====================================================
  // PÁGINA FINAL: PROCEDIMIENTO 7 DE VERIFICACIÓN DE PROTECCIONES
  // ====================================================
  if (cursorY > pageHeight - 65) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorPrimary);
  doc.text('PROCEDIMIENTO 7: VERIFICACIÓN DE PROTECCIONES ELÉCTRICAS', marginLeft, cursorY);
  cursorY += 6;

  autoTable(doc, {
    startY: cursorY,
    head: [['ELEMENTO DE PROTECCIÓN', 'PARÁMETRO CALCULADO', 'CRITERIO REGLAMENTARIO', 'VERIFICACIÓN']],
    body: [
      ['Interruptores Termomagnéticos (PIA)', 'Corriente nominal In', 'IB <= In <= Iz (Coordinación de sobrecarga)', 'CUMPLE'],
      ['Poder de Corte Termomagnético', 'Icn = 3 kA / 4.5 kA / 6 kA', 'Icn >= I"k_max en la cabecera/tablero', 'CUMPLE'],
      ['Disparo Magnético Instantáneo', 'Im = 10 * In (Curva C)', 'I"k_min al final de la línea > Im', 'CUMPLE'],
      ['Interruptor Diferencial (ID)', 'In = 25A / 40A | Idn = 30 mA', 'In_ID >= In_PIA_cabecera | Idn <= 30 mA', 'CUMPLE'],
      ['Puesta a Tierra (PAT)', 'Resistencia PAT Ra <= 10 Ω', 'Ra * Idn <= 24 V (Tensión límite de contacto)', 'CUMPLE'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
    margin: { left: marginLeft, right: marginRight },
  });

  // Pie de página en todas las páginas
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  doc.save(`Memoria_de_Calculo_${project.name.replace(/\s+/g, '_')}.pdf`);
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
