// frontend/functions/api/update-plan.ts
export async function onRequest(context) {
    const { env } = context;
    const planId = "f60b996e809848a482e25b74b1c44128";
    const webhookUrl = `${env.APP_BASE_URL || 'https://saasingenieriaelectrica200417.pages.dev'}/api/webhooks/mercadopago`;

    try {
        // 1. Obtenemos el plan actual
        const getRes = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
            headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
        });
        
        if (!getRes.ok) {
            return new Response(JSON.stringify({ error: 'Error obteniendo plan', details: await getRes.text() }), { status: getRes.status });
        }
        
        const planData = await getRes.json();

        // 2. Actualizamos la URL de notificación
        planData.auto_recurring.notification_url = webhookUrl;

        // 3. Enviamos la actualización
        const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData),
        });
        
        const result = await response.json();
        
        if (response.ok) {
            return new Response(JSON.stringify({ success: true, message: 'Plan actualizado correctamente', data: result }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: 'Error al actualizar', details: result }), { status: response.status });
        }
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Excepción', message: e.message }), { status: 500 });
    }
}