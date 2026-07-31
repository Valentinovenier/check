import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    await env.DB.prepare('INSERT INTO users (id, username, password_hash, subscription_status) VALUES (?, ?, ?, ?)')
      .bind(userId, username, passwordHash, 'pending')
      .run();

    const secret = env.SECRET_KEY || "super_secret_jwt_key_please_change_me";
    const token = jwt.sign({ 
      userId, 
      username,
      subscription_status: 'pending'
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

