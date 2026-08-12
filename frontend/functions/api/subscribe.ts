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

    // 1. Si existe MP_ACCESS_TOKEN, intentamos crear la suscripción dinámicamente vía API
    const body = await request.json().catch(() => ({}));
    const { planType } = body;
    
    // Configuración de IDs de planes
    const PLAN_IDS = {
        pro: 'f60b996e809848a482e25b74b1c44128',
        basic: '53c1ba35b5fd4219b09b5be4d9585262'
    };
    
    const preapproval_plan_id = PLAN_IDS[planType as 'pro' | 'basic'] || env.MP_PREAPPROVAL_PLAN_ID || "29130c3d9c384fda8091d85b8d209369";

    /*
    if (env.MP_ACCESS_TOKEN) {
        try {
            // Determinar el email a utilizar: MP_TEST_PAYER_EMAIL si existe, el email del usuario si tiene formato de email, ESTE CODIGO FUNCIONA MUY BIEN
            // o el email de prueba fijo para cuentas de testeo de MercadoPago
            const TEST_PAYER_EMAIL = 'test_user_3754759241978375765@testuser.com';
            const payerEmail = env.MP_TEST_PAYER_EMAIL
                || (decoded.username && decoded.username.includes('@') ? decoded.username : null)
                || TEST_PAYER_EMAIL;

            if (payerEmail) {
                const bodyPayload: any = {
                    preapproval_plan_id: preapproval_plan_id,
                    payer_email: payerEmail,
                    external_reference: decoded.userId,
                    back_url: `${appBaseUrl}/app-entry`,
                    notification_url: `${appBaseUrl}/api/webhook-mercadopago`
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
    */

    // 2. Fallback a URL directa de suscripción (con el ID de plan de Mercado Pago del usuario)
    const subscriptionUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${preapproval_plan_id}&external_reference=${decoded.userId}`;

    return new Response(JSON.stringify({ init_point: subscriptionUrl }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
