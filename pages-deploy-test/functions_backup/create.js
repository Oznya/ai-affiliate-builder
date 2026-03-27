// POST /create - Create affiliate page
const GROQ_API_KEY = 'process.env.GROQ_API_KEY';

export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const body = await request.json();
  
  const affiliateLink = body.link;
  if (!affiliateLink) {
    return new Response(JSON.stringify({ error: 'Lien affilié requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  const id = crypto.randomUUID().substring(0, 8);
  const productName = body.name || extractProductName(affiliateLink);
  const productImage = body.image || null;
  
  let content;
  if (body.customDescription || body.customFeatures) {
    content = {
      headline: productName,
      subheadline: body.niche ? `Pour votre ${body.niche}` : 'Découvrez cette offre exclusive',
      description: body.customDescription || `${productName} est un produit de qualité.`,
      features: body.customFeatures ? body.customFeatures.split('\n').filter(f => f.trim()).map(f => f.trim()) : ['Qualité supérieure', 'Livraison rapide', 'Excellent rapport qualité-prix'],
      callToAction: 'Découvrir maintenant'
    };
  } else {
    content = await generateContent(productName, body.niche || 'général');
  }
  
  const pageData = { ...content, productName, affiliateLink, productImage };
  const html = getTemplate(body.template || 'modern', pageData);
  
  await env.AFFILIATE_SITES.put(id, JSON.stringify({
    html,
    affiliateLink,
    productName,
    productImage,
    createdAt: new Date().toISOString(),
    views: 0
  }));

  const siteUrl = `${url.origin}/site/${id}`;
  let published = false;
  let publishError = null;

  // Publish to Facebook if token provided
  if (body.fbPageId && body.fbPageToken) {
    try {
      const postMessage = `🔥 ${productName}\n\n${content.description}\n\n👉 Découvrir: ${siteUrl}`;
      
      if (productImage) {
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${body.fbPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: productImage,
            caption: postMessage,
            access_token: body.fbPageToken
          })
        });
        const fbData = await fbRes.json();
        if (fbData.id) {
          published = true;
        } else {
          publishError = fbData.error?.message || 'Erreur inconnue';
        }
      } else {
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${body.fbPageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: postMessage,
            link: siteUrl,
            access_token: body.fbPageToken
          })
        });
        const fbData = await fbRes.json();
        if (fbData.id) {
          published = true;
        } else {
          publishError = fbData.error?.message || 'Erreur inconnue';
        }
      }
    } catch (e) {
      publishError = e.message;
    }
  }
  
  return new Response(JSON.stringify({
    success: true,
    url: siteUrl,
    id,
    published,
    publishError
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function extractProductName(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const segments = path.split('/').filter(s => s.length > 0);
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

async function generateContent(productName, niche) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Crée du contenu marketing en français pour ce produit en JSON uniquement:
Produit: ${productName}
Niche: ${niche}
Réponds UNIQUEMENT avec ce JSON sans markdown:
{"headline": "Titre", "subheadline": "Sous-titre", "description": "Description", "features": ["F1", "F2", "F3", "F4"], "callToAction": "Texte bouton"}`
        }],
        temperature: 0.8,
        max_tokens: 500
      })
    });
    
    if (!response.ok) return getFallbackContent(productName);
    
    const data = await response.json();
    const contentText = data.choices[0]?.message?.content || '';
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return getFallbackContent(productName);
  } catch {
    return getFallbackContent(productName);
  }
}

function getFallbackContent(productName) {
  return {
    headline: `Découvrez ${productName}`,
    subheadline: 'La solution que vous recherchiez',
    description: `${productName} est un produit de qualité qui répond parfaitement à vos besoins.`,
    features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix', 'Livraison rapide'],
    callToAction: 'Découvrir maintenant'
  };
}

function getTemplate(name, data) {
  const templates = {
    modern: getModernTemplate,
    dark: getDarkTemplate,
    minimal: getMinimalTemplate,
    gradient: getGradientTemplate,
    zen: getZenTemplate,
    coach: getCoachTemplate,
    business: getBusinessTemplate,
    tarologue: getTarologueTemplate,
    numerologue: getNumerologueTemplate,
    astrologue: getAstrologueTemplate,
    soin: getSoinTemplate,
    meditation: getMeditationTemplate
  };
  
  const templateFunc = templates[name] || templates.modern;
  return templateFunc(data);
}

// Template Modern - GLOW pourpre/bleu
function getModernTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">📦</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0B1F3A 0%, #2B0F3A 50%, #0B1F3A 100%); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 600px; width: 100%; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 15px; background: linear-gradient(135deg, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #a5b4fc; margin-bottom: 30px; font-size: 1.2rem; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120%; height: 120%; background: radial-gradient(ellipse, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.3) 30%, transparent 70%); filter: blur(30px); z-index: -1; animation: glowPulse 3s ease-in-out infinite; }
    @keyframes glowPulse { 0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; border-radius: 16px; position: relative; z-index: 1; }
    .product-placeholder { padding: 50px; font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
    .feature { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(99,102,241,0.2); }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 18px 50px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 30px 0; font-size: 1.1rem; }
    .btn:hover { transform: scale(1.05); }
    .description { color: #a5b4fc; line-height: 1.8; margin: 20px 0; font-size: 1.1rem; }
    .footer { margin-top: 40px; color: #6b7280; font-size: 12px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✓ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction} →</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template Dark Pro - GLOW doré
function getDarkTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">📦</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; min-height: 100vh; background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
    body::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 20% 50%, rgba(212,175,55,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(212,175,55,0.1) 0%, transparent 50%); }
    .container { max-width: 600px; width: 100%; text-align: center; position: relative; z-index: 1; }
    h1 { font-family: 'Playfair Display', serif; font-size: 2.8rem; margin-bottom: 15px; color: #d4af37; }
    .subtitle { color: #888; margin-bottom: 30px; font-size: 1.1rem; letter-spacing: 2px; text-transform: uppercase; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 130%; height: 130%; background: radial-gradient(ellipse, rgba(212,175,55,0.5) 0%, rgba(184,150,46,0.3) 40%, transparent 70%); filter: blur(25px); z-index: -1; animation: goldGlow 2.5s ease-in-out infinite; }
    @keyframes goldGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { padding: 50px; font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
    .feature { background: rgba(255,255,255,0.03); padding: 20px; border-left: 3px solid #d4af37; text-align: left; }
    .btn { display: inline-block; background: linear-gradient(135deg, #d4af37, #b8962e); color: #0a0a0a; padding: 18px 50px; text-decoration: none; font-weight: 700; margin: 30px 0; font-size: 1rem; letter-spacing: 1px; text-transform: uppercase; }
    .btn:hover { transform: scale(1.05); }
    .description { color: #aaa; line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 40px; color: #444; font-size: 11px; letter-spacing: 1px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 2rem; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✓ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template Minimal - GLOW gris doux
function getMinimalTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">📦</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Space Grotesk', sans-serif; min-height: 100vh; background: #fafafa; color: #1a1a1a; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 500px; width: 100%; text-align: center; }
    h1 { font-size: 2.2rem; margin-bottom: 10px; font-weight: 600; }
    .subtitle { color: #666; margin-bottom: 30px; font-size: 1rem; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120%; height: 120%; background: radial-gradient(ellipse, rgba(100,100,100,0.15) 0%, transparent 70%); filter: blur(30px); z-index: -1; }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { padding: 60px; font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; text-align: left; }
    .feature { padding: 12px 0; border-bottom: 1px solid #eee; }
    .btn { display: inline-block; background: #1a1a1a; color: white; padding: 16px 40px; text-decoration: none; font-weight: 600; margin: 30px 0; border-radius: 0; }
    .btn:hover { background: #333; }
    .description { color: #444; line-height: 1.7; margin: 20px 0; font-size: 1rem; }
    .footer { margin-top: 40px; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">— ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template Gradient - GLOW arc-en-ciel
function getGradientTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">📦</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', sans-serif; min-height: 100vh; background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab); background-size: 400% 400%; animation: gradientBG 15s ease infinite; color: white; display: flex; align-items: center; justify-content: center; padding: 20px; }
    @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .container { max-width: 600px; width: 100%; text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; }
    h1 { font-size: 2.5rem; margin-bottom: 15px; text-shadow: 2px 2px 10px rgba(0,0,0,0.2); }
    .subtitle { color: rgba(255,255,255,0.9); margin-bottom: 30px; font-size: 1.1rem; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140%; height: 140%; background: radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, rgba(231,60,126,0.3) 30%, rgba(35,166,213,0.2) 50%, transparent 70%); filter: blur(25px); z-index: -1; animation: rainbowGlow 4s ease-in-out infinite; }
    @keyframes rainbowGlow { 0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1) rotate(0deg); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(10deg); } }
    .product-image { max-width: 100%; max-height: 350px; border-radius: 16px; position: relative; z-index: 1; }
    .product-placeholder { padding: 50px; font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
    .feature { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; }
    .btn { display: inline-block; background: white; color: #e73c7e; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; margin: 30px 0; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .btn:hover { transform: scale(1.05); }
    .description { color: rgba(255,255,255,0.95); line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 30px; color: rgba(255,255,255,0.6); font-size: 11px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✓ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction} →</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template ZEN - GLOW vert sauge
function getZenTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">🪷</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Quicksand:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Quicksand', sans-serif; min-height: 100vh; background: linear-gradient(180deg, #f5f0e8 0%, #e8e0d5 100%); color: #4a4a4a; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b896' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.5; animation: float 20s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    .container { max-width: 550px; width: 100%; text-align: center; position: relative; z-index: 1; }
    h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; margin-bottom: 15px; color: #5d6b4d; font-weight: 400; }
    .subtitle { color: #8b8b7a; margin-bottom: 30px; font-size: 1rem; letter-spacing: 3px; text-transform: uppercase; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140%; height: 140%; background: radial-gradient(ellipse, rgba(147,168,116,0.3) 0%, rgba(201,184,150,0.2) 40%, transparent 70%); filter: blur(35px); z-index: -1; animation: zenGlow 4s ease-in-out infinite; }
    @keyframes zenGlow { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.05); } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; }
    .feature { padding: 15px; margin: 10px 0; background: rgba(255,255,255,0.5); border-radius: 8px; font-size: 0.95rem; }
    .btn { display: inline-block; background: #5d6b4d; color: white; padding: 16px 45px; text-decoration: none; border-radius: 30px; font-weight: 500; margin: 30px 0; font-size: 0.95rem; letter-spacing: 1px; }
    .btn:hover { background: #4a5740; }
    .description { color: #6b6b5a; line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 40px; color: #a0a090; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✿ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template COACH - GLOW orange feu
function getCoachTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">🎯</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Open Sans', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: ''; position: fixed; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 50%); animation: pulse 4s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
    .container { max-width: 600px; width: 100%; text-align: center; position: relative; z-index: 1; }
    .badge { display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 8px 20px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 20px; letter-spacing: 1px; }
    h1 { font-family: 'Montserrat', sans-serif; font-size: 2.5rem; margin-bottom: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; }
    .subtitle { color: #ff6b35; margin-bottom: 30px; font-size: 1.1rem; font-weight: 600; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140%; height: 140%; background: radial-gradient(ellipse, rgba(255,107,53,0.5) 0%, rgba(247,147,30,0.3) 40%, transparent 70%); filter: blur(30px); z-index: -1; animation: fireGlow 2s ease-in-out infinite; }
    @keyframes fireGlow { 0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; border-radius: 12px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
    .feature { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #ff6b35; text-align: left; }
    .btn { display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; margin: 30px 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(255,107,53,0.4); }
    .btn:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(255,107,53,0.5); }
    .description { color: #bbb; line-height: 1.8; margin: 20px 0; font-size: 1rem; }
    .footer { margin-top: 40px; color: #555; font-size: 11px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">🔥 OFFRE EXCLUSIVE</span>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✓ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template BUSINESS - GLOW bleu électrique
function getBusinessTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">💼</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #0c0c0c; color: white; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; animation: gridMove 20s linear infinite; }
    @keyframes gridMove { 0% { transform: translate(0, 0); } 100% { transform: translate(50px, 50px); } }
    .container { max-width: 650px; width: 100%; text-align: center; position: relative; z-index: 1; }
    h1 { font-family: 'DM Serif Display', serif; font-size: 3rem; margin-bottom: 15px; color: #3b82f6; }
    .subtitle { color: #64748b; margin-bottom: 30px; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 130%; height: 130%; background: radial-gradient(ellipse, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.3) 40%, transparent 70%); filter: blur(30px); z-index: -1; animation: blueGlow 3s ease-in-out infinite; }
    @keyframes blueGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 30px 0; }
    .feature { background: rgba(255,255,255,0.02); padding: 18px; border: 1px solid rgba(59,130,246,0.2); text-align: left; font-size: 0.9rem; }
    .feature::before { content: '→'; color: #3b82f6; margin-right: 10px; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 18px 50px; text-decoration: none; font-weight: 700; margin: 30px 0; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; }
    .btn:hover { background: #2563eb; }
    .description { color: #94a3b8; line-height: 1.8; margin: 20px 0; font-size: 1rem; }
    .footer { margin-top: 40px; color: #334155; font-size: 11px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 2rem; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template TAROLOGUE - GLOW violet mystique
function getTarologueTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">🔮</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Crimson Text', serif; min-height: 100vh; background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%); color: #e8d5f2; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50' y='55' font-size='30' text-anchor='middle' fill='%239b59b6' opacity='0.1'%3E✧%3C/text%3E%3C/svg%3E"); animation: twinkle 3s ease-in-out infinite; }
    @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
    .container { max-width: 550px; width: 100%; text-align: center; position: relative; z-index: 1; border: 1px solid rgba(155,89,182,0.3); padding: 40px; background: rgba(26,10,46,0.8); }
    .stars { font-size: 1.5rem; margin-bottom: 20px; letter-spacing: 10px; animation: glow 2s ease-in-out infinite; }
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px rgba(155,89,182,0.5); } 50% { text-shadow: 0 0 20px rgba(155,89,182,0.8), 0 0 30px rgba(155,89,182,0.5); } }
    h1 { font-family: 'Cinzel', serif; font-size: 2.5rem; margin-bottom: 15px; color: #d4af37; font-weight: 400; letter-spacing: 3px; }
    .subtitle { color: #b388ff; margin-bottom: 30px; font-size: 1.1rem; font-style: italic; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150%; height: 150%; background: radial-gradient(ellipse, rgba(155,89,182,0.5) 0%, rgba(212,175,55,0.3) 30%, transparent 60%); filter: blur(30px); z-index: -1; animation: mysticGlow 3s ease-in-out infinite; }
    @keyframes mysticGlow { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; }
    .feature { padding: 12px; margin: 8px 0; border-bottom: 1px solid rgba(155,89,182,0.2); font-size: 1.05rem; }
    .feature::before { content: '✧ '; color: #d4af37; }
    .btn { display: inline-block; background: linear-gradient(135deg, #d4af37, #b8962e); color: #1a0a2e; padding: 16px 45px; text-decoration: none; font-weight: 700; margin: 30px 0; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; }
    .btn:hover { transform: scale(1.05); }
    .description { color: #c9b8d9; line-height: 1.8; margin: 20px 0; font-size: 1.1rem; font-style: italic; }
    .footer { margin-top: 40px; color: #6b5b7a; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="stars">✧ ✧ ✧</div>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template NUMÉROLOGUE - GLOW turquoise
function getNumerologueTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">🔢</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Lato', sans-serif; min-height: 100vh; background: #0f0f1a; color: #e0e0e0; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: '11:22:33:44:55'; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 15rem; font-weight: 700; color: rgba(64,224,208,0.03); letter-spacing: -5px; white-space: nowrap; animation: numberFloat 30s linear infinite; }
    @keyframes numberFloat { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
    .container { max-width: 550px; width: 100%; text-align: center; position: relative; z-index: 1; }
    .number-badge { display: inline-block; background: linear-gradient(135deg, #40e0d0, #20b2aa); color: #0f0f1a; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 1.8rem; font-weight: 700; margin-bottom: 20px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 15px; color: #40e0d0; }
    .subtitle { color: #888; margin-bottom: 30px; font-size: 1rem; letter-spacing: 4px; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140%; height: 140%; background: radial-gradient(ellipse, rgba(64,224,208,0.5) 0%, rgba(32,178,170,0.3) 40%, transparent 70%); filter: blur(30px); z-index: -1; animation: turboGlow 3s ease-in-out infinite; }
    @keyframes turboGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 30px 0; }
    .feature { background: rgba(64,224,208,0.05); padding: 18px; border-left: 3px solid #40e0d0; text-align: left; }
    .feature-num { color: #40e0d0; font-weight: 700; margin-right: 8px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #40e0d0, #20b2aa); color: #0f0f1a; padding: 16px 45px; text-decoration: none; font-weight: 700; margin: 30px 0; font-size: 0.9rem; letter-spacing: 1px; }
    .btn:hover { transform: scale(1.05); }
    .description { color: #aaa; line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 40px; color: #444; font-size: 11px; }
    @media (max-width: 500px) { .features { grid-template-columns: 1fr; } h1 { font-size: 1.9rem; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="number-badge">7</div>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map((f, i) => `<div class="feature"><span class="feature-num">${i + 1}.</span>${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template ASTROLOGUE - GLOW doré cosmique
function getAstrologueTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">⭐</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Raleway:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Raleway', sans-serif; min-height: 100vh; background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%); color: #f0e6ff; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%234a90d9' stroke-width='1'%3E%3Ccircle cx='400' cy='400' r='300' opacity='0.1'/%3E%3Ccircle cx='400' cy='400' r='200' opacity='0.1'/%3E%3Ccircle cx='400' cy='400' r='100' opacity='0.1'/%3E%3C/g%3E%3C/svg%3E"); background-position: center; animation: rotate 60s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .container { max-width: 550px; width: 100%; text-align: center; position: relative; z-index: 1; }
    .zodiac { font-size: 2rem; margin-bottom: 15px; letter-spacing: 15px; }
    h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; margin-bottom: 15px; color: #f8d866; font-weight: 400; }
    .subtitle { color: #8b8bbe; margin-bottom: 30px; font-size: 1rem; letter-spacing: 3px; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150%; height: 150%; background: radial-gradient(ellipse, rgba(248,216,102,0.5) 0%, rgba(74,144,217,0.2) 40%, transparent 60%); filter: blur(35px); z-index: -1; animation: cosmicGlow 4s ease-in-out infinite; }
    @keyframes cosmicGlow { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; }
    .feature { padding: 12px 0; border-bottom: 1px solid rgba(139,139,190,0.2); font-size: 1rem; }
    .feature::before { content: '★ '; color: #f8d866; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f8d866, #e6c84a); color: #1a1a3e; padding: 16px 45px; text-decoration: none; font-weight: 600; margin: 30px 0; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; border-radius: 0; }
    .btn:hover { transform: scale(1.05); }
    .description { color: #b8b8d8; line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 40px; color: #4a4a7a; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="zodiac">♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓</div>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template SOIN ÉNERGÉTIQUE - GLOW turquoise doux
function getSoinTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">💫</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&family=Poiret+One&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Quicksand', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #e8f4f8 0%, #d4e8f0 50%, #c8e0e8 100%); color: #2d4a5e; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: ''; position: fixed; top: 50%; left: 50%; width: 600px; height: 600px; margin: -300px 0 0 -300px; background: radial-gradient(circle, rgba(100,200,200,0.3) 0%, transparent 70%); animation: breathe 4s ease-in-out infinite; }
    @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
    .container { max-width: 520px; width: 100%; text-align: center; position: relative; z-index: 1; background: rgba(255,255,255,0.7); padding: 40px; border-radius: 30px; box-shadow: 0 20px 60px rgba(45,74,94,0.1); }
    .energy-icon { font-size: 3rem; margin-bottom: 15px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    h1 { font-family: 'Poiret One', cursive; font-size: 2.5rem; margin-bottom: 15px; color: #5a9; font-weight: 400; }
    .subtitle { color: #7ab; margin-bottom: 30px; font-size: 1rem; letter-spacing: 2px; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140%; height: 140%; background: radial-gradient(ellipse, rgba(90,153,153,0.4) 0%, rgba(100,200,200,0.2) 40%, transparent 70%); filter: blur(30px); z-index: -1; animation: healingGlow 3s ease-in-out infinite; }
    @keyframes healingGlow { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; border-radius: 20px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; }
    .feature { padding: 15px; margin: 10px 0; background: rgba(90,153,153,0.08); border-radius: 15px; font-size: 0.95rem; }
    .btn { display: inline-block; background: linear-gradient(135deg, #5a9, #4a8); color: white; padding: 16px 45px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 30px 0; font-size: 0.95rem; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(90,153,153,0.3); }
    .description { color: #5a7a8a; line-height: 1.8; margin: 20px 0; font-size: 1.05rem; }
    .footer { margin-top: 40px; color: #9ab; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="energy-icon">💫</div>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">✦ ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}

// Template MÉDITATION - GLOW ambre/terre
function getMeditationTemplate(data) {
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" class="product-image">`
    : `<div class="product-placeholder">🧘</div>`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Nunito', sans-serif; min-height: 100vh; background: linear-gradient(180deg, #2c1810 0%, #3d2314 50%, #2c1810 100%); color: #e8dcc8; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at 50% 0%, rgba(255,200,150,0.1) 0%, transparent 50%); animation: sunrise 8s ease-in-out infinite alternate; }
    @keyframes sunrise { 0% { opacity: 0.3; transform: translateY(0); } 100% { opacity: 0.6; transform: translateY(-20px); } }
    .container { max-width: 500px; width: 100%; text-align: center; position: relative; z-index: 1; }
    .om { font-family: 'Cormorant Garamond', serif; font-size: 4rem; margin-bottom: 15px; color: #c9a86c; opacity: 0.8; }
    h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; margin-bottom: 15px; color: #c9a86c; font-weight: 400; font-style: italic; }
    .subtitle { color: #a89070; margin-bottom: 30px; font-size: 1rem; letter-spacing: 4px; text-transform: uppercase; }
    .image-wrapper { position: relative; display: inline-block; margin: 20px 0; }
    .image-wrapper::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150%; height: 150%; background: radial-gradient(ellipse, rgba(201,168,108,0.4) 0%, rgba(255,200,150,0.2) 40%, transparent 60%); filter: blur(35px); z-index: -1; animation: earthGlow 4s ease-in-out infinite; }
    @keyframes earthGlow { 0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); } }
    .product-image { max-width: 100%; max-height: 350px; position: relative; z-index: 1; }
    .product-placeholder { font-size: 48px; position: relative; z-index: 1; }
    .features { margin: 30px 0; }
    .feature { padding: 12px 0; border-bottom: 1px solid rgba(201,168,108,0.2); font-size: 1rem; letter-spacing: 0.5px; }
    .btn { display: inline-block; background: transparent; color: #c9a86c; padding: 16px 45px; text-decoration: none; border: 2px solid #c9a86c; font-weight: 600; margin: 30px 0; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; }
    .btn:hover { background: rgba(201,168,108,0.1); }
    .description { color: #b8a890; line-height: 1.9; margin: 20px 0; font-size: 1.05rem; font-style: italic; }
    .footer { margin-top: 40px; color: #6a5a4a; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="om">ॐ</div>
    <h1>${data.headline}</h1>
    <p class="subtitle">${data.subheadline}</p>
    <div class="image-wrapper">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${data.features.map(f => `<div class="feature">— ${f}</div>`).join('')}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction}</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}
