import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  VerticalAlign,
} from 'docx';
import { Project, DatosCaratula } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente, TomasCircuito } from '../types/vivienda';
import {
  calcularPotencias,
  calcularPuntosMinimosAmbiente,
  obtenerCircuitosMinimos,
  obtenerConfiguracionCircuitos,
} from '../engine/strategies/vivienda/normas770';
import { calcularDPMS } from '../engine/strategies/vivienda/calculoPotencia';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../data/vivienda/factoresSimultaneidad';

// Colores institucionales formales (hex sin almohadilla para docx)
const DOCX_COLORS = {
  primaryNavy: '1E3A8A',     // Azul Marino Institucional
  primaryEmerald: '047857',  // Verde Técnico
  darkSlate: '1E293B',       // Pizarra Oscuro
  textSlate: '334155',       // Texto Principal
  lightBg: 'F8FAFC',         // Fondo Gris Claro
  borderSlate: 'CBD5E1',     // Bordes de tabla
  white: 'FFFFFF',
};

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: DOCX_COLORS.borderSlate,
};

const TABLE_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
  insideHorizontal: BORDER_STYLE,
  insideVertical: BORDER_STYLE,
};

/**
 * Genera y descarga un documento editable en formato Word (.docx)
 * 100% compatible con Google Docs y Microsoft Word, manteniendo
 * TODAS las tablas estructuradas como objetos de tabla nativos editables.
 */
export const generateDocxMemoriaCalculoBasico = async (
  project: Project,
  overrideCaratula?: DatosCaratula
): Promise<void> => {
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

    const isVivienda = (project.projectType || 'Vivienda') === 'Vivienda';

    const docChildren: (Paragraph | Table)[] = isVivienda
      ? construirContenidoVivienda(project, caratula)
      : construirContenidoGeneral(project, caratula);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1134, // ~2cm
                right: 1134,
                bottom: 1134,
                left: 1134,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memoria_Calculo_DPMS_${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar archivo DOCX para Google Docs:', error);
    alert('Ocurrió un error al generar el archivo .docx editable.');
  }
};

/**
 * Crea las celdas de encabezado de tabla con estilo institucional
 */
function createHeaderCell(text: string, widthPercent: number, bgColor = DOCX_COLORS.primaryNavy): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18, // 9pt
            color: DOCX_COLORS.white,
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

/**
 * Crea una celda de datos regular para la tabla
 */
