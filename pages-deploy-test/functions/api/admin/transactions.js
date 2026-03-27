/**
 * API Admin Transactions - Gestion des transactions d'affiliation
 * Permet de voir les ventes effectuées par les ambassadeurs pour le calcul des commissions
 * Système à 3 niveaux: 25%, 10%, 5%
 */
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  // CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  try {
    if (method === 'GET') {
      return await getTransactions(env);
    } else if (method === 'POST') {
      const body = await request.json();
      return await handleTransactionAction(env, body);
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function getTransactions(env) {
  const transactions = [];
  const stats = {
    total: 0,
    totalAmount: 0,
    totalCommissions: 0,
    level1Commissions: 0, // 25%
    level2Commissions: 0, // 10%
    level3Commissions: 0, // 5%
    pendingCommissions: 0,
    paidCommissions: 0,
    thisMonth: {
      transactions: 0,
      amount: 0,
      commissions: 0
    }
  };
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // Récupérer toutes les transactions depuis KV
    const transactionsList = await env.KV.list({ prefix: 'transaction_' });
    
    for (const key of transactionsList.keys) {
      const txData = await env.KV.get(key.name, { type: 'json' });
      if (txData) {
        const transaction = {
          id: txData.id || key.name.replace('transaction_', ''),
          orderId: txData.orderId || '',
          amount: txData.amount || 0,
          currency: txData.currency || 'CAD',
          product: txData.product || '',
          productId: txData.productId || '',
          
          // Informations sur l'acheteur
          buyerEmail: txData.buyerEmail || '',
          buyerName: txData.buyerName || '',
          
          // Informations d'affiliation (3 niveaux)
          affiliateId: txData.affiliateId || null,
          affiliateName: txData.affiliateName || '',
          affiliateCode: txData.affiliateCode || '',
          affiliateLevel: txData.affiliateLevel || 1,
          affiliateCommission: txData.affiliateCommission || 0,
          affiliateCommissionRate: txData.affiliateCommissionRate || 25,
          
          // Niveau 2 (parrain de l'ambassadeur)
          level2AffiliateId: txData.level2AffiliateId || null,
          level2AffiliateName: txData.level2AffiliateName || '',
          level2Commission: txData.level2Commission || 0,
          level2CommissionRate: txData.level2CommissionRate || 10,
          
          // Niveau 3
          level3AffiliateId: txData.level3AffiliateId || null,
          level3AffiliateName: txData.level3AffiliateName || '',
          level3Commission: txData.level3Commission || 0,
          level3CommissionRate: txData.level3CommissionRate || 5,
          
          // Statut
          status: txData.status || 'completed', // 'completed', 'refunded', 'pending'
          commissionStatus: txData.commissionStatus || 'pending', // 'pending', 'paid'
          
          // Dates
          createdAt: txData.createdAt,
          paidAt: txData.paidAt || null,
          
          // Métadonnées
          source: txData.source || 'direct', // 'direct', 'stripe', 'paypal'
          metadata: txData.metadata || {}
        };
        
        transactions.push(transaction);
        stats.total++;
        stats.totalAmount += transaction.amount;
        
        // Calculer les commissions totales
        const totalTxCommission = transaction.affiliateCommission + 
                                   transaction.level2Commission + 
                                   transaction.level3Commission;
        stats.totalCommissions += totalTxCommission;
        stats.level1Commissions += transaction.affiliateCommission;
        stats.level2Commissions += transaction.level2Commission;
        stats.level3Commissions += transaction.level3Commission;
        
        if (transaction.commissionStatus === 'paid') {
          stats.paidCommissions += totalTxCommission;
        } else {
          stats.pendingCommissions += totalTxCommission;
        }
        
        // Stats du mois
        if (transaction.createdAt) {
          const txDate = new Date(transaction.createdAt);
          if (txDate >= startOfMonth) {
            stats.thisMonth.transactions++;
            stats.thisMonth.amount += transaction.amount;
            stats.thisMonth.commissions += totalTxCommission;
          }
        }
      }
    }
    
    // Trier par date décroissante
    transactions.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return new Response(JSON.stringify({ success: true, transactions, stats }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleTransactionAction(env, body) {
  const { action, id, status, commissionStatus } = body;
  
  // Ajouter une nouvelle transaction
  if (action === 'add') {
    const { 
      orderId, amount, currency, product, productId,
      buyerEmail, buyerName,
      affiliateId, affiliateName, affiliateCode, affiliateLevel
    } = body;
    
    if (!amount || !affiliateId) {
      return new Response(JSON.stringify({ error: 'Montant et ID ambassadeur requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Calculer les commissions selon le niveau
    const level1Rate = 25;
    const level2Rate = 10;
    const level3Rate = 5;
    
    const level1Commission = Math.round(amount * level1Rate / 100 * 100) / 100;
    const level2Commission = Math.round(amount * level2Rate / 100 * 100) / 100;
    const level3Commission = Math.round(amount * level3Rate / 100 * 100) / 100;
    
    // Récupérer les infos des parrains (niveaux 2 et 3)
    const affiliateData = await env.KV.get(`affiliate_${affiliateId}`, { type: 'json' });
    let level2AffiliateId = null;
    let level2AffiliateName = '';
    let level3AffiliateId = null;
    let level3AffiliateName = '';
    
    if (affiliateData && affiliateData.referredBy) {
      const level2Data = await env.KV.get(`affiliate_${affiliateData.referredBy}`, { type: 'json' });
      if (level2Data) {
        level2AffiliateId = affiliateData.referredBy;
        level2AffiliateName = level2Data.name || '';
        
        if (level2Data.referredBy) {
          const level3Data = await env.KV.get(`affiliate_${level2Data.referredBy}`, { type: 'json' });
          if (level3Data) {
            level3AffiliateId = level2Data.referredBy;
            level3AffiliateName = level3Data.name || '';
          }
        }
      }
    }
    
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction = {
      id: txId,
      orderId: orderId || txId,
      amount: parseFloat(amount),
      currency: currency || 'CAD',
      product: product || '',
      productId: productId || '',
      buyerEmail: buyerEmail || '',
      buyerName: buyerName || '',
      affiliateId: affiliateId,
      affiliateName: affiliateName || '',
      affiliateCode: affiliateCode || '',
      affiliateLevel: affiliateLevel || 1,
      affiliateCommission: level1Commission,
      affiliateCommissionRate: level1Rate,
      level2AffiliateId: level2AffiliateId,
      level2AffiliateName: level2AffiliateName,
      level2Commission: level2Commission,
      level2CommissionRate: level2Rate,
      level3AffiliateId: level3AffiliateId,
      level3AffiliateName: level3AffiliateName,
      level3Commission: level3Commission,
      level3CommissionRate: level3Rate,
      status: 'completed',
      commissionStatus: 'pending',
      createdAt: new Date().toISOString(),
      source: body.source || 'direct',
      metadata: body.metadata || {}
    };
    
    await env.KV.put(`transaction_${txId}`, JSON.stringify(newTransaction));
    
    // Mettre à jour les stats de l'ambassadeur
    if (affiliateData) {
      const updatedAffiliate = {
        ...affiliateData,
        totalCommissions: (affiliateData.totalCommissions || 0) + level1Commission,
        referralsCount: (affiliateData.referralsCount || 0) + 1,
        commissions: [...(affiliateData.commissions || []), {
          transactionId: txId,
          amount: level1Commission,
          level: 1,
          status: 'pending',
          createdAt: new Date().toISOString()
        }]
      };
      await env.KV.put(`affiliate_${affiliateId}`, JSON.stringify(updatedAffiliate));
    }
    
    return new Response(JSON.stringify({ success: true, transaction: newTransaction }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Mettre à jour le statut d'une transaction
  if (action === 'update_status') {
    const key = `transaction_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Transaction non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const updated = {
      ...existing,
      status: status || existing.status,
      updatedAt: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Marquer les commissions comme payées
  if (action === 'mark_paid') {
    const key = `transaction_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Transaction non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const updated = {
      ...existing,
      commissionStatus: 'paid',
      paidAt: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Rembourser une transaction
  if (action === 'refund') {
    const key = `transaction_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Transaction non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const updated = {
      ...existing,
      status: 'refunded',
      commissionStatus: 'cancelled',
      refundedAt: new Date().toISOString()
    };
    
    await env.KV.put(key, JSON.stringify(updated));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
