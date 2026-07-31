// frontend/functions/api/webhook-mercadopago.ts
export async function onRequestPost(context) {
    const { request, env } = context;
    
    console.log('--- NUEVO EVENTO WEBHOOK ---');
    
    try {
        const rawBody = await request.text();
        console.log('Cuerpo crudo:', rawBody);
        
        let data;
        try {
            data = JSON.parse(rawBody);
            console.log('JSON parseado exitosamente:', JSON.stringify(data));
        } catch (e) {
            console.error('Error parseando JSON, pero retornamos 200 para evitar reintentos de MP.');
            return new Response('OK - JSON inválido pero recibido', { status: 200 });
        }

        // --- Extracción de ID (Multi-formato para cubrir todos los casos de MP) ---
        const preapprovalId = data.data?.id || data.id || data.resource?.id;
        console.log('ID extraído de la notificación:', preapprovalId);

        if (!preapprovalId) {
            console.log('No se pudo extraer un ID de la notificación. Fin del proceso.');
            return new Response('OK - Sin ID', { status: 200 });
        }

        if (!env.MP_ACCESS_TOKEN) {
            console.error('Error: MP_ACCESS_TOKEN no configurado en env');
            return new Response('OK - Error config', { status: 200 });
        }

        // --- Obtener detalles de la API de MP ---
        console.log('Consultando API de Mercado Pago para ID:', preapprovalId);
        const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
            headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
        });
        
        const subData = await response.json();
        console.log('Respuesta API Mercado Pago:', JSON.stringify(subData));

        const userId = subData.external_reference;
        const status = (subData.status === 'authorized' || subData.status === 'active') ? 'active' : 'inactive';
        
        console.log('Datos procesados -> Usuario:', userId, '| Estado:', status);

        // --- Actualización de DB ---
        if (userId) {
            console.log('Intentando actualizar base de datos...');
            const result = await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ? WHERE id = ?')
                .bind(status, preapprovalId, userId)
                .run();
            
            console.log('Resultado DB:', JSON.stringify(result));
            console.log(`Usuario ${userId} suscripción actualizada a ${status}.`);
        } else {
            console.log('No se encontró external_reference (userId) en la suscripción.');
        }

        return new Response('OK - Procesado', { status: 200 });
    } catch (e) {
        console.error('Error crítico en webhook:', e);
        // Siempre devolvemos 200 para que MercadoPago deje de intentar
        return new Response('OK - Error interno', { status: 200 });
    }
}
