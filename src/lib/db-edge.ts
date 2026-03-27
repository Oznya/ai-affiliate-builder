// Edge-compatible database using Supabase JS client
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when needed
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      // Return a dummy client for build time
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export interface AffiliateSite {
  id: string;
  name: string;
  slug: string;
  productName: string;
  productUrl: string;
  affiliateUrl: string;
  niche?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  features?: string;
  benefits?: string;
  pros?: string;
  cons?: string;
  faq?: string;
  callToAction?: string;
  imageUrl?: string;
  customImageUrl?: string;
  template: string;
  primaryColor: string;
  accentColor: string;
  views: number;
  clicks: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const db = {
  async createSite(data: Partial<AffiliateSite>): Promise<AffiliateSite> {
    const supabase = getSupabase();
    const { data: site, error } = await supabase
      .from('AffiliateSite')
      .insert({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return site;
  },

  async getSiteBySlug(slug: string): Promise<AffiliateSite | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('AffiliateSite')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) return null;
    return data;
  },

  async getAllSites(limit: number = 50): Promise<AffiliateSite[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('AffiliateSite')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return data || [];
  },

  async deleteSite(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('AffiliateSite')
      .delete()
      .eq('id', id);
    
    return !error;
  },

  async updateSite(id: string, data: Partial<AffiliateSite>): Promise<AffiliateSite | null> {
    const supabase = getSupabase();
    const { data: site, error } = await supabase
      .from('AffiliateSite')
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return site;
  },

  async incrementViews(slug: string): Promise<void> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('AffiliateSite')
      .select('views')
      .eq('slug', slug)
      .single();
    
    if (data) {
      await supabase
        .from('AffiliateSite')
        .update({ views: (data.views || 0) + 1 })
        .eq('slug', slug);
    }
  }
};
