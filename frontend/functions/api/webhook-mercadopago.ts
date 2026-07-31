// frontend/functions/api/webhook-mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const data = await request.json();
        console.log('Webhook MercadoPago recibido:', JSON.stringify(data));

        let preapprovalId = null;

        if (data.type === 'subscription_preapproval' || data.type === 'preapproval' || data.topic === 'preapproval') {
            preapprovalId = data.data?.id || data.id;
        } else if (data.type === 'payment' || data.topic === 'payment') {
            const paymentId = data.data?.id || data.id;
            if (paymentId && env.MP_ACCESS_TOKEN) {
                const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
                });
                const payData = await payRes.json();
                preapprovalId = payData.metadata?.preapproval_id || payData.external_reference;
            }
        }

        if (preapprovalId && env.MP_ACCESS_TOKEN) {
            // 1. Obtener detalles de la suscripción desde la API de Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
            });
            const subData = await response.json();

            const userId = subData.external_reference;
            const status = (subData.status === 'authorized' || subData.status === 'active') ? 'active' : (subData.status || 'inactive');

            // 2. Si hay un userId válido, actualizar el estado de la suscripción en la base de datos
            if (userId) {
                await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ? WHERE id = ?')
                    .bind(status, preapprovalId, userId)
                    .run();
                
                console.log(`Usuario ${userId} suscripción actualizada a ${status}.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e: any) {
        console.error('Error en webhook:', e);
        return new Response(JSON.stringify({ error: 'Error procesando webhook: ' + e.message }), { status: 500 });
    }
}

