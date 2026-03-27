/**
 * API pour uploader une image pour l'affiliation
 * L'image est stockée dans KV et retourne une URL
 * v1.1 - Fixed KV binding
 */

// Fonction pour générer un ID unique
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Fonction pour convertir base64 en ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'Aucune image fournie' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image trop volumineuse. Maximum 5MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Générer un ID unique
    const imageId = generateId();
    const extension = file.name.split('.').pop() || 'jpg';
    const key = `affiliation-img-${imageId}.${extension}`;
    
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Stocker dans KV
    await env.AFFILIATE_SITES.put(key, arrayBuffer, {
      expirationTtl: 86400 * 30, // 30 jours
      metadata: {
        contentType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Retourner l'URL de l'image
    const imageUrl = `${new URL(request.url).origin}/api/image/${key}`;
    
    return new Response(JSON.stringify({
      success: true,
      url: imageUrl,
      id: key
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'upload: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
