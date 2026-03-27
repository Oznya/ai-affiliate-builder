// GET /api/cm-add-page - Add a specific page to connected pages
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

  const availablePages = JSON.parse(pagesData);
  const pageToAdd = availablePages.find(p => p.id === pageId);
  
  if (!pageToAdd) {
    return new Response(JSON.stringify({ error: 'Page non trouvée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Get existing pages
  const existingPagesRaw = await env.AFFILIATE_SITES.get('cm_pages');
  const existingPages = existingPagesRaw ? JSON.parse(existingPagesRaw) : [];
  
  // Check if already added
  if (existingPages.find(p => p.id === pageId)) {
    return new Response(JSON.stringify({ error: 'Page déjà connectée', alreadyExists: true }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Add the page
  existingPages.push({
    id: pageToAdd.id,
    name: pageToAdd.name,
    category: pageToAdd.category,
    token: pageToAdd.token,
    picture: pageToAdd.picture
  });

  await env.AFFILIATE_SITES.put('cm_pages', JSON.stringify(existingPages));

  return new Response(JSON.stringify({
    success: true,
    page: {
      id: pageToAdd.id,
      name: pageToAdd.name
    },
    total: existingPages.length
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
