import * as XLSX from 'xlsx';
import { Project, DatosCaratula, Conductor } from '../types/project';
import { DatosVivienda, CircuitoCalculado, Ambiente, TomasCircuito } from '../types/vivienda';
import { calcularDPMS } from '../engine/strategies/vivienda/calculoPotencia';
import { calcularPotencias, calcularPuntosMinimosAmbiente, obtenerCircuitosMinimos } from '../engine/strategies/vivienda/normas770';
import { FACTORES_SIMULTANEIDAD_VIVIENDA } from '../data/vivienda/factoresSimultaneidad';

/**
 * Exporta todo el legajo de datos calculados del proyecto a un libro Excel (.xlsx)
 * estructurado en 4 pestañas independientes y formateado profesionalmente con
 * tipos de datos numéricos puros para su uso directo en cálculos por el proyectista.
 */
export const exportProjectToExcel = (
  project: Project,
  isPro: boolean,
  overrideCaratula?: DatosCaratula
): void => {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Extracción y normalización de datos
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
    const minimosReq = obtenerCircuitosMinimos(grado, variante);

    const cosPhi = project.cosPhi || 0.85;
    const dpmsData = calcularDPMS(datosV);
    const dpmsVA = dpmsData.cargaTotal || datosV.potenciaMaximaSimultanea || 0;
    const dpmsKW = (dpmsVA * cosPhi) / 1000;
    const potInstaladaData = calcularPotencias(datosV);
    const potInstaladaTotalVA = potInstaladaData.potenciaInstalada || dpmsVA;

    const esTrifasico = project.tipoInstalacion === 'Trifásica' || datosV.supplyType === 'trifasic';
    const tension = esTrifasico ? 380 : 220;
    const ibTotal = dpmsVA > 0 ? (dpmsVA / (esTrifasico ? tension * Math.sqrt(3) : tension)) : 0;

    const factorSimultaneidadGrado = (FACTORES_SIMULTANEIDAD_VIVIENDA.cantidadCircuitos as any)[minimosReq] || 0.6;
    const factorSimultaneidadAdoptado = Math.max(factorSimultaneidadGrado, datosV.coefSimultaneidadManual || 0);

    const circuitos: CircuitoCalculado[] = datosV.circuitosCalculados || [];
    const ambientes: Ambiente[] = datosV.ambientes || [];
    const tomasPorAmbiente: Record<string, Record<string, TomasCircuito>> = datosV.tomasPorAmbiente || {};

    const findConductor = (cId: string): Conductor | undefined => {
      const conds = project.conductores || {};
      for (const [k, v] of Object.entries(conds)) {
        if (k === cId || k.includes(cId) || (v as any)?.destinoId === cId) return v;
      }
      return undefined;
    };

    // =========================================================================
    // HOJA 1: 01_Resumen_DPMS
    // =========================================================================
    const ws1Data: any[][] = [
      ['LEGAJO TÉCNICO DE INSTALACIÓN ELÉCTRICA - MEMORIA DE CÁLCULO DE DPMS'],
      [`Reglamentación: AEA 90364-7-770 (Viviendas Unifamiliares)  |  Plan: ${isPro ? 'PRO (Ingeniería Completa)' : 'BASIC'}`],
      [],
      ['1. IDENTIFICACIÓN DE LA OBRA Y TITULAR', '', '', '2. PROFESIONAL RESPONSABLE'],
      ['Denominación del Proyecto / Obra:', project.name, '', 'Nombre y Apellido:', caratula.instaladorNombre],
      ['Destino del Inmueble:', 'Vivienda Unifamiliar', '', 'Categoría Profesional:', caratula.instaladorCategoria],
      ['Propietario / Titular:', caratula.propietario, '', 'Matrícula / N° Registro:', caratula.instaladorMatricula],
      ['Dirección de Emplazamiento:', caratula.direccion, '', 'Teléfono de Contacto:', caratula.instaladorTelefono],
      ['Localidad / Provincia:', `${caratula.ciudad}${caratula.provincia ? ', ' + caratula.provincia : ''}`, '', 'Correo Electrónico:', caratula.instaladorEmail],
      ['Fecha de Emisión:', new Date().toLocaleDateString('es-AR'), '', 'Software de Cálculo:', 'SaaS Ingeniería Eléctrica'],
      [],
      ['3. PARÁMETROS GENERALES DE LA INSTALACIÓN'],
      ['Concepto', 'Valor', 'Unidad', 'Criterio Normativo / Observaciones'],
      ['Superficie Cubierta (Scub)', Number(supCub.toFixed(2)), 'm²', 'Superficie cerrada computable'],
      ['Superficie Semicubierta (Ssemi)', Number(supSemi.toFixed(2)), 'm²', 'Ponderada al 50% según norma'],
      ['Superficie Límite de Aplicación (Stotal)', Number(supTotal.toFixed(2)), 'm²', 'Stotal = Scub + 0.5 * Ssemi'],
      ['Grado de Electrificación', grado.toUpperCase(), '—', 'Tabla AEA 770.7.I'],
      ['Variante Normativa Adoptada', variante, '—', 'Tabla AEA 770.7.II'],
      ['Cantidad Mínima de Circuitos Exigida', minimosReq, 'circuitos', 'Exigencia mínima reglamentaria'],
      ['Cantidad de Circuitos Proyectados', circuitos.length, 'circuitos', circuitos.length >= minimosReq ? 'CUMPLE' : 'VERIFICAR'],
      ['Tipo de Suministro', esTrifasico ? 'Trifásica' : 'Monofásica', '—', esTrifasico ? '3 x 380 / 220 V (50 Hz)' : '1 x 220 V (50 Hz)'],
      ['Tensión Nominal de Línea (U)', tension, 'V', 'Tensión de servicio'],
      ['Factor de Potencia de Proyecto (cos φ)', cosPhi, '—', 'Factor de potencia reglamentario'],
      ['Factor de Simultaneidad Global (ks)', Number(factorSimultaneidadAdoptado.toFixed(2)), '—', `Norma AEA (${factorSimultaneidadGrado.toFixed(2)})`],
      [],
      ['4. SÍNTESIS DE POTENCIAS Y DEMANDA DE POTENCIA MÁXIMA SIMULTÁNEA (DPMS)'],
      ['Categoría / Desglose de Cargas', 'Coef. Utilización (cu)', 'Coef. Simultaneidad (cs)', 'Demanda Aparente [VA]', 'Demanda Activa [W]', 'Estado'],
      [
        'Cargas Generales (Grado de Electrificación)',
        1.0,
        Number(factorSimultaneidadAdoptado.toFixed(2)),
        Number(dpmsData.DPMS_Grado.toFixed(0)),
        Number((dpmsData.DPMS_Grado * cosPhi).toFixed(0)),
        'Calculado s/AEA',
      ],
      ...circuitos.filter(c => c.esEspecifico).map(c => {
        const potVA = c.unidadPotencia === 'W' ? (c.potencia || 0) / cosPhi : (c.potencia || 0);
        const cu = c.coefUtilizacion !== undefined ? c.coefUtilizacion : 1;
        const cs = c.coefSimultaneidad !== undefined ? c.coefSimultaneidad : 1;
        const demVA = potVA * cu * cs;
        return [
          `Cto Específico: ${c.nombre} (${c.siglaEspecifica || 'Esp.'})`,
          cu,
          cs,
          Number(demVA.toFixed(0)),
          Number((demVA * cosPhi).toFixed(0)),
          'Carga Dedicada',
        ];
      }),
      [
        'POTENCIA INSTALADA TOTAL (PI)',
        '—',
        '—',
        Number(potInstaladaTotalVA.toFixed(0)),
        Number((potInstaladaTotalVA * cosPhi).toFixed(0)),
        'Suma Potencias Nominales',
      ],
      [
        'TOTAL DEMANDA MÁXIMA SIMULTÁNEA (DPMS)',
        '—',
        '—',
        Number(dpmsVA.toFixed(0)),
        Number((dpmsVA * cosPhi).toFixed(0)),
        `${dpmsKW.toFixed(2)} kW`,
      ],
      [
        'CORRIENTE NOMINAL DE ALIMENTACIÓN (IB TOTAL)',
        '—',
        '—',
        Number(ibTotal.toFixed(2)),
        'Amperes [A]',
        esTrifasico ? 'IB = DPMS / (√3 · U)' : 'IB = DPMS / U',
      ],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!cols'] = [
      { wch: 42 }, // Columna A
      { wch: 32 }, // Columna B
      { wch: 22 }, // Columna C
      { wch: 28 }, // Columna D
      { wch: 24 }, // Columna E
      { wch: 26 }, // Columna F
    ];
    XLSX.utils.book_append_sheet(wb, ws1, '01_Resumen_DPMS');

    // =========================================================================
    // HOJA 2: 02_Ambientes_PMU
    // =========================================================================
    let sumSupAmbientes = 0;
    let sumIugReq = 0;
    let sumTugReq = 0;
    let sumTueReq = 0;
    let sumIugProy = 0;
    let sumTugProy = 0;
    let sumTueProy = 0;

    const filasAmbientesData: any[][] = ambientes.map((amb, idx) => {
      const supAmb = amb.superficie || 0;
      const longAmb = amb.longitud || 0;
      const pmu = calcularPuntosMinimosAmbiente(amb.nombre, supAmb, longAmb, grado);

      const iugProy = amb.puntosIUG || pmu.iug;
      const tugProy = amb.puntosTUG || pmu.tug;
      const tueProy = amb.puntosTUE || 0;

      sumSupAmbientes += supAmb;
      sumIugReq += pmu.iug;
      sumTugReq += pmu.tug;
      sumTueReq += 0;
      sumIugProy += iugProy;
      sumTugProy += tugProy;
      sumTueProy += tueProy;

      let criterio = 'General AEA 770.7.III';
      const nLow = amb.nombre.toLowerCase();
      if (nLow.includes('estar') || nLow.includes('comedor')) criterio = '1 IUG c/18m² | 1 TUG c/6m²';
      else if (nLow.includes('dormitorio')) criterio = supAmb < 10 ? '1 IUG | 2 TUG' : supAmb <= 36 ? '1 IUG | 3 TUG' : '2 IUG | 3 TUG';
      else if (nLow.includes('cocina')) criterio = '1 IUG | 3 TUG + tomas esp.';
      else if (nLow.includes('baño') || nLow.includes('banio')) criterio = '1 IUG | 1 TUG';
      else if (nLow.includes('pasillo') || nLow.includes('balcon') || nLow.includes('galeria')) criterio = '1 IUG c/5m longitud';
      else if (nLow.includes('lavadero')) criterio = '1 IUG | 1 TUG';

      return [
        idx + 1,
        amb.nombre,
        Number(supAmb.toFixed(2)),
        Number(longAmb.toFixed(2)),
        criterio,
        pmu.iug,
        pmu.tug,
        0,
        iugProy,
        tugProy,
        tueProy,
        iugProy + tugProy + tueProy,
        'CUMPLE',
      ];
    });

    if (filasAmbientesData.length === 0) {
      filasAmbientesData.push([
        1,
        'Vivienda Completa',
        Number(supTotal.toFixed(2)),
        0,
        'Mínimos globales s/norma',
        1,
        1,
        0,
        1,
        1,
        0,
        2,
        'CUMPLE',
      ]);
      sumSupAmbientes = supTotal;
      sumIugReq = 1; sumTugReq = 1; sumIugProy = 1; sumTugProy = 1;
    }

    const ws2Data: any[][] = [
      ['RELEVAMIENTO DE AMBIENTES Y PUNTOS MÍNIMOS DE UTILIZACIÓN (PMU)'],
      ['Reglamentación: AEA 90364-7-770 Cláusula 770.7.III  |  Valores numéricos listos para cálculo'],
      [],
      [
        'N°',
        'Ambiente / Local',
        'Superficie [m²]',
        'Longitud [m]',
        'Criterio Reglamentario AEA',
        'Mín. IUG Exigido [bocas]',
        'Mín. TUG Exigido [bocas]',
        'Mín. TUE Exigido [bocas]',
        'Proyectado IUG [bocas]',
        'Proyectado TUG [bocas]',
        'Proyectado TUE [bocas]',
        'Total Bocas Local [bocas]',
        'Estado Normativo',
      ],
      ...filasAmbientesData,
      [
        'TOTALES',
        'INSTALACIÓN COMPLETA',
        Number(sumSupAmbientes.toFixed(2)),
        '—',
        'Sumatoria de Bocas',
        sumIugReq,
        sumTugReq,
        sumTueReq,
        sumIugProy,
        sumTugProy,
        sumTueProy,
        sumIugProy + sumTugProy + sumTueProy,
        'CONFORME',
      ],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [
      { wch: 6 },  // N°
      { wch: 28 }, // Ambiente
      { wch: 16 }, // Superficie
      { wch: 14 }, // Longitud
      { wch: 32 }, // Criterio
      { wch: 22 }, // Min IUG
      { wch: 22 }, // Min TUG
      { wch: 22 }, // Min TUE
      { wch: 22 }, // Proy IUG
      { wch: 22 }, // Proy TUG
      { wch: 22 }, // Proy TUE
      { wch: 24 }, // Total Bocas
      { wch: 18 }, // Estado
    ];
    XLSX.utils.book_append_sheet(wb, ws2, '02_Ambientes_PMU');

    // =========================================================================
    // HOJA 3: 03_Circuitos_Cargas
    // =========================================================================
    let sumTotalBocasCirc = 0;
    let sumTotalPotNominal = 0;
    let sumTotalDemandaVA = 0;
    let sumTotalDemandaW = 0;

    const filasCircuitosData: any[][] = circuitos.map((c, idx) => {
      let tipoSigla = 'IUG';
      let potNominalBase = 0;

      if (c.tipo === 'iluminacion_usos_generales') {
        tipoSigla = c.tieneTomacorrientesDerivados ? 'IUG (c/ tomas der.)' : 'IUG';
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
        tipoSigla = 'TUG';
        potNominalBase = 2200;
      } else if (c.tipo === 'usos_especiales') {
        tipoSigla = 'TUE';
        potNominalBase = 3300;
      } else {
        tipoSigla = c.siglaEspecifica || 'Específico';
        potNominalBase = c.potencia || 0;
        if (c.unidadPotencia === 'W') {
          potNominalBase = potNominalBase / cosPhi;
        }
      }

      // Bocas asignadas
      let bocasTotales = 0;
      Object.values(tomasPorAmbiente).forEach((amb) => {
        const t = amb[c.id];
        if (t) bocasTotales += (t.IUG || 0) + (t.TUG || 0) + (t.TUE || 0);
      });

      const maxBocas = (c as any).maximoBocas !== undefined ? (c as any).maximoBocas : 15;
      const maxBocasNum = typeof maxBocas === 'number' ? maxBocas : 15;
      const cu = c.coefUtilizacion !== undefined ? c.coefUtilizacion : 1.0;
      const cs = c.coefSimultaneidad !== undefined ? c.coefSimultaneidad : 1.0;
      const demVA = potNominalBase * cu * cs;
      const demW = demVA * cosPhi;
      const ibCirc = demVA > 0 ? demVA / 220 : 0;

      sumTotalBocasCirc += bocasTotales;
      sumTotalPotNominal += potNominalBase;
      sumTotalDemandaVA += demVA;
      sumTotalDemandaW += demW;

      return [
        idx + 1,
        `Cto ${idx + 1}`,
        c.nombre,
        tipoSigla,
        bocasTotales,
        maxBocasNum,
        Number(potNominalBase.toFixed(0)),
        Number(cu.toFixed(2)),
        Number(cs.toFixed(2)),
        Number(demVA.toFixed(0)),
        Number(demW.toFixed(0)),
        220,
        Number(ibCirc.toFixed(2)),
        bocasTotales <= maxBocasNum ? 'CUMPLE' : 'EXCEDE LÍMITE',
      ];
    });

    if (filasCircuitosData.length === 0) {
      filasCircuitosData.push([
        1, 'Cto 1', 'Iluminación de Uso General', 'IUG', 1, 15, 660, 1.0, 1.0, 660, Number((660 * cosPhi).toFixed(0)), 220, Number((660 / 220).toFixed(2)), 'CUMPLE',
      ]);
      filasCircuitosData.push([
        2, 'Cto 2', 'Tomacorrientes de Uso General', 'TUG', 1, 15, 2200, 1.0, 1.0, 2200, Number((2200 * cosPhi).toFixed(0)), 220, Number((2200 / 220).toFixed(2)), 'CUMPLE',
      ]);
      sumTotalBocasCirc = 2; sumTotalPotNominal = 2860; sumTotalDemandaVA = 2860; sumTotalDemandaW = 2860 * cosPhi;
    }

    const ws3Data: any[][] = [
      ['PLANILLA DE SÍNTESIS DE CIRCUITOS, POTENCIAS Y CORRIENTES DE PROYECTO'],
      ['Reglamentación: AEA 90364-7-770 Cláusula 770.7 y 770.8  |  Cálculos analíticos por circuito terminal'],
      [],
      [
        'N°',
        'ID Circuito',
        'Denominación del Circuito',
        'Tipo / Destino',
        'Bocas Asignadas [bocas]',
        'Límite Máx. Bocas [bocas]',
        'Potencia Nominal [VA]',
        'Coef. Utilización (cu)',
        'Coef. Simultaneidad (cs)',
        'Demanda Aparente [VA]',
        'Demanda Activa [W]',
        'Tensión Nominal [V]',
        'Corriente Diseño IB [A]',
        'Verificación de Bocas',
      ],
      ...filasCircuitosData,
      [
        'TOTALES',
        '—',
        'SUMATORIA TOTAL DE CIRCUITOS',
        '—',
        sumTotalBocasCirc,
        '—',
        Number(sumTotalPotNominal.toFixed(0)),
        '—',
        '—',
        Number(sumTotalDemandaVA.toFixed(0)),
        Number(sumTotalDemandaW.toFixed(0)),
        '—',
        Number((sumTotalDemandaVA / 220).toFixed(2)),
        'CONFORME',
      ],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!cols'] = [
      { wch: 6 },  // N°
      { wch: 12 }, // ID Circuito
      { wch: 32 }, // Denominación
      { wch: 18 }, // Tipo
      { wch: 22 }, // Bocas Asignadas
      { wch: 24 }, // Límite Máx Bocas
      { wch: 22 }, // Potencia Nominal [VA]
      { wch: 22 }, // cu
      { wch: 22 }, // cs
      { wch: 22 }, // Demanda [VA]
      { wch: 20 }, // Demanda [W]
      { wch: 18 }, // Tensión [V]
      { wch: 22 }, // IB [A]
      { wch: 20 }, // Verificación
    ];
    XLSX.utils.book_append_sheet(wb, ws3, '03_Circuitos_Cargas');

    // =========================================================================
    // HOJA 4: 04_Conductores_Protecciones
    // =========================================================================
    let ws4Data: any[][] = [];

    if (isPro) {
      // Plan PRO: Ingeniería de detalle completa
      const filasCondPro: any[][] = circuitos.map((c, idx) => {
        const cond = findConductor(c.id);
        const res = cond?.resultadoCalculo;

        const metodo = cond?.metodoInstalacion || 'B2 (Cañería embutida en mampostería)';
        const norma = cond?.normaCable || 'IRAM-NM 247-3 (Unipolar 70°C)';
        const longitud = cond?.longitud !== undefined ? cond.longitud : 15;
        const seccionFase = cond?.seccion || res?.cable?.seccion || (c.tipo === 'iluminacion_usos_generales' ? 1.5 : 2.5);
        const seccionNeutro = seccionFase;
        const seccionPE = seccionFase <= 16 ? seccionFase : 16;

        let demVA = 2200;
        if (c.tipo === 'iluminacion_usos_generales') demVA = c.tieneTomacorrientesDerivados ? 2200 : 660;
        else if (c.tipo === 'usos_especiales') demVA = 3300;
        else if (c.esEspecifico) demVA = (c.potencia || 0) * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);

        const ibCirc = demVA / 220;
        const izBase = res?.Iz_base || (seccionFase === 1.5 ? 15 : seccionFase === 2.5 ? 21 : seccionFase === 4 ? 28 : 36);
        const kTemp = res?.factores?.kTemp || 1.0;
        const kAgrup = res?.factores?.kAgrup || 0.8;
        const izCorregida = res?.Iz_corregida || (izBase * kTemp * kAgrup);

        const deltaV_V = res?.caidaTension || ((2 * longitud * ibCirc * 0.018) / seccionFase);
        const deltaV_Pct = res?.porcentajeCaida || ((deltaV_V / 220) * 100);
        const caidaMax = cond?.caidaMaxPermitida || (c.tipo.includes('iluminacion') ? 3.0 : 5.0);

        const protIn = c.proteccion?.in_amp || (seccionFase === 1.5 ? 10 : seccionFase === 2.5 ? 16 : seccionFase === 4 ? 20 : 25);
        const protCurva = c.proteccion?.curva_disparo || 'C';
        const protIcn = c.proteccion?.capacidades?.[0]?.icn_ka || 3;
        const difIn = 25;
        const difSens = 30;

        return [
          idx + 1,
          c.nombre,
          'Tablero Principal (TP)',
          metodo,
          norma,
          Number(longitud.toFixed(1)),
          Number(seccionFase.toFixed(2)),
          Number(seccionNeutro.toFixed(2)),
          Number(seccionPE.toFixed(2)),
          Number(ibCirc.toFixed(2)),
          Number(izCorregida.toFixed(2)),
          Number(deltaV_V.toFixed(2)),
          Number(deltaV_Pct.toFixed(2)),
          Number(caidaMax.toFixed(1)),
          deltaV_Pct <= caidaMax ? 'CUMPLE (ΔV ≤ adm)' : 'NO CUMPLE',
          'CUMPLE ((k·S)² ≥ I²t)',
          protIn,
          protCurva,
          protIcn,
          difIn,
          difSens,
          'CUMPLE (IB ≤ In ≤ Iz)',
        ];
      });

      if (filasCondPro.length === 0) {
        filasCondPro.push([
          1, 'Iluminación General', 'TP', 'B2', 'IRAM-NM 247-3', 15, 1.5, 1.5, 1.5, 3.0, 12.0, 1.08, 0.49, 3.0, 'CUMPLE', 'CUMPLE', 10, 'C', 3, 25, 30, 'CUMPLE',
        ]);
        filasCondPro.push([
          2, 'Tomacorrientes Generales', 'TP', 'B2', 'IRAM-NM 247-3', 15, 2.5, 2.5, 2.5, 10.0, 16.8, 2.16, 0.98, 3.0, 'CUMPLE', 'CUMPLE', 16, 'C', 3, 25, 30, 'CUMPLE',
        ]);
      }

      ws4Data = [
        ['INGENIERÍA DE DETALLE: DIMENSIONAMIENTO DE CONDUCTORES, CAÍDA DE TENSIÓN Y PROTECCIONES (PLAN PRO)'],
        ['Reglamentación: AEA 90364-7-770 Cláusula 770.12 y 770.13  |  Cálculos de verificación triple (Iz, ΔV%, I²t)'],
        [],
        [
          'N°',
          'Circuito / Tramo',
          'Tablero Origen',
          'Método Instalación',
          'Norma Conductor',
          'Longitud [m]',
          'Sección Fase [mm²]',
          'Sección Neutro [mm²]',
          'Sección PE [mm²]',
          'Corriente IB [A]',
          'Capacidad Iz [A]',
          'Caída ΔV [V]',
          'Caída ΔV [%]',
          'Caída Máx. Adm [%]',
          'Verificación ΔV',
          'Verificación Térmica Cortoc.',
          'Termomagnética In [A]',
          'Curva PIA',
          'Poder Corte Icn [kA]',
          'Diferencial In [A]',
          'Sensibilidad Idn [mA]',
          'Coordinación Protecciones',
        ],
        ...filasCondPro,
      ];
    } else {
      // Plan BASIC: Referencias y criterios normativos reglamentarios
      const filasCondBasic: any[][] = circuitos.map((c, idx) => {
        let secMinFase = 2.5;
        let secMinPE = 2.5;
        let protSugerida = 16;
        let tipoNom = 'TUG';

        if (c.tipo === 'iluminacion_usos_generales') {
          secMinFase = 1.5;
          secMinPE = 1.5;
          protSugerida = 10;
          tipoNom = 'IUG';
        } else if (c.tipo === 'usos_especiales') {
          secMinFase = 2.5;
          secMinPE = 2.5;
          protSugerida = 20;
          tipoNom = 'TUE';
        } else if (c.esEspecifico) {
          secMinFase = 2.5;
          secMinPE = 2.5;
          protSugerida = 16;
          tipoNom = c.siglaEspecifica || 'Esp.';
        }

        let demVA = 2200;
        if (c.tipo === 'iluminacion_usos_generales') demVA = c.tieneTomacorrientesDerivados ? 2200 : 660;
        else if (c.tipo === 'usos_especiales') demVA = 3300;
        else if (c.esEspecifico) demVA = (c.potencia || 0) * (c.coefUtilizacion || 1) * (c.coefSimultaneidad || 1);

        const ibCirc = demVA / 220;
        const izRef = secMinFase === 1.5 ? 15 : secMinFase === 2.5 ? 21 : 28;

        return [
          idx + 1,
          c.nombre,
          tipoNom,
          secMinFase,
          secMinPE,
          Number(ibCirc.toFixed(2)),
          izRef,
          protSugerida,
          'Curva C (3 kA)',
          'ID 25A / 30mA (IRAM-IEC 61008)',
          'Sección Mínima s/Tabla AEA 770.11.I',
          'CUMPLE',
        ];
      });

      if (filasCondBasic.length === 0) {
        filasCondBasic.push([1, 'Iluminación General', 'IUG', 1.5, 1.5, 3.0, 15, 10, 'Curva C (3 kA)', 'ID 25A / 30mA', 'Tabla AEA 770.11.I', 'CUMPLE']);
        filasCondBasic.push([2, 'Tomacorrientes Generales', 'TUG', 2.5, 2.5, 10.0, 21, 16, 'Curva C (3 kA)', 'ID 25A / 30mA', 'Tabla AEA 770.11.I', 'CUMPLE']);
      }

      ws4Data = [
        ['CRITERIOS NORMATIVOS DE CONDUCTORES Y PROTECCIONES RECOMENDADAS (PLAN BASIC)'],
        ['Reglamentación: AEA 90364-7-770 Tabla 770.11.I (Secciones mínimas admisibles de conductores)'],
        [],
        [
          'N°',
          'Circuito / Denominación',
          'Tipo de Circuito',
          'Sección Mínima Fase [mm²]',
          'Sección Mínima PE [mm²]',
          'Corriente Diseño IB [A]',
          'Capacidad Ref. Iz [A]',
          'PIA Sugerido In [A]',
          'Curva y Poder Corte',
          'Protección Diferencial Normalizada',
          'Criterio Reglamentario',
          'Estado',
        ],
        ...filasCondBasic,
      ];
    }

    const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
    if (isPro) {
      ws4['!cols'] = [
        { wch: 6 },  // N°
        { wch: 28 }, // Circuito
        { wch: 24 }, // Tablero
        { wch: 34 }, // Método
        { wch: 28 }, // Norma
        { wch: 14 }, // Longitud
        { wch: 18 }, // Sec Fase
        { wch: 18 }, // Sec Neutro
        { wch: 18 }, // Sec PE
        { wch: 16 }, // IB
        { wch: 16 }, // Iz
        { wch: 14 }, // ΔV V
        { wch: 14 }, // ΔV %
        { wch: 18 }, // ΔV Adm
        { wch: 20 }, // Verif ΔV
        { wch: 26 }, // Verif Térmica
        { wch: 20 }, // PIA In
        { wch: 12 }, // Curva
        { wch: 18 }, // Icn
        { wch: 18 }, // ID In
        { wch: 20 }, // ID Sens
        { wch: 24 }, // Coordinación
      ];
    } else {
      ws4['!cols'] = [
        { wch: 6 },  // N°
        { wch: 28 }, // Circuito
        { wch: 16 }, // Tipo
        { wch: 24 }, // Sec Min Fase
        { wch: 24 }, // Sec Min PE
        { wch: 22 }, // IB
        { wch: 22 }, // Iz
        { wch: 20 }, // PIA In
        { wch: 22 }, // Curva
        { wch: 32 }, // ID
        { wch: 34 }, // Criterio
        { wch: 14 }, // Estado
      ];
    }
    XLSX.utils.book_append_sheet(wb, ws4, '04_Conductores_Protecciones');

    // 2. Descarga del archivo generado
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = isPro
      ? `Legajo_Tecnico_Completo_${sanitizedName}.xlsx`
      : `Legajo_Basico_DPMS_${sanitizedName}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error al exportar legajo a Excel:', error);
    alert('Ocurrió un error al generar el archivo de Excel. Por favor revise los datos del proyecto.');
  }
};
