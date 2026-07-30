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

    // Creamos una preferencia de pago/suscripción en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [
                {
                    title: "Suscripción Premium ElectroSaaS",
                    description: "Acceso ilimitado a cálculos y carpeta técnica AEA 90364-7-770",
                    unit_price: 15000,
                    quantity: 1,
                    currency_id: "ARS"
                }
            ],
            external_reference: decoded.userId,
            back_urls: {
                success: `${appBaseUrl}/app`,
                pending: `${appBaseUrl}/`,
                failure: `${appBaseUrl}/`
            },
            auto_return: "approved"
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
