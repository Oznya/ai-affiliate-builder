/**
 * API Auth Register - Inscription principale
 */
export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const body = await request.json();
    const { name, email, password } = body;
    
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ success: false, error: 'Tous les champs sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const userKey = `user_${email.toLowerCase()}`;
    const existing = await env.KV.get(userKey, { type: 'json' });
    
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'Un compte existe déjà avec cet email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Créer l'utilisateur
    const userData = {
      email: email.toLowerCase(),
      name: name,
      password: password,
      createdAt: new Date().toISOString()
    };
    
    await env.KV.put(userKey, JSON.stringify(userData));
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        email: userData.email,
        name: userData.name
      }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
