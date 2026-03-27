// Handle page selection - POST /auth/select-page
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
    const { siteId, pageId, pageName, pageToken, productName } = body;

    if (!pageId || !pageToken) {
      return new Response(JSON.stringify({ error: 'Données manquantes' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Store the page token
    const key = `fb_${siteId}`;
    const data = {
      pageId,
      pageName,
      pageToken,
      productName: productName || 'Produit',
      siteId,
      connectedAt: new Date().toISOString()
    };

    await env.AFFILIATE_SITES.put(key, JSON.stringify(data));

    // Update the list of connected sites
    const listKey = 'fb_connected_sites';
    let connectedSites = [];

    try {
      const existing = await env.AFFILIATE_SITES.get(listKey);
      if (existing) {
        connectedSites = JSON.parse(existing);
      }
    } catch (e) {}

    // Remove existing and add new
    connectedSites = connectedSites.filter(s => s.siteId !== siteId);
    connectedSites.push({
      siteId,
      pageId,
      pageName,
      productName: productName || 'Produit',
      connectedAt: new Date().toISOString()
    });

    await env.AFFILIATE_SITES.put(listKey, JSON.stringify(connectedSites));

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
