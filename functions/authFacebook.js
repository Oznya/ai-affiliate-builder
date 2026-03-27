// GET /auth-facebook - Démarrer OAuth Facebook
export async function onRequestGet(context) {
  const { env, request } = context;

  const FB_APP_ID = env.FB_APP_ID;

  if (!FB_APP_ID) {
    return new Response('Erreur: FB_APP_ID non configuré', { status: 500 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session') || crypto.randomUUID().substring(0, 8);

  const redirectUri = encodeURIComponent(`${url.origin}/auth-callback`);
  const scope = encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_posts');
  const state = encodeURIComponent(sessionId);

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;

  return Response.redirect(authUrl, 302);
}
