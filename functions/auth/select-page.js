// Handle page selection - POST /auth/select-page
// Sauvegarde ET publie IMMÉDIATEMENT sur la page sélectionnée

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { siteId, pageId, pageName, pageToken, productName } = body;

    if (!pageId || !pageToken) {
      return new Response(JSON.stringify({ error: 'Données manquantes' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 1. Sauvegarder le token
    const key = 'fb_' + siteId;
    const data = {
      pageId,
      pageName,
      pageToken,
      productName: productName || 'Produit',
      siteId,
      connectedAt: new Date().toISOString()
    };

    await env.AFFILIATE_SITES.put(key, JSON.stringify(data));

    // Mettre à jour la liste des sites connectés
    const listKey = 'fb_connected_sites';
    let connectedSites = [];

    try {
      const existing = await env.AFFILIATE_SITES.get(listKey);
      if (existing) {
        connectedSites = JSON.parse(existing);
      }
    } catch (e) {}

    connectedSites = connectedSites.filter(s => s.siteId !== siteId);
    connectedSites.push({
      siteId,
      pageId,
      pageName,
      productName: productName || 'Produit',
      connectedAt: new Date().toISOString()
    });

    await env.AFFILIATE_SITES.put(listKey, JSON.stringify(connectedSites));

    // 2. GÉNÉRER ET PUBLIER IMMÉDIATEMENT
    const postResult = await generateAndPost(env, pageId, pageToken, productName || 'Produit');

    return new Response(JSON.stringify({ 
      success: true, 
      posted: postResult.success,
      postId: postResult.postId,
      content: postResult.content,
      error: postResult.error
    }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Générer du contenu avec l'IA et publier sur Facebook
async function generateAndPost(env, pageId, pageToken, productName) {
  try {
    // 1. Générer le contenu avec Groq AI
    const content = await generateContent(env, productName);
    
    // 2. Publier sur Facebook
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.message,
          access_token: pageToken
        })
      }
    );

    const result = await response.json();

    if (result.id) {
      return { success: true, postId: result.id, content: content.message };
    } else {
      return { success: false, error: result.error?.message || 'Erreur Facebook' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Générer un post marketing avec l'IA
async function generateContent(env, productName) {
  const product = productName || 'notre produit';
  const groqApiKey = env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    return getFallbackContent(product);
  }
  
  const prompt = `Tu es un expert en marketing d'affiliation. Génère un post Facebook engageant pour promouvoir "${product}".

RÈGLES:
- Maximum 280 caractères
- Utilise des emojis pertinents (max 3)
- Inclus un appel à l'action clair
- Ton enthousiaste mais professionnel
- Pas de hashtags excessifs (max 2)

Génère UNIQUEMENT le texte du post, rien d'autre.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + groqApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Tu es un expert marketing qui crée des posts Facebook viraux.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.8
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return { message: data.choices[0].message.content.trim() };
    }
  } catch (err) {
    console.error('Erreur Groq:', err);
  }

  return getFallbackContent(product);
}

function getFallbackContent(product) {
  const fallbacks = [
    `🚀 Découvrez ${product} ! Une solution innovante qui va révolutionner votre quotidien. #Innovation`,
    `✨ Vous cherchez ${product} ? Nous avons ce qu'il vous faut ! #Qualité`,
    `💎 ${product} - La référence du marché !`
  ];

  return { message: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
}
