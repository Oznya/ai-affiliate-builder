// Worker Cron pour publication automatique Facebook
// Ce Worker tourne toutes les heures via Cron Trigger

export default {
  async scheduled(controller, env, ctx) {
    console.log('🚀 Cron Facebook démarré à:', new Date().toISOString());
    
    if (!env.AFFILIATE_SITES) {
      console.error('❌ KV namespace non configuré');
      return;
    }
    
    // Lister tous les plannings en attente
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
        
        // Publier si le temps est venu
        if (!post.posted && post.scheduledFor <= now) {
          console.log(`📝 Publication sur ${schedule.pageName}...`);
          
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
          
          // Attendre 2 secondes entre chaque post
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      // Mettre à jour ou supprimer le planning
      if (updated) {
        const allPosted = schedule.posts.every(p => p.posted);
        
        if (allPosted) {
          await env.AFFILIATE_SITES.delete(key.name);
          console.log(`✨ Planning terminé`);
        } else {
          await env.AFFILIATE_SITES.put(key.name, JSON.stringify(schedule));
          console.log(`💾 Planning mis à jour`);
        }
      }
    }
    
    console.log(`📊 Résumé: ${postsPublished} posts publiés, ${errors} erreurs`);
  }
};
