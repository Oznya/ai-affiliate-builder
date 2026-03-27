// GET /api/test-generate - Generate and publish content
const GROQ_API_KEY = 'process.env.GROQ_API_KEY';

const CONTENT_TYPES = {
  'conseil': { emoji: '💡', prompt: 'Crée un post Facebook avec un conseil pratique et actionable. Style: professionnel mais accessible.' },
  'motivation': { emoji: '🔥', prompt: 'Crée un post Facebook motivant et inspirant. Style: énergique et positif.' },
  'engagement': { emoji: '💬', prompt: 'Crée un post Facebook avec une question engageante pour susciter des commentaires. Style: convivial.' },
  'rendez-vous': { emoji: '🎯', prompt: 'Crée un post Facebook invitant à prendre rendez-vous. Style: convaincant avec appel à l\'action clair.' },
  'promo': { emoji: '📢', prompt: 'Crée un post Facebook promotionnel pour une offre spéciale. Style: persuasif sans être agressif.' },
  'story': { emoji: '📖', prompt: 'Crée un post Facebook avec une histoire personnelle ou un témoignage. Style: authentique et touchant.' },
  'evenement': { emoji: '📅', prompt: 'Crée un post Facebook annonçant un événement. Style: excitant avec tous les détails importants.' },
  'nurturing': { emoji: '💚', prompt: 'Crée un post Facebook pour maintenir la relation avec l\'audience. Style: chaleureux et attentionné.' },
  'free': { emoji: '✨', prompt: 'Crée un post Facebook engageant sur ce sujet.' }
};

function generateAutoTopic(config, dayOfWeek) {
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const types = config.themeTypes || ['conseil', 'motivation', 'engagement'];
  const typeIndex = dayOfWeek % types.length;
  const type = types[typeIndex];
  const topics = {
    'conseil': `Conseil ${config.mainTheme ? config.mainTheme : 'business'} du ${dayNames[dayOfWeek]}`,
    'motivation': `Motivation du ${dayNames[dayOfWeek]}${config.mainTheme ? ' - ' + config.mainTheme : ''}`,
    'engagement': `Question du ${dayNames[dayOfWeek]} - ${config.mainTheme || 'Vos avis nous intéressent'}`,
    'rendez-vous': `Prenez rendez-vous pour votre ${config.mainTheme || 'accompagnement'}`,
    'promo': `Offre spéciale ${dayNames[dayOfWeek]}`,
    'story': `Mon expérience en ${config.mainTheme || 'entrepreneuriat'}`,
    'evenement': `Événement à venir - ${config.mainTheme || 'Rejoignez-nous'}`,
    'nurturing': `Pensée du ${dayNames[dayOfWeek]} pour notre communauté`,
    'free': `Publication du ${dayNames[dayOfWeek]}`
  };
  return { topic: topics[type] || topics['free'], type: type };
}

