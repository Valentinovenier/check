import jwt from 'jsonwebtoken';

async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Faltan credenciales de autorización');
  }
  
  const token = authHeader.split(' ')[1];
  const SECRET = env.SECRET_KEY || 'super_secret_jwt_key_please_change_me';
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (e: any) {
    throw new Error(`Token inválido o expirado: ${e.message}`);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: 'Falta el ID de la protección' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        });
    }

    // 1. Verificar propiedad y eliminar capacidades asociadas
    const proteccion = await env.DB.prepare('SELECT * FROM protecciones WHERE id = ? AND user_id = ?').bind(id, user.userId).first();
    if (!proteccion) {
        return new Response(JSON.stringify({ error: 'No autorizado o no encontrado' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    await env.DB.prepare('DELETE FROM capacidades_corte WHERE proteccion_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM protecciones WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error al eliminar la protección', details: e.message, stack: e.stack }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    
    // 1. Obtener todas las protecciones del usuario
    const { results: protecciones } = await env.DB.prepare('SELECT * FROM protecciones WHERE user_id = ?').bind(user.userId).all();
    
    if (protecciones.length === 0) {
      return new Response(JSON.stringify([]), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      });
    }

    const ids = protecciones.map(p => p.id);
    
    // 2. Obtener todas las capacidades para esas protecciones
    // Usamos IN para obtener todas de una sola vez
    const placeholders = ids.map(() => '?').join(',');
    const { results: capacidades } = await env.DB.prepare(`SELECT * FROM capacidades_corte WHERE proteccion_id IN (${placeholders})`)
      .bind(...ids)
      .all();

    // 3. Unir datos
    const resultado = protecciones.map(p => ({
      ...p,
      specs_tecnicas: JSON.parse(p.specs_tecnicas as string),
      capacidades: capacidades.filter(c => c.proteccion_id === p.id)
    }));

    return new Response(JSON.stringify(resultado), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (e: any) {
    const status = e.message.includes('autorización') || e.message.includes('Token') ? 401 : 500;
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { 
      status, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const body = await request.json() as any;
    const { marca_id, modelo, tipo_proteccion, in_amp, curva_disparo, polos, specs_tecnicas, capacidades } = body;

    // 1. Insertar la protección incluyendo user_id
    const proteccionResult = await env.DB.prepare(
      'INSERT INTO protecciones (marca_id, modelo, tipo_proteccion, in_amp, curva_disparo, polos, specs_tecnicas, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(marca_id || 1, modelo, tipo_proteccion, in_amp, curva_disparo, polos, JSON.stringify(specs_tecnicas || {}), user.userId)
    .run();

    const proteccion_id = proteccionResult.meta.last_row_id;

    // 2. Insertar capacidades en batch
    if (capacidades && Array.isArray(capacidades) && capacidades.length > 0) {
      const capStatements = capacidades.map(cap => 
        env.DB.prepare(
          'INSERT INTO capacidades_corte (proteccion_id, tension_v, icn_ka, clase_limitacion) VALUES (?, ?, ?, ?)'
        )
        .bind(proteccion_id, cap.tension_v, cap.icn_ka, cap.clase_limitacion)
      );
      await env.DB.batch(capStatements);
    }

    return new Response(JSON.stringify({ success: true, proteccion_id }), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error al crear la protección', details: e.message, stack: e.stack }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const user = await verifyAuth(request, env);
    const body = await request.json() as any;
    const { id, marca_id, modelo, tipo_proteccion, in_amp, curva_disparo, polos, specs_tecnicas, capacidades } = body;

    // Verificar propiedad
    const existing = await env.DB.prepare('SELECT * FROM protecciones WHERE id = ? AND user_id = ?').bind(id, user.userId).first();
    if (!existing) {
        return new Response(JSON.stringify({ error: 'No autorizado o no encontrado' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 1. Actualizar la protección
    await env.DB.prepare(
      'UPDATE protecciones SET marca_id = ?, modelo = ?, tipo_proteccion = ?, in_amp = ?, curva_disparo = ?, polos = ?, specs_tecnicas = ? WHERE id = ? AND user_id = ?'
    )
    .bind(marca_id, modelo, tipo_proteccion, in_amp, curva_disparo, polos, JSON.stringify(specs_tecnicas || {}), id, user.userId)
    .run();

    // 2. Eliminar capacidades antiguas y insertar las nuevas (Batch)
    const statements = [];
    statements.push(env.DB.prepare('DELETE FROM capacidades_corte WHERE proteccion_id = ?').bind(id));
    
    if (capacidades && Array.isArray(capacidades)) {
      capacidades.forEach(cap => {
        statements.push(
          env.DB.prepare(
            'INSERT INTO capacidades_corte (proteccion_id, tension_v, icn_ka, clase_limitacion) VALUES (?, ?, ?, ?)'
          )
          .bind(id, cap.tension_v, cap.icn_ka, cap.clase_limitacion)
        );
      });
    }
    
    await env.DB.batch(statements);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error al actualizar la protección', details: e.message, stack: e.stack }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}

