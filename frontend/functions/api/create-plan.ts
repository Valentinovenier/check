// frontend/functions/api/create-plan.ts
export async function onRequestPost(context) {
    const { env } = context;
    
    // IMPORTANTE: Definir tu webhook URL aquí
    const webhookUrl = `${env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev'}/api/webhooks/mercadopago`;

    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: "Suscripción Mensual Premium",
            auto_recurring: { 
                frequency: 1, 
                frequency_type: "months", 
                transaction_amount: 15000, 
                currency_id: "ARS",
                // AÑADIMOS LA URL DEL WEBHOOK PARA QUE MP SEPA DÓNDE NOTIFICAR
                notification_url: webhookUrl 
            },
            back_url: `${env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev'}/app`
        }),
    });
    return response;
}
