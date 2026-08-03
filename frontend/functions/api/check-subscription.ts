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

        // Consultar el estado actual registrado en la base de datos (actualizado únicamente por el Webhook)
        const user = await env.DB.prepare('SELECT subscription_status FROM users WHERE id = ?')
            .bind(decoded.userId)
            .first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        const userStatus = user.subscription_status || 'pending';

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
