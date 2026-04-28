import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', dark: '#111827', gray: '#6b7280',
  border: '#e5e7eb', lightGray: '#f9fafb', white: '#ffffff', success: '#16a34a'
};

export default function Vendeur() {
  const { nom }    = useParams();
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get(`/api/vendeurs/${nom}`);
        setData(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    charger();
  }, [nom]);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Chargement...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Vendeur introuvable</div>;

  const { vendeur, stats, produits } = data;

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* Profil */}
        <div style={{ background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: '28px', fontWeight: '800', flexShrink: 0 }}>
              {vendeur.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: C.dark, margin: '0 0 4px' }}>{vendeur.username}</h1>
              <div style={{ fontSize: '13px', color: C.gray }}>Membre depuis {new Date(vendeur.membre_depuis).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
              {vendeur.bio && <p style={{ fontSize: '14px', color: C.gray, margin: '8px 0 0', lineHeight: '1.5' }}>{vendeur.bio}</p>}
            </div>
          </div>

          {/* Statistiques vendeur */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Produits', value: stats.nb_produits,     icon: '📦' },
              { label: 'Ventes',   value: stats.total_commandes, icon: '🛒' },
              { label: 'Vues',     value: stats.total_vues,      icon: '👁' }
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: C.lightGray, borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: C.dark, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '13px', color: C.gray }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Produits du vendeur */}
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.dark, marginBottom: '16px' }}>
          Produits de {vendeur.username} ({produits.length})
        </h2>

        {produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: C.white, borderRadius: '12px', color: C.gray }}>
            Ce vendeur n'a pas encore de produits.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {produits.map(p => (
              <Link key={p._id} to={`/produits/${p._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ height: '180px', background: C.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px' }}>📦</span>}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <span style={{ fontSize: '11px', color: C.orange, fontWeight: '600', textTransform: 'uppercase' }}>{p.categorie}</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: C.dark, margin: '4px 0 8px', lineHeight: '1.3' }}>{p.nom}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: C.orange }}>{p.prix.toLocaleString()} MAD</span>
                      <span style={{ fontSize: '11px', color: p.stock > 0 ? C.success : '#dc2626' }}>{p.stock > 0 ? `${p.stock} dispo` : 'Épuisé'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: C.gray, marginTop: '6px' }}>👁 {p.vues || 0} · 🛒 {p.commandes || 0} vendus</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
