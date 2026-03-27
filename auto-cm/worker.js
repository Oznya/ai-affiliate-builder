// === WORKER PUBLICATION AUTOMATIQUE ===
// Ce worker publie automatiquement sur les Pages Facebook connectées
// Stockage compatible avec le site services-affiliation-programme.publication-web.com

const FB_APP_ID = "1489523952768079";
const FB_APP_SECRET = "a1744d5b708a325800326fbba6c1d2f7";
const GROQ_API_KEY = "YOUR_GROQ_API_KEY";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const REDIRECT_URI = `${url.origin}/auth/callback`;

    // Page d'accueil
    if (url.pathname === '/') {
      return new Response(getDashboardHTML(url.origin), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Lister les sites connectés
    if (url.pathname === '/api/connected') {
      const sites = await env.KV.get('fb_connected_sites');
      return new Response(sites || '[]', {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Publier manuellement sur TOUS les sites connectés
    if (url.pathname === '/api/publish-all') {
      const result = await this.publishAllSites(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Publier sur un site spécifique
    if (url.pathname.startsWith('/api/publish/')) {
      const siteId = url.pathname.replace('/api/publish/', '');
      const result = await this.publishSite(env, siteId);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tester la génération AI
    if (url.pathname === '/api/test-generate') {
      const product = url.searchParams.get('product') || 'notre produit';
      const content = await this.generateContent(product);
      return new Response(JSON.stringify(content, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Facebook OAuth - Login
    if (url.pathname === '/auth/login') {
      const scope = 'pages_manage_posts,pages_read_engagement';
      const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
      return Response.redirect(fbUrl, 302);
    }

    // Facebook OAuth - Callback
    if (url.pathname === '/auth/callback') {
      return await this.handleOAuthCallback(request, env, REDIRECT_URI);
    }

    // Sélection de page (POST)
    if (url.pathname === '/auth/select-page' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { siteId, pageId, pageName, pageToken } = body;
        await this.savePageConnection(env, siteId || 'default', {
          id: pageId,
          name: pageName,
          access_token: pageToken
        });
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  // Cron Trigger - publié tous les jours
  async scheduled(event, env, ctx) {
    console.log('Cron exécuté à:', new Date().toISOString());
    const result = await this.publishAllSites(env);
    console.log('Résultat:', JSON.stringify(result));
  },

  // Gérer le callback OAuth
  async handleOAuthCallback(request, env, redirectUri) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(getErrorHTML('Accès refusé par Facebook'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (!code) {
      return new Response(getErrorHTML('Code manquant'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    try {
      // Échanger le code contre un token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${FB_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${FB_APP_SECRET}&` +
        `code=${code}`
      );
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return new Response(getErrorHTML('Token error: ' + JSON.stringify(tokenData)), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Récupérer les pages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?` +
        `access_token=${tokenData.access_token}&` +
        `fields=id,name,access_token,picture,category`
      );
      const pagesData = await pagesRes.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        return new Response(getErrorHTML('Aucune Page Facebook trouvée'), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Si une seule page, la sélectionner automatiquement
      if (pagesData.data.length === 1) {
        const page = pagesData.data[0];
        await this.savePageConnection(env, 'default', page);
        return new Response(getSuccessHTML(page.name), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Sinon afficher la sélection
      return new Response(getPageSelectionHTML(pagesData.data), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

    } catch (e) {
      return new Response(getErrorHTML('Erreur: ' + e.message), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  },

  // Sauvegarder la connexion d'une page
  async savePageConnection(env, siteId, page) {
    // Sauvegarder les infos de la page
    const key = 'fb_' + siteId;
    await env.KV.put(key, JSON.stringify({
      pageId: page.id,
      pageName: page.name,
      pageToken: page.access_token,
      siteId: siteId,
      connectedAt: new Date().toISOString()
    }));

    // Mettre à jour la liste des sites connectés
    let connectedSites = [];
    try {
      const existing = await env.KV.get('fb_connected_sites');
      if (existing) connectedSites = JSON.parse(existing);
    } catch (e) {}

    // Retirer l'ancien et ajouter le nouveau
    connectedSites = connectedSites.filter(s => s.siteId !== siteId);
    connectedSites.push({
      siteId: siteId,
      pageId: page.id,
      pageName: page.name,
      connectedAt: new Date().toISOString()
    });

    await env.KV.put('fb_connected_sites', JSON.stringify(connectedSites));
  },

  // Publier sur tous les sites connectés
  async publishAllSites(env) {
    const results = {
      timestamp: new Date().toISOString(),
      published: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    try {
      const connected = await env.KV.get('fb_connected_sites');
      if (!connected) {
        results.message = 'Aucun site connecté';
        return results;
      }

      const sites = JSON.parse(connected);

      for (const site of sites) {
        // Vérifier si déjà publié aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const lastPostKey = 'lastpost_' + site.siteId;
        const lastPost = await env.KV.get(lastPostKey);

        if (lastPost === today) {
          results.skipped++;
          results.details.push({
            siteId: site.siteId,
            pageName: site.pageName,
            status: 'skipped',
            reason: 'Déjà publié aujourd\'hui'
          });
          continue;
        }

        // Récupérer les détails complets
        const siteData = await env.KV.get('fb_' + site.siteId);
        if (!siteData) {
          results.failed++;
          results.details.push({
            siteId: site.siteId,
            status: 'error',
            error: 'Données non trouvées'
          });
          continue;
        }

        const fbData = JSON.parse(siteData);

        // Générer le contenu
        const content = await this.generateContent(site.pageName || 'notre produit');

        // Publier
        const published = await this.publishToFacebook(
          fbData.pageId,
          fbData.pageToken,
          content.message
        );

        if (published.success) {
          await env.KV.put(lastPostKey, today);
          results.published++;
          results.details.push({
            siteId: site.siteId,
            pageName: site.pageName,
            status: 'success',
            postId: published.postId,
            preview: content.message.substring(0, 60) + '...'
          });
        } else {
          results.failed++;
          results.details.push({
            siteId: site.siteId,
            pageName: site.pageName,
            status: 'error',
            error: published.error
          });
        }

        // Attendre entre chaque publication
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (err) {
      results.error = err.message;
    }

    return results;
  },

  // Publier sur un site spécifique
  async publishSite(env, siteId) {
    const siteData = await env.KV.get('fb_' + siteId);
    if (!siteData) {
      return { success: false, error: 'Site non trouvé' };
    }

    const fbData = JSON.parse(siteData);
    const content = await this.generateContent(fbData.pageName || 'notre produit');

    const published = await this.publishToFacebook(
      fbData.pageId,
      fbData.pageToken,
      content.message
    );

    if (published.success) {
      const today = new Date().toISOString().split('T')[0];
      await env.KV.put('lastpost_' + siteId, today);
    }

    return {
      success: published.success,
      postId: published.postId,
      error: published.error,
      content: content.message
    };
  },

  // Générer du contenu avec Groq AI
  async generateContent(productName) {
    const product = productName || 'notre produit';

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
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Tu es un expert marketing qui crée des posts Facebook viraux et engageants.' },
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

    // Fallback
    const fallbacks = [
      `🚀 Découvrez ${product} ! Une solution innovante qui va révolutionner votre quotidien. Ne manquez pas cette opportunité ! #Innovation`,
      `✨ Vous cherchez ${product} ? Nous avons ce qu'il vous faut ! Découvrez nos offres exceptionnelles aujourd'hui. #Qualité`,
      `💎 ${product} - La référence du marché ! Profitez de nos offres exclusives maintenant !`
    ];

    return { message: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
  },

  // Publier sur Facebook
  async publishToFacebook(pageId, pageToken, message) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            access_token: pageToken
          })
        }
      );

      const result = await response.json();

      if (result.id) {
        return { success: true, postId: result.id };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Erreur inconnue'
        };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// === HTML TEMPLATES ===

function getDashboardHTML(origin) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Publication Automatique Facebook</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; font-size: 1.8rem; }
    .card { background: rgba(255,255,255,0.1); border-radius: 16px; padding: 25px; margin-bottom: 20px; }
    .card h2 { margin-bottom: 15px; font-size: 1.2rem; opacity: 0.9; }
    button { padding: 14px 24px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s; width: 100%; margin: 8px 0; }
    .btn-primary { background: linear-gradient(135deg, #1877f2, #166fe5); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(24,119,242,0.4); }
    .btn-success { background: linear-gradient(135deg, #4CAF50, #43A047); color: white; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(76,175,80,0.4); }
    .btn-warning { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
    .info { background: rgba(24,119,242,0.2); padding: 15px; border-radius: 10px; margin: 10px 0; font-size: 14px; }
    .success { background: rgba(76,175,80,0.2); border-left: 4px solid #4CAF50; }
    .error { background: rgba(244,67,54,0.2); border-left: 4px solid #f44336; }
    #status { margin-top: 15px; }
    #connected-list { margin: 10px 0; }
    .site-item { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center; }
    .site-item .name { font-weight: 600; }
    .site-item .date { opacity: 0.6; font-size: 12px; }
    .url-box { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; font-size: 13px; word-break: break-all; margin: 10px 0; }
    .section-title { margin: 25px 0 15px; font-size: 0.9rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Publication Automatique Facebook</h1>

    <div class="url-box">
      <strong>URL du worker:</strong> ${origin}
    </div>

    <div class="card">
      <h2>Pages connectées</h2>
      <div id="connected-list">Chargement...</div>
      <button class="btn-primary" onclick="window.location.href='/auth/login'">+ Connecter une nouvelle Page</button>
    </div>

    <div class="section-title">Publication manuelle</div>

    <div class="card">
      <h2>Publier maintenant</h2>
      <p style="opacity:0.7; margin-bottom:15px; font-size:14px;">Cliquez pour publier immédiatement sur toutes les pages connectées.</p>
      <button class="btn-success" onclick="publishAll()">Publier sur toutes les pages</button>
      <button class="btn-warning" onclick="testGenerate()">Tester la génération AI</button>
      <div id="status"></div>
    </div>

    <div class="card">
      <h2>Configuration Cron</h2>
      <p style="opacity:0.7; font-size:14px;">Le worker publie automatiquement tous les jours à 8h00 (heure de Paris).</p>
      <p style="opacity:0.5; font-size:12px; margin-top:10px;">Prochaine publication: 8h00 Paris (7h00 UTC)</p>
    </div>
  </div>

  <script>
    async function loadConnected() {
      const r = await fetch('/api/connected');
      const sites = await r.json();
      const list = document.getElementById('connected-list');

      if (sites.length === 0) {
        list.innerHTML = '<div class="info">Aucune Page connectée</div>';
        return;
      }

      list.innerHTML = sites.map(s => '<div class="site-item"><div><div class="name">' + s.pageName + '</div><div class="date">Connectée le ' + new Date(s.connectedAt).toLocaleDateString('fr-FR') + '</div></div></div>').join('');
    }

    async function publishAll() {
      const status = document.getElementById('status');
      status.innerHTML = '<div class="info">Publication en cours...</div>';

      try {
        const r = await fetch('/api/publish-all');
        const result = await r.json();

        let html = '<div class="info success">Publié: ' + result.published + ' | Échoué: ' + result.failed + ' | Ignoré: ' + result.skipped + '</div>';

        if (result.details) {
          result.details.forEach(d => {
            const cls = d.status === 'success' ? 'success' : (d.status === 'skipped' ? 'info' : 'error');
            html += '<div class="info ' + cls + '">' + (d.pageName || d.siteId) + ': ' + (d.preview || d.reason || d.error) + '</div>';
          });
        }

        status.innerHTML = html;
      } catch (e) {
        status.innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    async function testGenerate() {
      const status = document.getElementById('status');
      status.innerHTML = '<div class="info">Génération en cours...</div>';

      try {
        const r = await fetch('/api/test-generate?product=Mon%20Produit');
        const result = await r.json();
        status.innerHTML = '<div class="info success">Contenu généré:<br><br>"' + result.message + '"</div>';
      } catch (e) {
        status.innerHTML = '<div class="info error">Erreur: ' + e.message + '</div>';
      }
    }

    loadConnected();
  </script>
</body>
</html>`;
}

function getSuccessHTML(pageName) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion réussie</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { text-align: center; max-width: 400px; }
    .card { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
    h1 { color: #4CAF50; margin-bottom: 20px; }
    .info { background: rgba(76,175,80,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
    button { padding: 14px 40px; background: linear-gradient(135deg, #1877f2, #166fe5); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Connexion réussie !</h1>
      <div class="info">
        <p><strong>Page connectée :</strong></p>
        <p style="font-size: 1.2rem; margin-top: 10px;">${pageName}</p>
      </div>
      <p style="opacity: 0.7; margin-bottom: 20px;">Les publications automatiques sont maintenant activées.</p>
      <a href="/"><button>Retour au tableau de bord</button></a>
    </div>
  </div>
</body>
</html>`;
}

function getErrorHTML(message) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { text-align: center; max-width: 400px; }
    .card { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
    h1 { color: #f44336; margin-bottom: 20px; }
    .info { background: rgba(244,67,54,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
    button { padding: 14px 40px; background: linear-gradient(135deg, #1877f2, #166fe5); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Erreur</h1>
      <div class="info">${message}</div>
      <a href="/"><button>Réessayer</button></a>
    </div>
  </div>
</body>
</html>`;
}

function getPageSelectionHTML(pages) {
  const pagesJson = JSON.stringify(pages);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sélectionnez votre Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 400px; width: 100%; text-align: center; }
    h1 { margin-bottom: 10px; }
    .subtitle { opacity: 0.7; margin-bottom: 25px; }
    .page-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 15px; margin-bottom: 10px; background: rgba(24,119,242,0.15); border: 1px solid rgba(24,119,242,0.3); border-radius: 12px; color: white; text-align: left; cursor: pointer; transition: all 0.2s; }
    .page-btn:hover { background: rgba(24,119,242,0.3); transform: scale(1.02); }
    .page-btn img { width: 50px; height: 50px; border-radius: 50%; }
    .page-name { font-weight: 600; }
    .page-category { font-size: 12px; opacity: 0.7; margin-top: 4px; }
    .loading { display: none; color: #a5b4fc; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sélectionnez votre Page</h1>
    <p class="subtitle">Choisissez la Page Facebook pour la publication automatique</p>
    <div id="pagesList"></div>
    <div id="loading" class="loading">Connexion en cours...</div>
  </div>
  <script>
    const pages = ${pagesJson};

    const container = document.getElementById('pagesList');
    pages.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'page-btn';
      btn.innerHTML = '<img src="' + (p.picture?.data?.url || 'https://via.placeholder.com/50') + '"><div><div class="page-name">' + p.name + '</div><div class="page-category">' + (p.category || '') + '</div></div>';
      btn.onclick = () => selectPage(i);
      container.appendChild(btn);
    });

    async function selectPage(index) {
      const page = pages[index];
      const loading = document.getElementById('loading');
      const btns = document.querySelectorAll('.page-btn');
      btns.forEach(b => b.disabled = true);
      loading.style.display = 'block';

      try {
        const r = await fetch('/auth/select-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: 'default',
            pageId: page.id,
            pageName: page.name,
            pageToken: page.access_token
          })
        });

        const d = await r.json();
        if (d.success) {
          loading.innerHTML = 'Page connectée ! Redirection...';
          setTimeout(() => { window.location.href = '/'; }, 1000);
        } else {
          alert('Erreur: ' + d.error);
          btns.forEach(b => b.disabled = false);
          loading.style.display = 'none';
        }
      } catch (e) {
        alert('Erreur: ' + e.message);
        btns.forEach(b => b.disabled = false);
        loading.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
}
