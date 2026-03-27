// GET /api/affiliation-fb-status - Get affiliation FB token
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const pageId = url.searchParams.get('page_id');
  if (!pageId) {
    return new Response(JSON.stringify({ error: 'page_id requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const token = await env.AFFILIATE_SITES.get('aff_fb_token_' + pageId);
  return new Response(JSON.stringify({
    token: token || null
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
