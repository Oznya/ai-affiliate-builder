export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

// Simple content generation without external dependencies
async function generateContent(productName: string, niche: string): Promise<any> {
  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    console.error('GROQ_API_KEY not configured');
    // Return fallback content instead of failing
    return {
      headline: `Découvrez ${productName}`,
      subheadline: 'La solution parfaite pour vos besoins',
      description: `${productName} est un produit de qualité supérieure conçu pour répondre à vos besoins dans le domaine ${niche}. Ce produit offre des caractéristiques exceptionnelles et une performance remarquable.`,
      features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix', 'Support réactif', 'Garantie satisfait ou remboursé'],
      benefits: ['Gagnez du temps', 'Résultats rapides', 'Investissement rentable'],
      pros: ['Produit de qualité', 'Bon prix', 'Livraison rapide'],
      cons: ['Apprentissage initial requis'],
      faq: [{ question: 'Est-ce facile à utiliser?', answer: 'Oui, très intuitif et adapté à tous les niveaux.' }],
      callToAction: 'Commandez maintenant!'
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en copywriting et marketing d\'affiliation. Réponds uniquement avec du JSON valide.' 
          },
          { 
            role: 'user', 
            content: `Crée du contenu pour ce produit: ${productName} dans la niche: ${niche}.
            
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
}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      // Return fallback content
      return {
        headline: `Découvrez ${productName}`,
        subheadline: 'La solution parfaite pour vos besoins',
        description: `${productName} est un produit de qualité supérieure.`,
        features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix'],
        benefits: ['Gagnez du temps', 'Résultats rapides'],
        pros: ['Produit de qualité', 'Bon prix'],
        cons: ['Stock limité'],
        faq: [{ question: 'Est-ce fiable?', answer: 'Oui, entièrement testé et approuvé.' }],
        callToAction: 'Découvrir maintenant!'
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found');
  } catch (error) {
    console.error('AI generation error:', error);
    // Return fallback content
    return {
      headline: `Découvrez ${productName}`,
      subheadline: 'La solution parfaite pour vos besoins',
      description: `${productName} est un produit de qualité supérieure.`,
      features: ['Qualité supérieure', 'Facile à utiliser', 'Excellent rapport qualité-prix'],
      benefits: ['Gagnez du temps', 'Résultats rapides'],
      pros: ['Produit de qualité', 'Bon prix'],
      cons: ['Stock limité'],
      faq: [{ question: 'Est-ce fiable?', answer: 'Oui, entièrement testé et approuvé.' }],
      callToAction: 'Découvrir maintenant!'
    };
  }
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}

// Supabase client
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productUrl, affiliateUrl, niche, customName, template } = body;

    if (!productUrl) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

    // Get product name
    const productName = customName || 'Produit';
    
    console.log('Generating content for:', productName);
    
    // Generate AI content (with fallback)
    const content = await generateContent(productName, niche || 'general');

    // Create slug
    const slug = generateSlug(productName);

    // Save to database
    const supabase = await getSupabaseClient();
    
    const { data: site, error: dbError } = await supabase
      .from('AffiliateSite')
      .insert({
        name: productName,
        slug,
        productName,
        productUrl,
        affiliateUrl: affiliateUrl || productUrl,
        niche: niche || null,
        headline: content.headline,
        subheadline: content.subheadline,
        description: content.description,
        features: JSON.stringify(content.features),
        benefits: JSON.stringify(content.benefits),
        pros: JSON.stringify(content.pros),
        cons: JSON.stringify(content.cons),
        faq: JSON.stringify(content.faq),
        callToAction: content.callToAction,
        imageUrl: null,
        template: template || 'modern',
        primaryColor: '#6366f1',
        accentColor: '#a855f7',
        views: 0,
        clicks: 0,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Erreur de base de données: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, site });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Erreur de génération' }, { status: 500 });
  }
}
