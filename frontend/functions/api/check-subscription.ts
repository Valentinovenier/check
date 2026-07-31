import jwt from 'jsonwebtoken';

export async function onRequest(context: any) {
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
            const adminToken = jwt.sign({ 
                userId: decoded.userId, 
                username: decoded.username,
                subscription_status: 'active'
            }, secret, { expiresIn: '7d' });

            return new Response(JSON.stringify({ status: 'active', token: adminToken }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const url = new URL(request.url);
        console.log('DEBUG check-subscription URL:', request.url);
        
        const preapprovalId = url.searchParams.get('preapproval_id') || url.searchParams.get('payment_id') || url.searchParams.get('id') || url.searchParams.get('collection_id');
        const statusParam = url.searchParams.get('status') || url.searchParams.get('collection_status') || url.searchParams.get('preapproval_status');

        let userStatus = 'pending';

        // 1. Si el usuario vuelve desde Mercado Pago con parámetros en la URL indicando pago/preaprobación
        if (preapprovalId || statusParam === 'authorized' || statusParam === 'approved') {
            console.log('DEBUG check-subscription: Retorno con parámetros de MP detectados. Activando suscripción.');
            await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = ?, subscription_end_date = CURRENT_TIMESTAMP WHERE id = ?')
                .bind('active', preapprovalId || 'mp_confirmed', decoded.userId)
                .run();
            userStatus = 'active';
        } else {
            // 2. Consultar el estado actual registrado en la base de datos (actualizado por el Webhook)
            const user = await env.DB.prepare('SELECT subscription_status FROM users WHERE id = ?')
                .bind(decoded.userId)
                .first();

            if (!user) {
                return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
            }

            userStatus = user.subscription_status || 'pending';
        }

        // Generar un nuevo token JWT actualizado con el estado actual
        const updatedToken = jwt.sign({ 
            userId: decoded.userId, 
            username: decoded.username,
            subscription_status: userStatus
        }, secret, { expiresIn: '7d' });

        return new Response(JSON.stringify({ status: userStatus, token: updatedToken }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Token inválido: ' + e.message }), { status: 401 });
    }
}
