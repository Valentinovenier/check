import { Proteccion } from '../types/project';

export const PROTECCIONES_CATALOGO_DEFAULT: Proteccion[] = [
  // Termomagnéticas Bipolares (2P) Curva C - Schneider Easy9 / Acti9
  {
    id: 'def-pia-2p-c10',
    modelo: 'Schneider Easy9 2P C10',
    tipo_proteccion: 'Termomagnética',
    in_amp: 10,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c16',
    modelo: 'Schneider Easy9 2P C16',
    tipo_proteccion: 'Termomagnética',
    in_amp: 16,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c20',
    modelo: 'Schneider Easy9 2P C20',
    tipo_proteccion: 'Termomagnética',
    in_amp: 20,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c25',
    modelo: 'Schneider Easy9 2P C25',
    tipo_proteccion: 'Termomagnética',
    in_amp: 25,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c32',
    modelo: 'Schneider Easy9 2P C32',
    tipo_proteccion: 'Termomagnética',
    in_amp: 32,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c40',
    modelo: 'Schneider Easy9 2P C40',
    tipo_proteccion: 'Termomagnética',
    in_amp: 40,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c50',
    modelo: 'Schneider Acti9 iC60N 2P C50',
    tipo_proteccion: 'Termomagnética',
    in_amp: 50,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 6, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-2p-c63',
    modelo: 'Schneider Acti9 iC60N 2P C63',
    tipo_proteccion: 'Termomagnética',
    in_amp: 63,
    curva_disparo: 'C',
    polos: 2,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 6, clase_limitacion: 3 }]
  },

  // Termomagnéticas Tetrapolares (4P) Curva C
  {
    id: 'def-pia-4p-c25',
    modelo: 'Schneider Easy9 4P C25',
    tipo_proteccion: 'Termomagnética',
    in_amp: 25,
    curva_disparo: 'C',
    polos: 4,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-4p-c32',
    modelo: 'Schneider Easy9 4P C32',
    tipo_proteccion: 'Termomagnética',
    in_amp: 32,
    curva_disparo: 'C',
    polos: 4,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-4p-c40',
    modelo: 'Schneider Easy9 4P C40',
    tipo_proteccion: 'Termomagnética',
    in_amp: 40,
    curva_disparo: 'C',
    polos: 4,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-4p-c50',
    modelo: 'Schneider Acti9 iC60N 4P C50',
    tipo_proteccion: 'Termomagnética',
    in_amp: 50,
    curva_disparo: 'C',
    polos: 4,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 6, clase_limitacion: 3 }]
  },
  {
    id: 'def-pia-4p-c63',
    modelo: 'Schneider Acti9 iC60N 4P C63',
    tipo_proteccion: 'Termomagnética',
    in_amp: 63,
    curva_disparo: 'C',
    polos: 4,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 6, clase_limitacion: 3 }]
  },

  // Interruptores Diferenciales (ID) Bipolares y Tetrapolares 30mA
  {
    id: 'def-id-2p-25a',
    modelo: 'Schneider Easy9 ID 2P 25A 30mA',
    tipo_proteccion: 'Interruptor Diferencial',
    in_amp: 25,
    polos: 2,
    sensibilidad: 30,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-id-2p-40a',
    modelo: 'Schneider Easy9 ID 2P 40A 30mA',
    tipo_proteccion: 'Interruptor Diferencial',
    in_amp: 40,
    polos: 2,
    sensibilidad: 30,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-id-2p-63a',
    modelo: 'Schneider Acti9 ilD 2P 63A 30mA',
    tipo_proteccion: 'Interruptor Diferencial',
    in_amp: 63,
    polos: 2,
    sensibilidad: 30,
    marca: 'Schneider',
    capacidades: [{ tension_v: 230, icn_ka: 6, clase_limitacion: 3 }]
  },
  {
    id: 'def-id-4p-40a',
    modelo: 'Schneider Easy9 ID 4P 40A 30mA',
    tipo_proteccion: 'Interruptor Diferencial',
    in_amp: 40,
    polos: 4,
    sensibilidad: 30,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 4.5, clase_limitacion: 3 }]
  },
  {
    id: 'def-id-4p-63a',
    modelo: 'Schneider Acti9 ilD 4P 63A 30mA',
    tipo_proteccion: 'Interruptor Diferencial',
    in_amp: 63,
    polos: 4,
    sensibilidad: 30,
    marca: 'Schneider',
    capacidades: [{ tension_v: 400, icn_ka: 6, clase_limitacion: 3 }]
  }
];
