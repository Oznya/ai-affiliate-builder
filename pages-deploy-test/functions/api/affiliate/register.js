/**
 * API Inscription Ambassadeur - Programme 3 niveaux
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
    const { name, email, password, code, paypal, sponsorCode } = body;

    // Validation
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Nom, email et mot de passe requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Générer un code unique
    let affiliateCode = code;
    if (!affiliateCode) {
      affiliateCode = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10) + Math.random().toString(36).substring(2, 6);
    }

    // Vérifier si le code existe déjà
    const existingCode = await env.AFFILIATE_SITES.get(`affiliate_code_${affiliateCode}`, { type: 'json' });
    if (existingCode) {
      return new Response(JSON.stringify({ error: 'Ce code ambassadeur est déjà utilisé' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await env.AFFILIATE_SITES.get(`affiliate_${email}`, { type: 'json' });
    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Un compte existe déjà avec cet email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Trouver le parrain
    let sponsor = null;
    if (sponsorCode) {
      sponsor = await env.AFFILIATE_SITES.get(`affiliate_code_${sponsorCode}`, { type: 'json' });
    }

    // Créer l'ambassadeur
    const affiliateData = {
      id: Date.now().toString(),
      name: name,
      email: email.toLowerCase(),
      password: password,
      code: affiliateCode,
      paypal: paypal || '',
      sponsorCode: sponsorCode || null,
      sponsorId: sponsor?.id || null,
      level: sponsor ? (sponsor.level + 1) : 1,
      status: 'active',
      balance: 0,
      totalEarnings: 0,
      referrals: [],
      createdAt: new Date().toISOString()
    };

    // Sauvegarder l'ambassadeur
    await env.AFFILIATE_SITES.put(`affiliate_${email.toLowerCase()}`, JSON.stringify(affiliateData));
    await env.AFFILIATE_SITES.put(`affiliate_code_${affiliateCode}`, JSON.stringify(affiliateData));
    await env.AFFILIATE_SITES.put(`affiliate_id_${affiliateData.id}`, JSON.stringify(affiliateData));

    // Mettre à jour le parrain
    if (sponsor) {
      sponsor.referrals = sponsor.referrals || [];
      sponsor.referrals.push({
        id: affiliateData.id,
        code: affiliateCode,
        name: name,
        date: new Date().toISOString()
      });
      await env.AFFILIATE_SITES.put(`affiliate_code_${sponsorCode}`, JSON.stringify(sponsor));
      await env.AFFILIATE_SITES.put(`affiliate_${sponsor.email}`, JSON.stringify(sponsor));
    }

    // Retourner succès
    const responseData = { ...affiliateData };
    delete responseData.password;

    return new Response(JSON.stringify({
      success: true,
      code: affiliateCode,
      affiliate: responseData
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
