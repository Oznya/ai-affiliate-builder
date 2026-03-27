export async function onRequest(context) {
  return new Response(JSON.stringify({ 
    success: true, 
    message: "API fonctionne!",
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
