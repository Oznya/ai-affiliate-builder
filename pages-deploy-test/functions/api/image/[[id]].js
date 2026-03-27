// GET /api/image/:id - Serve uploaded image
export async function onRequestGet(context) {
  const { env, params } = context;
  const imageId = params.id;
  
  if (!imageId) {
    return new Response('Image not found', { status: 404 });
  }
  
  let imageData = null;
  let contentType = 'image/jpeg';
  
  // Déterminer le content-type basé sur l'extension
  if (imageId.includes('.png')) contentType = 'image/png';
  else if (imageId.includes('.gif')) contentType = 'image/gif';
  else if (imageId.includes('.webp')) contentType = 'image/webp';
  
  // Si l'ID commence déjà par affiliation-img-, on l'utilise directement
  if (imageId.startsWith('affiliation-img-')) {
    imageData = await env.AFFILIATE_SITES.get(imageId, { type: 'arrayBuffer' });
  } else {
    // Essayer avec le préfixe affiliation-img-
    imageData = await env.AFFILIATE_SITES.get('affiliation-img-' + imageId, { type: 'arrayBuffer' });
  }
  
  // Si pas trouvé, essayer l'ancien format JSON avec img_
  if (!imageData) {
    const jsonKey = imageId.startsWith('img_') ? imageId : 'img_' + imageId;
    const jsonImageData = await env.AFFILIATE_SITES.get(jsonKey);
    
    if (jsonImageData) {
      const image = JSON.parse(jsonImageData);
      const base64Data = image.data.split(',')[1];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      return new Response(buffer, {
        headers: {
          'Content-Type': image.type || contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response('Image not found', { status: 404 });
  }
  
  return new Response(imageData, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// POST /api/image - Upload image
export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image too large (max 5MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Convertir en base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    // Générer un ID unique
    const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    
    // Sauvegarder dans KV
    await env.AFFILIATE_SITES.put('img_' + imageId, JSON.stringify({
      data: dataUrl,
      type: file.type,
      name: file.name,
      size: file.size,
      uploaded: new Date().toISOString()
    }));
    
    // Construire l'URL publique
    const url = new URL(request.url);
    const publicUrl = `${url.origin}/api/image/${imageId}`;
    
    return new Response(JSON.stringify({
      success: true,
      imageId: imageId,
      url: publicUrl
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
