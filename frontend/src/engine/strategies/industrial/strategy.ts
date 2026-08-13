import { Project, CondicionesTramo, DatosCaratula } from '../../../types/project';
import { BaseProjectStrategy } from '../base';
import { calcularConductorTramo } from './calculadorTramo';
import { IndustrialConductorForm } from '../../../features/industrial/IndustrialConductorForm';
import { IndustrialReport } from '../../../features/industrial/IndustrialReport';

export class IndustrialStrategy implements BaseProjectStrategy {
  calcularTramo(condiciones: CondicionesTramo): any {
    return calcularConductorTramo(condiciones, 0, 0, 0, 0, 0, 0, [], 0, false);
  }

  validarReglas(project: Project): boolean {
    return true;
  }

  getFormularioComponente(): React.ComponentType<any> {
    return IndustrialConductorForm;
  }

  getInformeComponente(): React.ComponentType<{ project: Project, isPro: boolean, caratula: DatosCaratula }> {
    return IndustrialReport;
  }
}
