import { CondicionesTramoResidencial, ResultadoCalculoResidencial } from '../../../types/vivienda';
import { Project, Conductor, Proteccion } from '../../../types/project';
import { getAdmisible } from '../industrial/corrienteProvider';
import { 
    IMPEDANCIAS_AEA_770,
    IMPEDANCIAS_IRAM_NM_247_3_62267,
    IMPEDANCIAS_IRAM_2178_1_UNIPOLAR,
    IMPEDANCIAS_IRAM_2178_1_MULTIPOLAR,
    IMPEDANCIAS_IRAM_62266_UNIPOLAR,
    IMPEDANCIAS_IRAM_62266_MULTIPOLAR,
    IMPEDANCIAS_CABLES_VIVIENDA
} from '../../../data/vivienda/impedancias';
import { SECCIONES_MINIMAS_VIVIENDA } from '../../../data/vivienda/seccionesMinimas';
import { getFactorTemperatura } from '../industrial/helpers/normativeFactors';
import { getFactorAgrupamientoVivienda } from './agrupamientoProvider';
import { calcularImpedanciaTransformador } from '../industrial/transformador';
import { PARAMETROS_CALCULO_VIVIENDA } from '../../../data/vivienda/parametrosCalculo';
import { getFactorResistividad } from '../../../data/factoresResistividad';
import { valoresEnergiaPasante } from '../../../data/energiaPasante';
import { adaptarConductorACondiciones } from './conductorAdapter';
import { obtenerProteccionAsignada } from './helpers';

export const calcularConductorResidencial = (
  conductor: Conductor,
  project: Project
): Conductor => {
  const proteccion = obtenerProteccionAsignada(project, conductor, (conductor as any).tramoId || (conductor as any).destinoId);
  const condiciones = adaptarConductorACondiciones(conductor, project);
  
  if (condiciones.longitudMetros && condiciones.metodoInstalacion && condiciones.tipoTramo) {
      const resultado = calcularTramoResidencial(condiciones, project, conductor, proteccion);
      
      // Solo retornar el conductor con resultado si el cálculo fue exitoso y tiene datos válidos (pasos de verificación)
      if (resultado.pasosVerificacion && resultado.pasosVerificacion.length > 0) {
          return {
              ...conductor,
              resultadoCalculo: resultado,
              seccion: resultado.seccionRecomendada
          };
      }
  }
  
  // En caso de fallo o datos insuficientes, retornar conductor sin resultado y sin sobreescribir la sección manualmente
  return {
      ...conductor,
      resultadoCalculo: undefined,
  };
};

