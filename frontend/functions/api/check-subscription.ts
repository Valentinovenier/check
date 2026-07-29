import jwt from 'jsonwebtoken';

export async function onRequest(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, env.SECRET_KEY) as { userId: string, username: string };
        
        // Bypass para el administrador
        if (decoded.username === 'vale07venier@gmail.com') {
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

        return new Response(JSON.stringify({ status: user.subscription_status }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
    }
}
