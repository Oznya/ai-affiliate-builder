// GET /site/:id - Afficher une page générée
export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  if (!env.AFFILIATE_SITES) {
    return new Response('Base de données non disponible', { status: 500 });
  }

  const data = await env.AFFILIATE_SITES.get(id);

  if (!data) {
    return new Response('Page non trouvée', { status: 404 });
  }

  const pageData = JSON.parse(data);

  // Incrémenter les vues
  pageData.views = (pageData.views || 0) + 1;
  await env.AFFILIATE_SITES.put(id, JSON.stringify(pageData));

  return new Response(pageData.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
