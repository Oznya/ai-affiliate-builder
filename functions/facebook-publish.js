// Facebook Publish - Schedule posts - /facebook-publish
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
    const { action, pageId, pageName, pageAccessToken, siteData } = body;
    
    // Schedule posts for 24h
    if (action === 'schedule') {
      const scheduleKey = `schedule_${pageId}_${Date.now()}`;
      
      // Create 5 varied posts over 24 hours
      const posts = [];
      const templates = [
        `🔥 ${siteData.productName} - Découvrez cette offre incroyable! 👇\n${siteData.url}`,
        `⭐ Avis: "J'adore ${siteData.productName}!" Découvrez pourquoi!\n${siteData.url}`,
        `💡 Vous cherchez une solution? ${siteData.productName} pourrait vous plaire!\n${siteData.url}`,
        `🎯 ${siteData.productName} est disponible! Ne manquez pas cette offre!\n${siteData.url}`,
        `✨ ${siteData.productName} - Ce que nos clients adorent! 👇\n${siteData.url}`
      ];
      
      for (let i = 0; i < 5; i++) {
        posts.push({
          message: templates[i],
          link: siteData.url,
          image: siteData.image,
          scheduledFor: Date.now() + (i * 5 * 60 * 60 * 1000), // Every 5 hours
          posted: false
        });
      }
      
      await env.AFFILIATE_SITES.put(scheduleKey, JSON.stringify({
        pageId,
        pageName,
        pageAccessToken,
        siteData,
        posts,
        createdAt: new Date().toISOString()
      }));
      
      return new Response(JSON.stringify({ 
        success: true, 
        scheduledPosts: posts.length,
        message: `${posts.length} posts programmés sur 24h!`
      }), { headers: corsHeaders });
    }
    
    // Post immediately
    if (action === 'post') {
      const { message, link } = body;
      
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            link: link,
            access_token: pageAccessToken
          })
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        return new Response(JSON.stringify({ success: false, error: data.error.message }), { headers: corsHeaders });
      }
      
      return new Response(JSON.stringify({ success: true, postId: data.id }), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Action non reconnue' }), { 
      status: 400, 
      headers: corsHeaders 
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: corsHeaders });
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
