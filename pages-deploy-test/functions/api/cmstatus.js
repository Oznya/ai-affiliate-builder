// GET /api/cmstatus - Get CM status
export async function onRequestGet(context) {
  const { env } = context;
  
  const configRaw = await env.AFFILIATE_SITES.get('cm_config');
  const pages = await env.AFFILIATE_SITES.get('cm_pages');
  const lastPublish = await env.AFFILIATE_SITES.get('cm_last_publish');
  const slots = await env.AFFILIATE_SITES.get('cm_slots');

  const defaultConfig = {
    mode: 'weekly',
    mainTheme: '',
    activityDesc: '',
    themeTypes: ['conseil', 'motivation', 'engagement'],
    weeklySlots: {}
  };

  const defaultSlots = [
    { hour: 8, label: 'Bonne journée', topic: 'Bonne journée', style: 'enthousiaste', hashtags: '', imageUrl: '', active: true }
  ];

  let parsedConfig = null;
  if (configRaw) {
    try {
      parsedConfig = JSON.parse(configRaw);
    } catch (e) {
      console.error('Error parsing config:', e);
    }
  }

  return new Response(JSON.stringify({
    configured: !!configRaw,
    config: parsedConfig || defaultConfig,
    pages: pages ? JSON.parse(pages) : [],
    slots: slots ? JSON.parse(slots) : defaultSlots,
    lastPublish: lastPublish || null
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// POST /api/cmstatus - Save configuration
export async function onRequestPost(context) {
  const { env, request } = context;
  
  const body = await request.json();
  
  // Sauvegarder la nouvelle configuration
  if (body.config) {
    const config = {
      mode: body.config.mode || 'weekly',
      mainTheme: body.config.mainTheme || '',
      activityDesc: body.config.activityDesc || '',
      themeTypes: body.config.themeTypes || ['conseil', 'motivation', 'engagement'],
      weeklySlots: body.config.weeklySlots || {}
    };
    
    await env.AFFILIATE_SITES.put('cm_config', JSON.stringify(config));
    
    // Calculer le nombre de posts actifs
    let activeSlotsCount = 0;
    for (const day in config.weeklySlots) {
      if (config.weeklySlots[day]) {
        activeSlotsCount += config.weeklySlots[day].filter(s => s.active !== false).length;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: config.mode,
      activeSlots: activeSlotsCount,
      message: 'Configuration sauvegardée avec succès'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Legacy: sauvegarder les slots (pour compatibilité)
  if (body.slots) {
    const slots = body.slots || [];
    const cleanSlots = slots.map(slot => ({
      hour: parseInt(slot.hour) || 8,
      topic: slot.topic || 'Nouveau message',
      style: slot.style || 'enthousiaste',
      hashtags: slot.hashtags || '',
      imageUrl: slot.imageUrl || '',
      active: slot.active !== false
    }));

    await env.AFFILIATE_SITES.put('cm_slots', JSON.stringify(cleanSlots));

    return new Response(JSON.stringify({
      success: true,
      count: cleanSlots.filter(s => s.active).length,
      slots: cleanSlots
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Aucune configuration fournie'
  }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
