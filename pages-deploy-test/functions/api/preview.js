// GET /api/preview - Preview a template
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const template = url.searchParams.get('t') || 'modern';
  
  // Sample data for preview
  const sampleData = {
    headline: 'Découvrez ce Produit Incroyable',
    subheadline: 'Transformez votre quotidien dès aujourd\'hui',
    productName: 'Produit Exclusif',
    description: 'Ce produit de qualité supérieure a été conçu pour répondre à tous vos besoins. Découvrez une nouvelle façon de vivre.',
    features: ['100% Naturel', 'Résultats Garantis', 'Livraison Rapide', 'Satisfait ou Remboursé'],
    callToAction: 'Découvrir Maintenant',
    affiliateLink: '#',
    productImage: null
  };
  
  const html = getTemplate(template, sampleData);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function getTemplate(name, d) {
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
  
  const fn = templates[name] || templates.modern;
  return fn(d);
}

// Template Modern - GLOW pourpre/bleu
function getModernTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Modern</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Inter,sans-serif;min-height:100vh;background:linear-gradient(135deg,#0B1F3A,#2B0F3A,#0B1F3A);color:#fff;display:flex;align-items:center;justify-content:center;padding:20px}
    .c{max-width:600px;width:100%;text-align:center}
    h1{font-size:2.5rem;margin-bottom:15px;background:linear-gradient(135deg,#fff,#a5b4fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .s{color:#a5b4fc;margin-bottom:30px;font-size:1.2rem}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:120%;height:120%;background:radial-gradient(ellipse,rgba(99,102,241,0.4) 0%,rgba(168,85,247,0.3) 30%,transparent 70%);filter:blur(30px);z-index:-1;animation:g 3s ease-in-out infinite}
    @keyframes g{0%,100%{opacity:0.8;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
    .p{padding:50px;font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:30px 0}
    .fi{background:rgba(255,255,255,.05);padding:20px;border-radius:12px;border:1px solid rgba(99,102,241,.2)}
    .b{display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:18px 50px;text-decoration:none;border-radius:12px;font-weight:600;margin:30px 0;font-size:1.1rem}
    .d{color:#a5b4fc;line-height:1.8;margin:20px 0;font-size:1.1rem}
    .ft{margin-top:40px;color:#6b7280;font-size:12px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:1.8rem}}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">📦</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✓ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction} →</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template Dark Pro - GLOW doré
function getDarkTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dark Pro</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Inter,sans-serif;min-height:100vh;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
    body::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(212,175,55,.1),transparent 50%),radial-gradient(circle at 80% 50%,rgba(212,175,55,.1),transparent 50%)}
    .c{max-width:600px;width:100%;text-align:center;position:relative;z-index:1}
    h1{font-family:Playfair Display,serif;font-size:2.8rem;margin-bottom:15px;color:#d4af37}
    .s{color:#888;margin-bottom:30px;font-size:1.1rem;letter-spacing:2px;text-transform:uppercase}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:130%;height:130%;background:radial-gradient(ellipse,rgba(212,175,55,0.5) 0%,rgba(184,150,46,0.3) 40%,transparent 70%);filter:blur(25px);z-index:-1;animation:g 2.5s ease-in-out infinite}
    @keyframes g{0%,100%{opacity:0.7}50%{opacity:1}}
    .p{padding:50px;font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:30px 0}
    .fi{background:rgba(255,255,255,.03);padding:20px;border-left:3px solid #d4af37;text-align:left}
    .b{display:inline-block;background:linear-gradient(135deg,#d4af37,#b8962e);color:#0a0a0a;padding:18px 50px;text-decoration:none;font-weight:700;margin:30px 0;font-size:1rem;letter-spacing:1px;text-transform:uppercase}
    .d{color:#aaa;line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:40px;color:#444;font-size:11px;letter-spacing:1px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:2rem}}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">📦</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✓ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template Minimal - GLOW gris doux
function getMinimalTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Minimal</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Space Grotesk,sans-serif;min-height:100vh;background:#fafafa;color:#1a1a1a;display:flex;align-items:center;justify-content:center;padding:20px}
    .c{max-width:500px;width:100%;text-align:center}
    h1{font-size:2.2rem;margin-bottom:10px;font-weight:600}
    .s{color:#666;margin-bottom:30px;font-size:1rem}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:120%;height:120%;background:radial-gradient(ellipse,rgba(100,100,100,0.15) 0%,transparent 70%);filter:blur(30px);z-index:-1}
    .p{padding:60px;font-size:48px}
    .f{margin:30px 0;text-align:left}
    .fi{padding:12px 0;border-bottom:1px solid #eee}
    .b{display:inline-block;background:#1a1a1a;color:#fff;padding:16px 40px;text-decoration:none;font-weight:600;margin:30px 0}
    .d{color:#444;line-height:1.7;margin:20px 0;font-size:1rem}
    .ft{margin-top:40px;color:#999;font-size:11px}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">📦</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">— '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template Gradient - GLOW arc-en-ciel
function getGradientTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Gradient</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Poppins,sans-serif;min-height:100vh;background:linear-gradient(-45deg,#ee7752,#e73c7e,#23a6d5,#23d5ab);background-size:400% 400%;animation:gbg 15s ease infinite;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px}
    @keyframes gbg{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    .c{max-width:600px;width:100%;text-align:center;background:rgba(255,255,255,.1);backdrop-filter:blur(10px);padding:40px;border-radius:20px}
    h1{font-size:2.5rem;margin-bottom:15px;text-shadow:2px 2px 10px rgba(0,0,0,.2)}
    .s{color:rgba(255,255,255,.9);margin-bottom:30px;font-size:1.1rem}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140%;height:140%;background:radial-gradient(ellipse,rgba(255,255,255,0.4) 0%,rgba(231,60,126,0.3) 30%,rgba(35,166,213,0.2) 50%,transparent 70%);filter:blur(25px);z-index:-1;animation:rg 4s ease-in-out infinite}
    @keyframes rg{0%,100%{opacity:0.8;transform:translate(-50%,-50%) scale(1) rotate(0deg)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1) rotate(10deg)}}
    .p{padding:50px;font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:30px 0}
    .fi{background:rgba(255,255,255,.2);padding:20px;border-radius:12px}
    .b{display:inline-block;background:#fff;color:#e73c7e;padding:18px 50px;text-decoration:none;border-radius:50px;font-weight:700;margin:30px 0;font-size:1.1rem;box-shadow:0 10px 30px rgba(0,0,0,.2)}
    .d{color:rgba(255,255,255,.95);line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:30px;color:rgba(255,255,255,.6);font-size:11px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:1.8rem}}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">📦</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✓ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction} →</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template ZEN - GLOW vert sauge
function getZenTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Zen</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Quicksand:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Quicksand,sans-serif;min-height:100vh;background:linear-gradient(180deg,#f5f0e8,#e8e0d5);color:#4a4a4a;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b896' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");opacity:.5;animation:fl 20s ease-in-out infinite}
    @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
    .c{max-width:550px;width:100%;text-align:center;position:relative;z-index:1}
    h1{font-family:Cormorant Garamond,serif;font-size:2.8rem;margin-bottom:15px;color:#5d6b4d;font-weight:400}
    .s{color:#8b8b7a;margin-bottom:30px;font-size:1rem;letter-spacing:3px;text-transform:uppercase}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140%;height:140%;background:radial-gradient(ellipse,rgba(147,168,116,0.3) 0%,rgba(201,184,150,0.2) 40%,transparent 70%);filter:blur(35px);z-index:-1;animation:zg 4s ease-in-out infinite}
    @keyframes zg{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.9;transform:translate(-50%,-50%) scale(1.05)}}
    .p{font-size:48px}
    .f{margin:30px 0}
    .fi{padding:15px;margin:10px 0;background:rgba(255,255,255,.5);border-radius:8px;font-size:.95rem}
    .b{display:inline-block;background:#5d6b4d;color:#fff;padding:16px 45px;text-decoration:none;border-radius:30px;font-weight:500;margin:30px 0;font-size:.95rem;letter-spacing:1px}
    .d{color:#6b6b5a;line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:40px;color:#a0a090;font-size:11px}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">🪷</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✿ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template COACH - GLOW orange feu
function getCoachTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Coach</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Open Sans,sans-serif;min-height:100vh;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,107,53,.1),transparent 50%);animation:ps 4s ease-in-out infinite}
    @keyframes ps{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:.8}}
    .c{max-width:600px;width:100%;text-align:center;position:relative;z-index:1}
    .bd{display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);padding:8px 20px;border-radius:20px;font-size:.8rem;font-weight:600;margin-bottom:20px;letter-spacing:1px}
    h1{font-family:Montserrat,sans-serif;font-size:2.5rem;margin-bottom:15px;font-weight:800;text-transform:uppercase;letter-spacing:-1px}
    .s{color:#ff6b35;margin-bottom:30px;font-size:1.1rem;font-weight:600}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140%;height:140%;background:radial-gradient(ellipse,rgba(255,107,53,0.5) 0%,rgba(247,147,30,0.3) 40%,transparent 70%);filter:blur(30px);z-index:-1;animation:fg 2s ease-in-out infinite}
    @keyframes fg{0%,100%{opacity:0.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
    .p{font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:30px 0}
    .fi{background:rgba(255,255,255,.05);padding:20px;border-radius:10px;border-left:4px solid #ff6b35;text-align:left}
    .b{display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;padding:18px 50px;text-decoration:none;border-radius:50px;font-weight:700;margin:30px 0;font-size:1rem;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 30px rgba(255,107,53,.4)}
    .d{color:#bbb;line-height:1.8;margin:20px 0;font-size:1rem}
    .ft{margin-top:40px;color:#555;font-size:11px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:1.8rem}}
  </style>
</head>
<body><div class="c"><span class="bd">🔥 OFFRE EXCLUSIVE</span><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">🎯</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✓ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template BUSINESS - GLOW bleu électrique
function getBusinessTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Business</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:DM Sans,sans-serif;min-height:100vh;background:#0c0c0c;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'';position:fixed;inset:0;background:linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px),linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px);background-size:50px 50px;animation:gm 20s linear infinite}
    @keyframes gm{0%{transform:translate(0,0)}100%{transform:translate(50px,50px)}}
    .c{max-width:650px;width:100%;text-align:center;position:relative;z-index:1}
    h1{font-family:DM Serif Display,serif;font-size:3rem;margin-bottom:15px;color:#3b82f6}
    .s{color:#64748b;margin-bottom:30px;font-size:1rem;letter-spacing:2px;text-transform:uppercase}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:130%;height:130%;background:radial-gradient(ellipse,rgba(59,130,246,0.5) 0%,rgba(37,99,235,0.3) 40%,transparent 70%);filter:blur(30px);z-index:-1;animation:bg 3s ease-in-out infinite}
    @keyframes bg{0%,100%{opacity:0.6}50%{opacity:1}}
    .p{font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:30px 0}
    .fi{background:rgba(255,255,255,.02);padding:18px;border:1px solid rgba(59,130,246,.2);text-align:left;font-size:.9rem}
    .fi::before{content:'→';color:#3b82f6;margin-right:10px}
    .b{display:inline-block;background:#3b82f6;color:#fff;padding:18px 50px;text-decoration:none;font-weight:700;margin:30px 0;font-size:.9rem;letter-spacing:1px;text-transform:uppercase}
    .d{color:#94a3b8;line-height:1.8;margin:20px 0;font-size:1rem}
    .ft{margin-top:40px;color:#334155;font-size:11px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:2rem}}
  </style>
</head>
<body><div class="c"><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">💼</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">'+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template TAROLOGUE - GLOW violet mystique
function getTarologueTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tarologue</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Crimson Text,serif;min-height:100vh;background:linear-gradient(135deg,#1a0a2e,#2d1b4e,#1a0a2e);color:#e8d5f2;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
    body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50' y='55' font-size='30' text-anchor='middle' fill='%239b59b6' opacity='0.1'%3E✧%3C/text%3E%3C/svg%3E");animation:tw 3s ease-in-out infinite}
    @keyframes tw{0%,100%{opacity:.3}50%{opacity:.6}}
    .c{max-width:550px;width:100%;text-align:center;position:relative;z-index:1;border:1px solid rgba(155,89,182,.3);padding:40px;background:rgba(26,10,46,.8)}
    .st{font-size:1.5rem;margin-bottom:20px;letter-spacing:10px;animation:gl 2s ease-in-out infinite}
    @keyframes gl{0%,100%{text-shadow:0 0 10px rgba(155,89,182,.5)}50%{text-shadow:0 0 20px rgba(155,89,182,.8),0 0 30px rgba(155,89,182,.5)}}
    h1{font-family:Cinzel,serif;font-size:2.5rem;margin-bottom:15px;color:#d4af37;font-weight:400;letter-spacing:3px}
    .s{color:#b388ff;margin-bottom:30px;font-size:1.1rem;font-style:italic}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:150%;height:150%;background:radial-gradient(ellipse,rgba(155,89,182,0.5) 0%,rgba(212,175,55,0.3) 30%,transparent 60%);filter:blur(30px);z-index:-1;animation:mg 3s ease-in-out infinite}
    @keyframes mg{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
    .p{font-size:48px}
    .f{margin:30px 0}
    .fi{padding:12px;margin:8px 0;border-bottom:1px solid rgba(155,89,182,.2);font-size:1.05rem}
    .fi::before{content:'✧ ';color:#d4af37}
    .b{display:inline-block;background:linear-gradient(135deg,#d4af37,#b8962e);color:#1a0a2e;padding:16px 45px;text-decoration:none;font-weight:700;margin:30px 0;font-size:.9rem;letter-spacing:2px;text-transform:uppercase}
    .d{color:#c9b8d9;line-height:1.8;margin:20px 0;font-size:1.1rem;font-style:italic}
    .ft{margin-top:40px;color:#6b5b7a;font-size:11px}
  </style>
</head>
<body><div class="c"><div class="st">✧ ✧ ✧</div><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">🔮</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">'+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template NUMÉROLOGUE - GLOW turquoise
function getNumerologueTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Numérologue</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Lato,sans-serif;min-height:100vh;background:#0f0f1a;color:#e0e0e0;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'11:22:33:44:55';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:15rem;font-weight:700;color:rgba(64,224,208,.03);letter-spacing:-5px;white-space:nowrap;animation:nf 30s linear infinite}
    @keyframes nf{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
    .c{max-width:550px;width:100%;text-align:center;position:relative;z-index:1}
    .nb{display:inline-block;background:linear-gradient(135deg,#40e0d0,#20b2aa);color:#0f0f1a;width:60px;height:60px;line-height:60px;border-radius:50%;font-size:1.8rem;font-weight:700;margin-bottom:20px}
    h1{font-family:Playfair Display,serif;font-size:2.5rem;margin-bottom:15px;color:#40e0d0}
    .s{color:#888;margin-bottom:30px;font-size:1rem;letter-spacing:4px}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140%;height:140%;background:radial-gradient(ellipse,rgba(64,224,208,0.5) 0%,rgba(32,178,170,0.3) 40%,transparent 70%);filter:blur(30px);z-index:-1;animation:tug 3s ease-in-out infinite}
    @keyframes tug{0%,100%{opacity:0.7}50%{opacity:1}}
    .p{font-size:48px}
    .f{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:30px 0}
    .fi{background:rgba(64,224,208,.05);padding:18px;border-left:3px solid #40e0d0;text-align:left}
    .fn{color:#40e0d0;font-weight:700;margin-right:8px}
    .b{display:inline-block;background:linear-gradient(135deg,#40e0d0,#20b2aa);color:#0f0f1a;padding:16px 45px;text-decoration:none;font-weight:700;margin:30px 0;font-size:.9rem;letter-spacing:1px}
    .d{color:#aaa;line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:40px;color:#444;font-size:11px}
    @media(max-width:500px){.f{grid-template-columns:1fr}h1{font-size:1.9rem}}
  </style>
</head>
<body><div class="c"><div class="nb">7</div><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">🔢</div></div><p class="d">${d.description}</p><div class="f">${d.features.map((f,i)=>'<div class="fi"><span class="fn">'+(i+1)+'.</span>'+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template ASTROLOGUE - GLOW doré cosmique
function getAstrologueTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Astrologue</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Raleway:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Raleway,sans-serif;min-height:100vh;background:radial-gradient(ellipse at center,#1a1a3e,#0a0a1a);color:#f0e6ff;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
    body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%234a90d9' stroke-width='1'%3E%3Ccircle cx='400' cy='400' r='300' opacity='0.1'/%3E%3Ccircle cx='400' cy='400' r='200' opacity='0.1'/%3E%3Ccircle cx='400' cy='400' r='100' opacity='0.1'/%3E%3C/g%3E%3C/svg%3E");background-position:center;animation:rt 60s linear infinite}
    @keyframes rt{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .c{max-width:550px;width:100%;text-align:center;position:relative;z-index:1}
    .z{font-size:2rem;margin-bottom:15px;letter-spacing:15px}
    h1{font-family:Cormorant Garamond,serif;font-size:2.8rem;margin-bottom:15px;color:#f8d866;font-weight:400}
    .s{color:#8b8bbe;margin-bottom:30px;font-size:1rem;letter-spacing:3px}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:150%;height:150%;background:radial-gradient(ellipse,rgba(248,216,102,0.5) 0%,rgba(74,144,217,0.2) 40%,transparent 60%);filter:blur(35px);z-index:-1;animation:cg 4s ease-in-out infinite}
    @keyframes cg{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
    .p{font-size:48px}
    .f{margin:30px 0}
    .fi{padding:12px 0;border-bottom:1px solid rgba(139,139,190,.2);font-size:1rem}
    .fi::before{content:'★ ';color:#f8d866}
    .b{display:inline-block;background:linear-gradient(135deg,#f8d866,#e6c84a);color:#1a1a3e;padding:16px 45px;text-decoration:none;font-weight:600;margin:30px 0;font-size:.9rem;letter-spacing:2px;text-transform:uppercase}
    .d{color:#b8b8d8;line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:40px;color:#4a4a7a;font-size:11px}
  </style>
</head>
<body><div class="c"><div class="z">♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓</div><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">⭐</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">'+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template SOIN - GLOW turquoise doux
function getSoinTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Soin Énergétique</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&family=Poiret+One&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Quicksand,sans-serif;min-height:100vh;background:linear-gradient(135deg,#e8f4f8,#d4e8f0,#c8e0e8);color:#2d4a5e;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'';position:fixed;top:50%;left:50%;width:600px;height:600px;margin:-300px 0 0 -300px;background:radial-gradient(circle,rgba(100,200,200,.3),transparent 70%);animation:br 4s ease-in-out infinite}
    @keyframes br{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.2);opacity:.8}}
    .c{max-width:520px;width:100%;text-align:center;position:relative;z-index:1;background:rgba(255,255,255,.7);padding:40px;border-radius:30px;box-shadow:0 20px 60px rgba(45,74,94,.1)}
    .ei{font-size:3rem;margin-bottom:15px;animation:ps 2s ease-in-out infinite}
    @keyframes ps{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    h1{font-family:Poiret One,cursive;font-size:2.5rem;margin-bottom:15px;color:#5a9;font-weight:400}
    .s{color:#7ab;margin-bottom:30px;font-size:1rem;letter-spacing:2px}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140%;height:140%;background:radial-gradient(ellipse,rgba(90,153,153,0.4) 0%,rgba(100,200,200,0.2) 40%,transparent 70%);filter:blur(30px);z-index:-1;animation:hg 3s ease-in-out infinite}
    @keyframes hg{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
    .p{font-size:48px}
    .f{margin:30px 0}
    .fi{padding:15px;margin:10px 0;background:rgba(90,153,153,.08);border-radius:15px;font-size:.95rem}
    .b{display:inline-block;background:linear-gradient(135deg,#5a9,#4a8);color:#fff;padding:16px 45px;text-decoration:none;border-radius:25px;font-weight:600;margin:30px 0;font-size:.95rem}
    .d{color:#5a7a8a;line-height:1.8;margin:20px 0;font-size:1.05rem}
    .ft{margin-top:40px;color:#9ab;font-size:11px}
  </style>
</head>
<body><div class="c"><div class="ei">💫</div><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">💫</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">✦ '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}

// Template MÉDITATION - GLOW ambre/terre
function getMeditationTemplate(d) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Méditation</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Nunito,sans-serif;min-height:100vh;background:linear-gradient(180deg,#2c1810,#3d2314,#2c1810);color:#e8dcc8;display:flex;align-items:center;justify-content:center;padding:20px;position:relative}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,200,150,.1),transparent 50%);animation:sr 8s ease-in-out infinite alternate}
    @keyframes sr{0%{opacity:.3;transform:translateY(0)}100%{opacity:.6;transform:translateY(-20px)}}
    .c{max-width:500px;width:100%;text-align:center;position:relative;z-index:1}
    .om{font-family:Cormorant Garamond,serif;font-size:4rem;margin-bottom:15px;color:#c9a86c;opacity:.8}
    h1{font-family:Cormorant Garamond,serif;font-size:2.8rem;margin-bottom:15px;color:#c9a86c;font-weight:400;font-style:italic}
    .s{color:#a89070;margin-bottom:30px;font-size:1rem;letter-spacing:4px;text-transform:uppercase}
    .iw{position:relative;display:inline-block;margin:20px 0}
    .iw::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:150%;height:150%;background:radial-gradient(ellipse,rgba(201,168,108,0.4) 0%,rgba(255,200,150,0.2) 40%,transparent 60%);filter:blur(35px);z-index:-1;animation:eg 4s ease-in-out infinite}
    @keyframes eg{0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.8;transform:translate(-50%,-50%) scale(1.1)}}
    .p{font-size:48px}
    .f{margin:30px 0}
    .fi{padding:12px 0;border-bottom:1px solid rgba(201,168,108,.2);font-size:1rem;letter-spacing:.5px}
    .b{display:inline-block;background:transparent;color:#c9a86c;padding:16px 45px;text-decoration:none;border:2px solid #c9a86c;font-weight:600;margin:30px 0;font-size:.9rem;letter-spacing:2px;text-transform:uppercase}
    .d{color:#b8a890;line-height:1.9;margin:20px 0;font-size:1.05rem;font-style:italic}
    .ft{margin-top:40px;color:#6a5a4a;font-size:11px}
  </style>
</head>
<body><div class="c"><div class="om">ॐ</div><h1>${d.headline}</h1><p class="s">${d.subheadline}</p><div class="iw"><div class="p">🧘</div></div><p class="d">${d.description}</p><div class="f">${d.features.map(f=>'<div class="fi">— '+f+'</div>').join('')}</div><a href="#" class="b">${d.callToAction}</a><p class="ft">Créé par Publication-Web</p></div></body></html>`;
}
