// Facebook OAuth Callback - Publie IMMÉDIATEMENT après connexion

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const redirectUrl = new URL('/', request.url).origin;

  if (error) {
    return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent('Acces refuse'), 302);
  }

  if (!code) {
    return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent('Code manquant'), 302);
  }

  const clientId = '1489523952768079';
  const clientSecret = env.FB_APP_SECRET || 'a1744d5b708a325800326fbba6c1d2f7';
  const redirectUri = redirectUrl + '/auth/callback';

  try {
    // Exchange code for user access token
    const tokenRes = await fetch(
      'https://graph.facebook.com/v19.0/oauth/access_token?' +
      'client_id=' + clientId + '&' +
      'client_secret=' + clientSecret + '&' +
      'redirect_uri=' + encodeURIComponent(redirectUri) + '&' +
      'code=' + code
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent(tokenData.error.message), 302);
    }

    const userAccessToken = tokenData.access_token;

    // Get long-lived token
    const longLivedRes = await fetch(
      'https://graph.facebook.com/v19.0/oauth/access_token?' +
      'grant_type=fb_exchange_token&' +
      'client_id=' + clientId + '&' +
      'client_secret=' + clientSecret + '&' +
      'fb_exchange_token=' + userAccessToken
    );

    const longLivedData = await longLivedRes.json();
    const longLivedToken = longLivedData.access_token || userAccessToken;

    // Get user's pages
    const pagesRes = await fetch(
      'https://graph.facebook.com/v19.0/me/accounts?' +
      'access_token=' + longLivedToken + '&' +
      'fields=id,name,access_token,picture,category'
    );

    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent(pagesData.error.message), 302);
    }

    const pages = pagesData.data;

    if (!pages || pages.length === 0) {
      return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent('Aucune Page trouvee'), 302);
    }

    const [siteId, productName] = state ? state.split('|') : ['', 'Produit'];

    // Auto-select if only one page - PUBLIE IMMÉDIATEMENT
    if (pages.length === 1) {
      const page = pages[0];
      await savePageToken(env, siteId, page.id, page.name, page.access_token, productName);
      
      // GÉNÉRER ET PUBLIER IMMÉDIATEMENT
      const postResult = await generateAndPost(env, page.id, page.access_token, productName || 'Produit');
      
      if (postResult.success) {
        return Response.redirect(redirectUrl + '?fb_connected=true&page_name=' + encodeURIComponent(page.name) + '&posted=true', 302);
      } else {
        return Response.redirect(redirectUrl + '?fb_connected=true&page_name=' + encodeURIComponent(page.name) + '&post_error=' + encodeURIComponent(postResult.error), 302);
      }
    }

    // Multiple pages - show selection
    const pagesJson = JSON.stringify(pages);
    
    return new Response(getPageSelectionHTML(pagesJson, siteId, productName), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent(err.message), 302);
  }
}

// Sauvegarder le token de la page
async function savePageToken(env, siteId, pageId, pageName, pageToken, productName) {
  const key = 'fb_' + siteId;
  await env.AFFILIATE_SITES.put(key, JSON.stringify({
    pageId, pageName, pageToken,
    productName: productName || 'Produit',
    siteId,
    connectedAt: new Date().toISOString()
  }));

  let connectedSites = [];
  try {
    const existing = await env.AFFILIATE_SITES.get('fb_connected_sites');
    if (existing) connectedSites = JSON.parse(existing);
  } catch (e) {}
  
  connectedSites = connectedSites.filter(s => s.siteId !== siteId);
  connectedSites.push({ siteId, pageId, pageName, productName: productName || 'Produit', connectedAt: new Date().toISOString() });
  await env.AFFILIATE_SITES.put('fb_connected_sites', JSON.stringify(connectedSites));
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
    `🚀 Découvrez ${product} ! Une solution innovante qui va révolutionner votre quotidien. Ne manquez pas cette opportunité ! #Innovation`,
    `✨ Vous cherchez ${product} ? Nous avons ce qu'il vous faut ! Découvrez nos offres exceptionnelles aujourd'hui. #Qualité`,
    `💎 ${product} - La référence du marché ! Profitez de nos offres exclusives maintenant !`
  ];

  return { message: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
}

// HTML pour la sélection de page
function getPageSelectionHTML(pagesJson, siteId, productName) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sélectionnez votre Page</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;background:linear-gradient(135deg,#0B1F3A,#2B0F3A);color:white;display:flex;align-items:center;justify-content:center;padding:20px}
    .container{max-width:400px;width:100%;text-align:center}
    h1{font-size:1.5rem;margin-bottom:10px}
    .subtitle{color:#a5b4fc;margin-bottom:25px}
    .page-btn{display:flex;align-items:center;gap:12px;width:100%;padding:15px;margin-bottom:10px;background:rgba(24,119,242,0.15);border:1px solid rgba(24,119,242,0.3);border-radius:12px;color:white;text-align:left;cursor:pointer;transition:all .2s}
    .page-btn:hover{background:rgba(24,119,242,0.3);transform:scale(1.02)}
    .page-btn img{width:50px;height:50px;border-radius:50%}
    .page-name{font-weight:600}
    .page-category{font-size:12px;opacity:.7;margin-top:4px}
    .loading{display:none;color:#a5b4fc;margin-top:15px}
  </style>
</head>
<body>
  <div class="container">
    <h1>Sélectionnez votre Page</h1>
    <p class="subtitle">Votre publication sera postée immédiatement</p>
    <div id="pagesList"></div>
    <div id="loading" class="loading">Publication en cours...</div>
  </div>
  <script>
    const pagesData = ${pagesJson};
    const siteId = "${siteId}";
    const productName = "${productName || 'Produit'}";
    
    const container = document.getElementById("pagesList");
    
    pagesData.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "page-btn";
      b.innerHTML = '<img src="' + (p.picture?.data?.url || 'https://via.placeholder.com/50') + '"><div><div class="page-name">' + p.name + '</div><div class="page-category">' + (p.category || '') + '</div></div>';
      b.onclick = () => selectPage(i);
      container.appendChild(b);
    });
    
    async function selectPage(index) {
      const page = pagesData[index];
      const loading = document.getElementById("loading");
      const btns = document.querySelectorAll(".page-btn");
      
      btns.forEach(b => b.disabled = true);
      loading.style.display = "block";
      loading.innerHTML = "Connexion et publication en cours...";
      
      try {
        const r = await fetch("/auth/select-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: siteId,
            pageId: page.id,
            pageName: page.name,
            pageToken: page.access_token,
            productName: productName
          })
        });
        
        const d = await r.json();
        
        if (d.success) {
          loading.innerHTML = "✅ Publié avec succès ! Redirection...";
          setTimeout(() => {
            window.location.href = "/?fb_connected=true&page_name=" + encodeURIComponent(page.name) + "&posted=true";
          }, 1500);
        } else {
          alert("Erreur: " + d.error);
          btns.forEach(b => b.disabled = false);
          loading.style.display = "none";
        }
      } catch (e) {
        alert("Erreur: " + e.message);
        btns.forEach(b => b.disabled = false);
        loading.style.display = "none";
      }
    }
  </script>
</body>
</html>`;
}
