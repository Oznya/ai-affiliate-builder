// Facebook OAuth Callback - Fixed version
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

    // Auto-select if only one page
    if (pages.length === 1) {
      const page = pages[0];
      await savePageToken(env, siteId, page.id, page.name, page.access_token, productName);
      return Response.redirect(redirectUrl + '?fb_connected=true&page_name=' + encodeURIComponent(page.name), 302);
    }

    // Multiple pages - show selection
    const pagesJson = JSON.stringify(pages);
    
    return new Response('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selectionnez votre Page</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;background:linear-gradient(135deg,#0B1F3A,#2B0F3A);color:white;display:flex;align-items:center;justify-content:center;padding:20px}.container{max-width:400px;width:100%;text-align:center}h1{font-size:1.5rem;margin-bottom:10px}.subtitle{color:#a5b4fc;margin-bottom:25px}.page-btn{display:flex;align-items:center;gap:12px;width:100%;padding:15px;margin-bottom:10px;background:rgba(24,119,242,0.15);border:1px solid rgba(24,119,242,0.3);border-radius:12px;color:white;text-align:left;cursor:pointer;transition:all .2s}.page-btn:hover{background:rgba(24,119,242,0.3);transform:scale(1.02)}.page-btn img{width:50px;height:50px;border-radius:50%}.page-name{font-weight:600}.page-category{font-size:12px;opacity:.7;margin-top:4px}.loading{display:none;color:#a5b4fc;margin-top:15px}</style></head><body><div class="container"><h1>Selectionnez votre Page</h1><p class="subtitle">Choisissez la Page Facebook pour la publication automatique</p><div id="pagesList"></div><div id="loading" class="loading">Connexion en cours...</div></div><script>const pagesData=' + pagesJson + ';const siteId="' + siteId + '";const productName="' + (productName || 'Produit') + '";const container=document.getElementById("pagesList");pagesData.forEach((p,i)=>{const b=document.createElement("button");b.className="page-btn";b.innerHTML="<img src="+(p.picture?.data?.url||"https://via.placeholder.com/50")+"><div><div class=page-name>"+p.name+"</div><div class=page-category>"+(p.category||"")+"</div></div>";b.onclick=()=>selectPage(i);container.appendChild(b)});async function selectPage(i){const p=pagesData[i];const l=document.getElementById("loading");const btns=document.querySelectorAll(".page-btn");btns.forEach(b=>b.disabled=true);l.style.display="block";try{const r=await fetch("/auth/select-page",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteId:siteId,pageId:p.id,pageName:p.name,pageToken:p.access_token,productName:productName})});const d=await r.json();if(d.success){window.location.href="/?fb_connected=true&page_name="+encodeURIComponent(p.name)}else{alert("Erreur: "+d.error);btns.forEach(b=>b.disabled=false);l.style.display="none"}}catch(e){alert("Erreur: "+e.message);btns.forEach(b=>b.disabled=false);l.style.display="none"}}</script></body></html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    return Response.redirect(redirectUrl + '?fb_error=' + encodeURIComponent(err.message), 302);
  }
}

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
// Force redeploy Tue Mar 24 19:21:40 UTC 2026

// Redeploy fix 1774380124
