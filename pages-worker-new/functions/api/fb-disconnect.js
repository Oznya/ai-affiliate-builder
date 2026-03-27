// API: Disconnect Facebook - DELETE /api/fb-disconnect?siteId=xxx
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!siteId) {
    return new Response(JSON.stringify({ success: false, error: 'siteId requis' }), {
      headers: corsHeaders
    });
  }

  try {
    // Delete the page token
    const pageKey = `fb_${siteId}`;
    await env.AFFILIATE_SITES.delete(pageKey);

    // Remove from connected sites list
    const listKey = 'fb_connected_sites';
    const existing = await env.AFFILIATE_SITES.get(listKey);
    
    if (existing) {
      let connectedSites = JSON.parse(existing);
      connectedSites = connectedSites.filter(s => s.siteId !== siteId);
      await env.AFFILIATE_SITES.put(listKey, JSON.stringify(connectedSites));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: corsHeaders
    });
  }
}
