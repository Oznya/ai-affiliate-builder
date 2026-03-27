// Worker Cron pour publication automatique Facebook avec IA
// Ce Worker tourne quotidiennement via Cron Trigger (8h00 Paris = 7h00 UTC)

export default {
  // Handler pour les requêtes HTTP (test manuel)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Endpoint de test pour publier manuellement
    if (url.pathname === '/publish-now') {
      return await this.publishAll(env);
    }
    
    // Endpoint pour lister les sites connectés
    if (url.pathname === '/connected-sites') {
      return await this.listConnectedSites(env);
    }
    
    // Endpoint pour tester la génération de contenu
    if (url.pathname === '/test-generate') {
      const productName = url.searchParams.get('product') || 'Produit';
      return await this.testGenerate(env, productName);
    }
    
    return new Response(JSON.stringify({
      name: 'Affiliate Publisher Worker',
      endpoints: {
        '/publish-now': 'Publier manuellement sur toutes les pages connectees',
        '/connected-sites': 'Lister les sites connectes a Facebook',
        '/test-generate?product=NOM': 'Tester la generation de contenu'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Handler pour le Cron Trigger
  async scheduled(controller, env, ctx) {
    console.log('Cron Facebook+IA demarre a:', new Date().toISOString());
    return await this.publishAll(env);
  },

  // Liste les sites connectés
  async listConnectedSites(env) {
    try {
      const connected = await env.AFFILIATE_SITES.get('fb_connected_sites');
      const sites = connected ? JSON.parse(connected) : [];
      
      return new Response(JSON.stringify({
        count: sites.length,
        sites: sites.map(s => ({
          siteId: s.siteId,
          pageName: s.pageName,
          productName: s.productName,
          connectedAt: s.connectedAt
        }))
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Test de génération de contenu
  async testGenerate(env, productName) {
    try {
      const content = await this.generateContent(env, productName, 'Produit test');
      return new Response(JSON.stringify(content, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Publication sur toutes les pages connectées
  async publishAll(env) {
    const results = {
      timestamp: new Date().toISOString(),
      published: 0,
      failed: 0,
      details: []
    };

    try {
      // Récupérer la liste des sites connectés
      const connected = await env.AFFILIATE_SITES.get('fb_connected_sites');
      if (!connected) {
        return new Response(JSON.stringify({ 
          message: 'Aucun site connecte a Facebook',
          ...results 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const sites = JSON.parse(connected);
      if (sites.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'Liste vide',
          ...results 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Publier sur chaque page
      for (const site of sites) {
        try {
          // Récupérer les détails complets du token
          const siteData = await env.AFFILIATE_SITES.get('fb_' + site.siteId);
          if (!siteData) {
            results.failed++;
            results.details.push({
              siteId: site.siteId,
              status: 'error',
              error: 'Token non trouve'
            });
            continue;
          }

          const fbData = JSON.parse(siteData);
          
          // Vérifier si on a déjà publié aujourd'hui
          const today = new Date().toISOString().split('T')[0];
          const lastPostKey = 'lastpost_' + site.siteId;
          const lastPost = await env.AFFILIATE_SITES.get(lastPostKey);
          
          if (lastPost === today) {
            results.details.push({
              siteId: site.siteId,
              pageName: fbData.pageName,
              status: 'skipped',
              message: 'Deja publie aujourd\'hui'
            });
            continue;
          }

          // Générer le contenu avec l'IA
          const content = await this.generateContent(env, site.productName, fbData.productName);
          
          // Publier sur Facebook
          const published = await this.publishToFacebook(
            fbData.pageId,
            fbData.pageToken,
            content.message,
            content.link
          );

          if (published.success) {
            // Marquer comme publié aujourd'hui
            await env.AFFILIATE_SITES.put(lastPostKey, today);
            
            results.published++;
            results.details.push({
              siteId: site.siteId,
              pageName: fbData.pageName,
              status: 'success',
              postId: published.postId,
              content: content.message.substring(0, 50) + '...'
            });
          } else {
            results.failed++;
            results.details.push({
              siteId: site.siteId,
              pageName: fbData.pageName,
              status: 'error',
              error: published.error
            });
          }

          // Attendre 3 secondes entre chaque publication
          await new Promise(r => setTimeout(r, 3000));

        } catch (err) {
          results.failed++;
          results.details.push({
            siteId: site.siteId,
            status: 'error',
            error: err.message
          });
        }
      }

    } catch (err) {
      results.error = err.message;
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Générer du contenu marketing avec Groq AI
  async generateContent(env, productName, fallbackName) {
    const product = productName || fallbackName || 'notre produit';
    
    const prompt = `Tu es un expert en marketing d'affiliation. Genere un post Facebook engageant pour promouvoir "${product}".

REGLES:
- Maximum 280 caracteres
- Utilise des emojis pertinents (max 3)
- Inclus un appel a l'action clair
- Ton enthousiaste mais professionnel
- Pas de hashtags excessifs (max 2)

Genere UNIQUEMENT le texte du post, rien d'autre.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Tu es un expert marketing qui cree des posts Facebook viraux.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return {
          message: data.choices[0].message.content.trim(),
          link: null
        };
      }
    } catch (err) {
      console.error('Erreur Groq:', err);
    }

    // Fallback si l'IA échoue
    const fallbacks = [
      `Decouvrez ${product} ! Une solution innovante qui va revolutionner votre quotidien. Ne manquez pas cette opportunique ! 🚀 #Innovation`,
      `Vous cherchez ${product} ? Nous avons ce qu'il vous faut ! Decouvrez nos offres exceptionnelles aujourd'hui. ✨ #Qualite`,
      `${product} - La reference du marche ! Profitez de nos offres exclusives. 💎 Foncez !`
    ];

    return {
      message: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      link: null
    };
  },

  // Publier sur Facebook
  async publishToFacebook(pageId, pageToken, message, link) {
    try {
      const body = {
        message: message,
        access_token: pageToken
      };

      if (link) {
        body.link = link;
      }

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      const result = await response.json();

      if (result.id) {
        return { success: true, postId: result.id };
      } else {
        return { 
          success: false, 
          error: result.error?.message || 'Erreur inconnue' 
        };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
