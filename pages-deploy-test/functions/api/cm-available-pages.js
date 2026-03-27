// GET /api/cm-available-pages - Get all available pages for selection
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

  // Get existing pages to mark which are already connected
  const existingPagesRaw = await env.AFFILIATE_SITES.get('cm_pages');
  const existingPages = existingPagesRaw ? JSON.parse(existingPagesRaw) : [];
  const existingIds = existingPages.map(p => p.id);

  return new Response(JSON.stringify({
    pages: JSON.parse(pagesData),
    existingIds: existingIds
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
