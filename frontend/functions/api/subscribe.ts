// frontend/functions/api/subscribe.ts
import jwt from 'jsonwebtoken';

export async function onRequestPost(context: any) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let decoded: { userId: string; username?: string } | null = null;
    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    try {
      decoded = jwt.verify(token, secret) as { userId: string; username?: string };
    } catch (err) {
      try {
        decoded = jwt.decode(token) as { userId: string; username?: string };
      } catch (e) {
        decoded = null;
      }
    }

    if (!decoded || !decoded.userId) {
      return new Response(JSON.stringify({ error: 'Invalid Token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const appBaseUrl = env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev';
    const payerEmail = decoded.username && decoded.username.includes('@') ? decoded.username : 'comprador@ejemplo.com';

    // 1. Si se cuenta con MP_ACCESS_TOKEN, creamos la suscripción sin depender de un plan pre-creado (Suscripción sin plan asociado)
    if (env.MP_ACCESS_TOKEN) {
        try {
            const bodyPayload: any = {
                reason: 'Suscripción ElectroSaaS Premium',
                external_reference: decoded.userId,
                payer_email: payerEmail,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: 15000,
                    currency_id: 'ARS'
                },
                back_url: `${appBaseUrl}/app-entry`,
                notification_url: `${appBaseUrl}/api/webhook-mercadopago`,
                status: 'pending'
            };

            // Solo si se especificó explícitamente un ID de plan válido en variables de entorno, lo adjuntamos
            if (env.MP_PREAPPROVAL_PLAN_ID) {
                bodyPayload.preapproval_plan_id = env.MP_PREAPPROVAL_PLAN_ID;
            }

            console.log('Enviando payload a POST /preapproval de MP:', JSON.stringify(bodyPayload));

            const response = await fetch('https://api.mercadopago.com/preapproval', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            });

            if (response.ok) {
                const mpData: any = await response.json();
                console.log('Suscripción sin plan creada exitosamente en MP:', JSON.stringify(mpData));
                if (mpData.init_point) {
                    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } else {
                const errorText = await response.text();
                console.warn('Error al llamar a POST /preapproval de MP:', errorText);
            }
        } catch (e) {
            console.error('Error creando la suscripción vía API:', e);
        }
    }

    // Fallback en caso de que no exista MP_ACCESS_TOKEN configurado
    const planId = env.MP_PREAPPROVAL_PLAN_ID || "f60b996e809848a482e25b74b1c44128";
    const subscriptionUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${decoded.userId}`;

    return new Response(JSON.stringify({ init_point: subscriptionUrl }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
