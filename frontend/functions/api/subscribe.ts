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

    // Para redirigir al checkout del plan de suscripción creado por el vendedor:
    // Consultamos los datos del plan en Mercado Pago
    const planRes = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    const planData = await planRes.json();

    if (!planRes.ok) {
        console.error('Mercado Pago Plan Fetch Error:', planData);
        // Si no se pudo obtener el plan, intentamos crear una preferencia de checkout estándar
        const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{ title: "Suscripción Premium ElectroSaaS", unit_price: 15000, quantity: 1, currency_id: "ARS" }],
                external_reference: decoded.userId,
                back_urls: { success: `${appBaseUrl}/app`, failure: `${appBaseUrl}/` },
                auto_return: "approved"
            }),
        });
        const prefData = await prefRes.json();
        if (!prefRes.ok) {
            return new Response(JSON.stringify({ error: 'Mercado Pago Error', details: prefData }), { status: prefRes.status, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ init_point: prefData.init_point }), { headers: { 'Content-Type': 'application/json' } });
    }

    const initPoint = planData.init_point || planData.sandbox_init_point;
    return new Response(JSON.stringify({ init_point: initPoint }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
