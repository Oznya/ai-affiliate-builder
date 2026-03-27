// Community Manager IA - Worker principal
// Gestion complète : Configuration, OAuth, Publication automatique

const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
const FB_APP_ID = "1489523952768079";
const FB_APP_SECRET = "a1744d5b708a325800326fbba6c1d2f7";

export default {
  // Handler HTTP
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Page d'accueil - Dashboard
    if (path === '/' || path === '/index.html') {
      return new Response(getDashboardHTML(url.origin), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // API: Status et configuration
    if (path === '/api/status') {
      return await getStatus(env);
    }

    // API: Sauvegarder la configuration
    if (path === '/api/config' && request.method === 'POST') {
      return await saveConfig(request, env);
    }

    // API: Lancer une publication test
    if (path === '/api/publish-now') {
      return await publishNow(env);
    }

    // API: Lister les pages du compte
    if (path === '/api/pages') {
      return await getPages(request, env);
    }

    // API: Sélectionner les pages à utiliser
    if (path === '/api/select-pages' && request.method === 'POST') {
      return await selectPages(request, env);
    }

    // API: Déconnexion
    if (path === '/api/disconnect') {
      return await disconnect(env);
    }

    // OAuth: Démarrer la connexion Facebook
    if (path === '/auth/login') {
      const redirectUri = encodeURIComponent(url.origin + '/auth/callback');
      const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,pages_show_list');
      const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
      return Response.redirect(fbUrl, 302);
    }

    // OAuth: Callback Facebook
    if (path === '/auth/callback') {
      return await handleOAuthCallback(request, env);
    }

    // Page de sélection des pages Facebook
    if (path === '/select-pages') {
      return new Response(getPageSelectionHTML(url.origin), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  // Handler Cron - Publication automatique
  async scheduled(event, env, ctx) {
    console.log('🔔 Cron déclenché à:', new Date().toISOString());
    
    const result = await publishScheduled(env);
    console.log('📊 Résultat:', JSON.stringify(result));
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============ API HANDLERS ============

async function getStatus(env) {
  try {
    const config = await env.CM_DATA.get('config');
    const pages = await env.CM_DATA.get('selected_pages');
    const lastPublish = await env.CM_DATA.get('last_publish');

    return new Response(JSON.stringify({
      configured: !!config,
      config: config ? JSON.parse(config) : null,
      pages: pages ? JSON.parse(pages) : [],
      lastPublish: lastPublish || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function saveConfig(request, env) {
  try {
    const body = await request.json();
    
    // Validation
    const config = {
      topic: body.topic || 'Mon produit',
      style: body.style || 'professionnel',
      tone: body.tone || 'enthousiaste',
      hashtags: body.hashtags || '',
      imageUrl: body.imageUrl || '',
      cronHour: body.cronHour || 8,
      includeEmoji: body.includeEmoji !== false,
      active: body.active !== false
    };

    await env.CM_DATA.put('config', JSON.stringify(config));

    return new Response(JSON.stringify({ 
      success: true, 
      config,
      message: 'Configuration sauvegardée !'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getPages(request, env) {
  try {
    const url = new URL(request.url);
    const userToken = url.searchParams.get('token');

    if (!userToken) {
      const pages = await env.CM_DATA.get('user_pages');
      if (pages) {
        return new Response(pages, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Récupérer les pages depuis Facebook
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}&fields=id,name,access_token,picture,category`
    );
    const data = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sauvegarder les pages
    await env.CM_DATA.put('user_pages', JSON.stringify(data.data));
    await env.CM_DATA.put('user_token', userToken);

    return new Response(JSON.stringify(data.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function selectPages(request, env) {
  try {
    const body = await request.json();
    const selectedPages = body.pages; // [{id, name, token}, ...]

    if (!selectedPages || selectedPages.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune page sélectionnée' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sauvegarder avec les tokens
    await env.CM_DATA.put('selected_pages', JSON.stringify(selectedPages));

    return new Response(JSON.stringify({ 
      success: true, 
      count: selectedPages.length,
      pages: selectedPages.map(p => p.name)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function disconnect(env) {
  await env.CM_DATA.delete('user_token');
  await env.CM_DATA.delete('user_pages');
  await env.CM_DATA.delete('selected_pages');
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const origin = url.origin;

  if (error) {
    return Response.redirect(origin + '?error=' + encodeURIComponent('Accès refusé'), 302);
  }

  if (!code) {
    return Response.redirect(origin + '?error=' + encodeURIComponent('Code manquant'), 302);
  }

  try {
    // Échanger le code contre un token
    const redirectUri = origin + '/auth/callback';
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${FB_APP_ID}&` +
      `client_secret=${FB_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );
    
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      return Response.redirect(origin + '?error=' + encodeURIComponent(tokenData.error.message), 302);
    }

    // Obtenir un token longue durée
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${FB_APP_ID}&` +
      `client_secret=${FB_APP_SECRET}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );
    
    const longLivedData = await longLivedRes.json();
    const userToken = longLivedData.access_token || tokenData.access_token;

    // Récupérer les pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `access_token=${userToken}&` +
      `fields=id,name,access_token,picture,category`
    );
    
    const pagesData = await pagesRes.json();
    
    if (pagesData.error) {
      return Response.redirect(origin + '?error=' + encodeURIComponent(pagesData.error.message), 302);
    }

    // Sauvegarder
    await env.CM_DATA.put('user_token', userToken);
    await env.CM_DATA.put('user_pages', JSON.stringify(pagesData.data));

    // Rediriger vers la sélection de pages
    return Response.redirect(origin + '/select-pages?connected=true', 302);

  } catch (e) {
    return Response.redirect(origin + '?error=' + encodeURIComponent(e.message), 302);
  }
}

// ============ PUBLICATION ============

async function publishNow(env) {
  const result = await publishScheduled(env);
  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function publishScheduled(env) {
  const results = {
    timestamp: new Date().toISOString(),
    published: 0,
    failed: 0,
    posts: []
  };

  try {
    // Récupérer la configuration
    const configRaw = await env.CM_DATA.get('config');
    if (!configRaw) {
      results.error = 'Aucune configuration trouvée';
      return results;
    }
    const config = JSON.parse(configRaw);

    if (!config.active) {
      results.message = 'Publications désactivées';
      return results;
    }

    // Récupérer les pages sélectionnées
    const pagesRaw = await env.CM_DATA.get('selected_pages');
    if (!pagesRaw) {
      results.error = 'Aucune page sélectionnée';
      return results;
    }
    const pages = JSON.parse(pagesRaw);

    // Générer le contenu avec Groq
    const content = await generateContent(config);

    // Publier sur chaque page
    for (const page of pages) {
      const published = await publishToFacebook(page, content, config.imageUrl);
      
      if (published.success) {
        results.published++;
        results.posts.push({
          page: page.name,
          status: 'success',
          postId: published.postId,
          content: content.substring(0, 50) + '...'
        });
      } else {
        results.failed++;
        results.posts.push({
          page: page.name,
          status: 'error',
          error: published.error
        });
      }

      // Attendre entre chaque publication
      await new Promise(r => setTimeout(r, 2000));
    }

    // Sauvegarder la date de dernière publication
    await env.CM_DATA.put('last_publish', new Date().toISOString());

  } catch (e) {
    results.error = e.message;
  }

  return results;
}

async function generateContent(config) {
  const prompt = `Crée un post Facebook promotionnel pour: "${config.topic}"

Style: ${config.style}
Ton: ${config.tone}
${config.hashtags ? 'Hashtags à inclure: ' + config.hashtags : ''}
${config.includeEmoji ? 'Utilise des emojis' : 'Sans emojis'}

Format:
- Titre accrocheur (ligne 1)
- Description de 2-3 phrases engageantes
- Call-to-action

Maximum 400 caractères. Génère UNIQUEMENT le post.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Tu es un expert en marketing Facebook.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250,
        temperature: 0.9
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    }
  } catch (e) {
    console.error('Erreur Groq:', e);
  }

  // Fallback
  return `🔥 ${config.topic} - Découvrez cette opportunité !

Une solution innovante qui transformera votre quotidien. Qualité premium garantie.

${config.includeEmoji ? '👇 ' : ''}Découvrez maintenant !${config.hashtags ? '\n\n' + config.hashtags : ''}`;
}

async function publishToFacebook(page, message, imageUrl) {
  try {
    // Si image fournie, utiliser l'endpoint photos
    if (imageUrl) {
      const body = {
        url: imageUrl,
        caption: message,
        access_token: page.token || page.access_token
      };

      const res = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      const result = await res.json();
      if (result.id) {
        return { success: true, postId: result.id };
      }
    }

    // Sinon publier juste le texte
    const body = {
      message: message,
      access_token: page.token || page.access_token
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const result = await res.json();
    if (result.id) {
      return { success: true, postId: result.id };
    } else {
      return { success: false, error: result.error?.message || 'Erreur Facebook' };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============ HTML TEMPLATES ============

function getDashboardHTML(origin) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Community Manager IA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0B1F3A 0%, #1a1a2e 50%, #2B0F3A 100%); color: white; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 5px; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { opacity: 0.7; margin-bottom: 30px; text-align: center; }
    .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 28px; }
    .card { background: rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .card h2 { margin-bottom: 20px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; }
    .card h2::before { content: ''; width: 4px; height: 20px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 2px; }
    label { display: block; margin-bottom: 6px; color: #c7d2fe; font-weight: 500; font-size: 14px; }
    input, textarea, select { width: 100%; padding: 12px; border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; background: rgba(0,0,0,0.3); color: white; font-size: 15px; margin-bottom: 15px; }
    input::placeholder, textarea::placeholder { color: #6b7280; }
    textarea { resize: vertical; min-height: 80px; font-family: inherit; }
    select { cursor: pointer; }
    select option { background: #1a1a2e; }
    button { padding: 14px 24px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s; width: 100%; margin: 8px 0; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg, #1877f2, #166fe5); color: white; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(24,119,242,0.4); }
    .btn-success { background: linear-gradient(135deg, #4CAF50, #43A047); color: white; }
    .btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(76,175,80,0.4); }
    .btn-danger { background: linear-gradient(135deg, #f44336, #d32f2f); color: white; }
    .btn-row { display: flex; gap: 10px; }
    .btn-row button { flex: 1; }
    .info { background: rgba(99,102,241,0.15); padding: 15px; border-radius: 10px; margin: 15px 0; font-size: 14px; border-left: 3px solid #6366f1; }
    .success { background: rgba(76,175,80,0.15); border-left-color: #4CAF50; }
    .error { background: rgba(244,67,54,0.15); border-left-color: #f44336; }
    .warning { background: rgba(255,152,0,0.15); border-left-color: #ff9800; }
    .toggle { display: flex; align-items: center; gap: 12px; margin: 15px 0; }
    .toggle input { width: 50px; height: 26px; -webkit-appearance: none; background: rgba(255,255,255,0.1); border-radius: 13px; position: relative; cursor: pointer; }
    .toggle input::before { content: ''; position: absolute; width: 22px; height: 22px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: 0.3s; }
    .toggle input:checked::before { left: 26px; background: #4CAF50; }
    .toggle label { margin: 0; cursor: pointer; }
    #status { margin-top: 15px; }
    .page-item { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin: 10px 0; display: flex; align-items: center; gap: 12px; }
    .page-item img { width: 45px; height: 45px; border-radius: 50%; }
    .page-item .name { font-weight: 600; }
    .page-item .category { font-size: 12px; opacity: 0.6; }
    .page-item input[type="checkbox"] { width: 20px; height: 20px; margin: 0 0 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🤖</div>
    <h1>Community Manager IA</h1>
    <p class="subtitle">Votre assistant de publication automatique</p>

    <!-- État de connexion -->
    <div class="card" id="connectionCard">
      <h2>📘 Pages Facebook</h2>
      <div id="connectionStatus">
        <div class="info">Chargement...</div>
      </div>
    </div>

    <!-- Configuration -->
    <div class="card">
      <h2>📝 Configuration du contenu</h2>
      
      <label>Sujet / Produit *</label>
      <input type="text" id="topic" placeholder="Ex: Ma boutique en ligne, Mon coaching...">

      <label>Style de rédaction</label>
      <select id="style">
        <option value="professionnel">Professionnel</option>
        <option value="decontracte">Décontracté</option>
        <option value="inspirant">Inspirant</option>
        <option value="humoristique">Humoristique</option>
        <option value="experte">Expert</option>
      </select>

      <label>Ton</label>
      <select id="tone">
        <option value="enthousiaste">Enthousiaste</option>
        <option value="amicale">Amicale</option>
        <option value="persuasif">Persuasif</option>
        <option value="informatif">Informatif</option>
      </select>

      <label>Hashtags (séparés par des espaces)</label>
      <input type="text" id="hashtags" placeholder="#marketing #business #success">

      <label>URL de l'image (optionnel)</label>
      <input type="url" id="imageUrl" placeholder="https://exemple.com/mon-image.jpg">
      <p style="font-size:12px;opacity:0.6;margin-top:-10px;">💡 Laissez vide ou entrez l'URL d'une image</p>

      <div class="toggle">
        <input type="checkbox" id="includeEmoji" checked>
        <label for="includeEmoji">Inclure des emojis</label>
      </div>

      <button class="btn-success" onclick="saveConfig()">💾 Sauvegarder la configuration</button>
      <div id="configStatus"></div>
    </div>

    <!-- Planification -->
    <div class="card">
      <h2>⏰ Planification</h2>
      
      <label>Heure de publication quotidienne</label>
      <select id="cronHour">
        <option value="6">6h00</option>
        <option value="7">7h00</option>
        <option value="8" selected>8h00</option>
        <option value="9">9h00</option>
        <option value="12">12h00</option>
        <option value="18">18h00</option>
        <option value="20">20h00</option>
        <option value="21">21h00</option>
      </select>

      <div class="toggle">
        <input type="checkbox" id="active" checked>
        <label for="active">Publications automatiques actives</label>
      </div>

      <div class="btn-row">
        <button class="btn-primary" onclick="publishNow()">🚀 Publier maintenant</button>
      </div>
      <div id="publishStatus"></div>
    </div>
  </div>

  <script>
    let config = null;
    let pages = [];

    async function loadStatus() {
      try {
        const r = await fetch('/api/status');
        const data = await r.json();
        
        config = data.config;
        pages = data.pages || [];

        // Afficher l'état de connexion
        updateConnectionStatus(data);
        
        // Remplir le formulaire si config existe
        if (config) {
          document.getElementById('topic').value = config.topic || '';
          document.getElementById('style').value = config.style || 'professionnel';
          document.getElementById('tone').value = config.tone || 'enthousiaste';
          document.getElementById('hashtags').value = config.hashtags || '';
          document.getElementById('imageUrl').value = config.imageUrl || '';
          document.getElementById('cronHour').value = config.cronHour || 8;
          document.getElementById('includeEmoji').checked = config.includeEmoji !== false;
          document.getElementById('active').checked = config.active !== false;
        }

      } catch (e) {
        document.getElementById('connectionStatus').innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    function updateConnectionStatus(data) {
      const container = document.getElementById('connectionStatus');
      
      if (pages.length > 0) {
        let html = '<div class="info success">✅ ' + pages.length + ' page(s) sélectionnée(s)</div>';
        html += '<div style="margin: 15px 0;">';
        pages.forEach(p => {
          html += '<div class="page-item"><div class="name">' + p.name + '</div></div>';
        });
        html += '</div>';
        html += '<button class="btn-danger" onclick="disconnect()">❌ Déconnecter</button>';
        container.innerHTML = html;
      } else {
        container.innerHTML = '<button class="btn-primary" onclick="connectFacebook()">📘 Connecter mes Pages Facebook</button>';
      }
    }

    function connectFacebook() {
      window.location.href = '/auth/login';
    }

    async function disconnect() {
      if (!confirm('Déconnecter toutes les pages ?')) return;
      
      const r = await fetch('/api/disconnect');
      const data = await r.json();
      
      if (data.success) {
        pages = [];
        updateConnectionStatus({ pages: [] });
      }
    }

    async function saveConfig() {
      const status = document.getElementById('configStatus');
      status.innerHTML = '<div class="info">Sauvegarde...</div>';

      const body = {
        topic: document.getElementById('topic').value,
        style: document.getElementById('style').value,
        tone: document.getElementById('tone').value,
        hashtags: document.getElementById('hashtags').value,
        imageUrl: document.getElementById('imageUrl').value,
        cronHour: parseInt(document.getElementById('cronHour').value),
        includeEmoji: document.getElementById('includeEmoji').checked,
        active: document.getElementById('active').checked
      };

      try {
        const r = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json();

        if (data.success) {
          config = data.config;
          status.innerHTML = '<div class="info success">✅ ' + data.message + '</div>';
        } else {
          status.innerHTML = '<div class="info error">Erreur: ' + data.error + '</div>';
        }
      } catch (e) {
        status.innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    async function publishNow() {
      const status = document.getElementById('publishStatus');
      status.innerHTML = '<div class="info">Publication en cours...</div>';

      try {
        const r = await fetch('/api/publish-now');
        const data = await r.json();

        let html = '<div class="info ' + (data.published > 0 ? 'success' : 'warning') + '">';
        html += '✅ Publié: ' + data.published + ' | ❌ Échoué: ' + data.failed;
        html += '</div>';

        if (data.posts) {
          html += '<div style="margin-top:10px;font-size:13px;">';
          data.posts.forEach(p => {
            const icon = p.status === 'success' ? '✅' : '❌';
            html += '<div>' + icon + ' <strong>' + p.page + '</strong>: ' + (p.error || p.content) + '</div>';
          });
          html += '</div>';
        }

        status.innerHTML = html;

      } catch (e) {
        status.innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    // Charger au démarrage
    loadStatus();
  </script>
</body>
</html>`;
}

function getPageSelectionHTML(origin) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sélectionnez vos Pages</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0B1F3A, #2B0F3A); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 450px; width: 100%; }
    h1 { font-size: 1.5rem; margin-bottom: 10px; text-align: center; }
    .subtitle { color: #a5b4fc; margin-bottom: 25px; text-align: center; font-size: 14px; }
    .page-item { background: rgba(255,255,255,0.08); padding: 15px; border-radius: 12px; margin: 10px 0; display: flex; align-items: center; gap: 12px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
    .page-item:hover { background: rgba(255,255,255,0.12); }
    .page-item.selected { border-color: #4CAF50; background: rgba(76,175,80,0.15); }
    .page-item img { width: 50px; height: 50px; border-radius: 50%; }
    .page-item .name { font-weight: 600; }
    .page-item .category { font-size: 12px; opacity: 0.6; margin-top: 3px; }
    .page-item .check { margin-left: auto; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; }
    .page-item.selected .check { background: #4CAF50; border-color: #4CAF50; }
    button { width: 100%; padding: 15px; background: linear-gradient(135deg, #4CAF50, #43A047); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading { text-align: center; color: #a5b4fc; padding: 20px; }
    .info { background: rgba(24,119,242,0.15); padding: 15px; border-radius: 10px; margin: 10px 0; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sélectionnez vos Pages</h1>
    <p class="subtitle">Choisissez les pages sur lesquelles publier automatiquement</p>
    <div id="pagesList"><div class="loading">Chargement de vos pages...</div></div>
    <button id="confirmBtn" onclick="confirmSelection()" style="display:none;">✅ Confirmer la sélection</button>
  </div>

  <script>
    let allPages = [];
    let selectedPages = [];

    async function loadPages() {
      try {
        const r = await fetch('/api/pages');
        allPages = await r.json();

        if (allPages.error) {
          document.getElementById('pagesList').innerHTML = '<div class="info error">Erreur: ' + allPages.error + '</div>';
          return;
        }

        if (allPages.length === 0) {
          document.getElementById('pagesList').innerHTML = '<div class="info">Aucune Page trouvée</div>';
          return;
        }

        // Charger les pages déjà sélectionnées
        const statusR = await fetch('/api/status');
        const status = await statusR.json();
        selectedPages = status.pages || [];

        renderPages();

      } catch (e) {
        document.getElementById('pagesList').innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    function renderPages() {
      const container = document.getElementById('pagesList');
      const selectedIds = selectedPages.map(p => p.id);

      let html = '';
      allPages.forEach(p => {
        const isSelected = selectedIds.includes(p.id);
        html += '<div class="page-item ' + (isSelected ? 'selected' : '') + '" onclick="togglePage(\\'' + p.id + '\\', \\'' + p.name.replace(/'/g, "\\\\'") + '\\')">';
        html += '<img src="' + (p.picture?.data?.url || 'https://via.placeholder.com/50') + '">';
        html += '<div><div class="name">' + p.name + '</div><div class="category">' + (p.category || '') + '</div></div>';
        html += '<div class="check">' + (isSelected ? '✓' : '') + '</div>';
        html += '</div>';
      });

      container.innerHTML = html;
      document.getElementById('confirmBtn').style.display = 'block';
    }

    function togglePage(id, name) {
      const index = selectedPages.findIndex(p => p.id === id);
      
      if (index >= 0) {
        selectedPages.splice(index, 1);
      } else {
        const page = allPages.find(p => p.id === id);
        selectedPages.push({
          id: id,
          name: name,
          token: page.access_token
        });
      }

      renderPages();
    }

    async function confirmSelection() {
      if (selectedPages.length === 0) {
        alert('Sélectionnez au moins une page');
        return;
      }

      const btn = document.getElementById('confirmBtn');
      btn.disabled = true;
      btn.textContent = 'Sauvegarde en cours...';

      try {
        const r = await fetch('/api/select-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: selectedPages })
        });

        const data = await r.json();

        if (data.success) {
          btn.textContent = '✅ ' + data.count + ' page(s) sélectionnée(s) !';
          setTimeout(() => { window.location.href = '/'; }, 1500);
        } else {
          alert('Erreur: ' + data.error);
          btn.disabled = false;
          btn.textContent = '✅ Confirmer la sélection';
        }

      } catch (e) {
        alert('Erreur: ' + e.message);
        btn.disabled = false;
        btn.textContent = '✅ Confirmer la sélection';
      }
    }

    loadPages();
  </script>
</body>
</html>`;
}
