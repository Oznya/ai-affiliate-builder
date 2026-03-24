// API: Get Facebook Pages - /api/pages
export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  const FB_ACCESS_TOKEN = env.FB_ACCESS_TOKEN;
  
  if (!FB_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'FB_ACCESS_TOKEN non configuré. Allez dans Settings > Variables and Secrets' 
    }), { headers: corsHeaders });
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${FB_ACCESS_TOKEN}&fields=id,name,access_token,picture`
    );
    const data = await response.json();
    
    if (data.error) {
      return new Response(JSON.stringify({ success: false, error: data.error.message }), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ success: true, pages: data.data }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
