import { CondicionesTramoResidencial, ResultadoCalculoResidencial } from '../../../types/vivienda';
import { Project, Conductor, Proteccion } from '../../../types/project';
import { getAdmisible } from '../industrial/corrienteProvider';
import { IMPEDANCIAS_CABLES_VIVIENDA } from '../../../data/vivienda/impedancias';
import { SECCIONES_MINIMAS_VIVIENDA } from '../../../data/vivienda/seccionesMinimas';
import { getFactorTemperatura } from '../industrial/helpers/normativeFactors';
import { calcularFactorAgrupamiento } from '../industrial/canalizacionService';
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
      const resultado = calcularTramoResidencial(condiciones, project, proteccion);
      
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
            case 'usos_especificos_mbtf': seccionMinima = SECCIONES_MINIMAS_VIVIENDA.usosEspecificosMBTF; break;
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
    
    // PASO 1
    pasosActuales.push({
        numero: 1, nombre: "Corriente del tramo (IB)",
        valor: `${I_B.toFixed(2)} A`, condicion: "-", cumple: true
    });

    // PASO 2: Capacidad de Conducción (Iz)
    const IzBase = getAdmisible(
        '770', s, condiciones.metodoInstalacion === 'sinEnvoltura' ? 'B1' : condiciones.metodoInstalacion,
        'Monofásica', 'Cobre', 'PVC', undefined, undefined, 'multipolar'
    );

    if (!IzBase) continue;

    const esInstalacionAire = !(condiciones.metodoInstalacion || '').toUpperCase().startsWith('D');
    const factorTemp = getFactorTemperatura('PVC', condiciones.temperaturaAmbiente, esInstalacionAire, condiciones.tempSuelo);
    const factorAgrup = calcularFactorAgrupamiento(nCircuitos, condiciones.tipoInstalacion || 'Monofásica');
    const factorResistividad = condiciones.resistividadTermica ? getFactorResistividad(condiciones.metodoInstalacion, condiciones.resistividadTermica) : 1.0;
    const IzCorregida = IzBase * factorTemp * factorAgrup * factorResistividad;

    pasosActuales.push({
        numero: 2, nombre: "Capacidad de Conducción (Iz)",
        valor: `${IzCorregida.toFixed(2)} A (Iz_base: ${IzBase.toFixed(2)}A * F.Temp: ${factorTemp.toFixed(2)} * F.Agrup: ${factorAgrup.toFixed(2)} * F.Resist: ${factorResistividad.toFixed(2)})`,
        condicion: `Iz >= IB`, cumple: IzCorregida >= I_B
    });
    
    if (IzCorregida < I_B) continue;

    // PASO 3: Coordinación con Protección (I_B <= I_N <= I_Z)
    let InElegida = 0;
    let cumpleProteccion = false;

    if (proteccionSeleccionada) {
        InElegida = proteccionSeleccionada.in_amp;
        cumpleProteccion = InElegida >= I_B && InElegida <= IzCorregida;
        pasosActuales.push({ 
            numero: 3, nombre: "Protección (In)", 
            valor: `${InElegida} A (Seleccionada: ${proteccionSeleccionada.modelo})`, 
            condicion: "IB <= In <= Iz", cumple: cumpleProteccion 
        });
    } else {
        const InPosibles = valoresTermomagneticas.filter(In => In >= I_B && In <= IzCorregida);
        if (InPosibles.length === 0) {
            pasosActuales.push({ numero: 3, nombre: "Protección (In)", valor: "Ninguna In comercial ajusta", condicion: "IB <= In <= Iz", cumple: false });
        } else {
            termomagneticaRecomendada = InPosibles[0];
            InElegida = termomagneticaRecomendada;
            cumpleProteccion = true;
            pasosActuales.push({ 
                numero: 3, nombre: "Protección (In)", 
                valor: `${InElegida} A (Recomendada)`, 
                condicion: "IB <= In <= Iz", cumple: true 
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
        valor: `I2=${I2.toFixed(2)}A, 1.45*Iz=${I2_limite.toFixed(2)}A`, 
        condicion: "I2 <= 1.45 * Iz", cumple: cumplePaso4
    });
    
    if (!cumplePaso4) continue;

    // PASO 5: Corriente de cortocircuito máxima (I"k)
    const Ik_max = 220 / Math.sqrt(Math.pow(Z_upstream.r, 2) + Math.pow(Z_upstream.x, 2));
    pasosActuales.push({
        numero: 5, nombre: "I. Cortocircuito Máxima (I\"k)", valor: `${(Ik_max/1000).toFixed(2)} kA`, condicion: "Dato origen", cumple: true
    });

    // Cálculos de impedancia del tramo para pasos 6 y 7
    const impedancia = IMPEDANCIAS_CABLES_VIVIENDA[s.toFixed(1)] || IMPEDANCIAS_CABLES_VIVIENDA[s.toString()];
    if (!impedancia) {
      caidaTensionPorcentaje = (I_B * condiciones.longitudMetros * 0.02) / 220 * 100;
      pasosActuales.push({ numero: 6, nombre: "Exigencia Térmica", valor: "Faltan datos", condicion: "-", cumple: true });
      pasosActuales.push({ numero: 7, nombre: "Actuación Ikmin", valor: "Faltan datos", condicion: "-", cumple: true });
    } else {
        const rTramo = impedancia.r * (condiciones.longitudMetros / 1000);
        const xTramo = impedancia.x * (condiciones.longitudMetros / 1000);
        
        // PASO 6: Verificación de Cortocircuito Térmico
        const K = 115;
        const capacidadCable = Math.pow(K * s, 2);
        
        let energiaFalla = 0;
        let fuenteEnergia = "";
        let cumplePaso6 = false;

        // Búsqueda de I²t
        if (InElegida <= 32) {
            // Automatizado para protecciones <= 32A
            const rango = InElegida <= 16 ? 'hasta16A' : 'entre16A32A';
            const clase = (proteccionSeleccionada?.capacidades[0]?.clase_limitacion === 3) ? 'clase3' : 'clase2';
            const curva = (proteccionSeleccionada?.curva_disparo === 'B') ? 'tipoB' : 'tipoC';
            
            // Aproximación simplificada tomando el Icn del proyecto (fallback a 6000A)
            const Icn = proteccionSeleccionada?.capacidades[0]?.icn_ka ? (proteccionSeleccionada.capacidades[0].icn_ka * 1000) : 6000;
            
            energiaFalla = (valoresEnergiaPasante as any)[rango][clase][curva][Icn] || Math.pow(Ik_max, 2) * 0.1;
            fuenteEnergia = `(tablas AEA para ${rango}, ${clase}, ${curva})`;
            cumplePaso6 = capacidadCable >= energiaFalla;
        } else {
            // Requerido para protecciones > 32A
            if (proteccionSeleccionada?.energia_pasante) {
                energiaFalla = proteccionSeleccionada.energia_pasante;
                fuenteEnergia = "(dato de catálogo)";
                cumplePaso6 = capacidadCable >= energiaFalla;
            } else {
                energiaFalla = 0;
                fuenteEnergia = "(ERROR: REQUIERE DATO ENERGÍA PASANTE)";
                cumplePaso6 = false;
            }
        }
            
        pasosActuales.push({
            numero: 6, nombre: "Exigencia Térmica", 
            valor: `K²S²=${capacidadCable.toFixed(0)}, I²t=${energiaFalla.toFixed(0)} ${fuenteEnergia}`,
            condicion: "K²S² >= I²t", cumple: cumplePaso6
        });
        
        if (!cumplePaso6) continue;
        
        // PASO 7: Verificación de Ikmin
        const Z_total = Math.sqrt(Math.pow((Z_upstream.r + rTramo)*2, 2) + Math.pow((Z_upstream.x + xTramo)*2, 2));
        const Icc_min = (220 / Z_total); // Icc al final del tramo
        
        // Asumiendo Curva C
        const Im = 10 * InElegida;
        const cumplePaso7 = Icc_min > Im;
        
        pasosActuales.push({
            numero: 7, nombre: "Actuación Protección Ikmin", 
            valor: `Ikmin=${Icc_min.toFixed(0)}A, Im=${Im}A`,
            condicion: "Ikmin > Im (Curva C)", cumple: cumplePaso7
        });
        
        if (!cumplePaso7) continue;

        // PASO 8: Verificación de Caída de Tensión
        const sinPhi = Math.sqrt(1 - Math.pow(cosPhi, 2));
        const longitudKm = condiciones.longitudMetros / 1000;
        const dv = 2 * I_B * longitudKm * (impedancia.r * cosPhi + impedancia.x * sinPhi);
        caidaTensionPorcentaje = (dv / 220) * 100;
    }
    
    let limiteCaida = PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.iluminacionTomacorrientes;
    if (condiciones.tipoCircuito.includes('fuerza_motriz') || condiciones.tipoCircuito.includes('especificos')) {
        limiteCaida = PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.motoresRegimen;
    }
    if (condiciones.tipoTramo === 'LineaPrincipal') {
        limiteCaida = PARAMETROS_CALCULO_VIVIENDA.limitesCaidaTension.recomendacionSeccionales;
    }

    const cumplePaso8 = caidaTensionPorcentaje <= limiteCaida;
    pasosActuales.push({
        numero: 8, nombre: "Caída de Tensión", 
        valor: `${caidaTensionPorcentaje.toFixed(2)}%`,
        condicion: `<= ${limiteCaida}%`, cumple: cumplePaso8
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
    pasosVerificacion
  };
};