function createDataCell(
  text: string,
  widthPercent: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  bold = false,
  isAlternate = false
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isAlternate ? { fill: DOCX_COLORS.lightBg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold,
            size: 18, // 9pt
            color: DOCX_COLORS.textSlate,
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

/**
 * Construye el documento Word con todas las tablas nativas de Vivienda
 */
function construirContenidoVivienda(project: Project, caratula: DatosCaratula): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

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

  // ==========================================
  // 1. TÍTULO Y CARÁTULA FORMAL
  // ==========================================
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: 'MEMORIA TÉCNICA Y CÁLCULO DE DPMS',
          bold: true,
          size: 32, // 16pt
          color: DOCX_COLORS.primaryNavy,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'DETERMINACIÓN DE DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA - REGLAMENTACIÓN AEA 90364-7-770',
          size: 20, // 10pt
          color: DOCX_COLORS.darkSlate,
          font: 'Arial',
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Tabla Cuadro de Obra y Datos de Portada
  const coverTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_COLORS.lightBg, type: ShadingType.CLEAR },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'PROYECTO: ', bold: true, size: 20, color: DOCX_COLORS.textSlate }),
                  new TextRun({ text: project.name.toUpperCase(), bold: true, size: 24, color: DOCX_COLORS.primaryNavy }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Destino: Vivienda Unifamiliar  |  Fecha: ${new Date().toLocaleDateString('es-AR')}`, size: 18, color: DOCX_COLORS.textSlate }),
                ],
                spacing: { before: 100 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'DATOS DE LA OBRA Y TITULAR:', bold: true, size: 20, color: DOCX_COLORS.primaryEmerald }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `• Titular / Comitente: ${caratula.propietario}\n`, size: 18 }),
                  new TextRun({ text: `• Ubicación / Dirección: ${caratula.direccion}, ${caratula.ciudad}${caratula.provincia !== 'No especificada' ? ', ' + caratula.provincia : ''}\n`, size: 18 }),
                  new TextRun({ text: `• Profesional Responsable: ${caratula.instaladorNombre} (Matrícula: ${caratula.instaladorMatricula} - ${caratula.instaladorCategoria})\n`, size: 18 }),
                  new TextRun({ text: `• Contacto: Tel: ${caratula.instaladorTelefono} | Email: ${caratula.instaladorEmail}`, size: 18 }),
                ],
                spacing: { before: 80, after: 100 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_COLORS.lightBg, type: ShadingType.CLEAR },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'SÍNTESIS DE PARÁMETROS PRINCIPALES:', bold: true, size: 20, color: DOCX_COLORS.primaryNavy }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `• Superficie Computable Total: ${supTotal.toFixed(2)} m² (Cub: ${supCub} m² | Semicub: ${supSemi} m²)\n`, size: 18 }),
                  new TextRun({ text: `• Grado de Electrificación: ${grado.toUpperCase()} (Tabla AEA 770.7.I)\n`, size: 18 }),
                  new TextRun({ text: `• Demanda de Potencia Máxima Simultánea (DPMS): ${dpmsVA.toFixed(0)} VA (${dpmsKW.toFixed(2)} kW)\n`, size: 18, bold: true }),
                  new TextRun({ text: `• Corriente Nominal de Acometida: IB = ${ibTotal} A  |  Suministro: ${esTrifasico ? 'Trifásica (3x380/220V)' : 'Monofásica (220V)'}`, size: 18 }),
                ],
                spacing: { before: 80 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(coverTable);
  elements.push(new Paragraph({ spacing: { before: 400 } }));

  // ==========================================
  // 2. PROCEDIMIENTO 1: SUPERFICIES Y GRADO
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 1: SUPERFICIE Y GRADO DE ELECTRIFICACIÓN (AEA 770.7.I / II)',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `• Superficie Cubierta (Scub): ${supCub.toFixed(2)} m²\n` +
            `• Superficie Semicubierta (Ssemi): ${supSemi.toFixed(2)} m² (ponderada al 50%)\n` +
            `• Fórmula AEA: Stotal = Scub + 0.5 * Ssemi = ${supCub.toFixed(2)} + 0.5 * ${supSemi.toFixed(2)} = ${supTotal.toFixed(2)} m².\n` +
            `• Grado de Electrificación determinado: ${grado.toUpperCase()} (Conforme Tabla 770.7.I).\n` +
            `• Cantidad Mínima Reglamentaria de Circuitos (Tabla 770.7.II - Variante ${variante}): ` +
            `${configNormativa.IUG} IUG + ${configNormativa.TUG} TUG ${configNormativa.CLE ? '+ 1 Especial' : ''} (Mínimo: ${minimosReq} circuitos | Proyectados: ${circuitos.length} circuitos).`,
          size: 18,
          color: DOCX_COLORS.textSlate,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // ==========================================
  // 3. PROCEDIMIENTO 2: AMBIENTES Y BOCAS (TABLA NATIVA EDITABLE)
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 2: RELEVAMIENTO DE AMBIENTES Y PUNTOS MÍNIMOS DE UTILIZACIÓN (PMU)',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );

  let totalIUG = 0;
  let totalTUG = 0;
  let totalTUE = 0;

  const tableAmbientesRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('AMBIENTE / LOCAL', 25),
        createHeaderCell('DIMENSIONES', 15),
        createHeaderCell('CRITERIO AEA 770.7.III', 28),
        createHeaderCell('MIN. NORMA', 10),
        createHeaderCell('IUG PROY.', 8),
        createHeaderCell('TUG PROY.', 8),
        createHeaderCell('TUE PROY.', 6),
      ],
    }),
  ];

  ambientes.forEach((amb, idx) => {
    const supAmb = amb.superficie || 0;
    const longAmb = amb.longitud || 0;
    const pmu = calcularPuntosMinimosAmbiente(amb.nombre, supAmb, longAmb, grado);

    totalIUG += amb.puntosIUG || pmu.iug;
    totalTUG += amb.puntosTUG || pmu.tug;
    totalTUE += amb.puntosTUE || 0;

    let criterio = 'General AEA';
    const nLow = amb.nombre.toLowerCase();
    if (nLow.includes('estar') || nLow.includes('comedor')) criterio = '1 IUG c/18m² | 1 TUG c/6m²';
    else if (nLow.includes('dormitorio')) criterio = supAmb < 10 ? '1 IUG | 2 TUG' : supAmb <= 36 ? '1 IUG | 3 TUG' : '2 IUG | 3 TUG';
    else if (nLow.includes('cocina')) criterio = '1 IUG | 3 TUG + tomas esp.';
    else if (nLow.includes('baño') || nLow.includes('banio')) criterio = '1 IUG | 1 TUG';
    else if (nLow.includes('pasillo') || nLow.includes('balcon') || nLow.includes('galeria')) criterio = '1 IUG c/5m longitud';
    else if (nLow.includes('lavadero')) criterio = '1 IUG | 1 TUG';

    const dimStr = longAmb > 0 ? `${supAmb > 0 ? supAmb.toFixed(1) + ' m² | ' : ''}L: ${longAmb.toFixed(1)} m` : `${supAmb.toFixed(2)} m²`;
    const isAlt = idx % 2 === 1;

    tableAmbientesRows.push(
      new TableRow({
        children: [
          createDataCell(amb.nombre, 25, AlignmentType.LEFT, true, isAlt),
          createDataCell(dimStr, 15, AlignmentType.CENTER, false, isAlt),
          createDataCell(criterio, 28, AlignmentType.LEFT, false, isAlt),
          createDataCell(`${pmu.iug} / ${pmu.tug}`, 10, AlignmentType.CENTER, false, isAlt),
          createDataCell(`${amb.puntosIUG || pmu.iug}`, 8, AlignmentType.CENTER, true, isAlt),
          createDataCell(`${amb.puntosTUG || pmu.tug}`, 8, AlignmentType.CENTER, true, isAlt),
          createDataCell(`${amb.puntosTUE || 0}`, 6, AlignmentType.CENTER, false, isAlt),
        ],
      })
    );
  });

  // Fila de Totales
  tableAmbientesRows.push(
    new TableRow({
      children: [
        createDataCell('TOTALES INSTALACIÓN', 25, AlignmentType.LEFT, true, true),
        createDataCell(`${supTotal.toFixed(2)} m²`, 15, AlignmentType.CENTER, true, true),
        createDataCell('Sumatoria Puntos de Utilización', 28, AlignmentType.LEFT, false, true),
        createDataCell('-', 10, AlignmentType.CENTER, false, true),
        createDataCell(`${totalIUG}`, 8, AlignmentType.CENTER, true, true),
        createDataCell(`${totalTUG}`, 8, AlignmentType.CENTER, true, true),
        createDataCell(`${totalTUE}`, 6, AlignmentType.CENTER, true, true),
      ],
    })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: tableAmbientesRows,
    }),
    new Paragraph({ spacing: { before: 300 } })
  );

  // ==========================================
  // 4. PROCEDIMIENTO 3: SÍNTESIS DE CIRCUITOS (TABLA NATIVA EDITABLE)
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 3: SÍNTESIS Y CONFIGURACIÓN DE CIRCUITOS PROYECTADOS',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );

  const tableCircuitosRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('ID', 8, DOCX_COLORS.primaryEmerald),
        createHeaderCell('DENOMINACIÓN CIRCUITO', 28, DOCX_COLORS.primaryEmerald),
        createHeaderCell('TIPO / DESTINO', 20, DOCX_COLORS.primaryEmerald),
        createHeaderCell('BOCAS / LÍM.', 12, DOCX_COLORS.primaryEmerald),
        createHeaderCell('POT. NOM.', 12, DOCX_COLORS.primaryEmerald),
        createHeaderCell('c_u', 5, DOCX_COLORS.primaryEmerald),
        createHeaderCell('c_s', 5, DOCX_COLORS.primaryEmerald),
        createHeaderCell('DEMANDA (VA)', 10, DOCX_COLORS.primaryEmerald),
      ],
    }),
  ];

  circuitos.forEach((c, idx) => {
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
    const isAlt = idx % 2 === 1;

    tableCircuitosRows.push(
      new TableRow({
        children: [
          createDataCell(`Cto ${idx + 1}`, 8, AlignmentType.CENTER, true, isAlt),
          createDataCell(c.nombre, 28, AlignmentType.LEFT, true, isAlt),
          createDataCell(tipoNom, 20, AlignmentType.LEFT, false, isAlt),
          createDataCell(`${bocasTotales} / ${maxBocasStr}`, 12, AlignmentType.CENTER, false, isAlt),
          createDataCell(`${potNominalBase.toFixed(0)} VA`, 12, AlignmentType.RIGHT, false, isAlt),
          createDataCell(`${cu.toFixed(2)}`, 5, AlignmentType.CENTER, false, isAlt),
          createDataCell(`${cs.toFixed(2)}`, 5, AlignmentType.CENTER, false, isAlt),
          createDataCell(`${demandaCircuitoVA.toFixed(0)} VA`, 10, AlignmentType.RIGHT, true, isAlt),
        ],
      })
    );
  });

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: tableCircuitosRows,
    }),
    new Paragraph({ spacing: { before: 300 } })
  );

  // ==========================================
  // 5. PROCEDIMIENTO 5: MEMORIA ANALÍTICA DPMS (TABLA NATIVA EDITABLE)
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 5: MEMORIA ANALÍTICA DE CÁLCULO DE DPMS (AEA 770.8.2 / 770.8.3)',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `• Potencia Instalada Total (PI): ${potInstaladaTotalVA.toFixed(0)} VA\n` +
            `• Coeficiente de Simultaneidad adoptado (ks): ${factorSimultaneidadAdoptado.toFixed(2)} (Normativo: ${factorSimultaneidadGrado.toFixed(2)} para ${minimosReq} circuitos mínimos)\n` +
            `• DPMS Cargas Generales: DPMS_Grado = PI_Generales * ks = ${dpmsData.DPMS_Grado.toFixed(0)} VA\n` +
            `• DPMS Cargas Específicas / Especiales: ${dpmsData.DPMS_Específicas.toFixed(0)} VA\n` +
            `• DPMS Total Instalación: DPMS_Total = ${dpmsVA.toFixed(0)} VA  -->  Potencia Activa: P = ${dpmsVA.toFixed(0)} * ${cosPhi.toFixed(2)} = ${(dpmsVA * cosPhi).toFixed(0)} W (${dpmsKW.toFixed(2)} kW)`,
          size: 18,
          color: DOCX_COLORS.textSlate,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  const tableDpmsRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('CATEGORÍA / CONCEPTO', 40, DOCX_COLORS.darkSlate),
        createHeaderCell('COEF. UTILIZACIÓN (c_u)', 18, DOCX_COLORS.darkSlate),
        createHeaderCell('COEF. SIMULTANEIDAD (c_s)', 18, DOCX_COLORS.darkSlate),
        createHeaderCell('DEMANDA (VA)', 12, DOCX_COLORS.darkSlate),
        createHeaderCell('DEMANDA (W)', 12, DOCX_COLORS.darkSlate),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Cargas Generales (Grado Electrificación AEA)', 40, AlignmentType.LEFT, true),
        createDataCell('-', 18, AlignmentType.CENTER),
        createDataCell(`${factorSimultaneidadAdoptado.toFixed(2)}`, 18, AlignmentType.CENTER),
        createDataCell(`${dpmsData.DPMS_Grado.toFixed(0)} VA`, 12, AlignmentType.RIGHT, true),
        createDataCell(`${(dpmsData.DPMS_Grado * cosPhi).toFixed(0)} W`, 12, AlignmentType.RIGHT, true),
      ],
    }),
  ];

  circuitos
    .filter((c) => c.esEspecifico)
    .forEach((c, i) => {
      const potVA = c.unidadPotencia === 'W' ? (c.potencia || 0) / cosPhi : c.potencia || 0;
      const demVA = potVA * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);
      const isAlt = i % 2 === 1;

      tableDpmsRows.push(
        new TableRow({
          children: [
            createDataCell(`Cto Específico: ${c.nombre} (${c.siglaEspecifica || 'Esp.'})`, 40, AlignmentType.LEFT, false, isAlt),
            createDataCell(`${(c.coefUtilizacion || 1).toFixed(2)}`, 18, AlignmentType.CENTER, false, isAlt),
            createDataCell(`${(c.coefSimultaneidad || 1).toFixed(2)}`, 18, AlignmentType.CENTER, false, isAlt),
            createDataCell(`${demVA.toFixed(0)} VA`, 12, AlignmentType.RIGHT, false, isAlt),
            createDataCell(`${(demVA * cosPhi).toFixed(0)} W`, 12, AlignmentType.RIGHT, false, isAlt),
          ],
        })
      );
    });

  // Total DPMS
  tableDpmsRows.push(
    new TableRow({
      children: [
        createDataCell('TOTAL DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)', 40, AlignmentType.LEFT, true, true),
        createDataCell('-', 18, AlignmentType.CENTER, false, true),
        createDataCell('-', 18, AlignmentType.CENTER, false, true),
        createDataCell(`${dpmsVA.toFixed(0)} VA`, 12, AlignmentType.RIGHT, true, true),
        createDataCell(`${(dpmsVA * cosPhi).toFixed(0)} W (${dpmsKW.toFixed(2)} kW)`, 12, AlignmentType.RIGHT, true, true),
      ],
    })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: tableDpmsRows,
    }),
    new Paragraph({ spacing: { before: 300 } })
  );

  // ==========================================
  // 6. PROCEDIMIENTO 6: CORRIENTES NOMINALES IB
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 6: CORRIENTES NOMINALES DE PROYECTO (IB)',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: esTrifasico
            ? `• Fórmula de Acometida Trifásica: IB = DPMS / (sqrt(3) * U) = ${dpmsVA.toFixed(0)} VA / (1.732 * 380 V) = ${ibTotal} A.\n` +
              `• Tensión de Alimentación: 3 x 380 / 220 V (50 Hz)  |  Factor de Potencia adoptado: cos(phi) = ${cosPhi.toFixed(2)}.`
            : `• Fórmula de Acometida Monofásica: IB = DPMS / U = ${dpmsVA.toFixed(0)} VA / 220 V = ${ibTotal} A.\n` +
              `• Tensión de Alimentación: 1 x 220 V (50 Hz)  |  Factor de Potencia adoptado: cos(phi) = ${cosPhi.toFixed(2)}.`,
          size: 18,
          color: DOCX_COLORS.textSlate,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // ==========================================
  // 7. PROCEDIMIENTO 7: VALIDACIONES NORMATIVAS Y CUADRO DE FIRMAS
  // ==========================================
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'PROCEDIMIENTO 7: VALIDACIONES NORMATIVAS Y VERIFICACIONES TÉCNICAS',
          bold: true,
          size: 22,
          color: DOCX_COLORS.primaryNavy,
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );

  const tableValidacionesRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('CRITERIO TÉCNICO NORMATIVO', 35, DOCX_COLORS.primaryEmerald),
        createHeaderCell('CONDICIÓN / VERIFICACIÓN EN PROYECTO', 50, DOCX_COLORS.primaryEmerald),
        createHeaderCell('ESTADO REGLAMENTARIO', 15, DOCX_COLORS.primaryEmerald),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Límite de Suministro Monofásico', 35, AlignmentType.LEFT, true),
        createDataCell(esTrifasico ? 'Suministro Trifásico (Correcto)' : dpmsVA > 7000 ? `Supera 7 kVA (${(dpmsVA / 1000).toFixed(2)} kVA)` : `Dentro de límite (${(dpmsVA / 1000).toFixed(2)} kVA <= 7 kVA)`, 50),
        createDataCell(dpmsVA > 7000 && !esTrifasico ? 'RECOMENDAR TRIFÁSICA' : 'CUMPLE', 15, AlignmentType.CENTER, true),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Cantidad Mínima de Circuitos', 35, AlignmentType.LEFT, true, true),
        createDataCell(`Proyectados: ${circuitos.length} circuitos >= Mínimo Normativo: ${minimosReq} circuitos (Grado ${grado})`, 50, AlignmentType.LEFT, false, true),
        createDataCell(circuitos.length >= minimosReq ? 'CUMPLE' : 'VERIFICAR', 15, AlignmentType.CENTER, true, true),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Límite de Bocas por Circuito General', 35, AlignmentType.LEFT, true),
        createDataCell('Máximo 15 bocas por circuito de usos generales (AEA 770.7.VI)', 50),
        createDataCell('CUMPLE', 15, AlignmentType.CENTER, true),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Circuitos Específicos > 8 A', 35, AlignmentType.LEFT, true, true),
        createDataCell('Canalización independiente y protecciones dedicadas para consumos mayores a 8A', 50, AlignmentType.LEFT, false, true),
        createDataCell('CUMPLE', 15, AlignmentType.CENTER, true, true),
      ],
    }),
    new TableRow({
      children: [
        createDataCell('Puntos Mínimos de Utilización', 35, AlignmentType.LEFT, true),
        createDataCell('Cumplimiento de dotación mínima de bocas por local (Tabla AEA 770.7.III)', 50),
        createDataCell('CUMPLE', 15, AlignmentType.CENTER, true),
      ],
    }),
  ];

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: tableValidacionesRows,
    }),
    new Paragraph({ spacing: { before: 400 } })
  );

  // Cuadro de Firmas
  const tableFirmas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 200, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '__________________________________\n', size: 18 }),
                  new TextRun({ text: `${(caratula.instaladorNombre || 'PROFESIONAL RESPONSABLE').toUpperCase()}\n`, bold: true, size: 18 }),
                  new TextRun({ text: `Mat. N°: ${caratula.instaladorMatricula || 'Pendiente'} - ${caratula.instaladorCategoria || 'Instalador'}\n`, size: 16, color: DOCX_COLORS.textSlate }),
                  new TextRun({ text: 'Firma y Sello del Profesional Responsable', size: 14, color: DOCX_COLORS.textSlate }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 200, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '__________________________________\n', size: 18 }),
                  new TextRun({ text: `${(caratula.propietario || 'PROPIETARIO / COMITENTE').toUpperCase()}\n`, bold: true, size: 18 }),
                  new TextRun({ text: 'Propietario / Comitente\n', size: 16, color: DOCX_COLORS.textSlate }),
                  new TextRun({ text: 'Conformidad de Proyecto', size: 14, color: DOCX_COLORS.textSlate }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(tableFirmas);

  return elements;
}

/**
 * Construye el contenido Word para proyectos Industriales o Comerciales
 */
function construirContenidoGeneral(project: Project, caratula: DatosCaratula): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: 'INFORME TÉCNICO Y MEMORIA DE CÁLCULO',
          bold: true,
          size: 32,
          color: DOCX_COLORS.primaryNavy,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `PROYECTO ${project.projectType.toUpperCase()} - PARÁMETROS Y DEMANDA ELÉCTRICA`,
          size: 20,
          color: DOCX_COLORS.darkSlate,
          font: 'Arial',
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  const tableGeneral = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_COLORS.lightBg, type: ShadingType.CLEAR },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'PROYECTO: ', bold: true, size: 20 }),
                  new TextRun({ text: project.name.toUpperCase(), bold: true, size: 24, color: DOCX_COLORS.primaryNavy }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Propietario: ${caratula.propietario}  |  Fecha: ${new Date().toLocaleDateString('es-AR')}`, size: 18 }),
                ],
                spacing: { before: 100 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'PARÁMETROS GENERALES DE LA INSTALACIÓN:\n', bold: true, size: 20, color: DOCX_COLORS.primaryNavy }),
                  new TextRun({ text: `• Tipo de Instalación: ${project.tipoInstalacion || 'Trifásica'}\n`, size: 18 }),
                  new TextRun({ text: `• Temperatura Ambiente: ${project.tempAmbiente || 30} °C\n`, size: 18 }),
                  new TextRun({ text: `• Factor de Potencia (cos phi): ${project.cosPhi || 0.95}\n`, size: 18 }),
                  new TextRun({ text: `• Coeficiente de Simultaneidad: ${project.coefSimultaneidad || 1.0}\n`, size: 18 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  elements.push(tableGeneral);
  return elements;
}
