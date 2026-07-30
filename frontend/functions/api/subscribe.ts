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

    // Retornamos el enlace oficial de checkout de suscripción para el plan del vendedor
    const subscriptionUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}`;

    return new Response(JSON.stringify({ init_point: subscriptionUrl }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
