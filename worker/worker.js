// AI Affiliate Builder - Cloudflare Worker
// Système simple: lien affilié → page générée → URL

// Templates HTML
const TEMPLATES = {
  modern: (data) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName} - Offre Spéciale</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f0520 100%);
      min-height: 100vh;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 15px;
      background: linear-gradient(135deg, #fff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 1.2rem;
      color: #a5b4fc;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 30px 0;
    }
    .feature {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(99, 102, 241, 0.2);
      padding: 20px;
      border-radius: 12px;
    }
    .feature-icon { font-size: 24px; margin-bottom: 10px; }
    .feature-text { color: #c7d2fe; font-size: 14px; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #a855f7, #8b5cf6);
      color: white;
      padding: 18px 45px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 30px;
      transition: transform 0.3s, box-shadow 0.3s;
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
    }
    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(99, 102, 241, 0.5);
    }
    .pros-cons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
      text-align: left;
    }
    @media (max-width: 600px) {
      .pros-cons { grid-template-columns: 1fr; }
      h1 { font-size: 1.8rem; }
    }
    .pros { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 20px; border-radius: 12px; }
    .cons { background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); padding: 20px; border-radius: 12px; }
    .pros h3 { color: #4ade80; margin-bottom: 10px; }
    .cons h3 { color: #facc15; margin-bottom: 10px; }
    .pros li, .cons li { color: #c7d2fe; margin: 8px 0; margin-left: 20px; }
    .urgency {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      color: #fca5a5;
    }
    .stars {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    }
    .star {
      position: absolute;
      width: 2px;
      height: 2px;
      background: white;
      border-radius: 50%;
      animation: twinkle 2s ease-in-out infinite;
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    .footer { margin-top: 40px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="stars" id="stars"></div>
  
  <div class="container">
    <span class="badge">⚡ Offre Limitée</span>
    
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    
    <div class="urgency">
      🔥 <strong>Attention:</strong> Cette offre expire bientôt. Ne manquez pas cette opportunité!
    </div>
    
    <div class="features">
      ${data.features.map(f => `
        <div class="feature">
          <div class="feature-icon">✓</div>
          <div class="feature-text">${f}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="pros-cons">
      <div class="pros">
        <h3>✅ Points forts</h3>
        <ul>
          ${data.pros.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      <div class="cons">
        <h3>⚠️ À considérer</h3>
        <ul>
          ${data.cons.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <p style="color: #a5b4fc; margin: 20px 0;">${data.description}</p>
    
    <a href="${data.affiliateLink}" class="cta-button" target="_blank">
      ${data.callToAction} →
    </a>
    
    <p class="footer">Site généré automatiquement • Liens sponsorisés</p>
  </div>
  
  <script>
    // Create stars
    const starsContainer = document.getElementById('stars');
    for(let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 2 + 's';
      starsContainer.appendChild(star);
    }
  </script>
</body>
</html>
  `,
  
  dark: (data) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .glow {
      position: fixed;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(99,102,241,0.15), transparent);
      border-radius: 50%;
      top: -200px;
      right: -100px;
    }
    .container { max-width: 600px; text-align: center; position: relative; }
    h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; }
    p { color: #888; margin-bottom: 30px; line-height: 1.8; }
    .btn {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 18px 50px;
      text-decoration: none;
      font-weight: 600;
      border-radius: 8px;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    ul { text-align: left; margin: 30px 0; list-style: none; }
    li { padding: 10px 0; border-bottom: 1px solid #222; color: #aaa; }
    li:before { content: '→ '; color: #6366f1; }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="container">
    <h1>${data.headline}</h1>
    <p>${data.subheadline}</p>
    <ul>
      ${data.features.map(f => `<li>${f}</li>`).join('')}
    </ul>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
  </div>
</body>
</html>
  `,
  
  minimal: (data) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 20px; }
    p { color: #666; margin-bottom: 20px; }
    a { display: inline-block; background: #000; color: #fff; padding: 15px 30px; text-decoration: none; margin-top: 20px; }
    ul { margin: 20px 0; }
    li { margin: 10px 0; color: #444; }
  </style>
</head>
<body>
  <h1>${data.headline}</h1>
  <p>${data.subheadline}</p>
  <p>${data.description}</p>
  <ul>
    ${data.features.map(f => `<li>✓ ${f}</li>`).join('')}
  </ul>
  <a href="${data.affiliateLink}" target="_blank">${data.callToAction}</a>
</body>
</html>
  `
};

// Génère le contenu avec Groq AI
async function generateContent(productName, niche, groqApiKey) {
  if (!groqApiKey) {
    return getFallbackContent(productName);
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Crée du contenu marketing pour ce produit en JSON uniquement:
          
Produit: ${productName}
Niche: ${niche || 'général'}

Réponds UNIQUEMENT avec ce JSON:
{
  "headline": "Titre accrocheur court",
  "subheadline": "Sous-titre persuasif",
  "description": "Description de 2-3 phrases",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "pros": ["Avantage 1", "Avantage 2"],
  "cons": ["Point 1"],
  "callToAction": "Texte du bouton"
}`
        }],
        temperature: 0.8,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      return getFallbackContent(productName);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return getFallbackContent(productName);
  } catch (error) {
    return getFallbackContent(productName);
  }
}

function getFallbackContent(productName) {
  return {
    headline: `Découvrez ${productName}`,
    subheadline: 'La solution que vous recherchiez',
    description: `${productName} est un produit de qualité qui répond parfaitement à vos besoins. Découvrez ses avantages exceptionnels.`,
    features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix', 'Livraison rapide'],
    pros: ['Produit fiable', 'Bon investissement'],
    cons: ['Stock limité'],
    callToAction: 'Découvrir maintenant'
  };
}

// Extrait le nom du produit depuis l'URL
function extractProductName(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const segments = path.split('/').filter(s => s.length > 0);
    
    // Amazon
    if (urlObj.hostname.includes('amazon')) {
      for (const seg of segments) {
        if (seg.length > 3 && !seg.includes('dp') && !seg.includes('ref')) {
          return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }
    
    // Autres sites
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last.length > 2) {
        return last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    
    return 'Produit Exclusif';
  } catch {
    return 'Produit Exclusif';
  }
}

// Worker principal
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // ============================================
    // ROUTE: CRÉER UNE PAGE
    // ============================================
    if (request.method === 'POST' && url.pathname === '/create') {
      try {
        const body = await request.json();
        const affiliateLink = body.link;
        const customName = body.name;
        const niche = body.niche || 'général';
        const template = body.template || 'modern';
        
        if (!affiliateLink) {
          return new Response(JSON.stringify({ error: 'Lien affilié requis' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // Génère un ID unique
        const id = crypto.randomUUID().substring(0, 8);
        
        // Extrait ou utilise le nom du produit
        const productName = customName || extractProductName(affiliateLink);
        
        // Génère le contenu avec l'IA
        const content = await generateContent(productName, niche, env.GROQ_API_KEY);
        
        // Crée les données pour le template
        const pageData = {
          ...content,
          productName,
          affiliateLink
        };
        
        // Génère le HTML avec le template choisi
        const html = TEMPLATES[template]?.(pageData) || TEMPLATES.modern(pageData);
        
        // Stocke dans KV
        await env.AFFILIATE_SITES.put(id, JSON.stringify({
          html,
          affiliateLink,
          productName,
          createdAt: new Date().toISOString(),
          views: 0
        }));
        
        // Retourne l'URL
        const siteUrl = `${url.origin}/site/${id}`;
        
        return new Response(JSON.stringify({
          success: true,
          url: siteUrl,
          id
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // ============================================
    // ROUTE: SERVIR UNE PAGE
    // ============================================
    if (url.pathname.startsWith('/site/')) {
      const id = url.pathname.split('/site/')[1]?.split('?')[0];
      
      if (!id) {
        return new Response('Page non trouvée', { status: 404 });
      }
      
      const data = await env.AFFILIATE_SITES.get(id);
      
      if (!data) {
        return new Response(`
          <html>
            <body style="font-family:Arial;text-align:center;padding:50px;">
              <h1>Page non trouvée</h1>
              <p>Cette page n'existe pas ou a été supprimée.</p>
            </body>
          </html>
        `, {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      const parsed = JSON.parse(data);
      
      // Incrémente les vues (async, non-bloquant)
      ctx.waitUntil(
        env.AFFILIATE_SITES.put(id, JSON.stringify({
          ...parsed,
          views: (parsed.views || 0) + 1
        }))
      );
      
      return new Response(parsed.html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // ============================================
    // ROUTE: PAGE D'ACCUEIL
    // ============================================
    if (url.pathname === '/' || url.pathname === '') {
      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Affiliate Builder</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f0520 100%);
      min-height: 100vh;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .container { max-width: 600px; width: 100%; margin-top: 60px; }
    h1 {
      font-size: 2.5rem;
      text-align: center;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { text-align: center; color: #a5b4fc; margin-bottom: 40px; }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 20px;
    }
    label { display: block; margin-bottom: 8px; color: #c7d2fe; font-weight: 500; }
    input, select, textarea {
      width: 100%;
      padding: 14px;
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 8px;
      background: rgba(0,0,0,0.3);
      color: white;
      font-size: 16px;
      margin-bottom: 20px;
    }
    input::placeholder { color: #6b7280; }
    button {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.02); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result {
      margin-top: 20px;
      padding: 20px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 8px;
      display: none;
    }
    .result a { color: #4ade80; word-break: break-all; }
    .error {
      margin-top: 20px;
      padding: 15px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #fca5a5;
      display: none;
    }
    .templates { display: flex; gap: 10px; margin-bottom: 20px; }
    .template-btn {
      flex: 1;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(99,102,241,0.2);
      border-radius: 8px;
      color: #c7d2fe;
      cursor: pointer;
      transition: all 0.2s;
    }
    .template-btn.active {
      border-color: #6366f1;
      background: rgba(99,102,241,0.2);
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡</div>
    <h1>AI Affiliate Builder</h1>
    <p class="subtitle">Générez votre page affiliée en 10 secondes</p>
    
    <div class="card">
      <label>Votre lien affilié *</label>
      <input type="url" id="link" placeholder="https://votre-lien-affilie.com">
      
      <label>Nom du produit (optionnel)</label>
      <input type="text" id="name" placeholder="Laisser vide pour détection auto">
      
      <label>Niche (optionnel)</label>
      <input type="text" id="niche" placeholder="ex: Fitness, Santé, Technologie">
      
      <label>Template</label>
      <div class="templates">
        <button class="template-btn active" data-template="modern">✨ Moderne</button>
        <button class="template-btn" data-template="dark">🌙 Dark</button>
        <button class="template-btn" data-template="minimal">◻️ Minimal</button>
      </div>
      
      <button id="generateBtn" onclick="generate()">⚡ Générer ma page</button>
      
      <div id="error" class="error"></div>
      
      <div id="result" class="result">
        <p style="margin-bottom:10px;">✅ Votre page est prête!</p>
        <a id="resultUrl" href="" target="_blank"></a>
        <button onclick="copyUrl()" style="margin-top:15px; padding:10px;">📋 Copier le lien</button>
      </div>
    </div>
  </div>
  
  <script>
    let selectedTemplate = 'modern';
    
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTemplate = btn.dataset.template;
      });
    });
    
    async function generate() {
      const link = document.getElementById('link').value;
      const name = document.getElementById('name').value;
      const niche = document.getElementById('niche').value;
      const btn = document.getElementById('generateBtn');
      const result = document.getElementById('result');
      const error = document.getElementById('error');
      
      if (!link) {
        error.textContent = 'Veuillez entrer un lien affilié';
        error.style.display = 'block';
        return;
      }
      
      btn.disabled = true;
      btn.textContent = '⏳ Génération...';
      error.style.display = 'none';
      result.style.display = 'none';
      
      try {
        const res = await fetch('/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            link,
            name: name || null,
            niche: niche || null,
            template: selectedTemplate
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          document.getElementById('resultUrl').href = data.url;
          document.getElementById('resultUrl').textContent = data.url;
          result.style.display = 'block';
        } else {
          error.textContent = data.error || 'Erreur lors de la génération';
          error.style.display = 'block';
        }
      } catch (e) {
        error.textContent = 'Erreur de connexion';
        error.style.display = 'block';
      }
      
      btn.disabled = false;
      btn.textContent = '⚡ Générer ma page';
    }
    
    function copyUrl() {
      const url = document.getElementById('resultUrl').textContent;
      navigator.clipboard.writeText(url);
      alert('Lien copié!');
    }
  </script>
</body>
</html>
      `;
      
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // 404 pour les autres routes
    return new Response('Not found', { status: 404 });
  }
};
