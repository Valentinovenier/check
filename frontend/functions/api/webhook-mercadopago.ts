// frontend/functions/api/webhook-mercadopago.ts
async function handleWebhook(context: any) {
    const { request, env } = context;
    console.log('--- NUEVO EVENTO WEBHOOK MERCADO PAGO ---');
    try {
        const url = new URL(request.url);
        let preapprovalId = url.searchParams.get('id') || url.searchParams.get('data.id');
        let topic = url.searchParams.get('topic') || url.searchParams.get('type');
        let body: any = {};
        if (request.method === 'POST') {
            try {
                const rawBody = await request.text();
                if (rawBody) {
                    body = JSON.parse(rawBody);
                    console.log('Cuerpo del webhook:', JSON.stringify(body));
                }
            } catch (e) {
                console.warn('Cuerpo no parseable como JSON:', e);
            }
        }
        if (!preapprovalId) {
            preapprovalId = body.data?.id || body.id || body.resource?.id;
        }
        if (!topic) {
            topic = body.type || body.topic || body.action;
        }
        console.log(`ID extraído: ${preapprovalId} | Tópico: ${topic}`);
        if (!preapprovalId) {
            console.log('No se obtuvo ID del webhook. Retornando HTTP 200.');
            return new Response('OK - Sin ID', { status: 200 });
        }
        if (!env.MP_ACCESS_TOKEN) {
            console.error('Error: MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
            return new Response('OK - Sin MP_ACCESS_TOKEN', { status: 200 });
        }
        let targetPreapprovalId = preapprovalId;
        let userId: string | null = null;
        let status: string | null = null;
        
        // Si la notificación es sobre un pago individual, consultamos la API de pagos para obtener el preapproval_id o external_reference
        if (topic === 'payment' || body.type === 'payment') {
            console.log('Consultando API de pagos para ID:', preapprovalId);
            const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
            });
            if (payRes.ok) {
                const payData: any = await payRes.json();
                console.log('Datos de pago obtenidos:', JSON.stringify(payData));
                if (payData.preapproval_id) {
                    targetPreapprovalId = payData.preapproval_id;
                }
                
                // Extraer userId del external_reference del pago
                if (payData.external_reference) {
                    userId = payData.external_reference;
                }
                
                // Intentar obtener el preapproval_id desde point_of_interaction
                if (payData.point_of_interaction?.transaction_data?.subscription_id) {
                    targetPreapprovalId = payData.point_of_interaction.transaction_data.subscription_id;
                }
            }
        }

        // Consultar API de suscripción (preapproval)
        console.log('Consultando API de suscripciones para preapprovalId:', targetPreapprovalId);
        const subRes = await fetch(`https://api.mercadopago.com/preapproval/${targetPreapprovalId}`, {
            headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
        });

        if (subRes.ok) {
            const subData: any = await subRes.json();
            console.log('Respuesta de la API de suscripción:', JSON.stringify(subData));

            if (!userId) {
                userId = subData.external_reference;
            }

            const mpStatus = subData.status; // 'authorized', 'active', 'paused', 'cancelled', etc.
            
            // Lógica inteligente de estados:
            // - Si es 'authorized' o 'active', marcar como 'active'.
            // - Si es 'cancelled', 'paused', 'expired', marcar como 'inactive'.
            // - Si es 'pending', no hacer nada (preservar estado actual).
            if (mpStatus === 'authorized' || mpStatus === 'active') {
                status = 'active';
            } else if (['cancelled', 'paused', 'expired', 'refunded'].includes(mpStatus)) {
                status = 'inactive';
            } else {
                console.log(`Estado 'pending' u otro detectado (${mpStatus}). Omitiendo actualización para evitar errores.`);
                return new Response('OK - Estado ignorado', { status: 200 });
            }
            
            console.log(`Estado procesado -> Usuario: ${userId} | Estado MP: ${mpStatus} -> Estado Final: ${status}`);

            // Actualizar la base de datos si tenemos el ID del usuario y un nuevo estado
            if (userId && status && env.DB) {
                // Extraer la fecha de vencimiento de la respuesta de suscripción
                const nextPaymentDate = subData.next_payment_date || null;
                
                console.log(`Actualizando base de datos para usuario ${userId} a estado '${status}' y fecha ${nextPaymentDate}...`);
                const dbResult = await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ?, subscription_end_date = ? WHERE id = ?')
                    .bind(status, targetPreapprovalId, nextPaymentDate, userId)
                    .run();
                console.log('Resultado DB:', JSON.stringify(dbResult));
            } else {
                console.warn('No se pudo asociar la suscripción a un userId o estado inválido.');
            }
        } else {
            console.error(`Error al consultar suscripción (${subRes.status}):`, await subRes.text());
            return new Response('OK - Error consultando suscripción', { status: 200 });
        }

        return new Response('OK - Webhook procesado', { status: 200 });
    } catch (e: any) {
        console.error('Error crítico procesando el webhook:', e);
        return new Response('OK - Error interno capturado', { status: 200 });
    }
}

export async function onRequestPost(context: any) {
    return handleWebhook(context);
}

export async function onRequestGet(context: any) {
    return handleWebhook(context);
}
