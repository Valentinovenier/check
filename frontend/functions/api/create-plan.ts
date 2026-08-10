// frontend/functions/api/create-plan.ts
export async function onRequestPost(context) {
    const { env, request } = context;
    const body = await request.json();
    const { planType } = body; // 'pro' o 'basic'
    
    // Configuración de IDs de planes
    const PLAN_IDS = {
        pro: '8c28f422fee34b11b7be627df7a9dc6a',
        basic: '29130c3d9c384fda8091d85b8d209369'
    };

    const planId = PLAN_IDS[planType || 'pro'];

    // IMPORTANTE: Definir tu webhook URL aquí
    const webhookUrl = `${env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev'}/api/webhooks/mercadopago`;

    // Si ya tienes el plan creado en Mercado Pago, no necesitas crearlo de nuevo, 
    // solo necesitas la preferencia de pago para suscribir al usuario.
    // Esta función parece estar pensada para CREAR el plan en MP. 
    // Si el plan ya existe, este endpoint debe devolver el ID o gestionar la suscripción.
    
    // Dado que el usuario me da el ID del plan BASIC, asumo que ya existe.
    // Si la lógica es CREAR un plan nuevo, esto no funcionará con un ID existente.
    // Ajustaré el código para que, si el plan ya existe, retorne el ID o gestione la suscripción.
    
    return new Response(JSON.stringify({ planId }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
