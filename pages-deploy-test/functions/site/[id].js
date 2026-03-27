// GET /site/:id - Get affiliate site
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  // Extract ID from path
  const pathParts = url.pathname.split('/');
  const id = pathParts[2]; // /site/{id}
  
  if (!id) {
    return new Response('ID manquant', { status: 400 });
  }
  
  const data = await env.AFFILIATE_SITES.get(id);
  
  if (!data) {
    return new Response('Site not found', { status: 404 });
  }
  
  const siteData = JSON.parse(data);
  siteData.views = (siteData.views || 0) + 1;
  await env.AFFILIATE_SITES.put(id, JSON.stringify(siteData));
  
  return new Response(siteData.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
