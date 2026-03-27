// Serve generated site - /site/:id
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = params.id;
  
  if (!id) {
    return new Response('ID manquant', { status: 400 });
  }
  
  const data = await env.AFFILIATE_SITES.get(id);
  
  if (data) {
    const page = JSON.parse(data);
    return new Response(page.html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  return new Response('Page non trouvée', { status: 404 });
}
