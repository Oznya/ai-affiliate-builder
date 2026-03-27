// Affiliation OAuth Callback - Returns ALL pages for selection
const FB_APP_ID = '1489523952768079';
const FB_APP_SECRET = 'a1744d5b708a325800326fbba6c1d2f7';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error || !code) {
    return new Response(`<html><body><script>window.location.href='/affiliation?error=1';</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${url.origin}/auth/affiliation-callback&code=${code}`);
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      return new Response(`<html><body><script>window.location.href='/affiliation?error=token';</script></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const userToken = tokenData.access_token;

    // Get ALL pages with pagination
    let allPages = [];
    let nextUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}&fields=id,name,access_token,picture.type(square).width(50).height(50)&limit=100`;

    while (nextUrl) {
      const pagesRes = await fetch(nextUrl);
      const pagesData = await pagesRes.json();
      
      if (pagesData.data) {
        allPages = allPages.concat(pagesData.data.map(p => ({
          id: p.id,
          name: p.name,
          token: p.access_token,
          picture: p.picture?.data?.url || ''
        })));
      }
      nextUrl = pagesData.paging?.next;
    }

    // Store all pages temporarily
    const pagesKey = 'aff_fb_all_pages_' + Date.now();
    await env.AFFILIATE_SITES.put(pagesKey, JSON.stringify(allPages), { expirationTtl: 600 });

    // Build URL with all pages for selection
    const pagesParam = encodeURIComponent(JSON.stringify(allPages));
    
    return new Response(`<html><body><script>window.location.href='/affiliation?show_pages=1&pages_key=${pagesKey}&count=${allPages.length}';</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (e) {
    const errMsg = e.message || 'unknown_error';
    return new Response(`<html><body><script>window.location.href='/affiliation?error=' + encodeURIComponent('${errMsg}');</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
