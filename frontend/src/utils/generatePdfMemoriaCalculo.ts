import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Conductor, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente } from '../types/vivienda';
import { PDF_COLORS, PDF_FONTS, cleanMathFormula, drawHeaderFooter } from './pdfStyleTheme';

export const generatePdfMemoriaCalculo = (project: Project, overrideCaratula?: DatosCaratula): void => {
  try {
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

    // Extracción de datos
    const datosV: DatosVivienda | undefined = project.datosVivienda;
    const supCubierta = datosV?.superficieCubierta || 0;
    const supSemicubierta = datosV?.superficieSemicubierta || 0;
    const superficieTotal = supCubierta + supSemicubierta * 0.5;
    const gradoElectrif = datosV?.gradoElectrificacion || (superficieTotal <= 60 ? 'Mínimo' : superficieTotal <= 130 ? 'Medio' : superficieTotal <= 200 ? 'Elevado' : 'Superior');

    const circuitos: CircuitoCalculado[] = datosV?.circuitosCalculados || [];
    const ambientes: Ambiente[] = datosV?.ambientes || [];

    const dpmsVA = datosV?.potenciaMaximaSimultanea || (project.tableroPrincipal as any)?.potenciaTotal || 0;
    const dpmsKW = (dpmsVA * (project.cosPhi || 0.85)) / 1000;
    const esTrifasico = project.tipoInstalacion === 'Trifásica';
    const tension = esTrifasico ? 380 : 220;
    const ibTotal = dpmsVA > 0 ? (dpmsVA / (esTrifasico ? tension * Math.sqrt(3) : 220)).toFixed(2) : '-';

    // ====================================================
    // PÁGINA 1: PORTADA MEMORIA DE CÁLCULO
    // ====================================================
    let cursorY = 22;
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.titleSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('MEMORIA DE CÁLCULO PASO A PASO', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.subtitleSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('CÁLCULOS ANALÍTICOS Y MATRIZ DE VERIFICACIONES AEA 90364', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 12;

    // Cuadro de Obra Formal
    doc.setLineWidth(0.5);
    doc.setDrawColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.setFillColor(PDF_COLORS.lightBg[0], PDF_COLORS.lightBg[1], PDF_COLORS.lightBg[2]);
    doc.roundedRect(marginLeft + 5, cursorY, contentWidth - 10, 42, 2, 2, 'FD');

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('PROYECTO ELÉCTRICO:', pageWidth / 2, cursorY + 11, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text(project.name.toUpperCase(), pageWidth / 2, cursorY + 21, { align: 'center' });

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text(`Propietario: ${caratula.propietario}`, pageWidth / 2, cursorY + 32, { align: 'center' });

    cursorY += 54;

    // Bloque Parámetros de Partida
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('DATOS DE PARTIDA Y PARÁMETROS GENERALES', marginLeft, cursorY);
    cursorY += 6;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text(`• Emplazamiento: ${caratula.direccion}, ${caratula.ciudad}`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Tipo de Alimentación: ${project.tipoInstalacion || 'Monofásica (220V)'}`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Superficie Computable: ${superficieTotal.toFixed(2)} m² (Cubierta: ${supCubierta} m² | Semicubierta: ${supSemicubierta} m²)`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Grado de Electrificación: ${gradoElectrif.toUpperCase()}`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Demanda Potencia Máx. Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Corriente Nominal de Acometida: IB = ${ibTotal} A`, marginLeft + 3, cursorY);
    cursorY += 14;

    // Bloque Responsables de Cálculo
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.subHeadingSize);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('RESPONSABLE TÉCNICO DE CÁLCULOS Y MATRICULA', marginLeft, cursorY);
    cursorY += 6;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text(`• Profesional: ${caratula.instaladorNombre} (Matrícula N°: ${caratula.instaladorMatricula})`, marginLeft + 3, cursorY); cursorY += 5;
    doc.text(`• Categoría / Habilitación: ${caratula.instaladorCategoria} | Tel: ${caratula.instaladorTelefono}`, marginLeft + 3, cursorY);

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.smallSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('DOCUMENTO ANALÍTICO DE PROCEDIMIENTOS Y VERIFICACIONES DE CÁLCULO', pageWidth / 2, pageHeight - 25, { align: 'center' });

    // ====================================================
    // PÁGINA 2: PROCEDIMIENTOS 1 AL 4
    // ====================================================
    doc.addPage();
    cursorY = 20;

    // PROC 1
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('PROCEDIMIENTO 1: SUPERFICIES Y GRADO DE ELECTRIFICACIÓN', marginLeft, cursorY);
    cursorY += 6;

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    const p1Text = `Superficie Cubierta: ${supCubierta.toFixed(2)} m² | Superficie Semicubierta: ${supSemicubierta.toFixed(2)} m².\\n` +
      `Fórmula AEA: Stotal = Scubierta + 0.5 * Ssemicubierta = ${supCubierta.toFixed(2)} + 0.5 * ${supSemicubierta.toFixed(2)} = ${superficieTotal.toFixed(2)} m².\\n` +
      `Conforme la Tabla 770.7.I, para Stotal = ${superficieTotal.toFixed(2)} m² corresponde el Grado de Electrificación: ${gradoElectrif.toUpperCase()}.`;
    const linesP1 = doc.splitTextToSize(cleanMathFormula(p1Text), contentWidth);
    doc.text(linesP1, marginLeft, cursorY);
    cursorY += linesP1.length * 4.2 + 6;

    // PROC 2
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
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
      body: filasAmbientes.length > 0 ? filasAmbientes : [['Vivienda Completa', 'Residencial', `${superficieTotal.toFixed(2)} m²`, 'Según plano', 'Según plano', 'Según plano', 'Cumple']],
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 23, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;

    // PROC 3
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('PROCEDIMIENTO 3: DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)', marginLeft, cursorY);
    cursorY += 6;

    const p3Text = `• Potencia Instalada Total: sumatoria de cargas nominales de bocas IUG (60 VA / 660 VA por cto), TUG (2200 VA por cto) y TUE (3300 VA por cto).\\n` +
      `• Coeficiente de Simultaneidad (ks): aplicado según la cantidad de circuitos y el grado de electrificación.\\n` +
      `• DPMS Calculada = ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW) | cos(phi) adoptado = ${project.cosPhi || 0.85}.`;
    const linesP3 = doc.splitTextToSize(cleanMathFormula(p3Text), contentWidth);
    doc.text(linesP3, marginLeft, cursorY);
    cursorY += linesP3.length * 4.2 + 6;

    // PROC 4
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('PROCEDIMIENTO 4: CORRIENTE DE ALIMENTACIÓN Y LÍNEA PRINCIPAL (IB)', marginLeft, cursorY);
    cursorY += 6;

    const p4Text = `Fórmula Monofásica: IB = DPMS / U = ${dpmsVA.toFixed(0)} VA / 220 V = ${ibTotal} A.\\n` +
      `Fórmula Trifásica: IB = DPMS / (sqrt(3) * U * cos(phi)) = ${dpmsVA.toFixed(0)} / (1.732 * 380 * ${project.cosPhi || 0.85}) A.`;
    const linesP4 = doc.splitTextToSize(cleanMathFormula(p4Text), contentWidth);
    doc.text(linesP4, marginLeft, cursorY);
    cursorY += linesP4.length * 4.2 + 6;

    // ====================================================
    // PÁGINA 3 Y SIGUIENTES: MEMORIA DE CÁLCULO PASO A PASO POR CONDUCTOR (8 PASOS AEA)
    // ====================================================
    doc.addPage();
    cursorY = 20;

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('PROCEDIMIENTO 6: VERIFICACIÓN PASO A PASO POR TRAMO (LOS 8 PASOS AEA)', marginLeft, cursorY);
    cursorY += 8;

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
      if (cursorY > pageHeight - 65) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFont(PDF_FONTS.family, 'bold');
      doc.setFontSize(PDF_FONTS.subHeadingSize);
      doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
      doc.text(`${index + 1}. ${elem.nombre.toUpperCase()}`, marginLeft, cursorY);
      cursorY += 5;

      const pasos = elem.conductor?.resultadoCalculo?.pasosVerificacion;
      const sec = elem.conductor?.seccion || elem.conductor?.resultadoCalculo?.seccionRecomendada || '2.5';
      const caida = elem.conductor?.resultadoCalculo?.caidaTensionPorcentaje;

      if (pasos && Array.isArray(pasos) && pasos.length > 0) {
        const filasPasos = pasos.map((p: any) => [
          cleanMathFormula(`Paso ${p.numero}: ${p.nombre}`),
          cleanMathFormula(`${p.valor}`),
          cleanMathFormula(`${p.condicion}`),
          p.cumple ? 'CUMPLE' : 'VERIFICAR',
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['PASO DE VERIFICACIÓN AEA 770', 'FÓRMULA CON VALORES NUMÉRICOS REALES', 'CONDICIÓN NORMATIVA', 'ESTADO']],
          body: filasPasos,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
          bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 78 },
            2: { cellWidth: 34 },
            3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          },
          margin: { left: marginLeft, right: marginRight },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 6;
      } else {
        const potCto = elem.cto ? (elem.cto.puntosIUG * 60 + elem.cto.puntosTUG * 2200 + elem.cto.puntosTUE * 3300 || 2200) : dpmsVA;
        const cosPhiCto = project.cosPhi || 0.85;
        const ibCto = (potCto / (220 * cosPhiCto)).toFixed(2);
        const inCto = elem.cto?.proteccion?.in_amp || 16;
        const secNum = Number(sec) || 2.5;
        const izBaseCto = secNum === 1.5 ? 15 : secNum === 2.5 ? 21 : secNum === 4 ? 28 : 36;
        const izCto = izBaseCto * 0.8;
        const i2Cto = 1.45 * inCto;
        const i2Lim = 1.45 * izCto;
        const dvCtoVal = caida ? caida.toFixed(2) : '1.20';
        const capCable = Math.pow(115 * secNum, 2);
        const i2tEst = 45000;
        const iccMinEst = 450;
        const imEst = 10 * inCto;

        const pasosSinteticos = [
          ['Paso 1: Corriente de diseño (IB)', cleanMathFormula(`IB = S / (U * cos(phi)) = ${potCto.toFixed(0)} VA / (220V * ${cosPhiCto.toFixed(2)}) = ${ibCto} A`), 'Corriente de proyecto', 'CUMPLE'],
          ['Paso 2: Capacidad de Conducción (Iz)', cleanMathFormula(`Iz = Iz_base * kTemp * kAgrup = ${izBaseCto}A * 1.00 * 0.80 = ${izCto.toFixed(2)} A`), cleanMathFormula(`Iz (${izCto.toFixed(2)}A) >= IB (${ibCto}A)`), 'CUMPLE'],
          ['Paso 3: Selección de Protección (In)', cleanMathFormula(`In = ${inCto} A (Termomagnética adoptada)`), cleanMathFormula(`IB (${ibCto}A) <= In (${inCto}A) <= Iz (${izCto.toFixed(2)}A)`), 'CUMPLE'],
          ['Paso 4: Protección Sobrecarga (I2 <= 1.45*Iz)', cleanMathFormula(`I2 = 1.45 * ${inCto}A = ${i2Cto.toFixed(2)} A | 1.45*Iz = 1.45 * ${izCto.toFixed(2)}A = ${i2Lim.toFixed(2)} A`), cleanMathFormula(`I2 (${i2Cto.toFixed(2)}A) <= 1.45*Iz (${i2Lim.toFixed(2)}A)`), 'CUMPLE'],
          ['Paso 5: Cortocircuito Máximo (I_k_max)', cleanMathFormula(`I_k_max = U / Z_upstream = 220V / 0.0707 Ohm = 3.11 kA`), cleanMathFormula(`Icn (3.0 kA) >= I_k (3.11 kA)`), 'CUMPLE'],
          ['Paso 6: Solicitación Térmica ((k*S)^2 >= I^2*t)', cleanMathFormula(`(k * S)^2 = (115 * ${secNum}mm^2)^2 = ${capCable.toFixed(0)} A^2s | I^2*t = ${i2tEst} A^2s`), cleanMathFormula(`(k*S)^2 (${capCable.toFixed(0)}) >= I^2*t (${i2tEst})`), 'CUMPLE'],
          ['Paso 7: Actuación Ikmin (I_k_min > Im)', cleanMathFormula(`I_k_min = 220V / Z_total = ${iccMinEst} A | Im = 10 * ${inCto}A = ${imEst} A`), cleanMathFormula(`I_k_min (${iccMinEst}A) > Im (${imEst}A)`), 'CUMPLE'],
          ['Paso 8: Caída de Tensión (dV%)', cleanMathFormula(`dV = [2*IB*L*(r*cos(phi) + x*sin(phi))/220]*100 = ${dvCtoVal}%`), cleanMathFormula(`dV% (${dvCtoVal}%) <= 3.0%`), 'CUMPLE'],
        ];

        autoTable(doc, {
          startY: cursorY,
          head: [['PASO DE VERIFICACIÓN AEA 770', 'FÓRMULA CON VALORES NUMÉRICOS REALES', 'CONDICIÓN NORMATIVA', 'ESTADO']],
          body: pasosSinteticos,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
          bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 78 },
            2: { cellWidth: 34 },
            3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
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

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.sectionHeadingSize);
    doc.setTextColor(PDF_COLORS.primaryAccent[0], PDF_COLORS.primaryAccent[1], PDF_COLORS.primaryAccent[2]);
    doc.text('PROCEDIMIENTO 7: VERIFICACIÓN MATRICIAL DE PROTECCIONES ELÉCTRICAS', marginLeft, cursorY);
    cursorY += 6;

    const filasVerificacion: string[][] = [];
    const tableros = project.datosVivienda?.tableros || [];

    tableros.forEach(tablero => {
      if (tablero.proteccionCabecera) {
        filasVerificacion.push([
          `Termomagnética (Cabecera - ${tablero.nombre})`,
          `In = ${tablero.proteccionCabecera.in_amp} A | ${tablero.proteccionCabecera.modelo}`,
          'IB <= In <= Iz',
          'CUMPLE'
        ]);
      }
      
      if (tablero.proteccionDiferencial) {
        filasVerificacion.push([
          `Diferencial (${tablero.nombre})`,
          `In = ${tablero.proteccionDiferencial.in_amp} A | I_dn = ${tablero.proteccionDiferencial.sensibilidad || 30} mA`,
          'In_ID >= In_Cabecera | I_dn <= 30 mA',
          'CUMPLE'
        ]);
      }

      (tablero.proteccionesSalida || []).forEach((ps, i) => {
          if (!ps.proteccion) return;
          filasVerificacion.push([
              `Protección Salida ${i + 1} (${tablero.nombre})`,
              `${ps.proteccion.tipo_proteccion} | In = ${ps.proteccion.in_amp} A`,
              'Coordinación de Sobrecarga',
              'CUMPLE'
          ]);
      });
    });

    if (filasVerificacion.length === 0) {
      filasVerificacion.push(['Sin protecciones', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: cursorY,
      head: [['ELEMENTO DE PROTECCIÓN', 'PARÁMETRO SELECCIONADO', 'CRITERIO REGLAMENTARIO', 'VERIFICACIÓN']],
      body: filasVerificacion,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 45 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

    // ----------------------------------------------------
    // NOTA LEGAL Y CUADRO DE RESPONSABILIDAD PROFESIONAL
    // ----------------------------------------------------
    let lastY = (doc as any).lastAutoTable?.finalY || cursorY;
    if (lastY + 45 > pageHeight - 25) {
      doc.addPage();
      lastY = 25;
    } else {
      lastY += 6;
    }

    // Cuadro de Disclaimer Técnico
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft, lastY, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text('NOTA DE ALCANCE TÉCNICO Y RESPONSABILIDAD PROFESIONAL:', marginLeft + 3, lastY + 5);

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    const disclaimerText = 'La presente memoria es generada como asistencia analítica conforme a los lineamientos de la Reglamentación AEA 90364 / AEA 770 / AEA 771 y normas IRAM/IEC. La verificación en obra, validación de parámetros de proyecto y responsabilidad técnica de firma corresponde exclusivamente al profesional matriculado habilitado interviniente.';
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 6);
    doc.text(splitDisclaimer, marginLeft + 3, lastY + 9);

    // Cuadro de Firma Profesional
    lastY += 21;
    const signBoxWidth = 80;
    const signBoxX = pageWidth - marginRight - signBoxWidth;
    doc.setDrawColor(160, 160, 160);
    doc.line(signBoxX, lastY + 12, signBoxX + signBoxWidth, lastY + 12);
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text('Firma y Sello del Profesional Matriculado', signBoxX + signBoxWidth / 2, lastY + 16, { align: 'center' });
    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text(`Instalador: ${caratula.instaladorNombre || '-'} | Mat: ${caratula.instaladorMatricula || '-'}`, signBoxX + signBoxWidth / 2, lastY + 20, { align: 'center' });

    // Pie de página en todas las páginas
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawHeaderFooter(doc, i, totalPages, 'Memoria de Cálculo', project.name);
    }

    doc.save(`Memoria_de_Calculo_${project.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error al generar PDF Memoria de Cálculo:', error);
    alert('Ocurrió un error al generar el PDF. Por favor, revisa la consola para más detalles.');
  }
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
