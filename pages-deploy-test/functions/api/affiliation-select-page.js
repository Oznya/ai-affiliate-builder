// GET /api/affiliation-select-page - Select a page and return its token
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const pagesKey = url.searchParams.get('pages_key');
  const pageId = url.searchParams.get('page_id');
  
  if (!pagesKey || !pageId) {
    return new Response(JSON.stringify({ error: 'pages_key et page_id requis' }), {
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

  const pages = JSON.parse(pagesData);
  const selectedPage = pages.find(p => p.id === pageId);
  
  if (!selectedPage) {
    return new Response(JSON.stringify({ error: 'Page non trouvée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Store the selected page token
  await env.AFFILIATE_SITES.put('aff_fb_token_' + pageId, selectedPage.token, { expirationTtl: 600 });

  // Return the token to the frontend so it can use it immediately
  return new Response(JSON.stringify({
    success: true,
    page: {
      id: selectedPage.id,
      name: selectedPage.name,
      token: selectedPage.token  // IMPORTANT: return token to frontend
    }
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
