// frontend/functions/api/subscribe.ts
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response('Unauthorized', { status: 401 });

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.SECRET_KEY) as { userId: string };
    } catch (err) {
      return new Response('Invalid Token', { status: 401 });
    }

    const appBaseUrl = env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev';

    // Si existe MP_PREAPPROVAL_PLAN_ID usamos suscripción recurrente automática.
    // De lo contrario usamos Checkout con cobro mensual recurrente para Mercado Pago.
    const planId = env.MP_PREAPPROVAL_PLAN_ID || "8c28f422fee34b11b7be627df7a9dc6a";

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

    return new Response(JSON.stringify({ init_point: data.init_point }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
