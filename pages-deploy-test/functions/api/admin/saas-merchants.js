/**
 * API pour gérer les marchands SAAS (abonnés 27$/47$/97$)
 * GET /api/admin/saas-merchants - Liste tous les marchands
 * POST /api/admin/saas-merchants - Actions (update plan, suspend, etc.)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Plans disponibles
const PLANS = {
  'starter': { name: 'Starter', price: 27, maxAffiliates: 50 },
  'pro': { name: 'Pro', price: 47, maxAffiliates: 200 },
  'enterprise': { name: 'Enterprise', price: 97, maxAffiliates: -1 }
};

export async function onRequestGet({ request, env }) {
  try {
    // Récupérer tous les marchands
    let merchants = {};
    try {
      const merchantsRaw = await env.AFFILIATE_SITES.get('saas_merchants');
      if (merchantsRaw) {
        merchants = JSON.parse(merchantsRaw);
      }
    } catch (e) {
      console.log('Could not load merchants from KV');
    }
    
    // Calculer les stats globales
    const merchantList = Object.entries(merchants).map(([slug, m]) => {
      const plan = PLANS[m.plan] || PLANS['starter'];
      return {
        slug: slug,
        id: m.id,
        name: m.name,
        email: m.email,
        businessName: m.businessName,
        plan: m.plan || 'starter',
        planName: plan.name,
        planPrice: plan.price,
        status: m.status || 'trial',
        createdAt: m.createdAt,
        trialEndsAt: m.trialEndsAt,
        commissions: m.commissions
      };
    });
    
    // Stats globales
    const stats = {
      total: merchantList.length,
      byPlan: {
        starter: merchantList.filter(m => m.plan === 'starter').length,
        pro: merchantList.filter(m => m.plan === 'pro').length,
        enterprise: merchantList.filter(m => m.plan === 'enterprise').length
      },
      byStatus: {
        trial: merchantList.filter(m => m.status === 'trial').length,
        active: merchantList.filter(m => m.status === 'active').length,
        suspended: merchantList.filter(m => m.status === 'suspended').length
      },
      mrr: merchantList.reduce((sum, m) => sum + (PLANS[m.plan]?.price || 27), 0)
    };
    
    // Trier par date de création (plus récent d'abord)
    merchantList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return new Response(JSON.stringify({
      success: true,
      merchants: merchantList,
      stats: stats,
      plans: PLANS
    }), { headers: corsHeaders });
    
  } catch (error) {
    console.error('Erreur get saas merchants:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { action, slug, plan, status, password } = body;
    
    if (!action || !slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action et slug requis'
      }), { status: 400, headers: corsHeaders });
    }
    
    // Récupérer les marchands
    let merchants = {};
    try {
      const merchantsRaw = await env.AFFILIATE_SITES.get('saas_merchants');
      if (merchantsRaw) {
        merchants = JSON.parse(merchantsRaw);
      }
    } catch (e) {}
    
    if (!merchants[slug]) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Marchand non trouvé'
      }), { status: 404, headers: corsHeaders });
    }
    
    // Exécuter l'action
    switch (action) {
      case 'update_plan':
        if (!PLANS[plan]) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Plan invalide'
          }), { status: 400, headers: corsHeaders });
        }
        merchants[slug].plan = plan;
        break;
        
      case 'update_status':
        merchants[slug].status = status;
        break;
        
      case 'reset_password':
        if (!password || password.length < 8) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Le mot de passe doit contenir au moins 8 caractères'
          }), { status: 400, headers: corsHeaders });
        }
        merchants[slug].password = password;
        break;
        
      case 'delete':
        // Supprimer le marchand et ses données
        delete merchants[slug];
        await env.AFFILIATE_SITES.delete(`saas_${slug}_affiliates`);
        await env.AFFILIATE_SITES.delete(`saas_${slug}_sales`);
        break;
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Action non reconnue'
        }), { status: 400, headers: corsHeaders });
    }
    
    // Sauvegarder si ce n'est pas une suppression
    if (action !== 'delete') {
      merchants[slug].updatedAt = new Date().toISOString();
    }
    
    await env.AFFILIATE_SITES.put('saas_merchants', JSON.stringify(merchants));
    
    return new Response(JSON.stringify({
      success: true,
      message: action === 'delete' ? 'Marchand supprimé' : 'Marchand mis à jour',
      merchant: action !== 'delete' ? {
        slug: slug,
        plan: merchants[slug]?.plan,
        status: merchants[slug]?.status
      } : null
    }), { headers: corsHeaders });
    
  } catch (error) {
    console.error('Erreur post saas merchants:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
