import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', orangeDark: '#e55500', orangeLight: '#fff3ed',
  dark: '#111827', gray: '#6b7280', border: '#e5e7eb',
  lightGray: '#f9fafb', white: '#ffffff', success: '#16a34a', red: '#dc2626'
};

export default function ProduitDetail({ session }) {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [produit,   setProduit]    = useState(null);
  const [similaires, setSimilaires] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [quantite,  setQuantite]  = useState(1);
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      try {
        const [resProduit, resSim] = await Promise.all([
          api.get(`/api/produits/${id}`),
          api.get(`/api/produits/${id}/similaires`)
        ]);
        setProduit(resProduit.data.produit);
        setSimilaires(resSim.data.similaires || []);
        // Enregistrer une vue
        api.post(`/api/stats/vue/${id}/`).catch(() => {});
      } catch (_) { navigate('/produits'); }
      finally { setLoading(false); }
    };
    charger();
  }, [id]);

  const ajouterAuPanier = async () => {
    if (!session) { navigate('/login'); return; }
    const userId = localStorage.getItem('username');
    try {
      await api.post(`/api/panier/${userId}/`, { produitId: produit._id, quantite });
      setSuccess(`${quantite}x "${produit.nom}" ajouté au panier`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { alert(err.response?.data?.erreur || 'Stock insuffisant'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Chargement...</div>;
  if (!produit) return null;

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* Fil d'Ariane */}
        <div style={{ fontSize: '13px', color: C.gray, marginBottom: '20px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link to="/produits" style={{ color: C.orange }}>Catalogue</Link>
          <span>/</span>
          <Link to={`/produits?categorie=${produit.categorie}`} style={{ color: C.orange }}>{produit.categorie}</Link>
          <span>/</span>
          <span>{produit.nom}</span>
        </div>

        {/* Fiche produit */}
        <div style={{ background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '32px' }}>

          {/* Image */}
          <div style={{ background: C.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px', borderRight: `1px solid ${C.border}` }}>
            {produit.image
              ? <img src={produit.image} alt={produit.nom} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', padding: '24px' }} />
              : <div style={{ textAlign: 'center', color: '#cbd5e1' }}><span style={{ fontSize: '64px' }}>📦</span><div style={{ fontSize: '14px', marginTop: '12px' }}>Pas d'image</div></div>}
          </div>

          {/* Infos */}
          <div style={{ padding: '36px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: C.orange, textTransform: 'uppercase', letterSpacing: '1px' }}>{produit.categorie}</span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: C.dark, margin: '10px 0 8px', letterSpacing: '-0.3px', lineHeight: '1.2' }}>{produit.nom}</h1>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: C.gray }}>
              <span>👁 {produit.vues || 0} vues</span>
              <span>🛒 {produit.commandes || 0} vendus</span>
              {produit.vendeur && (
                <Link to={`/vendeur/${produit.vendeur}`} style={{ color: C.orange }}>
                  Vendeur : {produit.vendeur}
                </Link>
              )}
            </div>

            {/* Prix */}
            <div style={{ fontSize: '36px', fontWeight: '800', color: C.orange, marginBottom: '8px' }}>
              {produit.prix.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: '600' }}>MAD</span>
            </div>

            {/* Stock */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                background: produit.stock > 0 ? '#f0fdf4' : '#fef2f2',
                color:      produit.stock > 0 ? C.success   : C.red,
                border:     `1px solid ${produit.stock > 0 ? '#bbf7d0' : '#fecaca'}`
              }}>
                {produit.stock > 0 ? `✓ En stock (${produit.stock} disponibles)` : '✗ Rupture de stock'}
              </span>
            </div>

            {/* Description */}
            {produit.description && (
              <p style={{ fontSize: '15px', color: C.gray, lineHeight: '1.7', marginBottom: '24px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                {produit.description}
              </p>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: C.success, fontSize: '14px' }}>
                {success}
              </div>
            )}

            {/* Quantité + CTA */}
            {produit.stock > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setQuantite(q => Math.max(1, q - 1))} style={{ padding: '10px 16px', border: 'none', background: C.lightGray, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>−</button>
                  <span style={{ padding: '10px 20px', fontSize: '15px', fontWeight: '600', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{quantite}</span>
                  <button onClick={() => setQuantite(q => Math.min(produit.stock, q + 1))} style={{ padding: '10px 16px', border: 'none', background: C.lightGray, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>+</button>
                </div>
                <span style={{ fontSize: '13px', color: C.gray }}>max {produit.stock}</span>
              </div>
            )}

            <button onClick={ajouterAuPanier} disabled={produit.stock === 0}
              style={{
                width: '100%', padding: '14px', fontSize: '16px', fontWeight: '700',
                background: produit.stock > 0 ? C.orange : '#e5e7eb',
                color:      produit.stock > 0 ? C.white  : C.gray,
                border: 'none', borderRadius: '8px',
                cursor: produit.stock > 0 ? 'pointer' : 'not-allowed',
                marginBottom: '12px', transition: 'background 0.15s'
              }}
              onMouseEnter={e => { if (produit.stock > 0) e.target.style.background = C.orangeDark; }}
              onMouseLeave={e => { if (produit.stock > 0) e.target.style.background = C.orange; }}
            >
              {produit.stock > 0
                ? (session ? '🛒 Ajouter au panier' : 'Se connecter pour acheter')
                : 'Indisponible'}
            </button>

            {!session && produit.stock > 0 && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: C.gray }}>
                <Link to="/login" style={{ color: C.orange, fontWeight: '600' }}>Connexion</Link> ou
                <Link to="/register" style={{ color: C.orange, fontWeight: '600' }}> inscription</Link> requise pour acheter
              </p>
            )}
          </div>
        </div>

        {/* Produits similaires */}
        {similaires.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.dark, marginBottom: '16px' }}>Produits similaires</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {similaires.map(p => (
                <Link key={p._id} to={`/produits/${p._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ height: '140px', background: C.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.image
                        ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '32px' }}>📦</span>}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: C.dark, marginBottom: '4px', lineHeight: '1.3' }}>{p.nom}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: C.orange }}>{p.prix.toLocaleString()} MAD</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
