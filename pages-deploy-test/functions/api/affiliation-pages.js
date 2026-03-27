// GET /api/affiliation-pages - Get all pages for selection
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const pagesKey = url.searchParams.get('pages_key');
  if (!pagesKey) {
    return new Response(JSON.stringify({ error: 'pages_key requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const pagesData = await env.AFFILIATE_SITES.get(pagesKey);
  if (!pagesData) {
    return new Response(JSON.stringify({ error: 'Pages expirées, veuillez vous reconnecter' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  return new Response(JSON.stringify({
    pages: JSON.parse(pagesData)
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
