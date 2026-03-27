/**
 * API Auth Login - Connexion principale
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
    const { email, password } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Email et mot de passe requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Vérifier l'utilisateur dans KV
    const userKey = `user_${email.toLowerCase()}`;
    const userData = await env.KV.get(userKey, { type: 'json' });
    
    if (!userData) {
      return new Response(JSON.stringify({ success: false, error: 'Email non trouvé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Vérifier le mot de passe
    if (userData.password !== password) {
      return new Response(JSON.stringify({ success: false, error: 'Mot de passe incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Mettre à jour la dernière connexion
    userData.lastLogin = new Date().toISOString();
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
