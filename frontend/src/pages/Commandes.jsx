import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', orangeDark: '#e55500', dark: '#111827', gray: '#6b7280',
  border: '#e5e7eb', lightGray: '#f9fafb', white: '#ffffff',
  success: '#16a34a', red: '#dc2626', blue: '#1e3a8a'
};

function StatCard({ icon, label, value, sub, color = C.orange }) {
  return (
    <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fff3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: C.dark, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: C.gray, marginTop: '3px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function BadgeStatut({ statut }) {
  const cfg = {
    en_attente: { bg: '#fffbeb', color: '#92400e', label: 'En attente' },
    confirmee:  { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmée' },
    expediee:   { bg: '#f0fdf4', color: '#15803d', label: 'Expédiée' },
    livree:     { bg: '#f0fdf4', color: C.success,  label: 'Livrée' },
  }[statut] || { bg: C.lightGray, color: C.gray, label: statut };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// VUE ACHETEUR
// ──────────────────────────────────────────────────────────────
function VueAcheteur({ username, onRoleUpdate }) {
  const [commandes, setCommandes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loading2,  setLoading2]  = useState(false);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    api.get(`/api/commandes/user/${username}`)
      .then(res => setCommandes(res.data.commandes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const devenirVendeur = async () => {
    setLoading2(true);
    try {
      const res = await api.put('/api/vendeurs/devenir-vendeur/');
      onRoleUpdate(res.data.role);
      setMsg('✓ Compte vendeur activé ! La page va se mettre à jour.');
    } catch (err) {
      setMsg(err.response?.data?.erreur || 'Erreur');
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div>
      {/* CTA Devenir vendeur */}
      <div style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #1e40af 100%)`, borderRadius: '12px', padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: C.white, fontSize: '18px', fontWeight: '700', margin: '0 0 6px' }}>Vous aussi, devenez vendeur</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>Publiez vos produits et gérez vos ventes depuis votre espace vendeur.</p>
          {msg && <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>{msg}</p>}
        </div>
        <button onClick={devenirVendeur} disabled={loading2}
          style={{ padding: '12px 24px', background: C.orange, color: C.white, border: 'none', borderRadius: '8px', cursor: loading2 ? 'wait' : 'pointer', fontWeight: '700', fontSize: '14px', flexShrink: 0, opacity: loading2 ? 0.7 : 1 }}>
          {loading2 ? 'Activation...' : '🏪 Devenir vendeur'}
        </button>
      </div>

      {/* Historique achats */}
      <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.dark, marginBottom: '14px' }}>Mon historique d'achats</h2>
      <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: C.gray }}>Chargement...</div>
        ) : commandes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.gray }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛍️</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: C.dark, marginBottom: '6px' }}>Aucune commande pour l'instant</div>
            <Link to="/produits" style={{ color: C.orange, fontWeight: '600', fontSize: '14px' }}>Découvrir le catalogue →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.lightGray, borderBottom: `1px solid ${C.border}` }}>
                {['Produit', 'Quantité', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: C.dark }}>{c.produit}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: C.dark }}>×{c.quantite}</td>
                  <td style={{ padding: '14px 16px' }}><BadgeStatut statut={c.statut} /></td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: C.gray }}>
                    {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VUE VENDEUR
// ──────────────────────────────────────────────────────────────
function VueVendeur({ username }) {
  const [onglet,   setOnglet]   = useState('dashboard');
  const [data,     setData]     = useState(null);
  const [commandes,setCommandes]= useState([]);
  const [loading,  setLoading]  = useState(true);

  const chargerDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/vendeurs/${username}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [username]);

  const chargerCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/commandes/vendeur/${username}`);
      setCommandes(res.data.commandes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [username]);

  useEffect(() => {
    if (onglet === 'dashboard' || onglet === 'produits') chargerDashboard();
    else chargerCommandes();
  }, [onglet, chargerDashboard, chargerCommandes]);

  const stats    = data?.stats    || {};
  const produits = data?.produits || [];

  return (
    <div>
      {/* En-tête vendeur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: C.dark, margin: '0 0 4px' }}>Espace vendeur</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: C.gray }}>Connecté en tant que</span>
            <span style={{ fontWeight: '700', color: C.dark }}>{username}</span>
            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', background: '#fff3ed', color: C.orange, border: '1px solid #fed7aa' }}>🏪 Vendeur</span>
          </div>
        </div>
        <Link to="/produits" style={{ padding: '9px 18px', background: C.orange, color: C.white, borderRadius: '7px', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
          + Ajouter un produit
        </Link>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', background: C.white, padding: '4px', borderRadius: '8px', border: `1px solid ${C.border}`, width: 'fit-content', marginBottom: '20px' }}>
        {[
          { id: 'dashboard', label: '📊 Tableau de bord' },
          { id: 'produits',  label: '📦 Mes produits' },
          { id: 'commandes', label: '🧾 Commandes reçues' }
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setOnglet(id)} style={{
            padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            background: onglet === id ? C.orange : 'transparent',
            color:      onglet === id ? C.white  : C.gray
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.gray }}>Chargement...</div>
      ) : (
        <>
          {/* ── DASHBOARD ── */}
          {onglet === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <StatCard icon="📦" label="Produits actifs"    value={stats.nb_produits      || 0} />
              <StatCard icon="🛒" label="Total commandes"    value={stats.total_commandes   || 0} sub="sur tous vos produits" />
              <StatCard icon="👁" label="Total vues"         value={stats.total_vues        || 0} />
              <StatCard icon="💰" label="Chiffre d'affaires" value={`${(stats.ca_estime || 0).toLocaleString()} MAD`} sub="estimé" />
            </div>
          )}

          {/* ── MES PRODUITS ── */}
          {onglet === 'produits' && (
            <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {produits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: C.gray }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: C.dark, marginBottom: '8px' }}>Aucun produit publié</div>
                  <Link to="/produits" style={{ color: C.orange, fontWeight: '600', fontSize: '14px' }}>Ajouter votre premier produit →</Link>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.lightGray, borderBottom: `1px solid ${C.border}` }}>
                      {['Produit', 'Catégorie', 'Prix', 'Stock', 'Commandes', 'Vues', 'CA estimé'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map((p, i) => (
                      <tr key={p._id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.lightGray }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : C.lightGray}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: C.lightGray, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.image ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📦</span>}
                            </div>
                            <Link to={`/produits/${p._id}`} style={{ fontSize: '14px', fontWeight: '600', color: C.dark, textDecoration: 'none' }}>{p.nom}</Link>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '12px', color: C.orange, fontWeight: '600', background: '#fff3ed', padding: '3px 8px', borderRadius: '4px' }}>{p.categorie}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: C.dark }}>{p.prix.toLocaleString()} MAD</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
                            background: p.stock === 0 ? '#fef2f2' : p.stock <= 5 ? '#fffbeb' : '#f0fdf4',
                            color:      p.stock === 0 ? C.red     : p.stock <= 5 ? '#92400e' : C.success
                          }}>
                            {p.stock === 0 ? '❌ Épuisé' : `${p.stock} unité${p.stock > 1 ? 's' : ''}`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '16px', fontWeight: '800', color: C.dark }}>{p.commandes || 0}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: C.gray }}>{p.vues || 0}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: C.success }}>
                          {((p.commandes || 0) * p.prix) > 0 ? `${((p.commandes || 0) * p.prix).toLocaleString()} MAD` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── COMMANDES REÇUES ── */}
          {onglet === 'commandes' && (
            <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {commandes.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: C.gray }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: C.dark }}>Aucune commande reçue pour l'instant</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.lightGray, borderBottom: `1px solid ${C.border}` }}>
                      {['Client', 'Produit', 'Qté', 'Prix unitaire', 'Total', 'Statut', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commandes.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.lightGray }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: C.dark }}>{c.client}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: C.dark }}>{c.produit}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: C.dark }}>×{c.quantite}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: C.gray }}>{(c.prix_unitaire || 0).toLocaleString()} MAD</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: C.success }}>{(c.total || 0).toLocaleString()} MAD</td>
                        <td style={{ padding: '14px 16px' }}><BadgeStatut statut={c.statut} /></td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: C.gray }}>
                          {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function Commandes({ role, username, onRoleUpdate }) {
  return (
    <div style={{ background: C.lightGray, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {role === 'vendeur' || role === 'admin'
          ? <VueVendeur  username={username} />
          : <VueAcheteur username={username} onRoleUpdate={onRoleUpdate} />
        }
      </div>
    </div>
  );
}
