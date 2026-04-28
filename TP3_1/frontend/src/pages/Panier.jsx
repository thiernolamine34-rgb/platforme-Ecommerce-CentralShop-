import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', orangeDark: '#e55500', orangeLight: '#fff3ed',
  dark: '#111827', gray: '#6b7280', border: '#e5e7eb',
  lightGray: '#f9fafb', white: '#ffffff', success: '#16a34a', red: '#dc2626'
};

function LignePanier({ ligne, onRetirer, onModifierQte }) {
  const [chargement, setChargement] = useState(false);

  const modifier = async (delta) => {
    const nvQte = ligne.quantite + delta;
    if (nvQte < 1) return;
    setChargement(true);
    await onModifierQte(ligne.produitId, nvQte);
    setChargement(false);
  };

  if (ligne.introuvable) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, gap: '16px', opacity: 0.5 }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: C.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>❌</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: C.red }}>Produit indisponible</div>
          <div style={{ fontSize: '12px', color: C.gray, marginTop: '2px' }}>Ce produit a été retiré du catalogue</div>
        </div>
        <button onClick={() => onRetirer(ligne.produitId)}
          style={{ padding: '6px 14px', background: C.white, color: C.red, border: `1px solid #fecaca`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, gap: '16px' }}>
      {/* Image */}
      <Link to={`/produits/${ligne.produitId}`} style={{ flexShrink: 0 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: C.lightGray, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ligne.image
            ? <img src={ligne.image} alt={ligne.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '28px' }}>📦</span>}
        </div>
      </Link>

      {/* Infos produit */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/produits/${ligne.produitId}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: C.dark, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ligne.nom}
          </div>
        </Link>
        <div style={{ fontSize: '12px', color: C.gray, marginBottom: '6px' }}>{ligne.categorie}</div>
        <div style={{ fontSize: '13px', color: C.dark }}>
          Prix unitaire : <strong style={{ color: C.orange }}>{ligne.prix.toLocaleString()} MAD</strong>
        </div>
        {ligne.stock <= 5 && (
          <div style={{ fontSize: '11px', color: '#92400e', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
            Plus que {ligne.stock} en stock
          </div>
        )}
      </div>

      {/* Sélecteur quantité */}
      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
        <button onClick={() => modifier(-1)} disabled={chargement || ligne.quantite <= 1}
          style={{ padding: '8px 12px', border: 'none', background: C.lightGray, cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: C.dark, opacity: ligne.quantite <= 1 ? 0.4 : 1 }}>
          −
        </button>
        <span style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '600', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: '48px', textAlign: 'center' }}>
          {ligne.quantite}
        </span>
        <button onClick={() => modifier(+1)} disabled={chargement || ligne.quantite >= ligne.stock}
          style={{ padding: '8px 12px', border: 'none', background: C.lightGray, cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: C.dark, opacity: ligne.quantite >= ligne.stock ? 0.4 : 1 }}>
          +
        </button>
      </div>

      {/* Sous-total */}
      <div style={{ minWidth: '100px', textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: C.dark }}>{ligne.sousTotal.toLocaleString()} MAD</div>
        <div style={{ fontSize: '11px', color: C.gray, marginTop: '2px' }}>{ligne.quantite} × {ligne.prix.toLocaleString()}</div>
      </div>

      {/* Retirer */}
      <button onClick={() => onRetirer(ligne.produitId)}
        style={{ flexShrink: 0, width: '32px', height: '32px', border: `1px solid #fecaca`, borderRadius: '6px', background: C.white, color: C.red, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Retirer du panier">
        ×
      </button>
    </div>
  );
}

export default function Panier() {
  const [lignes,   setLignes]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [success,  setSuccess]  = useState('');

  const userId = localStorage.getItem('username') || 'user1';

  const chargerPanier = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/panier/${userId}/`);
      setLignes(res.data.panier || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { chargerPanier(); }, [chargerPanier]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const retirer = async (produitId) => {
    try {
      await api.delete(`/api/panier/${userId}/${produitId}/`);
      flash('Article retiré du panier');
      chargerPanier();
    } catch (err) { console.error(err); }
  };

  const modifierQte = async (produitId, quantite) => {
    try {
      await api.patch(`/api/panier/${userId}/${produitId}/`, { quantite });
      chargerPanier();
    } catch (err) {
      alert(err.response?.data?.erreur || 'Erreur');
    }
  };

  const vider = async () => {
    if (!window.confirm('Vider tout le panier ?')) return;
    try {
      await api.delete(`/api/panier/${userId}/`);
      flash('Panier vidé');
      setLignes([]); setTotal(0);
    } catch (err) { console.error(err); }
  };

  const nbArticles  = lignes.filter(l => !l.introuvable).reduce((acc, l) => acc + l.quantite, 0);
  const nbProduits  = lignes.filter(l => !l.introuvable).length;

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: C.dark, margin: '0 0 4px' }}>Mon panier</h1>
          <p style={{ color: C.gray, fontSize: '14px', margin: 0 }}>
            {nbProduits > 0 ? `${nbArticles} article${nbArticles > 1 ? 's' : ''} — ${nbProduits} produit${nbProduits > 1 ? 's' : ''}` : 'Votre panier est vide'}
          </p>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '11px 16px', marginBottom: '16px', color: C.success, fontSize: '14px' }}>
            ✓ {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Chargement...</div>
        ) : lignes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', background: C.white, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛒</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: C.dark, marginBottom: '8px' }}>Votre panier est vide</div>
            <div style={{ fontSize: '14px', color: C.gray, marginBottom: '24px' }}>Découvrez notre catalogue et ajoutez des produits</div>
            <Link to="/produits" style={{ display: 'inline-block', padding: '12px 28px', background: C.orange, color: C.white, borderRadius: '8px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Découvrir le catalogue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

            {/* Articles */}
            <div>
              <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '600', color: C.dark, margin: 0 }}>Articles ({nbArticles})</h2>
                  <button onClick={vider}
                    style={{ padding: '6px 14px', background: C.white, color: C.red, border: `1px solid #fecaca`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Tout vider
                  </button>
                </div>
                {lignes.map(ligne => (
                  <LignePanier
                    key={ligne.produitId}
                    ligne={ligne}
                    onRetirer={retirer}
                    onModifierQte={modifierQte}
                  />
                ))}
              </div>

              <Link to="/produits" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '14px', color: C.orange, fontWeight: '500', textDecoration: 'none' }}>
                ← Continuer mes achats
              </Link>
            </div>

            {/* Récapitulatif */}
            <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '24px', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.dark, marginBottom: '20px' }}>Récapitulatif</h2>

              {/* Détail par produit */}
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lignes.filter(l => !l.introuvable).map(l => (
                  <div key={l.produitId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.gray }}>
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nom} ×{l.quantite}</span>
                    <span style={{ fontWeight: '500', color: C.dark }}>{l.sousTotal.toLocaleString()} MAD</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: C.dark }}>Total</span>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: C.orange }}>{total.toLocaleString()} MAD</span>
                </div>
              </div>

              <button
                onClick={() => alert('Fonctionnalité de paiement à implémenter')}
                style={{ width: '100%', padding: '14px', background: C.orange, color: C.white, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.target.style.background = C.orangeDark}
                onMouseLeave={e => e.target.style.background = C.orange}
              >
                Passer la commande →
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: C.gray, marginTop: '12px' }}>
                Livraison et taxes calculées à l'étape suivante
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
