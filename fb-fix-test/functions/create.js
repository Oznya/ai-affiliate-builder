// API: Create Page - POST /create
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
    const affiliateLink = body.link;
    const customName = body.name;
    const productImage = body.image;
    const niche = body.niche || 'général';
    const template = body.template || 'modern';
    const customDescription = body.customDescription;
    const customFeatures = body.customFeatures;
    
    if (!affiliateLink) {
      return new Response(JSON.stringify({ error: 'Lien affilié requis' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const id = crypto.randomUUID().substring(0, 8);
    const productName = customName || extractProductName(affiliateLink);
    
    let content;
    if (customDescription || customFeatures) {
      content = {
        headline: productName,
        subheadline: niche ? `Pour votre ${niche}` : 'Découvrez cette offre exclusive',
        description: customDescription || `${productName} est un produit de qualité.`,
        features: customFeatures 
          ? customFeatures.split('\n').filter(f => f.trim()).map(f => f.trim())
          : ['Qualité supérieure', 'Livraison rapide', 'Excellent rapport qualité-prix'],
        pros: ['Produit recommandé', 'Satisfaction garantie'],
        cons: ['Stock limité'],
        callToAction: 'Découvrir maintenant'
      };
    } else {
      content = await generateContent(productName, niche, env.GROQ_API_KEY);
    }
    
    const pageData = { ...content, productName, affiliateLink, productImage };
    const html = getTemplate(template, pageData);
    
    await env.AFFILIATE_SITES.put(id, JSON.stringify({
      html,
      affiliateLink,
      productName,
      productImage,
      createdAt: new Date().toISOString(),
      views: 0
    }));
    
    const url = new URL(request.url);
    const siteUrl = `${url.origin}/site/${id}`;
    
    return new Response(JSON.stringify({
      success: true,
      url: siteUrl,
      id
    }), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    projet: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
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

async function generateContent(productName, niche, groqApiKey) {
  if (!groqApiKey) return getFallbackContent(productName);
  
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
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
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
  const imageHtml = data.productImage 
    ? `<img src="${data.productImage}" alt="${data.productName}" style="max-width:100%;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.3);">`
    : `<div style="padding:50px;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2));border-radius:16px;font-size:48px;">📦</div>`;
  
  const featuresHtml = data.features.map(f => `<div style="background:rgba(255,255,255,0.05);padding:20px;border-radius:12px;border:1px solid rgba(99,102,241,0.2);">✓ ${f}</div>`).join('');
  
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
    .product-image { margin: 30px 0; }
    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
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
    <div class="product-image">${imageHtml}</div>
    <p class="description">${data.description}</p>
    <div class="features">${featuresHtml}</div>
    <a href="${data.affiliateLink}" class="btn" target="_blank">${data.callToAction} →</a>
    <p class="footer">Créé par Publication-Web</p>
  </div>
</body>
</html>`;
}
