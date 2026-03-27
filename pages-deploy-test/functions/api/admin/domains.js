/**
 * API Admin Domains - Gestion des domaines et sous-domaines personnalisés
 * Publicationcashflow.com est le moteur principal, d'autres domaines peuvent être greffés
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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  try {
    if (method === 'GET') {
      return await getDomains(env);
    } else if (method === 'POST') {
      const body = await request.json();
      return await handleDomainAction(env, body);
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

async function getDomains(env) {
  const domains = [];
  const stats = {
    total: 0,
    active: 0,
    pending: 0,
    primary: 'publicationcashflow.com'
  };
  
  try {
    // Récupérer tous les domaines depuis KV
    const domainsList = await env.KV.list({ prefix: 'domain_' });
    
    for (const key of domainsList.keys) {
      const domainData = await env.KV.get(key.name, { type: 'json' });
      if (domainData) {
        const domain = {
          id: domainData.id || key.name.replace('domain_', ''),
          name: domainData.name,
          type: domainData.type || 'subdomain', // 'subdomain' ou 'custom'
          status: domainData.status || 'pending', // 'active', 'pending', 'error'
          sslEnabled: domainData.sslEnabled || false,
          targetUrl: domainData.targetUrl || '',
          affiliateId: domainData.affiliateId || null,
          affiliateName: domainData.affiliateName || '',
          createdAt: domainData.createdAt,
          notes: domainData.notes || ''
        };
        
        domains.push(domain);
        stats.total++;
        
        if (domain.status === 'active') {
          stats.active++;
        } else if (domain.status === 'pending') {
          stats.pending++;
        }
      }
    }
    
    // Trier par date décroissante
    domains.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return new Response(JSON.stringify({ success: true, domains, stats }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleDomainAction(env, body) {
  const { action, id, name, type, status, sslEnabled, targetUrl, affiliateId, affiliateName, notes } = body;
  
  // Ajouter un nouveau domaine
  if (action === 'add') {
    if (!name) {
      return new Response(JSON.stringify({ error: 'Le nom du domaine est requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Vérifier si le domaine existe déjà
    const existingDomain = await env.KV.get(`domain_${name}`, { type: 'json' });
    if (existingDomain) {
      return new Response(JSON.stringify({ error: 'Ce domaine existe déjà' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const domainId = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const newDomain = {
      id: domainId,
      name: name,
      type: type || 'subdomain',
      status: status || 'pending',
      sslEnabled: sslEnabled || false,
      targetUrl: targetUrl || '',
      affiliateId: affiliateId || null,
      affiliateName: affiliateName || '',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    await env.KV.put(`domain_${domainId}`, JSON.stringify(newDomain));
    
    return new Response(JSON.stringify({ success: true, domain: newDomain }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Mettre à jour un domaine
  if (action === 'update') {
    const key = `domain_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Domaine non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const updated = {
      ...existing,
      type: type || existing.type,
      status: status || existing.status,
      sslEnabled: sslEnabled !== undefined ? sslEnabled : existing.sslEnabled,
      targetUrl: targetUrl || existing.targetUrl,
      affiliateId: affiliateId !== undefined ? affiliateId : existing.affiliateId,
      affiliateName: affiliateName !== undefined ? affiliateName : existing.affiliateName,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Supprimer un domaine
  if (action === 'delete') {
    const key = `domain_${id}`;
    await env.KV.delete(key);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Vérifier le statut SSL
  if (action === 'check_ssl') {
    const key = `domain_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Domaine non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Simuler une vérification SSL (en production, faire une vraie vérification)
    const sslValid = Math.random() > 0.3; // Simulation
    
    const updated = {
      ...existing,
      sslEnabled: sslValid,
      status: sslValid ? 'active' : 'error',
      lastSslCheck: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ 
      success: true, 
      sslEnabled: sslValid,
      status: updated.status
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
