import jwt from 'jsonwebtoken';

export async function onRequest(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
        const decoded = jwt.verify(token, secret) as { userId: string, username: string };
        
        // Bypass para el administrador
        if (decoded.username === 'vale07venier@gmail.com') {
             return new Response(JSON.stringify({ status: 'active' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Inspeccionar si MercadoPago redirigió al usuario con parámetros de confirmación en la URL
        const url = new URL(request.url);
        const preapprovalId = url.searchParams.get('preapproval_id') || url.searchParams.get('payment_id') || url.searchParams.get('id') || url.searchParams.get('collection_id');
        const statusParam = url.searchParams.get('status') || url.searchParams.get('collection_status') || url.searchParams.get('preapproval_status');

        // Si retorna de MercadoPago con confirmación de pago/suscripción
        if (preapprovalId || statusParam === 'authorized' || statusParam === 'approved') {
            await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ?, subscription_end_date = CURRENT_TIMESTAMP WHERE id = ?')
                .bind('active', preapprovalId || 'mp_confirmed', decoded.userId)
                .run();

            return new Response(JSON.stringify({ status: 'active' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const user = await env.DB.prepare('SELECT subscription_status FROM users WHERE id = ?')
            .bind(decoded.userId)
            .first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        return new Response(JSON.stringify({ status: user.subscription_status || 'pending' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Token inválido: ' + e.message }), { status: 401 });
    }
}

