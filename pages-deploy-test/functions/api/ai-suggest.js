// POST /api/ai-suggest - Get AI suggestions for content
const GROQ_API_KEY = 'process.env.GROQ_API_KEY';

export async function onRequestPost(context) {
  const { request } = context;
  
  try {
    const body = await request.json();
    const { activity, theme, dayOfWeek, type, existingTopics } = body;
    
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = dayNames[dayOfWeek] || 'aujourd\'hui';
    
    // Construire le prompt selon le type de suggestion
    let prompt = '';
    
    if (type === 'topics') {
      // Suggérer plusieurs topics pour une journée
      prompt = `Tu es un expert en marketing de contenu pour entrepreneurs.
      
Contexte: ${activity || theme || 'Entrepreneuriat général'}
Jour: ${dayName}

Génère 5 idées de sujets de posts Facebook pour ${dayName}, variées et engageantes.
Chaque idée doit être courte (max 10 mots), actionnable et pertinente pour un entrepreneur.

Réponds UNIQUEMENT avec une liste JSON: ["idée 1", "idée 2", "idée 3", "idée 4", "idée 5"]`;
    
    } else if (type === 'weekly') {
      // Suggérer un planning complet
      prompt = `Tu es un expert en marketing de contenu pour entrepreneurs.

Activité: ${activity || 'Entrepreneuriat général'}
Thématique: ${theme || 'Business'}

Crée un planning de contenu pour une semaine complète (lundi à dimanche).
Pour chaque jour, propose 1-2 sujets de posts Facebook différents et variés.
Varie les types: conseils, motivation, engagement (questions), promotions douces, stories.

Réponds UNIQUEMENT avec un JSON: {
  "1": [{"hour": 9, "topic": "sujet", "type": "conseil"}],
  "2": [{"hour": 10, "topic": "sujet", "type": "motivation"}],
  ...
}`;
    
    } else {
      // Suggestion simple pour un topic
      prompt = `Tu es un expert en marketing Facebook pour entrepreneurs.

Contexte: ${activity || theme || 'Business'}
Jour: ${dayName}
Sujets déjà utilisés: ${existingTopics ? existingTopics.join(', ') : 'aucun'}

Propose UN sujet de post Facebook original et engageant pour ${dayName}.
Maximum 15 mots. Pas de hashtags dans le sujet.

Réponds UNIQUEMENT avec le sujet, sans guillemets ni explications.`;
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Tu es un assistant marketing expert en création de contenu Facebook pour entrepreneurs. Tu réponds de manière concise et actionnable.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.9
      })
    });
    
    const groqData = await groqRes.json();
    
    if (groqData.choices?.[0]) {
      let content = groqData.choices[0].message.content.trim();
      
      // Essayer de parser le JSON si c'est une liste
      let suggestions = null;
      try {
        // Nettoyer le contenu
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        if (content.startsWith('[') || content.startsWith('{')) {
          suggestions = JSON.parse(content);
        }
      } catch (e) {
        // Pas du JSON, c'est du texte simple
      }
      
      return new Response(JSON.stringify({
        success: true,
        suggestions: suggestions,
        text: suggestions ? null : content
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Pas de réponse de l\'IA'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: e.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
