/**
 * API Admin Affiliates - Gestion des affiliés
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
      return await getAffiliates(env);
    } else if (method === 'POST') {
      const body = await request.json();
      return await handleAffiliateAction(env, body);
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

async function getAffiliates(env) {
  const affiliates = [];
  const stats = {
    total: 0,
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    totalReferrals: 0
  };
  
  try {
    // Récupérer tous les affiliés depuis KV
    const affiliatesList = await env.KV.list({ prefix: 'affiliate_' });
    
    for (const key of affiliatesList.keys) {
      const affiliateData = await env.KV.get(key.name, { type: 'json' });
      if (affiliateData) {
        const affiliate = {
          id: affiliateData.id || key.name.replace('affiliate_', ''),
          email: affiliateData.email,
          name: affiliateData.name,
          code: affiliateData.code,
          status: affiliateData.status || 'pending',
          commissionRate: affiliateData.commissionRate || 30,
          paypal: affiliateData.paypal || '',
          notes: affiliateData.notes || '',
          referralsCount: affiliateData.referralsCount || 0,
          totalCommissions: affiliateData.totalCommissions || 0,
          commissions: affiliateData.commissions || [],
          createdAt: affiliateData.createdAt
        };
        
        affiliates.push(affiliate);
        stats.total++;
        stats.totalCommissions += affiliate.totalCommissions;
        stats.totalReferrals += affiliate.referralsCount;
        
        // Calculer les commissions payées et en attente
        if (affiliate.commissions) {
          affiliate.commissions.forEach(c => {
            if (c.status === 'paid') {
              stats.paidCommissions += c.amount || 0;
            } else {
              stats.pendingCommissions += c.amount || 0;
            }
          });
        }
      }
    }
    
    // Trier par date décroissante
    affiliates.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return new Response(JSON.stringify({ success: true, affiliates, stats }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleAffiliateAction(env, body) {
  const { action, id, status, commissionRate, paypal, notes } = body;
  
  if (action === 'update') {
    const key = `affiliate_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Affilié non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Mettre à jour les champs
    const updated = {
      ...existing,
      status: status || existing.status,
      commissionRate: commissionRate || existing.commissionRate,
      paypal: paypal || existing.paypal,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  if (action === 'delete') {
    const key = `affiliate_${id}`;
    await env.KV.delete(key);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  if (action === 'mark_paid') {
    const key = `affiliate_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Affilié non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Marquer toutes les commissions comme payées
    if (existing.commissions) {
      existing.commissions = existing.commissions.map(c => ({
        ...c,
        status: 'paid',
        paidAt: new Date().toISOString()
      }));
    }
    
    await env.KV.put(key, JSON.stringify(existing));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
