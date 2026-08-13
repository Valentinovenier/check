import jwt from 'jsonwebtoken';

export async function onRequest(context: any) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const url = new URL(request.url);
    const queryPlanType = url.searchParams.get('plan_type');
    
    try {
        const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
        const decoded = jwt.verify(token, secret) as { userId: string, username: string };
        
        // Bypass para el administrador
        if (decoded.username === 'vale07venier@gmail.com') {
            const adminToken = jwt.sign({ 
                userId: decoded.userId, 
                username: decoded.username,
                subscription_status: 'active',
                plan_type: 'pro'
            }, secret, { expiresIn: '7d' });

            return new Response(JSON.stringify({ status: 'active', plan_type: 'pro', token: adminToken }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Consultar el estado actual registrado en la base de datos
        const user = await env.DB.prepare('SELECT subscription_status, plan_type, mp_subscription_id FROM users WHERE id = ?')
            .bind(decoded.userId)
            .first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        let userStatus = user.subscription_status || 'pending';
        let userPlanType = queryPlanType || user.plan_type || 'basic';

        // Si la BD aún dice 'pending' pero tenemos mp_subscription_id y MP_ACCESS_TOKEN, consultar API de MP en vivo (Fallback por si el webhook tardó)
        if (userStatus !== 'active' && user.mp_subscription_id && env.MP_ACCESS_TOKEN) {
            try {
                const subRes = await fetch(`https://api.mercadopago.com/preapproval/${user.mp_subscription_id}`, {
                    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
                });
                if (subRes.ok) {
                    const subData: any = await subRes.json();
                    if (subData.status === 'authorized' || subData.status === 'active') {
                        userStatus = 'active';
                        await env.DB.prepare('UPDATE users SET subscription_status = ? WHERE id = ?')
                            .bind('active', decoded.userId)
                            .run();
                        console.log(`Verificación en vivo exitosa: Usuario ${decoded.userId} activado`);
                    }
                }
            } catch (liveErr) {
                console.error("Error en verificación en vivo con MP:", liveErr);
            }
        }

        // Generar un nuevo token JWT actualizado con el estado y plan actual
        const updatedToken = jwt.sign({ 
            userId: decoded.userId, 
            username: decoded.username,
            subscription_status: userStatus,
            plan_type: userPlanType
        }, secret, { expiresIn: '7d' });

        return new Response(JSON.stringify({ status: userStatus, plan_type: userPlanType, token: updatedToken }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Token inválido: ' + e.message }), { status: 401 });
    }
}

