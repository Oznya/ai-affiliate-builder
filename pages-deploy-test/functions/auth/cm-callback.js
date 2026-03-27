// Community Manager OAuth Callback - Returns all pages for selection
const FB_APP_ID = '1489523952768079';
const FB_APP_SECRET = 'a1744d5b708a325800326fbba6c1d2f7';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error) {
    const errParam = encodeURIComponent(error);
    return new Response(`<html><body><script>window.location.href='/publication?error=${errParam}';</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (!code) {
    return new Response('<html><body><script>window.location.href="/publication?error=no_code";</script></body></html>', {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${url.origin}/auth/cm-callback&code=${code}`);
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      const errorMsg = encodeURIComponent(tokenData.error?.message || 'token_error');
      return new Response(`<html><body><script>window.location.href='/publication?error=${errorMsg}';</script></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const userToken = tokenData.access_token;

    // Get all pages with pagination
    let allPages = [];
    let nextUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}&fields=id,name,category,access_token,picture.type(square).width(50).height(50)&limit=100`;

    while (nextUrl) {
      const pagesRes = await fetch(nextUrl);
      const pagesData = await pagesRes.json();
      
      if (pagesData.data) {
        allPages = allPages.concat(pagesData.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          token: p.access_token,
          picture: p.picture?.data?.url || ''
        })));
      }
      
      nextUrl = pagesData.paging?.next;
    }

    // Store all pages temporarily with a key
    const pagesKey = 'cm_all_pages_' + Date.now();
    await env.AFFILIATE_SITES.put(pagesKey, JSON.stringify(allPages), { expirationTtl: 600 });

    // Get existing pages
    const existingPagesRaw = await env.AFFILIATE_SITES.get('cm_pages');
    const existingPages = existingPagesRaw ? JSON.parse(existingPagesRaw) : [];
    const existingIds = existingPages.map(p => p.id);

    // Redirect with pages for selection
    return new Response(`<html><body><script>window.location.href='/publication?select_pages=1&pages_key=${pagesKey}&count=${allPages.length}&existing=${existingIds.length}';</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (e) {
    const errMsg = encodeURIComponent(e.message || 'unknown_error');
    return new Response(`<html><body><script>window.location.href='/publication?error=${errMsg}';</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
