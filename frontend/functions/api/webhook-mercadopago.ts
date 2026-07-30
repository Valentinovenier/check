// frontend/functions/api/webhook-mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const data = await request.json();

        // Mercado Pago envía 'subscription_preapproval' para suscripciones
        if (data.type === 'subscription_preapproval') {
            const preapprovalId = data.data.id;

            // 1. Obtener detalles de la suscripción desde la API de Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
            });
            const subData = await response.json();

            const userId = subData.external_reference;

            // 2. Si la suscripción está 'authorized' o 'active', actualizar usuario
            if (userId && (subData.status === 'authorized' || subData.status === 'active')) {
                await env.DB.prepare('UPDATE users SET subscription_status = ? WHERE id = ?')
                    .bind('active', userId)
                    .run();
                
                console.log(`Usuario ${userId} suscripción activada/actualizada.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e) {
        console.error('Error en webhook:', e);
        return new Response(JSON.stringify({ error: 'Error procesando webhook' }), { status: 500 });
    }
}
