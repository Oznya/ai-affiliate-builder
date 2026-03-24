// Scheduled Worker - Cron Trigger for auto-posting to Facebook
// This runs automatically via Cron Trigger

export default {
  async scheduled(controller, env, ctx) {
    console.log('🚀 Cron job démarré à:', new Date().toISOString());
    
    if (!env.AFFILIATE_SITES) {
      console.error('❌ KV namespace AFFILIATE_SITES non disponible');
      return;
    }
    
    const list = await env.AFFILIATE_SITES.list({ prefix: 'schedule_' });
    
    if (!list.keys || list.keys.length === 0) {
      console.log('ℹ️ Aucun planning en attente');
      return;
    }
    
    let postsPublished = 0;
    let errors = 0;
    
    for (const key of list.keys) {
      const data = await env.AFFILIATE_SITES.get(key.name);
      if (!data) continue;
      
      const schedule = JSON.parse(data);
      const now = Date.now();
      let updated = false;
      
      for (let i = 0; i < schedule.posts.length; i++) {
        const post = schedule.posts[i];
        
        if (!post.posted && post.scheduledFor <= now) {
          console.log(`📝 Publication #${i+1} sur ${schedule.pageName}: ${post.message.substring(0, 50)}...`);
          
          try {
            const response = await fetch(
              `https://graph.facebook.com/v19.0/${schedule.pageId}/feed`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: post.message,
                  link: post.link,
                  access_token: schedule.pageAccessToken
                })
              }
            );
            
            const result = await response.json();
            
            if (result.id) {
              post.posted = true;
              post.postedAt = new Date().toISOString();
              post.postId = result.id;
              updated = true;
              postsPublished++;
              console.log(`✅ Post publié: ${result.id}`);
            } else {
              console.error('❌ Erreur Facebook:', result.error);
              errors++;
            }
          } catch (error) {
            console.error('❌ Erreur:', error.message);
            errors++;
          }
          
          // Wait 2 seconds between posts
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      if (updated) {
        const allPosted = schedule.posts.every(p => p.posted);
        
        if (allPosted) {
          await env.AFFILIATE_SITES.delete(key.name);
          console.log(`✨ Planning ${key.name} terminé et supprimé`);
        } else {
          await env.AFFILIATE_SITES.put(key.name, JSON.stringify(schedule));
          console.log(`💾 Planning ${key.name} mis à jour`);
        }
      }
    }
    
    console.log(`📊 Résumé: ${postsPublished} posts publiés, ${errors} erreurs`);
  }
};
