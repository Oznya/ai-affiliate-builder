// Check Facebook connection status - GET /api/fb-status?siteId=xxx
// Sans siteId: retourne la liste de tous les sites connectés

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Si un siteId est fourni, retourner les infos de ce site
    if (siteId) {
      const key = `fb_${siteId}`;
      const data = await env.AFFILIATE_SITES.get(key);

      if (data) {
        const pageData = JSON.parse(data);
        const lastPost = await env.AFFILIATE_SITES.get(`lastpost_${siteId}`);
        
        return new Response(JSON.stringify({
          connected: true,
          pageName: pageData.pageName,
          pageId: pageData.pageId,
          connectedAt: pageData.connectedAt,
          lastPostDate: lastPost || null
        }), {
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ connected: false }), {
        headers: corsHeaders
      });
    }

    // Sinon, retourner la liste de tous les sites connectés
    const connected = await env.AFFILIATE_SITES.get('fb_connected_sites');
    
    if (!connected) {
      return new Response(JSON.stringify({ 
        connected: false, 
        sites: [] 
      }), {
        headers: corsHeaders
      });
    }

    const sites = JSON.parse(connected);
    
    // Enrichir avec les dates de dernière publication
    const enrichedSites = await Promise.all(sites.map(async (site) => {
      const lastPost = await env.AFFILIATE_SITES.get(`lastpost_${site.siteId}`);
      return {
        ...site,
        lastPostDate: lastPost || null
      };
    }));

    return new Response(JSON.stringify({
      connected: true,
      sites: enrichedSites
    }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      connected: false, 
      error: err.message 
    }), {
      headers: corsHeaders
    });
  }
}
