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
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!decoded || !decoded.userId) {
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const appBaseUrl = env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev';

    let bodyReq: any = {};
    try {
        bodyReq = await request.json();
    } catch (e) {
        bodyReq = {};
    }

    const planType: 'basic' | 'pro' = (bodyReq.planType === 'basic' || bodyReq.planType === 'pro') ? bodyReq.planType : 'pro';

    const PLAN_ID_PRO = env.PLAN_ID_PRO || 'f60b996e809848a482e25b74b1c44128';
    const PLAN_ID_BASIC = env.PLAN_ID_BASIC || '53c1ba35b5fd4219b09b5be4d9585262';
    const targetPlanId = planType === 'pro' ? PLAN_ID_PRO : PLAN_ID_BASIC;

    const PLAN_PRICE_PRO = Number(env.PLAN_PRICE_PRO) || 9000;
    const PLAN_PRICE_BASIC = Number(env.PLAN_PRICE_BASIC) || 4500;
    const planAmount = planType === 'pro' ? PLAN_PRICE_PRO : PLAN_PRICE_BASIC;
    const planReason = planType === 'pro' ? 'Suscripción ElectroCheck Pro' : 'Suscripción ElectroCheck Basic';

    // 1. Si existe MP_ACCESS_TOKEN, intentamos crear la suscripción dinámicamente vía API a
    if (env.MP_ACCESS_TOKEN) {
        try {
            const TEST_PAYER_EMAIL = 'test_user_3754759241978375765@testuser.com';
            const payerEmail = env.MP_TEST_PAYER_EMAIL
                || (decoded.username && decoded.username.includes('@') ? decoded.username : null)
                || TEST_PAYER_EMAIL;

            if (payerEmail) {
                const backUrl = `${appBaseUrl}/app-entry?user_id=${decoded.userId}&plan_type=${planType}`;
                const notificationUrl = `${appBaseUrl}/api/webhooks/mercadopago?user_id=${decoded.userId}&plan_type=${planType}`;

                // Se construye el preapproval dinámico sin preapproval_plan_id para generar la URL init_point de Hosted Checkout
                const bodyPayload = {
                    reason: planReason,
                    external_reference: decoded.userId,
                    payer_email: payerEmail,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: 'months',
                        transaction_amount: planAmount,
                        currency_id: 'ARS'
                    },
                    back_url: backUrl,
                    notification_url: notificationUrl,
                    status: 'pending'
                };

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
                    console.log('Suscripción creada exitosamente en MP:', JSON.stringify(mpData));

                    // Estrategia 1: Pre-persistencia del preapproval_id en la base de datos
                    if (mpData.id && env.DB) {
                        try {
                            await env.DB.prepare('UPDATE users SET mp_subscription_id = ?, plan_type = ? WHERE id = ?')
                                .bind(mpData.id, planType, decoded.userId)
                                .run();
                            console.log(`Pre-persistencia exitosa para usuario ${decoded.userId} con preapproval_id ${mpData.id} y plan ${planType}`);
                        } catch (dbErr) {
                            console.error('Error pre-persistiendo preapproval_id:', dbErr);
                        }
                    }

                    if (mpData.init_point) {
                        return new Response(JSON.stringify({ init_point: mpData.init_point }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    const errorText = await response.text();
                    console.warn('Error al llamar a POST /preapproval de MP:', errorText);
                }
            }
        } catch (e) {
            console.error('Error al invocar API de Mercado Pago:', e);
        }
    }

    // 2. Fallback a URL directa de suscripción (con el ID de plan de Mercado Pago del usuario)
    if (env.DB) {
        try {
            await env.DB.prepare('UPDATE users SET plan_type = ? WHERE id = ?')
                .bind(planType, decoded.userId)
                .run();
        } catch (e) {
            console.error('Error pre-guardando planType en fallback:', e);
        }
    }

    const subscriptionUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${targetPlanId}&external_reference=${decoded.userId}`;

    return new Response(JSON.stringify({ init_point: subscriptionUrl }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
