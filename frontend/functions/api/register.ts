import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password, planType } = await request.json();

    // Validación de entrada
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!emailRegex.test(username)) {
      return new Response(JSON.stringify({ error: 'Invalid email format (must be a gmail account)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (password.length <= 7) {
      return new Response(JSON.stringify({ error: 'Password must be longer than 7 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetPlanType = (planType === 'basic' || planType === 'pro') ? planType : 'pro';

    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    await env.DB.prepare('INSERT INTO users (id, username, password_hash, subscription_status, plan_type) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, username, passwordHash, 'pending', targetPlanType)
      .run();

    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    const token = jwt.sign({ 
      userId, 
      username,
      subscription_status: 'pending',
      plan_type: targetPlanType
    }, secret, { expiresIn: '1h' });

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

