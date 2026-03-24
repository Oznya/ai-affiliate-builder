export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-edge';
import { generateProductImage } from '@/lib/ai-edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, productName, niche } = body;
    
    if (!siteId || !productName) {
      return NextResponse.json({ error: 'Site ID et nom requis' }, { status: 400 });
    }
    
    const imageUrl = await generateProductImage(productName, niche || 'general');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Impossible de générer' }, { status: 500 });
    }
    
    await db.updateSite(siteId, { imageUrl });
    
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
