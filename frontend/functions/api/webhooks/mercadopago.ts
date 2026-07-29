// frontend/functions/api/webhooks/mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();

    // TODO: CONFIGURACIÓN EXTERNA - Validar firma del webhook (seguridad)
    
    // 1. Obtener ID del recurso desde Mercado Pago
    const resourceId = body.data.id;
    
    // 2. Consultar el estado real a la API de Mercado Pago (Seguridad)
    const response = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
    });
    const subData = await response.json();

    // 3. Mapear estado y actualizar base de datos
    const status = subData.status === 'authorized' ? 'active' : subData.status;
    const userId = subData.external_reference;

    await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ? WHERE id = ?')
        .bind(status, resourceId, userId)
        .run();

    return new Response('OK', { status: 200 });
}
