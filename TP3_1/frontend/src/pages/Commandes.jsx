import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', orangeDark: '#e55500', dark: '#111827', gray: '#6b7280',
  border: '#e5e7eb', lightGray: '#f9fafb', white: '#ffffff', success: '#16a34a', red: '#dc2626'
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fff3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '26px', fontWeight: '800', color: C.dark, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: C.gray, marginTop: '3px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function BadgeStatut({ statut }) {
  const cfg = {
    en_attente: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'En attente' },
    confirmee:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Confirmée' },
    expediee:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Expédiée' },
    livree:     { bg: '#f0fdf4', color: C.success,  border: '#bbf7d0', label: 'Livrée' },
  }[statut] || { bg: C.lightGray, color: C.gray, border: C.border, label: statut };

  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

export default function Commandes() {
  const [onglet,     setOnglet]     = useState('dashboard'); // 'dashboard' | 'historique'
  const [produits,   setProduits]   = useState([]);
  const [commandes,  setCommandes]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);

  const username = localStorage.getItem('username') || '';

  const chargerDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/vendeurs/${username}`);
      setProduits(res.data.produits  || []);
      setStats(res.data.stats        || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [username]);

  const chargerHistorique = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/commandes/user/${username}`);
      setCommandes(res.data.commandes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [username]);

  useEffect(() => {
    if (onglet === 'dashboard') chargerDashboard();
    else chargerHistorique();
  }, [onglet, chargerDashboard, chargerHistorique]);

  const totalVentes = produits.reduce((acc, p) => acc + (p.commandes || 0) * p.prix, 0);

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: C.dark, margin: '0 0 4px' }}>Espace vendeur</h1>
            <p style={{ color: C.gray, fontSize: '14px', margin: 0 }}>Connecté en tant que <strong style={{ color: C.dark }}>{username}</strong></p>
          </div>
          <Link to="/produits" style={{ padding: '9px 18px', background: C.orange, color: C.white, borderRadius: '7px', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
            + Ajouter un produit
          </Link>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', background: C.white, padding: '4px', borderRadius: '8px', border: `1px solid ${C.border}`, width: 'fit-content', marginBottom: '20px' }}>
          {[
            { id: 'dashboard',  label: '📦 Mes produits' },
            { id: 'historique', label: '🧾 Mes commandes' }
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setOnglet(id)} style={{
              padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600',
              background: onglet === id ? C.orange : 'transparent',
              color:      onglet === id ? C.white  : C.gray
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ONGLET DASHBOARD ── */}
        {onglet === 'dashboard' && (
          <>
            {/* KPIs */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <StatCard icon="📦" label="Produits actifs"    value={stats.nb_produits   || 0} />
                <StatCard icon="🛒" label="Total commandes"    value={stats.total_commandes || 0} sub="sur tous vos produits" />
                <StatCard icon="👁" label="Total vues"         value={stats.total_vues     || 0} />
                <StatCard icon="💰" label="Chiffre d'affaires" value={`${totalVentes.toLocaleString()} MAD`} sub="estimé" />
              </div>
            )}

            {/* Tableau produits */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.gray }}>Chargement...</div>
            ) : produits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, color: C.gray }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: C.dark, marginBottom: '8px' }}>Vous n'avez pas encore de produits</div>
                <Link to="/produits" style={{ color: C.orange, fontWeight: '600', fontSize: '14px' }}>Ajouter votre premier produit →</Link>
              </div>
            ) : (
              <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.lightGray }}>
                      {['Produit', 'Catégorie', 'Prix', 'Stock', 'Commandes', 'CA estimé', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map((p) => {
                      const caEstime = (p.commandes || 0) * p.prix;
                      return (
                        <tr key={p._id} style={{ borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Produit */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: C.lightGray, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p.image
                                  ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <span style={{ fontSize: '18px' }}>📦</span>}
                              </div>
                              <Link to={`/produits/${p._id}`} style={{ fontSize: '14px', fontWeight: '600', color: C.dark, textDecoration: 'none', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                {p.nom}
                              </Link>
                            </div>
                          </td>

                          {/* Catégorie */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '12px', color: C.orange, fontWeight: '600', background: '#fff3ed', padding: '3px 8px', borderRadius: '4px' }}>
                              {p.categorie}
                            </span>
                          </td>

                          {/* Prix */}
                          <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: C.dark }}>
                            {p.prix.toLocaleString()} MAD
                          </td>

                          {/* Stock */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontSize: '13px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
                              background: p.stock === 0 ? '#fef2f2' : p.stock <= 5 ? '#fffbeb' : '#f0fdf4',
                              color:      p.stock === 0 ? C.red     : p.stock <= 5 ? '#92400e' : C.success,
                              border:     `1px solid ${p.stock === 0 ? '#fecaca' : p.stock <= 5 ? '#fde68a' : '#bbf7d0'}`
                            }}>
                              {p.stock === 0 ? '❌ Épuisé' : `${p.stock} unité${p.stock > 1 ? 's' : ''}`}
                            </span>
                          </td>

                          {/* Commandes */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '18px', fontWeight: '800', color: C.dark }}>{p.commandes || 0}</span>
                              <span style={{ fontSize: '12px', color: C.gray }}>commande{(p.commandes || 0) > 1 ? 's' : ''}</span>
                            </div>
                          </td>

                          {/* CA estimé */}
                          <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: C.success }}>
                            {caEstime > 0 ? `${caEstime.toLocaleString()} MAD` : '—'}
                          </td>

                          {/* Lien */}
                          <td style={{ padding: '14px 16px' }}>
                            <Link to={`/produits/${p._id}`} style={{ fontSize: '12px', color: C.orange, fontWeight: '500', textDecoration: 'none' }}>
                              Voir →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── ONGLET HISTORIQUE ── */}
        {onglet === 'historique' && (
          <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.gray }}>Chargement...</div>
            ) : commandes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.gray }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: C.dark }}>Aucune commande passée</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.lightGray }}>
                    {['Produit', 'Quantité', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
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
        )}

      </div>
    </div>
  );
}
