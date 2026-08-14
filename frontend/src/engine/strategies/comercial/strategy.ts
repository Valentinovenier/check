import { Project, CondicionesTramo, DatosCaratula } from '../../../types/project';
import { BaseProjectStrategy } from '../base';
import { calcularTramoComercial } from './calculador';
import { ComercialConductorForm } from '../../../features/comercial/ComercialConductorForm';
import { ComercialReport } from '../../../features/comercial/ComercialReport';

export class ComercialStrategy implements BaseProjectStrategy {
  calcularTramo(condiciones: CondicionesTramo, project: Project): any {
    // Adaptación inicial de parámetros para cálculo comercial
    return calcularTramoComercial(condiciones, project);
  }

  validarReglas(project: Project): boolean {
    return true; // Implementar validaciones específicas AEA 771 más adelante
  }

  getFormularioComponente(): React.ComponentType<any> {
    return ComercialConductorForm;
  }

  getInformeComponente(): React.ComponentType<any> {
    return ComercialReport;
  }
}
