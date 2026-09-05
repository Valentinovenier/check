/**
 * Configuración de Modelo de Acceso a la Plataforma ElectroCheck.
 * 
 * =========================================================================
 * INTERRUPTOR DE ACCESO GRATUITO / DE PAGO (FEATURE FLAG)
 * =========================================================================
 * 
 * - Si FREE_ACCESS_MODE === true (ACTUAL):
 *   El registro y uso de la plataforma es 100% GRATUITO.
 *   Los usuarios se registran e ingresan directo a la app (/app)
 *   sin pasar por el checkout de Mercado Pago ni exigir suscripción activa.
 * 
 * - Si FREE_ACCESS_MODE === false:
 *   Se reactiva automáticamente el modelo de pago.
 *   Los nuevos registros y usuarios sin suscripción activa son redirigidos
 *   al checkout de Mercado Pago y a la selección de planes.
 * 
 * Para volver al modo de pago: simplemente cambiar a `false`.
 */
export const FREE_ACCESS_MODE = true;
