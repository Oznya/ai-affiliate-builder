/**
 * API Admin Users - Gestion des clients IA
 */
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  // CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  try {
    if (method === 'GET') {
      return await getUsers(env);
    } else if (method === 'POST') {
      const body = await request.json();
      return await handleUserAction(env, body);
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function getUsers(env) {
  const users = [];
  const stats = {
    total: 0,
    active: 0,
    totalSites: 0,
    newThisMonth: 0
  };
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // Récupérer tous les sites pour extraire les utilisateurs
    const sitesList = await env.KV.list({ prefix: 'site_' });
    
    const usersMap = new Map();
    
    for (const key of sitesList.keys) {
      const siteData = await env.KV.get(key.name, { type: 'json' });
      if (siteData && siteData.userEmail) {
        const email = siteData.userEmail;
        
        if (!usersMap.has(email)) {
          usersMap.set(email, {
            email: email,
            name: siteData.userName || email.split('@')[0],
            createdAt: siteData.createdAt,
            sites: [],
            sitesCount: 0,
            notes: ''
          });
        }
        
        const user = usersMap.get(email);
        user.sites.push({
          productName: siteData.productName || siteData.name,
          createdAt: siteData.createdAt
        });
        user.sitesCount++;
        stats.totalSites++;
        
        // Utiliser la date la plus ancienne comme date d'inscription
        if (siteData.createdAt) {
          const siteDate = new Date(siteData.createdAt);
          if (!user.createdAt || siteDate < new Date(user.createdAt)) {
            user.createdAt = siteData.createdAt;
          }
        }
      }
    }
    
    // Convertir en tableau
    for (const user of usersMap.values()) {
      users.push(user);
      stats.total++;
      
      // Vérifier si actif ce mois
      if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        if (createdDate >= startOfMonth) {
          stats.newThisMonth++;
        }
      }
    }
    
    // Compter les actifs (ceux qui ont créé un site ce mois)
    stats.active = users.filter(u => {
      if (!u.sites || u.sites.length === 0) return false;
      return u.sites.some(s => s.createdAt && new Date(s.createdAt) >= startOfMonth);
    }).length;
    
    // Trier par date décroissante
    users.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return new Response(JSON.stringify({ success: true, users, stats }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleUserAction(env, body) {
  const { action, email, notes } = body;
  
  if (action === 'update_notes') {
    // Stocker les notes dans KV
    const noteKey = `user_notes_${email}`;
    await env.KV.put(noteKey, JSON.stringify({ email, notes, updatedAt: new Date().toISOString() }));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  if (action === 'delete') {
    // Supprimer les sites de l'utilisateur
    const sitesList = await env.KV.list({ prefix: 'site_' });
    
    for (const key of sitesList.keys) {
      const siteData = await env.KV.get(key.name, { type: 'json' });
      if (siteData && siteData.userEmail === email) {
        await env.KV.delete(key.name);
      }
    }
    
    // Supprimer les notes
    await env.KV.delete(`user_notes_${email}`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
