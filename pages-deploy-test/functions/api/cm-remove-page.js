// GET /api/cm-remove-page - Remove a specific page from connected pages
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

  // Get existing pages
  const existingPagesRaw = await env.AFFILIATE_SITES.get('cm_pages');
  if (!existingPagesRaw) {
    return new Response(JSON.stringify({ error: 'Aucune page connectée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let existingPages = JSON.parse(existingPagesRaw);
  const initialLength = existingPages.length;
  
  // Remove the page
  existingPages = existingPages.filter(p => p.id !== pageId);

  if (existingPages.length === initialLength) {
    return new Response(JSON.stringify({ error: 'Page non trouvée' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Save updated list
  if (existingPages.length === 0) {
    await env.AFFILIATE_SITES.delete('cm_pages');
  } else {
    await env.AFFILIATE_SITES.put('cm_pages', JSON.stringify(existingPages));
  }

  return new Response(JSON.stringify({
    success: true,
    total: existingPages.length
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
