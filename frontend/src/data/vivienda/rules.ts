// frontend/src/data/vivienda/rules.ts
import { AEA_Part } from '../../types/normas'; // Debemos crear esto

export interface NormativeRules {
  norma: AEA_Part;
  maxVoltageDrop: {
    iluminacion: number; // porcentaje
    fuerzaMotriz: number; // porcentaje
  };
  allowedMethods: string[];
  simultaneityFactorStrategy: 'vivienda' | 'industrial';
}

export const AEA_770_RULES: NormativeRules = {
  norma: '770',
  maxVoltageDrop: {
    iluminacion: 3,
    fuerzaMotriz: 5,
  },
  // Métodos permitidos (ejemplos, esto debe completarse con la norma)
  allowedMethods: ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2'], 
  simultaneityFactorStrategy: 'vivienda',
};
