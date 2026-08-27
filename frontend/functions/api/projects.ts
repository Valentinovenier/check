import jwt from 'jsonwebtoken';

async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Faltan credenciales de autorización');
  }
  
  const token = authHeader.split(' ')[1];
  const SECRET = env.SECRET_KEY || 'super_secret_jwt_key_please_change_me';
  let decoded: any;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (e: any) {
    throw new Error(`Token inválido o expirado: ${e.message}`);
  }

  // Validar estado de suscripción o rol admin en DB
  if (env.DB && decoded?.userId) {
    const dbUser = await env.DB.prepare('SELECT id, role, subscription_status, subscription_end_date FROM users WHERE id = ?')
      .bind(decoded.userId)
      .first();

    if (!dbUser) {
      throw new Error('Usuario no encontrado en la base de datos');
    }

    if (dbUser.role !== 'admin') {
      const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 días de gracia
      let isExpiredPastGrace = false;

      if (dbUser.subscription_end_date) {
        const expirationLimit = new Date(new Date(dbUser.subscription_end_date).getTime() + GRACE_PERIOD_MS);
        if (new Date() > expirationLimit) {
          isExpiredPastGrace = true;
        }
      }

      if (dbUser.subscription_status !== 'active' || isExpiredPastGrace) {
        // Si estaba como activo pero superó el período de gracia sin pagar, cancelar la suscripción en la BD
        if (isExpiredPastGrace && dbUser.subscription_status === 'active') {
          try {
            await env.DB.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?")
              .bind(decoded.userId)
              .run();
          } catch (e) {
            console.error("Error cancelando suscripción por vencimiento en projects:", e);
          }
        }
        const error: any = new Error('Tu suscripción ha vencido y el período de gracia ha finalizado. Por favor, renueva tu suscripción para continuar.');
        error.statusCode = 403;
        throw error;
      }
    }
  }

  return decoded;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const { results } = await env.DB.prepare('SELECT * FROM projects WHERE user_id = ?')
      .bind(user.userId)
      .all();
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    const status = e.statusCode || (e.message.includes('autorización') || e.message.includes('Token') ? 401 : 500);
    return new Response(JSON.stringify({ error: e.message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const { id, name, data } = await request.json();

    const userExists = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
      .bind(user.userId)
      .first();

    if (!userExists) {
      return new Response(JSON.stringify({ error: `El usuario con ID ${user.userId} no existe en la base de datos.` }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    await env.DB.prepare('INSERT INTO projects (id, user_id, name, data) VALUES (?, ?, ?, ?)')
      .bind(id, user.userId, name, JSON.stringify(data))
      .run();

    return new Response(JSON.stringify({ success: true }), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e: any) {
    const status = e.statusCode || (e.message.includes('autorización') || e.message.includes('Token') ? 401 : 500);
    return new Response(JSON.stringify({ error: e.message }), { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('id');

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Falta el ID del proyecto' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const result = await env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
      .bind(projectId, user.userId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Proyecto no encontrado o no autorizado' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e: any) {
    const status = e.statusCode || (e.message.includes('autorización') || e.message.includes('Token') ? 401 : 500);
    return new Response(JSON.stringify({ error: `Error en Servidor: ${e.message}` }), { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const { id, name, data } = await request.json();

    const result = await env.DB.prepare('UPDATE projects SET name = ?, data = ? WHERE id = ? AND user_id = ?')
      .bind(name, JSON.stringify(data), id, user.userId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Proyecto no encontrado o no autorizado' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e: any) {
    const status = e.statusCode || (e.message.includes('autorización') || e.message.includes('Token') ? 401 : 500);
    return new Response(JSON.stringify({ error: `Error en Servidor: ${e.message}` }), { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

