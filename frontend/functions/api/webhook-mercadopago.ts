// frontend/functions/api/webhook-mercadopago.ts
async function handleWebhook(context: any) {
    const { request, env } = context;
    console.log('--- NUEVO EVENTO WEBHOOK MERCADO PAGO ---');
    try {
        const url = new URL(request.url);
        const queryUserId = url.searchParams.get('user_id');
        const queryPlanType = url.searchParams.get('plan_type');
        
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

        // Extraer id si viene como URL completa (ej: https://api.mercadopago.com/preapproval/12345)
        if (preapprovalId && typeof preapprovalId === 'string' && preapprovalId.includes('/')) {
            const parts = preapprovalId.split('/');
            preapprovalId = parts[parts.length - 1];
        }

        if (!topic) {
            topic = body.type || body.topic || body.action;
        }

        console.log(`ID extraído: ${preapprovalId} | Tópico: ${topic} | Query UserId: ${queryUserId} | Query PlanType: ${queryPlanType}`);

        if (!preapprovalId) {
            console.log('No se obtuvo ID del webhook. Retornando HTTP 200.');
            return new Response('OK - Sin ID', { status: 200 });
        }

        if (!env.MP_ACCESS_TOKEN) {
            console.error('Error: MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
            return new Response('OK - Sin MP_ACCESS_TOKEN', { status: 200 });
        }

        let targetPreapprovalId = preapprovalId;
        let userId: string | null = queryUserId || null;
        let status: string | null = null;
        
        // Si la notificación es sobre un pago individual (factura/cobro recurrente)
        if (topic === 'payment' || body.type === 'payment' || topic === 'subscription_authorized_payment') {
            console.log('Consultando API de pagos para ID:', preapprovalId);
            const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
            });

            if (payRes.ok) {
                const payData: any = await payRes.json();
                console.log('Datos de pago obtenidos:', JSON.stringify(payData));

                if (payData.preapproval_id) {
                    targetPreapprovalId = payData.preapproval_id;
                } else if (payData.point_of_interaction?.transaction_data?.subscription_id) {
                    targetPreapprovalId = payData.point_of_interaction.transaction_data.subscription_id;
                }
                
                if (!userId && payData.external_reference) {
                    userId = payData.external_reference;
                }
            }
        }

        // Consultar API de suscripción (preapproval)
        console.log('Consultando API de suscripciones para preapprovalId:', targetPreapprovalId);
        const subRes = await fetch(`https://api.mercadopago.com/preapproval/${targetPreapprovalId}`, {
            headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
        });

        let subData: any = null;
        if (subRes.ok) {
            subData = await subRes.json();
            console.log('Respuesta de la API de suscripción:', JSON.stringify(subData));

            if (!userId && subData.external_reference) {
                userId = subData.external_reference;
            }

            const mpStatus = subData.status; // 'authorized', 'active', 'paused', 'cancelled', etc.
            
            if (mpStatus === 'authorized' || mpStatus === 'active') {
                status = 'active';
            } else if (['cancelled', 'paused', 'expired', 'refunded'].includes(mpStatus)) {
                status = 'inactive';
            } else {
                console.log(`Estado 'pending' u otro detectado (${mpStatus}). Preservando estado actual.`);
                return new Response('OK - Estado conservado', { status: 200 });
            }
        } else {
            console.warn(`No se pudo obtener preapproval de MP (${subRes.status}). Asumiendo actualización por pago directo si aplica.`);
        }

        if (!env.DB) {
            console.error('Error: Base de datos env.DB no disponible en webhook.');
            return new Response('OK - Sin DB', { status: 200 });
        }

        // Estrategia 1 (Pre-persistencia): Si userId aún es nulo, buscar en la BD local por mp_subscription_id
        let dbUser: any = null;
        if (!userId) {
            try {
                dbUser = await env.DB.prepare('SELECT id, plan_type FROM users WHERE mp_subscription_id = ?')
                    .bind(targetPreapprovalId)
                    .first();
                if (dbUser) {
                    userId = dbUser.id;
                    console.log(`Usuario hallado en DB por pre-persistencia de mp_subscription_id: ${userId}`);
                }
            } catch (dbErr) {
                console.error('Error buscando usuario por mp_subscription_id:', dbErr);
            }
        } else {
            try {
                dbUser = await env.DB.prepare('SELECT id, plan_type FROM users WHERE id = ?')
                    .bind(userId)
                    .first();
            } catch (e) {}
        }

        if (!userId) {
            console.warn(`No se pudo resolver el userId para la suscripción ${targetPreapprovalId}. Webhook finalizado.`);
            return new Response('OK - Usuario no encontrado', { status: 200 });
        }

        // Determinar el Plan (pro vs basic)
        const PRO_PLAN_ID = env.PLAN_ID_PRO || 'f60b996e809848a482e25b74b1c44128'; 
        const BASIC_PLAN_ID = env.PLAN_ID_BASIC || '53c1ba35b5fd4219b09b5be4d9585262';

        let planType = dbUser?.plan_type || 'basic';

        if (queryPlanType === 'pro' || queryPlanType === 'basic') {
            planType = queryPlanType;
        } else if (subData?.preapproval_plan_id) {
            if (subData.preapproval_plan_id === PRO_PLAN_ID) {
                planType = 'pro';
            } else if (subData.preapproval_plan_id === BASIC_PLAN_ID) {
                planType = 'basic';
            }
        }

        const finalStatus = status || 'active';
        const nextPaymentDate = subData?.next_payment_date || null;

        console.log(`Actualizando base de datos para usuario ${userId} -> estado: '${finalStatus}', plan: '${planType}', preapprovalId: '${targetPreapprovalId}'`);
        
        const dbResult = await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ?, subscription_end_date = ?, plan_type = ? WHERE id = ?')
            .bind(finalStatus, targetPreapprovalId, nextPaymentDate, planType, userId)
            .run();
            
        console.log('Resultado actualización DB:', JSON.stringify(dbResult));

        return new Response('OK - Webhook procesado exitosamente', { status: 200 });
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