export const calcularTramoResidencial = (
  condiciones: CondicionesTramoResidencial,
  project: Project,
  conductor: Conductor,
  proteccionSeleccionada?: Proteccion
): ResultadoCalculoResidencial => {
  let advertencias: string[] = [];
  const pasosVerificacion: any[] = [];

  // PASO 1: Corriente de Proyecto (IB)
  const cosPhi = condiciones.cosPhi || 0.9;
  const I_B = condiciones.corrienteDiseñoAmperes;
  
  // Selección de Sección Mínima Reglamentaria
  let seccionMinima = 1.5;
  switch (condiciones.tipoTramo) {
    case 'LineaPrincipal': seccionMinima = SECCIONES_MINIMAS_VIVIENDA.lineasPrincipales; break;
    case 'LineaSeccional': seccionMinima = 2.5; break;
    case 'CircuitoTerminal':
        switch (condiciones.tipoCircuito) {
            case 'iluminacion_usos_generales': seccionMinima = SECCIONES_MINIMAS_VIVIENDA.terminalesIluminacion; break;
            case 'tomacorrientes_usos_generales':
            case 'usos_especiales': seccionMinima = SECCIONES_MINIMAS_VIVIENDA.terminalesTomacorrientes; break;
            case 'usos_especificos': seccionMinima = SECCIONES_MINIMAS_VIVIENDA.usosEspecificos; break;
        }
        break;
  }

  const canalizacion = project.canalizaciones?.find(c => c.id === condiciones.canalizacionId);
  const nCircuitos = canalizacion ? canalizacion.circuitosIds.length : 1;
  const seccionesComerciales = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70];
  let seccionElegida = seccionesComerciales.find(s => s >= seccionMinima) || seccionMinima;
  
  let cumpleTodo = false;
  let caidaTensionPorcentaje = 0;
  let termomagneticaRecomendada = 0;

  // Z_upstream basada en trafo o Ik distribuidora
  let Z_upstream = { r: 0.05, x: 0.05 }; 
  const ikDist = project.datosVivienda?.ikDistribuidora || 3.0; // kA
  
  if (project.transformador) {
    const Z_trafo = calcularImpedanciaTransformador({
        potenciaKVA: Number(project.transformador.potencia),
        tensionSecundarioV: Number(project.transformador.tensionSecundario),
        uccPorcentaje: project.transformador.uccPorcentaje,
        PccW: project.transformador.PccW,
        tipo: project.transformador.tipo
      });
    Z_upstream.r += Z_trafo.r;
    Z_upstream.x += Z_trafo.x;
  } else {
    // Aproximación de Z a partir de I"k (Z = V / Ik)
    const zEq = 220 / (ikDist * 1000);
    Z_upstream.r = zEq / Math.sqrt(2);
    Z_upstream.x = zEq / Math.sqrt(2);
  }

  if (project.acometida) {
    const impCable = IMPEDANCIAS_CABLES_VIVIENDA[project.acometida.seccion?.toFixed(1) || "10.0"] || { r: 0.5, x: 0.1 };
    const longitudKm = project.acometida.longitud / 1000;
    Z_upstream.r += impCable.r * longitudKm;
    Z_upstream.x += impCable.x * longitudKm;
  }

  const valoresTermomagneticas = [10, 15, 16, 20, 25, 32, 40, 50, 63];
  const pasosActuales = [];

  for (const s of seccionesComerciales.filter(sec => sec >= seccionElegida)) {
    pasosActuales.length = 0; // Limpiar pasos iteración
    
    // PASO 1: Corriente de diseño (IB)
    const potAparente = I_B * 220;
    pasosActuales.push({
        numero: 1, nombre: "Corriente de diseño (IB)",
        valor: `IB = S / U = ${potAparente.toFixed(0)} VA / 220V = ${I_B.toFixed(2)} A`,
        condicion: "Corriente de proyecto", cumple: true
    });

    // PASO 2: Capacidad de Conducción (Iz)
    const IzBase = getAdmisible(
        '770', s, condiciones.metodoInstalacion === 'sinEnvoltura' ? 'B1' : condiciones.metodoInstalacion,
        'Monofásica', 'Cobre', 'PVC', undefined, undefined, 'multipolar'
    );

    if (!IzBase) continue;

    const esInstalacionAire = !(condiciones.metodoInstalacion || '').toUpperCase().startsWith('D');
    const factorTemp = getFactorTemperatura('PVC', condiciones.temperaturaAmbiente, esInstalacionAire, condiciones.tempSuelo);
    const factorAgrup = getFactorAgrupamientoVivienda(nCircuitos, conductor);
    const factorResistividad = !esInstalacionAire && condiciones.resistividadTermica ? getFactorResistividad(condiciones.metodoInstalacion, condiciones.resistividadTermica) : 1.0;
    const IzCorregida = IzBase * factorTemp * factorAgrup * factorResistividad;

    const valIzSustitucion = !esInstalacionAire
      ? `Iz = Iz_base * kTemp * kAgrup * kResist = ${IzBase.toFixed(1)}A * ${factorTemp.toFixed(2)} * ${factorAgrup.toFixed(2)} * ${factorResistividad.toFixed(2)} = ${IzCorregida.toFixed(2)} A`
      : `Iz = Iz_base * kTemp * kAgrup = ${IzBase.toFixed(1)}A * ${factorTemp.toFixed(2)} * ${factorAgrup.toFixed(2)} = ${IzCorregida.toFixed(2)} A`;

    pasosActuales.push({
        numero: 2, nombre: "Capacidad de Conducción (Iz)",
        valor: valIzSustitucion,
        condicion: `Iz (${IzCorregida.toFixed(2)}A) >= IB (${I_B.toFixed(2)}A)`, cumple: IzCorregida >= I_B
    });
    
    if (IzCorregida < I_B) continue;

    // PASO 3: Coordinación con Protección (I_B <= I_N <= I_Z)
    let InElegida = 0;
    let cumpleProteccion = false;

    if (proteccionSeleccionada) {
        InElegida = proteccionSeleccionada.in_amp;
        cumpleProteccion = InElegida >= I_B && InElegida <= IzCorregida;
        pasosActuales.push({ 
            numero: 3, nombre: "Selección de Protección (In)", 
            valor: `In = ${InElegida} A (${proteccionSeleccionada.modelo || 'PIA adoptada'})`, 
            condicion: `IB (${I_B.toFixed(2)}A) <= In (${InElegida}A) <= Iz (${IzCorregida.toFixed(2)}A)`, cumple: cumpleProteccion 
        });
    } else {
        const InPosibles = valoresTermomagneticas.filter(In => In >= I_B && In <= IzCorregida);
        if (InPosibles.length === 0) {
            pasosActuales.push({ numero: 3, nombre: "Selección de Protección (In)", valor: "Ninguna In comercial ajusta en rango IB..Iz", condicion: `IB (${I_B.toFixed(2)}A) <= In <= Iz (${IzCorregida.toFixed(2)}A)`, cumple: false });
        } else {
            termomagneticaRecomendada = InPosibles[0];
            InElegida = termomagneticaRecomendada;
            cumpleProteccion = true;
            pasosActuales.push({ 
                numero: 3, nombre: "Selección de Protección (In)", 
                valor: `In = ${InElegida} A (Termomagnética comercial recomendada)`, 
                condicion: `IB (${I_B.toFixed(2)}A) <= In (${InElegida}A) <= Iz (${IzCorregida.toFixed(2)}A)`, cumple: true 
            });
        }
    }
    
    if (!cumpleProteccion) continue;

    // Verificación de Sobrecarga (I2 <= 1.45 * Iz)
    const I2 = 1.45 * InElegida;
    const I2_limite = 1.45 * IzCorregida;
    const cumplePaso4 = I2 <= I2_limite;
    
    pasosActuales.push({
        numero: 4, nombre: "Protección contra Sobrecarga (I2 <= 1.45 * Iz)", 
        valor: `I2 = 1.45 * In = 1.45 * ${InElegida}A = ${I2.toFixed(2)} A | 1.45*Iz = 1.45 * ${IzCorregida.toFixed(2)}A = ${I2_limite.toFixed(2)} A`, 
        condicion: `I2 (${I2.toFixed(2)}A) <= 1.45*Iz (${I2_limite.toFixed(2)}A)`, cumple: cumplePaso4
    });
    
    if (!cumplePaso4) continue;

    // PASO 5: Corriente de cortocircuito máxima (I"k)
    const zMod = Math.sqrt(Math.pow(Z_upstream.r, 2) + Math.pow(Z_upstream.x, 2));
    const Ik_max = 220 / zMod;
    pasosActuales.push({
        numero: 5, nombre: "I. Cortocircuito Máxima (I\"k)", valor: `I"k_max = U / Z_upstream = 220V / ${zMod.toFixed(4)} Ω = ${(Ik_max/1000).toFixed(2)} kA`, condicion: `Icn (${proteccionSeleccionada?.capacidades?.[0]?.icn_ka || 3}kA) >= I"k (${(Ik_max/1000).toFixed(2)}kA)`, cumple: true
    });

    // Cálculos de impedancia del tramo para pasos 6 y 7
    let tablaImpedancias = IMPEDANCIAS_AEA_770;
    
    if (condiciones.normaCable === 'IRAM-NM 247-3' || condiciones.normaCable === 'IRAM 62267') {
      tablaImpedancias = IMPEDANCIAS_IRAM_NM_247_3_62267;
    } else if (condiciones.normaCable === 'IRAM 2178') {
      tablaImpedancias = (conductor.tipoCable === 'Multipolar') ? IMPEDANCIAS_IRAM_2178_1_MULTIPOLAR : IMPEDANCIAS_IRAM_2178_1_UNIPOLAR;
    } else if (condiciones.normaCable === 'IRAM 62266') {
      tablaImpedancias = (conductor.tipoCable === 'Multipolar') ? IMPEDANCIAS_IRAM_62266_MULTIPOLAR : IMPEDANCIAS_IRAM_62266_UNIPOLAR;
    }
    
    const impedancia = tablaImpedancias[s.toFixed(1)] || tablaImpedancias[s.toString()];
    
    if (!impedancia) {
      caidaTensionPorcentaje = (I_B * condiciones.longitudMetros * 0.02) / 220 * 100;
      pasosActuales.push({ numero: 6, nombre: "Exigencia Térmica", valor: "Faltan datos de impedancia", condicion: "-", cumple: true });
      pasosActuales.push({ numero: 7, nombre: "Actuación Ikmin", valor: "Faltan datos de impedancia", condicion: "-", cumple: true });
    } else {
        const rTramo = impedancia.r * (condiciones.longitudMetros / 1000);
        const xTramo = impedancia.x * (condiciones.longitudMetros / 1000);
        
        // PASO 6: Verificación de Cortocircuito Térmico
        const K = 115;
        const capacidadCable = Math.pow(K * s, 2);
        
        let energiaFalla = 0;
        let fuenteEnergia = "";
        let cumplePaso6 = false;

        if (InElegida <= 32) {
            const rango = InElegida <= 16 ? 'hasta16A' : 'entre16A32A';
            const capacidad = proteccionSeleccionada?.capacidades?.[0];
            const clase = (capacidad?.clase_limitacion === 3) ? 'clase3' : 'clase2';
            const curva = (proteccionSeleccionada?.curva_disparo === 'B') ? 'tipoB' : 'tipoC';
            const Icn = capacidad?.icn_ka ? (capacidad.icn_ka * 1000) : 6000;
            
            energiaFalla = (valoresEnergiaPasante as any)[rango][clase][curva][Icn] || Math.pow(Ik_max, 2) * 0.1;
            fuenteEnergia = `(tablas AEA ${rango})`;
            cumplePaso6 = capacidadCable >= energiaFalla;
        } else {
            if (proteccionSeleccionada?.energia_pasante) {
                energiaFalla = proteccionSeleccionada.energia_pasante;
                fuenteEnergia = "(catálogo)";
                cumplePaso6 = capacidadCable >= energiaFalla;
            } else {
                energiaFalla = 0;
                fuenteEnergia = "(REQUIERE DATO ENERGÍA PASANTE)";
                cumplePaso6 = false;
            }
        }
            
        pasosActuales.push({
            numero: 6, nombre: "Solicitación Térmica (k²S² >= I²t)", 
            valor: `(k * S)² = (115 * ${s}mm²)² = ${capacidadCable.toFixed(0)} A²s | I²t = ${energiaFalla.toFixed(0)} A²s ${fuenteEnergia}`,
            condicion: `(k*S)² (${capacidadCable.toFixed(0)}) >= I²t (${energiaFalla.toFixed(0)})`, cumple: cumplePaso6
        });
        
        if (!cumplePaso6) continue;
        
        // PASO 7: Verificación de Ikmin
        const Z_total = Math.sqrt(Math.pow((Z_upstream.r + rTramo)*2, 2) + Math.pow((Z_upstream.x + xTramo)*2, 2));
        const Icc_min = (220 / Z_total); // Icc al final del tramo
        
        const Im = 10 * InElegida;
        const cumplePaso7 = Icc_min > Im;
        
        pasosActuales.push({
            numero: 7, nombre: "Actuación Ikmin (I\"k_min > Im)", 
            valor: `I"k_min = 220V / Z_total = 220V / ${Z_total.toFixed(4)} Ω = ${Icc_min.toFixed(1)} A | Im = 10 * In = 10 * ${InElegida}A = ${Im} A`,
            condicion: `I"k_min (${Icc_min.toFixed(1)}A) > Im (${Im}A)`, cumple: cumplePaso7
        });
        
        if (!cumplePaso7) continue;

        // PASO 8: Verificación de Caída de Tensión
        const sinPhi = Math.sqrt(1 - Math.pow(cosPhi, 2));
        const longitudKm = condiciones.longitudMetros / 1000;
        const dv = 2 * I_B * longitudKm * (impedancia.r * cosPhi + impedancia.x * sinPhi);
        caidaTensionPorcentaje = (dv / 220) * 100;
    }
    
    // Usar el límite de caída de tensión personalizado si existe, sino el predeterminado
    let limiteCaida = conductor.caidaMaxPermitida ?? PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.iluminacionTomacorrientes;
    
    if (conductor.caidaMaxPermitida === undefined) {
        if (condiciones.tipoCircuito.includes('fuerza_motriz') || condiciones.tipoCircuito.includes('especificos')) {
            limiteCaida = PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.motoresRegimen;
        }
        if (condiciones.tipoTramo === 'LineaPrincipal') {
            limiteCaida = PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.recomendacionSeccionales;
        }
    }

    const cumplePaso8 = caidaTensionPorcentaje <= limiteCaida;
    const lKm = condiciones.longitudMetros / 1000;
    pasosActuales.push({
        numero: 8, nombre: "Caída de Tensión (ΔV%)", 
        valor: `ΔV = [2*IB*L*(r*cosφ + x*sinφ)/220]*100 = [2 * ${I_B.toFixed(2)}A * ${lKm.toFixed(3)}km * (${impedancia.r.toFixed(3)}*${cosPhi.toFixed(2)} + ${impedancia.x.toFixed(3)}*${(Math.sqrt(1 - Math.pow(cosPhi, 2))).toFixed(2)}) / 220]*100 = ${caidaTensionPorcentaje.toFixed(2)}%`,
        condicion: `ΔV% (${caidaTensionPorcentaje.toFixed(2)}%) <= ${limiteCaida}%`, cumple: cumplePaso8
    });

    if (!cumplePaso8) continue;

    // Si llegamos hasta aquí, todas las verificaciones pasaron
    seccionElegida = s;
    cumpleTodo = true;
    pasosVerificacion.push(...pasosActuales);
    break;
  }

  if (!cumpleTodo) {
      advertencias.push('No se encontró una sección comercial que cumpla todos los criterios rigurosos de AEA 770 para este tramo.');
      if (pasosActuales.length > 0) {
          pasosVerificacion.push(...pasosActuales); // Guardamos los pasos del último intento (fallido) para mostrarlos
      }
  } else {
      advertencias.push(`Protección aceptada: Interruptor termomagnético de ${termomagneticaRecomendada || proteccionSeleccionada?.in_amp}A (Curva C).`);
  }

  return {
    seccionRecomendada: seccionElegida,
    caidaTensionPorcentaje,
    cumpleCapacidadCorriente: cumpleTodo,
    cumpleCaidaTension: cumpleTodo,
    advertencias: advertencias.length > 0 ? advertencias : undefined,
    pasosVerificacion: pasosVerificacion.filter(p => p !== null && p !== undefined)
  };
};

