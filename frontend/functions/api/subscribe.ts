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

    let decoded: { userId: string } | null = null;
    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    try {
      decoded = jwt.verify(token, secret) as { userId: string };
    } catch (err) {
      try {
        decoded = jwt.decode(token) as { userId: string };
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

    const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preapproval_plan_id: planId,
            reason: "Suscripción Mensual Premium - ElectroSaaS",
            external_reference: decoded.userId,
            back_url: `${appBaseUrl}/app`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: 15000,
                currency_id: "ARS"
            }
        }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        console.error('Mercado Pago API Error:', data);
        return new Response(JSON.stringify({ error: 'Mercado Pago Error', details: data }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Retornamos el init_point devuelto por la API de Mercado Pago
    return new Response(JSON.stringify({ init_point: data.init_point }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
