import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password, planType } = await request.json();

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

    if (password.length <= 7) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // =========================================================
    // FEATURE FLAG: FREE_ACCESS_MODE
    // Cuando FREE_ACCESS_MODE está activo, todos los usuarios
    // se registran directamente como 'active'/'free' sin pago.
    // 'free' como plan_type los identifica como usuarios del
    // período gratuito: cuando se desactive el flag, el backend
    // los redirigirá a elegir un plan de suscripción.
    // Para reactivar el cobro, setear FREE_ACCESS_MODE=false.
    // =========================================================
    const freeAccessMode = env.FREE_ACCESS_MODE === 'true' || env.FREE_ACCESS_MODE === true;
    const targetPlanType = freeAccessMode ? 'free' : ((planType === 'basic' || planType === 'pro') ? planType : 'basic');
    const initialStatus = freeAccessMode ? 'active' : 'pending';

    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'El usuario ya existe con ese correo electrónico' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await env.DB.prepare('INSERT INTO users (id, username, password_hash, role, subscription_status, plan_type) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, cleanUsername, passwordHash, 'user', initialStatus, targetPlanType)
      .run();

    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    const token = jwt.sign({ 
      userId, 
      username: cleanUsername,
      role: 'user',
      subscription_status: initialStatus,
      plan_type: targetPlanType
    }, secret, { expiresIn: freeAccessMode ? '7d' : '1h' });

    return new Response(JSON.stringify({ message: 'User registered successfully', token }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

