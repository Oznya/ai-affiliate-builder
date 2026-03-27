/**
 * API Admin Payments - Gestion des paiements de commissions aux ambassadeurs
 * Permet de savoir ce qui est dû à chaque ambassadeur
 * Système à 3 niveaux: 25% (niveau 1), 10% (niveau 2), 5% (niveau 3)
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
      return await getPayments(env);
    } else if (method === 'POST') {
      const body = await request.json();
      return await handlePaymentAction(env, body);
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

async function getPayments(env) {
  const payments = [];
  const affiliateBalances = new Map();
  
  const stats = {
    totalAffiliates: 0,
    totalOwed: 0,
    totalPaid: 0,
    totalPending: 0,
    paymentsThisMonth: 0,
    amountPaidThisMonth: 0,
    minPayoutThreshold: 50 // Montant minimum pour paiement
  };
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // 1. Récupérer tous les paiements effectués
    const paymentsList = await env.KV.list({ prefix: 'payment_' });
    
    for (const key of paymentsList.keys) {
      const paymentData = await env.KV.get(key.name, { type: 'json' });
      if (paymentData) {
        const payment = {
          id: paymentData.id || key.name.replace('payment_', ''),
          affiliateId: paymentData.affiliateId,
          affiliateName: paymentData.affiliateName || '',
          affiliateEmail: paymentData.affiliateEmail || '',
          
          // Détails du paiement
          amount: paymentData.amount || 0,
          currency: paymentData.currency || 'CAD',
          level: paymentData.level || 1, // Niveau d'affiliation (1, 2, ou 3)
          commissionRate: paymentData.commissionRate || 25,
          
          // Transactions incluses dans ce paiement
          transactionIds: paymentData.transactionIds || [],
          transactionCount: paymentData.transactionCount || 0,
          
          // Statut
          status: paymentData.status || 'completed', // 'pending', 'completed', 'failed'
          method: paymentData.method || 'paypal', // 'paypal', 'transfer', 'check'
          
          // Référence de paiement
          paymentReference: paymentData.paymentReference || '',
          paypalEmail: paymentData.paypalEmail || '',
          
          // Dates
          createdAt: paymentData.createdAt,
          paidAt: paymentData.paidAt || null,
          
          // Notes
          notes: paymentData.notes || ''
        };
        
        payments.push(payment);
        stats.totalPaid += payment.amount;
        
        // Stats du mois
        if (payment.paidAt) {
          const paidDate = new Date(payment.paidAt);
          if (paidDate >= startOfMonth) {
            stats.paymentsThisMonth++;
            stats.amountPaidThisMonth += payment.amount;
          }
        }
      }
    }
    
    // 2. Calculer les soldes en attente par ambassadeur
    const transactionsList = await env.KV.list({ prefix: 'transaction_' });
    
    for (const key of transactionsList.keys) {
      const txData = await env.KV.get(key.name, { type: 'json' });
      if (txData && txData.status === 'completed' && txData.commissionStatus === 'pending') {
        
        // Niveau 1
        if (txData.affiliateId && txData.affiliateCommission > 0) {
          if (!affiliateBalances.has(txData.affiliateId)) {
            affiliateBalances.set(txData.affiliateId, {
              affiliateId: txData.affiliateId,
              affiliateName: txData.affiliateName || '',
              pendingAmount: 0,
              level1Pending: 0,
              level2Pending: 0,
              level3Pending: 0,
              transactionCount: 0
            });
          }
          const balance = affiliateBalances.get(txData.affiliateId);
          balance.pendingAmount += txData.affiliateCommission;
          balance.level1Pending += txData.affiliateCommission;
          balance.transactionCount++;
        }
        
        // Niveau 2
        if (txData.level2AffiliateId && txData.level2Commission > 0) {
          if (!affiliateBalances.has(txData.level2AffiliateId)) {
            affiliateBalances.set(txData.level2AffiliateId, {
              affiliateId: txData.level2AffiliateId,
              affiliateName: txData.level2AffiliateName || '',
              pendingAmount: 0,
              level1Pending: 0,
              level2Pending: 0,
              level3Pending: 0,
              transactionCount: 0
            });
          }
          const balance = affiliateBalances.get(txData.level2AffiliateId);
          balance.pendingAmount += txData.level2Commission;
          balance.level2Pending += txData.level2Commission;
          balance.transactionCount++;
        }
        
        // Niveau 3
        if (txData.level3AffiliateId && txData.level3Commission > 0) {
          if (!affiliateBalances.has(txData.level3AffiliateId)) {
            affiliateBalances.set(txData.level3AffiliateId, {
              affiliateId: txData.level3AffiliateId,
              affiliateName: txData.level3AffiliateName || '',
              pendingAmount: 0,
              level1Pending: 0,
              level2Pending: 0,
              level3Pending: 0,
              transactionCount: 0
            });
          }
          const balance = affiliateBalances.get(txData.level3AffiliateId);
          balance.pendingAmount += txData.level3Commission;
          balance.level3Pending += txData.level3Commission;
          balance.transactionCount++;
        }
      }
    }
    
    // 3. Construire la liste des montants dus
    const owedPayments = [];
    for (const balance of affiliateBalances.values()) {
      // Récupérer les infos PayPal de l'ambassadeur
      const affiliateData = await env.KV.get(`affiliate_${balance.affiliateId}`, { type: 'json' });
      
      const owedPayment = {
        affiliateId: balance.affiliateId,
        affiliateName: balance.affiliateName,
        affiliateEmail: affiliateData?.email || '',
        paypalEmail: affiliateData?.paypal || '',
        pendingAmount: Math.round(balance.pendingAmount * 100) / 100,
        level1Pending: Math.round(balance.level1Pending * 100) / 100,
        level2Pending: Math.round(balance.level2Pending * 100) / 100,
        level3Pending: Math.round(balance.level3Pending * 100) / 100,
        transactionCount: balance.transactionCount,
        readyForPayout: balance.pendingAmount >= stats.minPayoutThreshold,
        status: balance.pendingAmount >= stats.minPayoutThreshold ? 'ready' : 'below_threshold'
      };
      
      owedPayments.push(owedPayment);
      stats.totalOwed += owedPayment.pendingAmount;
      if (owedPayment.readyForPayout) {
        stats.totalPending += owedPayment.pendingAmount;
      }
    }
    
    // Trier par montant décroissant
    owedPayments.sort((a, b) => b.pendingAmount - a.pendingAmount);
    
    // Trier les paiements par date décroissante
    payments.sort((a, b) => {
      if (!a.paidAt) return 1;
      if (!b.paidAt) return -1;
      return new Date(b.paidAt) - new Date(a.paidAt);
    });
    
    stats.totalAffiliates = owedPayments.length;
    
    return new Response(JSON.stringify({ 
      success: true, 
      payments, 
      owedPayments,
      stats 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handlePaymentAction(env, body) {
  const { action } = body;
  
  // Créer un nouveau paiement
  if (action === 'create') {
    const { affiliateId, amount, method, paypalEmail, notes, transactionIds } = body;
    
    if (!affiliateId || !amount) {
      return new Response(JSON.stringify({ error: 'ID ambassadeur et montant requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Récupérer les infos de l'ambassadeur
    const affiliateData = await env.KV.get(`affiliate_${affiliateId}`, { type: 'json' });
    if (!affiliateData) {
      return new Response(JSON.stringify({ error: 'Ambassadeur non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPayment = {
      id: paymentId,
      affiliateId: affiliateId,
      affiliateName: affiliateData.name || '',
      affiliateEmail: affiliateData.email || '',
      amount: parseFloat(amount),
      currency: 'CAD',
      level: 1,
      transactionIds: transactionIds || [],
      transactionCount: transactionIds ? transactionIds.length : 0,
      status: 'completed',
      method: method || 'paypal',
      paypalEmail: paypalEmail || affiliateData.paypal || '',
      paymentReference: body.paymentReference || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };
    
    await env.KV.put(`payment_${paymentId}`, JSON.stringify(newPayment));
    
    // Marquer les transactions comme payées
    if (transactionIds && transactionIds.length > 0) {
      for (const txId of transactionIds) {
        const txData = await env.KV.get(`transaction_${txId}`, { type: 'json' });
        if (txData) {
          txData.commissionStatus = 'paid';
          txData.paidAt = new Date().toISOString();
          txData.paymentId = paymentId;
          await env.KV.put(`transaction_${txId}`, JSON.stringify(txData));
        }
      }
    }
    
    // Mettre à jour l'ambassadeur
    const updatedAffiliate = {
      ...affiliateData,
      commissions: (affiliateData.commissions || []).map(c => ({
        ...c,
        status: 'paid',
        paidAt: new Date().toISOString()
      }))
    };
    await env.KV.put(`affiliate_${affiliateId}`, JSON.stringify(updatedAffiliate));
    
    return new Response(JSON.stringify({ success: true, payment: newPayment }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Payer tous les ambassadeurs prêts
  if (action === 'pay_all_ready') {
    const { method } = body;
    
    // Récupérer les soldes en attente
    const transactionsList = await env.KV.list({ prefix: 'transaction_' });
    const affiliateBalances = new Map();
    const affiliateTransactions = new Map();
    
    for (const key of transactionsList.keys) {
      const txData = await env.KV.get(key.name, { type: 'json' });
      if (txData && txData.status === 'completed' && txData.commissionStatus === 'pending') {
        
        // Collecter les transactions par ambassadeur
        const processAffiliate = (affiliateId, affiliateName, commission) => {
          if (!affiliateId || commission <= 0) return;
          
          if (!affiliateBalances.has(affiliateId)) {
            affiliateBalances.set(affiliateId, { pendingAmount: 0, name: affiliateName });
            affiliateTransactions.set(affiliateId, []);
          }
          
          affiliateBalances.get(affiliateId).pendingAmount += commission;
          affiliateTransactions.get(affiliateId).push(txData.id);
        };
        
        processAffiliate(txData.affiliateId, txData.affiliateName, txData.affiliateCommission);
        processAffiliate(txData.level2AffiliateId, txData.level2AffiliateName, txData.level2Commission);
        processAffiliate(txData.level3AffiliateId, txData.level3AffiliateName, txData.level3Commission);
      }
    }
    
    const paymentsCreated = [];
    const minPayout = 50;
    
    for (const [affiliateId, balance] of affiliateBalances) {
      if (balance.pendingAmount >= minPayout) {
        // Créer le paiement
        const affiliateData = await env.KV.get(`affiliate_${affiliateId}`, { type: 'json' });
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newPayment = {
          id: paymentId,
          affiliateId: affiliateId,
          affiliateName: balance.name || affiliateData?.name || '',
          affiliateEmail: affiliateData?.email || '',
          amount: Math.round(balance.pendingAmount * 100) / 100,
          currency: 'CAD',
          transactionIds: affiliateTransactions.get(affiliateId) || [],
          transactionCount: affiliateTransactions.get(affiliateId)?.length || 0,
          status: 'completed',
          method: method || 'paypal',
          paypalEmail: affiliateData?.paypal || '',
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        };
        
        await env.KV.put(`payment_${paymentId}`, JSON.stringify(newPayment));
        paymentsCreated.push(newPayment);
        
        // Marquer les transactions comme payées
        for (const txId of affiliateTransactions.get(affiliateId)) {
          const txData = await env.KV.get(`transaction_${txId}`, { type: 'json' });
          if (txData) {
            txData.commissionStatus = 'paid';
            txData.paidAt = new Date().toISOString();
            await env.KV.put(`transaction_${txId}`, JSON.stringify(txData));
          }
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      paymentsCreated,
      count: paymentsCreated.length,
      totalAmount: paymentsCreated.reduce((sum, p) => sum + p.amount, 0)
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  // Annuler un paiement
  if (action === 'cancel') {
    const { id } = body;
    const key = `payment_${id}`;
    const existing = await env.KV.get(key, { type: 'json' });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Paiement non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    existing.status = 'cancelled';
    existing.cancelledAt = new Date().toISOString();
    await env.KV.put(key, JSON.stringify(existing));
    
    // Remettre les transactions en pending
    for (const txId of existing.transactionIds || []) {
      const txData = await env.KV.get(`transaction_${txId}`, { type: 'json' });
      if (txData) {
        txData.commissionStatus = 'pending';
        delete txData.paidAt;
        await env.KV.put(`transaction_${txId}`, JSON.stringify(txData));
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
