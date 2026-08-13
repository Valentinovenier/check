import { Project, CondicionesTramo, DatosCaratula } from '../../../types/project';
import { BaseProjectStrategy } from '../base';
import { calcularTramoResidencial } from './calculador';
import { ViviendaConductorForm } from '../../../features/vivienda/ViviendaConductorForm';
import { ViviendaReport } from '../../../features/vivienda/ViviendaReport';
import { CondicionesTramoResidencial, TipoCircuito } from '../../../types/vivienda';

export class ViviendaStrategy implements BaseProjectStrategy {
  calcularTramo(condiciones: CondicionesTramo, project: Project): any {
    const condicionesRes: CondicionesTramoResidencial = {
        ...condiciones,
        tipoCircuito: condiciones.tipoCircuito as TipoCircuito,
        metodoInstalacion: (condiciones.metodoInstalacion === 'sinEnvoltura' ? 'sinEnvoltura' : 'B2') as 'B2' | 'D1' | 'D2' | 'sinEnvoltura' // Adaptación simple
    };
    
    // Creamos un conductor dummy para cumplir con la firma necesaria para los cálculos de agrupamiento
    const conductorDummy: any = {
        metodoInstalacion: condiciones.metodoInstalacion,
        tipoCable: 'Multipolar',
        separacionBordes: 'en_contacto'
    };
    
    return calcularTramoResidencial(condicionesRes, project, conductorDummy);
  }

  validarReglas(project: Project): boolean {
    return true;
  }

  getFormularioComponente(): React.ComponentType<any> {
    return ViviendaConductorForm;
  }

  getInformeComponente(): React.ComponentType<{ project: Project, isPro: boolean, caratula: DatosCaratula }> {
    return ViviendaReport;
  }
}
