import jwt from 'jsonwebtoken';

export async function onRequest(context: any) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const url = new URL(request.url);

    // Extraer parámetros pasados en la URL (por ejemplo desde el back_url de MercadoPago)
    const queryUserId = url.searchParams.get('user_id');
    const queryPlanType = url.searchParams.get('plan_type');
    const queryPreapprovalId = url.searchParams.get('preapproval_id') || url.searchParams.get('id') || url.searchParams.get('data.id');
    const queryPaymentId = url.searchParams.get('payment_id') || url.searchParams.get('collection_id');
    const queryStatus = url.searchParams.get('status') || url.searchParams.get('collection_status');

    let decoded: { userId: string; username: string; role?: string } | null = null;
    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";

    try {
        decoded = jwt.verify(token, secret) as { userId: string; username: string; role?: string };
    } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { status: 401 });
    }

    if (!decoded || !decoded.userId) {
        return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { status: 401 });
    }

    if (!env.DB) {
        return new Response(JSON.stringify({ error: 'Base de datos no disponible' }), { status: 500 });
    }

    try {
        const targetUserId = decoded.userId;
        const user = await env.DB.prepare('SELECT id, username, role, subscription_status, plan_type, mp_subscription_id, subscription_end_date FROM users WHERE id = ?')
            .bind(targetUserId)
            .first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        // =========================================================
        // FEATURE FLAG: FREE_ACCESS_MODE
        // Si está activo, retornar active/pro directamente sin
        // consultar Mercado Pago. Toda la lógica de MP permanece
        // intacta debajo de este bloque.
        // Para reactivar el cobro: setear FREE_ACCESS_MODE=false.
        // =========================================================
        const freeAccessMode = env.FREE_ACCESS_MODE === 'true' || env.FREE_ACCESS_MODE === true;
        if (freeAccessMode) {
            const freeToken = jwt.sign({ 
                userId: user.id, 
                username: user.username,
                role: user.role || 'user',
                subscription_status: 'active',
                plan_type: 'pro'
            }, secret, { expiresIn: '7d' });

            return new Response(JSON.stringify({ status: 'active', plan_type: 'pro', token: freeToken }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Bypass exclusivo por rol de Administrador en Base de Datos
        if (user.role === 'admin') {
            const adminToken = jwt.sign({ 
                userId: user.id, 
                username: user.username,
                role: 'admin',
                subscription_status: 'active',
                plan_type: 'pro'
            }, secret, { expiresIn: '7d' });

            return new Response(JSON.stringify({ status: 'active', plan_type: 'pro', role: 'admin', token: adminToken }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let userStatus = user.subscription_status || 'pending';
        let userPlanType = user.plan_type || queryPlanType || 'basic';
        const targetPreapprovalId = queryPreapprovalId || user.mp_subscription_id;
        let nextPaymentDate: string | null = user.subscription_end_date || null;

        const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 días de gracia
        let isExpiredPastGrace = false;
        if (nextPaymentDate) {
            const expirationLimit = new Date(new Date(nextPaymentDate).getTime() + GRACE_PERIOD_MS);
            if (new Date() > expirationLimit) {
                isExpiredPastGrace = true;
            }
        }

        let isVerifiedActive = (userStatus === 'active' && !isExpiredPastGrace);

        // =========================================================
        // PROTECCIÓN: Usuarios del período gratuito en modo de pago
        // Si FREE_ACCESS_MODE está desactivado y el usuario tiene
        // plan_type='free' (registrado durante el período gratuito)
        // sin una suscripción real de MP, se lo fuerza a suscribirse.
        // =========================================================
        const isFreePhaseUser = userPlanType === 'free';
        const hasRealMpSubscription = !!user.mp_subscription_id;
        if (isFreePhaseUser && !hasRealMpSubscription) {
            // Este usuario del período gratuito no tiene suscripción de pago activa.
            // Si FREE_ACCESS_MODE está activo, lo deja entrar (el bypass de arriba
            // ya retornó). Si está desactivado, llega hasta aquí y debe suscribirse.
            isVerifiedActive = false;
            userStatus = 'pending';
            console.log(`Usuario ${targetUserId} del período gratuito (plan_type='free') sin suscripción real. Requiere suscripción.`);
        }

        // 1. Si no está verificado como activo o su período de gracia ya venció, consultar Mercado Pago en vivo para chequear renovación
        if (!isVerifiedActive && targetPreapprovalId && env.MP_ACCESS_TOKEN) {
            try {
                console.log(`Verificando suscripción en vivo en MP para preapprovalId: ${targetPreapprovalId}`);
                const subRes = await fetch(`https://api.mercadopago.com/preapproval/${targetPreapprovalId}`, {
                    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
                });
                if (subRes.ok) {
                    const subData: any = await subRes.json();
                    if (subData.status === 'authorized' || subData.status === 'active') {
                        const mpNextDate = subData.next_payment_date;
                        if (mpNextDate) {
                            const newExpLimit = new Date(new Date(mpNextDate).getTime() + GRACE_PERIOD_MS);
                            if (new Date() <= newExpLimit) {
                                isVerifiedActive = true;
                                isExpiredPastGrace = false;
                                nextPaymentDate = mpNextDate;
                            }
                        } else {
                            isVerifiedActive = true;
                            isExpiredPastGrace = false;
                        }

                        const PRO_PLAN_ID = env.PLAN_ID_PRO || 'f60b996e809848a482e25b74b1c44128';
                        const BASIC_PLAN_ID = env.PLAN_ID_BASIC || '53c1ba35b5fd4219b09b5be4d9585262';
                        if (subData.preapproval_plan_id === PRO_PLAN_ID) {
                            userPlanType = 'pro';
                        } else if (subData.preapproval_plan_id === BASIC_PLAN_ID) {
                            userPlanType = 'basic';
                        }
                    }
                }
            } catch (liveErr) {
                console.error("Error consultando API de suscripción MP:", liveErr);
            }
        }

        // 2. Verificar en vivo consultando la API de Pagos si vino un payment_id
        if (!isVerifiedActive && queryPaymentId && env.MP_ACCESS_TOKEN) {
            try {
                console.log(`Verificando pago en vivo en MP para paymentId: ${queryPaymentId}`);
                const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${queryPaymentId}`, {
                    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
                });
                if (payRes.ok) {
                    const payData: any = await payRes.json();
                    if (payData.status === 'approved') {
                        isVerifiedActive = true;
                        isExpiredPastGrace = false;
                    }
                }
            } catch (payErr) {
                console.error("Error consultando API de pago MP:", payErr);
            }
        }

        // Si se confirma que está activo pero no hay fecha de vencimiento aún, calcular +30 días
        if (isVerifiedActive && !nextPaymentDate) {
            const calculatedDate = new Date();
            calculatedDate.setDate(calculatedDate.getDate() + 30);
            nextPaymentDate = calculatedDate.toISOString();
        }

        // Actualizar la base de datos según el estado resultante
        if (isVerifiedActive) {
            userStatus = 'active';
            try {
                await env.DB.prepare('UPDATE users SET subscription_status = ?, mp_subscription_id = COALESCE(?, mp_subscription_id), plan_type = COALESCE(?, plan_type), subscription_end_date = COALESCE(?, subscription_end_date) WHERE id = ?')
                    .bind('active', targetPreapprovalId || null, userPlanType, nextPaymentDate, targetUserId)
                    .run();
                console.log(`Base de datos actualizada exitosamente a 'active' para usuario ${targetUserId} con vencimiento ${nextPaymentDate}`);
            } catch (dbErr) {
                console.error("Error actualizando DB en check-subscription:", dbErr);
            }
        } else if (isExpiredPastGrace || userStatus === 'inactive') {
            // Cancelar suscripción si venció el período de gracia sin renovación
            userStatus = 'inactive';
            try {
                await env.DB.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?")
                    .bind(targetUserId)
                    .run();
                console.log(`Suscripción vencida pasada el período de gracia para usuario ${targetUserId}. Estado actualizado a 'inactive'.`);
            } catch (dbErr) {
                console.error("Error actualizando a inactive en check-subscription:", dbErr);
            }
        }

        // Generar un nuevo token JWT actualizado con el estado y plan verificado
        const updatedToken = jwt.sign({ 
            userId: targetUserId, 
            username: user.username,
            role: user.role || 'user',
            subscription_status: userStatus,
            plan_type: userPlanType
        }, secret, { expiresIn: '7d' });

        return new Response(JSON.stringify({ 
            status: userStatus, 
            plan_type: userPlanType, 
            subscription_end_date: nextPaymentDate,
            token: updatedToken 
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e: any) {
        console.error('Error procesando check-subscription:', e);
        return new Response(JSON.stringify({ error: 'Error interno: ' + e.message }), { status: 500 });
    }
}


