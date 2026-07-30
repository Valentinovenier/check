// frontend/functions/api/subscribe.ts
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response('Unauthorized', { status: 401 });

    const decoded = jwt.verify(token, env.SECRET_KEY) as { userId: string };

    const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preapproval_plan_id: "8c28f422fee34b11b7be627df7a9dc6a", // Plan ID real
            external_reference: decoded.userId, // Vinculamos al usuario
            back_url: `${env.APP_BASE_URL}/app`,
            reason: "Suscripción ElectroSaaS"
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
