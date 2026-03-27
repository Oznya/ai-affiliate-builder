// GET /auth-session - Récupérer les pages Facebook du client
export async function onRequestGet(context) {
  const { env, request } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const url = new URL(request.url);
  const session = url.searchParams.get('session');

  if (!session) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Session non fournie',
      needsAuth: true
    }), { headers: corsHeaders });
  }

  const sessionData = await env.AFFILIATE_SITES.get(`fb_${session}`);

  if (!sessionData) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Session expirée',
      needsAuth: true
    }), { headers: corsHeaders });
  }

  const data = JSON.parse(sessionData);

  return new Response(JSON.stringify({
    success: true,
    pages: data.pages,
    connected: true
  }), { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
