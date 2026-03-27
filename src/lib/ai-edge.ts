// Edge-compatible AI functions - direct HTTP calls, no Node.js SDK

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ImageResponse {
  data: Array<{
    b64_json: string;
  }>;
}

// Direct fetch to Groq API (Edge compatible)
async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json() as GroqResponse;
  return data.choices[0]?.message?.content || '';
}

// Generate affiliate content
export async function generateAffiliateContent(
  productName: string,
  productUrl: string,
  niche: string = 'general',
  additionalInfo: string = ''
): Promise<{
  headline: string;
  subheadline: string;
  description: string;
  features: string[];
  benefits: string[];
  pros: string[];
  cons: string[];
  faq: { question: string; answer: string }[];
  callToAction: string;
}> {
  const prompt = `Tu es un expert en marketing d'affiliation. Crée du contenu persuasif pour ce produit.

PRODUIT: ${productName}
URL: ${productUrl}
NICHE: ${niche}
INFO: ${additionalInfo}

Réponds UNIQUEMENT avec du JSON valide:
{
  "headline": "Titre accrocheur (max 10 mots)",
  "subheadline": "Sous-titre persuasif (max 15 mots)",
  "description": "Description détaillée (100-150 mots)",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3"],
  "pros": ["Point positif 1", "Point positif 2", "Point positif 3"],
  "cons": ["Point négatif 1", "Point négatif 2"],
  "faq": [{"question": "Question 1?", "answer": "Réponse 1"}, {"question": "Question 2?", "answer": "Réponse 2"}],
  "callToAction": "Appel à l'action (max 10 mots)"
}`;

  try {
    const responseText = await callGroq(prompt, 'Tu es un expert en copywriting. Réponds uniquement avec du JSON valide.');
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  // Fallback content
  return {
    headline: `Découvrez ${productName}`,
    subheadline: 'La solution parfaite pour vos besoins',
    description: `${productName} est un produit de qualité supérieure conçu pour répondre à vos besoins.`,
    features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix', 'Support réactif', 'Garantie'],
    benefits: ['Gagnez du temps', 'Résultats rapides', 'Investissement rentable'],
    pros: ['Produit de qualité', 'Bon prix', 'Livraison rapide'],
    cons: ['Apprentissage initial requis'],
    faq: [{ question: 'Est-ce facile?', answer: 'Oui, très intuitif.' }],
    callToAction: 'Commandez maintenant!'
  };
}

// Generate product image
export async function generateProductImage(productName: string, niche: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: `Professional product photography of ${productName}, ${niche}, clean background, studio lighting` }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json() as ImageResponse;
    return data.data[0]?.b64_json || null;
  } catch {
    return null;
  }
}

// Fetch product info from URL
export async function fetchProductInfo(url: string): Promise<{ name: string; description: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AffiliateBot/1.0)'
      }
    });
    
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const name = titleMatch ? titleMatch[1].split('|')[0].trim() : 'Produit';
    
    return { name, description: '' };
  } catch {
    return { name: 'Produit', description: '' };
  }
}

// Generate slug
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}
