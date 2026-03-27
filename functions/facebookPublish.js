// POST /facebook-publish - Programmer les posts Facebook
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { action, pageId, pageName, pageAccessToken, siteData, sessionId } = body;

    // Vérifier la session
    if (sessionId) {
      const sessionData = await env.AFFILIATE_SITES.get(`fb_${sessionId}`);
      if (!sessionData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Session expirée, veuillez reconnecter Facebook'
        }), { headers: corsHeaders });
      }
    }

    // Programmer les posts
    if (action === 'schedule') {
      const scheduleKey = `schedule_${pageId}_${Date.now()}`;

      const templates = [
        `🔥 ${siteData.productName} - Découvrez cette offre incroyable! 👇\n${siteData.url}`,
        `⭐ ${siteData.productName} - Ce que nos clients adore!\n${siteData.url}`,
        `💡 ${siteData.productName} pourrait vous plaire!\n${siteData.url}`,
        `🎯 ${siteData.productName} disponible!\n${siteData.url}`,
        `✨ ${siteData.productName} - Top choix! 👇\n${siteData.url}`
      ];

      const posts = templates.map((message, i) => ({
        message, link: siteData.url, image: siteData.image,
        scheduledFor: Date.now() + i * 5 * 60 * 60 * 1000,
        posted: false
      }));

      await env.AFFILIATE_SITES.put(scheduleKey, JSON.stringify({
        pageId, pageName, pageAccessToken, siteData, posts,
        createdAt: new Date().toISOString()
      }));

      return new Response(JSON.stringify({
        success: true,
        scheduledPosts: posts.length,
        message: `${posts.length} posts programmés!`
      }), { headers: corsHeaders });
    }

    // Poster immédiatement
    if (action === 'post') {
      const { message, link } = body;

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, link, access_token: pageAccessToken })
        }
      );

      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ success: false, error: data.error.message }), {
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ success: true, postId: data.id }), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
      status: 400, headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
