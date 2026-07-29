// frontend/functions/api/webhook-mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const data = await request.json();

        // Mercado Pago suele enviar notificaciones con un 'data.id' que es el ID del pago
        // o información del tipo de evento.
        // Aquí deberías validar la autenticidad de la notificación si es necesario.

        if (data.type === 'payment' && data.action === 'payment.updated') {
            const paymentId = data.data.id;
            
            // 1. Obtener información del pago desde la API de Mercado Pago usando el paymentId
            // 2. Extraer 'external_reference' (debería ser el userId que pasaste al crear la preferencia)
            
            const externalReference = 'USER_ID_DE_PRUEBA'; // Esto debe venir del pago real

            if (/* pago aprobado */ true) {
                await env.DB.prepare('UPDATE users SET subscription_status = ? WHERE id = ?')
                    .bind('active', externalReference)
                    .run();
                
                console.log(`Usuario ${externalReference} actualizado a activo.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e) {
        console.error('Error en webhook:', e);
        return new Response(JSON.stringify({ error: 'Error procesando webhook' }), { status: 500 });
    }
}