export async function onRequestGet(context) {
  const { env } = context;
  
  const results = {
    timestamp: new Date().toISOString(),
    published: 0,
    failed: 0,
    posts: []
  };

  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();
  
  const configRaw = await env.AFFILIATE_SITES.get('cm_config');
  const slotsRaw = await env.AFFILIATE_SITES.get('cm_slots');
  
  let config = null;
  let slotToUse = null;
  let topic = null;
  let content = null;
  let imageUrl = null;
  let hashtags = null;
  let contentType = 'free';
  
  if (configRaw) {
    try { config = JSON.parse(configRaw); } catch (e) { console.error('Error parsing config:', e); }
  }
  
  if (config) {
    if (config.mode === 'theme' && config.mainTheme) {
      const autoContent = generateAutoTopic(config, dayOfWeek);
      topic = autoContent.topic;
      contentType = autoContent.type;
      slotToUse = { hour: currentHour, topic: topic, type: contentType, active: true };
    } else if (config.mode === 'weekly' && config.weeklySlots) {
      const daySlots = config.weeklySlots[dayOfWeek] || [];
      slotToUse = daySlots.find(s => s.hour === currentHour && s.active !== false);
      if (!slotToUse) { slotToUse = daySlots.find(s => s.active !== false); }
      if (slotToUse) {
        topic = slotToUse.topic;
        content = slotToUse.content;
        imageUrl = slotToUse.imageUrl;
        hashtags = slotToUse.hashtags;
        contentType = slotToUse.type || 'free';
      }
    }
  }
  
  if (!slotToUse && slotsRaw) {
    try {
      const slots = JSON.parse(slotsRaw);
      slotToUse = slots.find(s => s.hour === currentHour && s.active !== false);
      if (!slotToUse) { slotToUse = slots.find(s => s.active !== false); }
      if (slotToUse) {
        topic = slotToUse.topic;
        imageUrl = slotToUse.imageUrl;
        hashtags = slotToUse.hashtags;
      }
    } catch (e) { console.error('Error parsing slots:', e); }
  }
  
  if (!slotToUse) {
    slotToUse = { hour: currentHour, topic: 'Bonne journée', type: 'free', active: true };
    topic = 'Bonne journée';
  }
  if (!topic) { topic = 'Publication du jour'; }

  const pagesRaw = await env.AFFILIATE_SITES.get('cm_pages');
  if (!pagesRaw) {
    results.error = 'Aucune page connectée';
    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
  const pages = JSON.parse(pagesRaw);

  // Générer le contenu avec l'IA SEULEMENT si pas de contenu personnalisé
  let finalContent = content;
  
  if (!finalContent || finalContent.trim() === '') {
    const typeConfig = CONTENT_TYPES[contentType] || CONTENT_TYPES['free'];
    const stylePrompt = typeConfig.prompt;
    const emoji = typeConfig.emoji;
    let activityContext = '';
    if (config && config.activityDesc) {
      activityContext = ` Contexte de l'activité: ${config.activityDesc}`;
    }

    finalContent = `${emoji} ${topic}`;

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Tu es un expert en marketing Facebook. Tu crées des posts engageants, authentiques et efficaces pour des entrepreneurs. Tu utilises des emojis avec parcimonie (2-4 max). Tu évites le jargon et restes accessible.' },
            { role: 'user', content: `${stylePrompt}${activityContext}\n\nSujet: "${topic}"\n\n${hashtags ? 'Intègre ces hashtags: ' + hashtags : ''}\n\nCrée un post Facebook de maximum 400 caractères. Réponds uniquement avec le texte du post, sans guillemets ni explications.` }
          ],
          max_tokens: 200,
          temperature: 0.85
        })
      });
      const groqData = await groqRes.json();
      if (groqData.choices?.[0]) {
        finalContent = groqData.choices[0].message.content.trim();
      }
    } catch (e) {
      console.error('Groq error:', e);
    }
  }
  
  // Ajouter les hashtags personnalisés si présents
  if (hashtags && hashtags.trim() !== '') {
    if (!finalContent.includes(hashtags)) {
      finalContent = finalContent + '\n\n' + hashtags;
    }
  }

  // Publier sur chaque page
  for (const page of pages) {
    try {
      const fbBody = {
        message: finalContent,
        access_token: page.token || page.access_token
      };

      // Ajouter image si fournie
      if (imageUrl && imageUrl.trim() !== '') {
        fbBody.link = imageUrl;
      }

      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbBody)
      });
      const fbData = await fbRes.json();
      
      if (fbData.id) {
        results.published++;
        results.posts.push({ 
          page: page.name, 
          status: 'success', 
          content: finalContent.substring(0, 80) + '...',
          topic: topic,
          type: contentType
        });
      } else {
        results.failed++;
        results.posts.push({ 
          page: page.name, 
          status: 'error', 
          error: fbData.error?.message || 'Erreur inconnue' 
        });
      }
    } catch (e) {
      results.failed++;
      results.posts.push({ page: page.name, status: 'error', error: e.message });
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  await env.AFFILIATE_SITES.put('cm_last_publish', new Date().toISOString());

  results.debug = {
    mode: config?.mode || 'legacy',
    dayOfWeek: dayOfWeek,
    hour: currentHour,
    topic: topic,
    type: contentType,
    hasCustomContent: !!(content && content.trim() !== ''),
    hasImage: !!(imageUrl && imageUrl.trim() !== ''),
    hasHashtags: !!(hashtags && hashtags.trim() !== '')
  };

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
