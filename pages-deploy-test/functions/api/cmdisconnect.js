// GET /api/cmdisconnect - Disconnect all pages
export async function onRequestGet(context) {
  const { env } = context;
  
  await env.AFFILIATE_SITES.delete('cm_pages');
  await env.AFFILIATE_SITES.delete('cm_user_token');
  await env.AFFILIATE_SITES.delete('cm_slots');

  return new Response(JSON.stringify({
    success: true,
    message: 'Déconnecté avec succès'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
