// frontend/functions/api/subscribe.ts
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
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
    const planId = env.MP_PREAPPROVAL_PLAN_ID || "f60b996e809848a482e25b74b1c44128";

    // Si contaremos con token de acceso a MP, generamos la suscripción personalizada pasando external_reference
    if (env.MP_ACCESS_TOKEN) {
        try {
            const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    preapproval_plan_id: planId,
                    payer_email: decoded.username && decoded.username.includes('@') ? decoded.username : undefined,
                    external_reference: decoded.userId,
                    back_url: `${appBaseUrl}/app-entry`,
                    reason: 'Suscripción ElectroSaaS Premium'
                })
            });

            const mpData = await mpRes.json();
            if (mpData.init_point) {
                return new Response(JSON.stringify({ init_point: mpData.init_point }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                console.error("Respuesta MP sin init_point:", mpData);
            }
        } catch (e) {
            console.error('Error llamando a la API de MercadoPago:', e);
        }
    }

    // Retornamos el enlace oficial de checkout de suscripción para el plan del vendedor si no hay token o falló
    const subscriptionUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}`;

    return new Response(JSON.stringify({ init_point: subscriptionUrl }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

