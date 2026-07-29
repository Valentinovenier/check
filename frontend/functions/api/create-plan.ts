// frontend/functions/api/create-plan.ts
export async function onRequestPost(context) {
    const { env } = context;
    // TODO: CONFIGURACIÓN EXTERNA - Verificar autorización (admin only)
    
    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: "Suscripción Mensual Premium",
            auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 15000, currency_id: "ARS" },
            back_url: `${env.APP_BASE_URL}/app`
        }),
    });
    return response;
}
