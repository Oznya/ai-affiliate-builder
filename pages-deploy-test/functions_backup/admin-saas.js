/**
 * Admin SAAS - Page de gestion des abonnés SAAS
 * GET /admin-saas
 */

export async function onRequestGet(context) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💎 Super Admin SAAS - AffiliationPro</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0B1F3A 0%, #2B0F3A 50%, #0B1F3A 100%); color: white; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(139, 92, 246, 0.2); }
    .nav h1 { font-size: 1.5rem; background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-links { display: flex; gap: 15px; }
    .nav-links a { color: #a5b4fc; text-decoration: none; font-size: 14px; padding: 8px 15px; background: rgba(255,255,255,0.05); border-radius: 8px; }
    .nav-links a:hover { background: rgba(255,255,255,0.1); color: white; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 25px; border: 1px solid rgba(139, 92, 246, 0.2); text-align: center; }
    .stat-card.highlight { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2)); border-color: rgba(16,185,129,0.4); }
    .stat-icon { font-size: 2rem; margin-bottom: 10px; }
    .stat-value { font-size: 2.2rem; font-weight: 700; color: #10b981; }
    .stat-label { font-size: 13px; color: #a5b4fc; margin-top: 5px; }
    .card { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 25px; margin-bottom: 20px; border: 1px solid rgba(139, 92, 246, 0.2); }
    .card h2 { margin-bottom: 20px; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
    .plans-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .plan-box { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; }
    .plan-box h3 { font-size: 14px; color: #a5b4fc; margin-bottom: 10px; }
    .plan-box .count { font-size: 2rem; font-weight: 700; }
    .plan-box.starter .count { color: #f59e0b; }
    .plan-box.pro .count { color: #6366f1; }
    .plan-box.enterprise .count { color: #a855f7; }
    .plan-box .price { font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
    th { color: #a5b4fc; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { font-size: 14px; }
    tr:hover { background: rgba(255,255,255,0.03); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-starter { background: rgba(245,158,11,0.2); color: #fbbf24; }
    .badge-pro { background: rgba(99,102,241,0.2); color: #a5b4fc; }
    .badge-enterprise { background: rgba(168,85,247,0.2); color: #c4b5fd; }
    .badge-trial { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .badge-active { background: rgba(16,185,129,0.2); color: #34d399; }
    .badge-suspended { background: rgba(239,68,68,0.2); color: #f87171; }
    .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; }
    .btn-danger { background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .btn-small { padding: 5px 10px; font-size: 12px; }
    .actions-cell { display: flex; gap: 8px; flex-wrap: wrap; }
    .search-box { display: flex; gap: 10px; margin-bottom: 20px; }
    .search-box input { flex: 1; padding: 12px 16px; border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; background: rgba(0,0,0,0.3); color: white; font-size: 14px; }
    .search-box input:focus { outline: none; border-color: #10b981; }
    .search-box input::placeholder { color: #6b7280; }
    .empty { text-align: center; padding: 50px; color: #6b7280; }
    .empty-icon { font-size: 4rem; margin-bottom: 15px; }
    @media (max-width: 768px) { .plans-summary { grid-template-columns: 1fr; } table { font-size: 12px; } th, td { padding: 8px; } .actions-cell { flex-direction: column; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <h1>💎 Super Admin SAAS - Abonnés</h1>
      <div class="nav-links">
        <a href="/admin-users">👥 Clients IA</a>
        <a href="/admin-affiliates">🤝 Affiliés</a>
        <a href="/home">← Retour</a>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card highlight">
        <div class="stat-icon">💵</div>
        <div class="stat-value" id="mrr">0$</div>
        <div class="stat-label">MRR (Revenus mensuels)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value" id="totalMerchants">0</div>
        <div class="stat-label">Total abonnés</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-value" id="activeCount">0</div>
        <div class="stat-label">Actifs</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-value" id="trialCount">0</div>
        <div class="stat-label">En essai</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔴</div>
        <div class="stat-value" id="suspendedCount">0</div>
        <div class="stat-label">Suspendus</div>
      </div>
    </div>
    
    <div class="card">
      <h2>📊 Répartition par plan</h2>
      <div class="plans-summary">
        <div class="plan-box starter">
          <h3>🥉 Starter</h3>
          <div class="count" id="starterCount">0</div>
          <div class="price">27$/mois</div>
        </div>
        <div class="plan-box pro">
          <h3>🥈 Pro</h3>
          <div class="count" id="proCount">0</div>
          <div class="price">47$/mois</div>
        </div>
        <div class="plan-box enterprise">
          <h3>🥇 Enterprise</h3>
          <div class="count" id="enterpriseCount">0</div>
          <div class="price">97$/mois</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>📋 Liste des abonnés SAAS</h2>
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="🔍 Rechercher par email, nom ou business..." oninput="filterMerchants()">
      </div>
      <div id="merchantsList">
        <div class="empty">
          <div class="empty-icon">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    let allMerchants = [];
    
    async function loadMerchants() {
      try {
        const res = await fetch('/api/admin/saas-merchants');
        const data = await res.json();
        
        if (!data.success) {
          document.getElementById('merchantsList').innerHTML = '<div style="padding:20px;color:#fca5a5;">Erreur: ' + data.error + '</div>';
          return;
        }
        
        allMerchants = data.merchants;
        const stats = data.stats;
        
        document.getElementById('mrr').textContent = stats.mrr + '$';
        document.getElementById('totalMerchants').textContent = stats.total;
        document.getElementById('activeCount').textContent = stats.byStatus.active;
        document.getElementById('trialCount').textContent = stats.byStatus.trial;
        document.getElementById('suspendedCount').textContent = stats.byStatus.suspended;
        
        document.getElementById('starterCount').textContent = stats.byPlan.starter;
        document.getElementById('proCount').textContent = stats.byPlan.pro;
        document.getElementById('enterpriseCount').textContent = stats.byPlan.enterprise;
        
        renderMerchants(allMerchants);
        
      } catch (e) {
        document.getElementById('merchantsList').innerHTML = '<div style="padding:20px;color:#fca5a5;">Erreur: ' + e.message + '</div>';
      }
    }
    
    function renderMerchants(merchants) {
      if (merchants.length === 0) {
        document.getElementById('merchantsList').innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>Aucun abonné pour le moment</p></div>';
        return;
      }
      
      let html = '<table><thead><tr><th>🏢 Business</th><th>📧 Email</th><th>💎 Plan</th><th>📊 Statut</th><th>📅 Créé le</th><th>⚙️ Actions</th></tr></thead><tbody>';
      
      merchants.forEach(m => {
        const createdAt = m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '-';
        const planBadge = m.plan || 'starter';
        const statusBadge = m.status || 'trial';
        
        html += '<tr>';
        html += '<td><strong>' + (m.businessName || m.slug) + '</strong><br><small style="color:#6b7280;">' + m.slug + '</small></td>';
        html += '<td>' + m.email + '</td>';
        html += '<td><span class="badge badge-' + planBadge + '">' + (m.planName || 'Starter') + ' (' + (m.planPrice || 27) + '$)</span></td>';
        html += '<td><span class="badge badge-' + statusBadge + '">' + statusBadge + '</span></td>';
        html += '<td>' + createdAt + '</td>';
        html += '<td class="actions-cell">';
        html += '<button class="btn btn-secondary btn-small" onclick="editMerchant(\\'' + m.slug + '\\')">✏️</button>';
        html += '<a href="/saas/' + m.slug + '/admin" target="_blank" class="btn btn-primary btn-small">👁️</a>';
        html += '<button class="btn btn-danger btn-small" onclick="deleteMerchant(\\'' + m.slug + '\\')">🗑️</button>';
        html += '</td>';
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      document.getElementById('merchantsList').innerHTML = html;
    }
    
    function filterMerchants() {
      const search = document.getElementById('searchInput').value.toLowerCase();
      if (!search) { renderMerchants(allMerchants); return; }
      const filtered = allMerchants.filter(m => 
        (m.email && m.email.toLowerCase().includes(search)) ||
        (m.businessName && m.businessName.toLowerCase().includes(search)) ||
        (m.slug && m.slug.toLowerCase().includes(search))
      );
      renderMerchants(filtered);
    }
    
    function editMerchant(slug) {
      alert('Édition de ' + slug + ' - Fonctionnalité à implémenter');
    }
    
    async function deleteMerchant(slug) {
      if (!confirm('⚠️ Supprimer définitivement ' + slug + ' ?')) return;
      try {
        const res = await fetch('/api/admin/saas-merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', slug })
        });
        const data = await res.json();
        if (data.success) { loadMerchants(); } 
        else { alert('Erreur: ' + data.error); }
      } catch (e) { alert('Erreur: ' + e.message); }
    }
    
    loadMerchants();
  </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
