// GET /auth-callback - Callback OAuth Facebook
export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const session = url.searchParams.get('state') || 'default';

  if (!code) {
    return new Response('Erreur: Pas de code d\'autorisation', { status: 400 });
  }

  const FB_APP_ID = env.FB_APP_ID;
  const FB_APP_SECRET = env.FB_APP_SECRET;
  const redirectUri = `${url.origin}/auth-callback`;

  const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

  try {
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Erreur Facebook: ${tokenData.error.message}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,picture`
    );
    const pagesData = await pagesResponse.json();

    const clientData = {
      accessToken,
      pages: pagesData.data || [],
      connectedAt: new Date().toISOString()
    };

    await env.AFFILIATE_SITES.put(`fb_${session}`, JSON.stringify(clientData), {
      expirationTtl: 3600
    });

    return Response.redirect(`${url.origin}/?fb_session=${session}`, 302);

  } catch (error) {
    return new Response(`Erreur: ${error.message}`, { status: 500 });
  }
}
