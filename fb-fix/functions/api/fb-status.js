// Check Facebook connection status - GET /api/fb-status?siteId=xxx
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!siteId) {
    return new Response(JSON.stringify({ connected: false }), {
      headers: corsHeaders
    });
  }

  try {
    const key = `fb_${siteId}`;
    const data = await env.AFFILIATE_SITES.get(key);

    if (data) {
      const pageData = JSON.parse(data);
      return new Response(JSON.stringify({
        connected: true,
        pageName: pageData.pageName,
        pageId: pageData.pageId,
        connectedAt: pageData.connectedAt
      }), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ connected: false }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ connected: false, error: err.message }), {
      headers: corsHeaders
    });
  }
}
