import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    // Validación de entrada (correo universal)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'El correo y la contraseña son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!emailRegex.test(cleanUsername)) {
      return new Response(JSON.stringify({ error: 'Formato de correo electrónico inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let subscriptionStatus = user.subscription_status || 'pending';
    if (user.role !== 'admin' && subscriptionStatus === 'active' && user.subscription_end_date) {
      const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;
      const expirationLimit = new Date(new Date(user.subscription_end_date).getTime() + GRACE_PERIOD_MS);
      if (new Date() > expirationLimit) {
        subscriptionStatus = 'inactive';
        try {
          await env.DB.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?")
            .bind(user.id)
            .run();
        } catch (e) {
          console.error("Error actualizando status inactive en login:", e);
        }
      }
    }

    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    const token = jwt.sign({ 
      userId: user.id, 
      username: user.username,
      role: user.role || 'user',
      subscription_status: subscriptionStatus,
      plan_type: user.plan_type || 'basic'
    }, secret, { expiresIn: '7d' });

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
