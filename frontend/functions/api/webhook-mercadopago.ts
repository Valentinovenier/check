// frontend/functions/api/webhook-mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const data = await request.json();
        console.log('Webhook MercadoPago recibido con datos:', JSON.stringify(data));

        let preapprovalId = null;

        // --- EXTRACCIÓN DE ID ---
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

        // --- VALIDACIÓN Y LLAMADA A API ---
        // Ignorar IDs de prueba o placeholder
        if (!preapprovalId || preapprovalId === '123456') {
            console.log('Webhook ignorado (ID inválido o de prueba):', preapprovalId);
            return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 });
        }

        if (env.MP_ACCESS_TOKEN) {
            const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
            });
            
            if (response.status === 404) {
                console.log(`Preaprobación ${preapprovalId} no encontrada en MP.`);
                return new Response(JSON.stringify({ received: true, error: 'Not found' }), { status: 200 });
            }

            const subData = await response.json();
            console.log('Datos de suscripción obtenidos:', JSON.stringify(subData));

            const userId = subData.external_reference;
            const status = (subData.status === 'authorized' || subData.status === 'active') ? 'active' : (subData.status || 'inactive');

            if (userId) {
                const endDate = subData.next_payment_date || null;
                await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ?, subscription_end_date = ? WHERE id = ?')
                    .bind(status, preapprovalId, endDate, userId)
                    .run();
                console.log(`Usuario ${userId} actualizado a ${status}.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e: any) {
        console.error('Error en webhook:', e);
        return new Response(JSON.stringify({ error: 'Error procesando webhook: ' + e.message }), { status: 500 });
    }
}

