// Cron Worker for Facebook Auto-Publishing
// Runs daily at 6:00 UTC (8:00 Paris time)

export default {
  async scheduled(event, env, ctx) {
    console.log('Starting scheduled Facebook auto-publish...');

    try {
      // Get all connected sites from KV
      const listKey = 'fb_connected_sites';
      const connectedData = await env.AFFILIATE_SITES.get(listKey);

      if (!connectedData) {
        console.log('No connected sites found');
        return new Response('No connected sites', { status: 200 });
      }

      const connectedSites = JSON.parse(connectedData);
      console.log(`Found ${connectedSites.length} connected sites`);

      let successCount = 0;
      let failCount = 0;

      for (const site of connectedSites) {
        try {
          // Get the full page data with token
          const pageKey = `fb_${site.siteId}`;
          const pageDataRaw = await env.AFFILIATE_SITES.get(pageKey);

          if (!pageDataRaw) {
            console.log(`No page data for site ${site.siteId}`);
            failCount++;
            continue;
          }

          const pageData = JSON.parse(pageDataRaw);
          const { pageId, pageToken, pageName, productName } = pageData;

          // Generate content with Groq
          const content = await generatePostContent(env.GROQ_API_KEY, productName, pageName);

          if (!content) {
            console.log(`Failed to generate content for ${pageName}`);
            failCount++;
            continue;
          }

          // Post to Facebook
          const posted = await postToFacebook(pageId, pageToken, content);

          if (posted) {
            console.log(`✅ Posted to ${pageName}`);
            successCount++;

            // Log the post
            const logKey = `post_log_${site.siteId}`;
            let logs = [];
            try {
              const existingLogs = await env.AFFILIATE_SITES.get(logKey);
              if (existingLogs) logs = JSON.parse(existingLogs);
            } catch (e) {}

            logs.unshift({
              content,
              postedAt: new Date().toISOString(),
              success: true
            });

            // Keep only last 30 logs
            logs = logs.slice(0, 30);
            await env.AFFILIATE_SITES.put(logKey, JSON.stringify(logs));
          } else {
            console.log(`❌ Failed to post to ${pageName}`);
            failCount++;
          }

          // Small delay between posts to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (siteError) {
          console.error(`Error processing site ${site.siteId}:`, siteError);
          failCount++;
        }
      }

      console.log(`Completed: ${successCount} success, ${failCount} failed`);
      return new Response(`Completed: ${successCount} success, ${failCount} failed`, { status: 200 });

    } catch (error) {
      console.error('Scheduled job error:', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  },

  // HTTP handler for manual testing
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manual trigger endpoint
    if (url.pathname === '/trigger') {
      const triggerKey = url.searchParams.get('key');
      if (triggerKey !== 'auto_publish_2024') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Run scheduled job
      return await this.scheduled(null, env, ctx);
    }

    // Status endpoint
    if (url.pathname === '/status') {
      try {
        const listKey = 'fb_connected_sites';
        const data = await env.AFFILIATE_SITES.get(listKey);
        const sites = data ? JSON.parse(data) : [];

        return new Response(JSON.stringify({
          connectedSites: sites.length,
          sites: sites.map(s => ({
            siteId: s.siteId,
            pageName: s.pageName,
            connectedAt: s.connectedAt
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Facebook Auto-Publish Cron Worker', { status: 200 });
  }
};

async function generatePostContent(groqApiKey, productName, pageName) {
  if (!groqApiKey) {
    return getFallbackContent(productName);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Génère un post Facebook engageant en français pour promouvoir "${productName}" sur la page "${pageName}".

Le post doit être:
- Amical et naturel, comme écrit par un humain
- Inclure 1-2 emojis pertinents
- Maximum 280 caractères
- Pas de hashtags
- Pas de "Découvrez" ou "N'hésitez pas"

Réponds uniquement avec le texte du post, rien d'autre.`
        }],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return getFallbackContent(productName);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    return content || getFallbackContent(productName);

  } catch (error) {
    console.error('Error generating content:', error);
    return getFallbackContent(productName);
  }
}

function getFallbackContent(productName) {
  const greetings = [
    `Bonjour ! ☀️ Aujourd'hui, découvrez ${productName}, une excellente option pour vous !`,
    `Bonne journée à tous ! 🌟 ${productName} pourrait bien vous surprendre...`,
    `Hello ! 👋 Envie de découvrir quelque chose de nouveau ? Jetez un œil à ${productName} !`,
    `Bien le bonjour ! ☕ ${productName} vous attend pour une expérience unique.`,
    `Hello tout le monde ! 🌈 ${productName} - une pépite à ne pas manquer !`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

async function postToFacebook(pageId, pageToken, message) {
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        message: message,
        access_token: pageToken
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error('Facebook API error:', result.error);

      // Check if token expired
      if (result.error.code === 190) {
        console.error('Token expired for page:', pageId);
      }

      return false;
    }

    return result.id ? true : false;

  } catch (error) {
    console.error('Error posting to Facebook:', error);
    return false;
  }
}
