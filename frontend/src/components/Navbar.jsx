import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const C = {
  dark: '#0f172a', orange: '#ff6000', white: '#ffffff',
  gray: '#9ca3af', border: 'rgba(255,255,255,0.12)',
};

export default function Navbar({ session, onLogout }) {
  const [search,     setSearch]     = useState('');
  const [categories, setCategories] = useState([]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const username  = localStorage.getItem('username') || '';

  // Catégories chargées dynamiquement depuis le backend
  useEffect(() => {
    api.get('/api/produits/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/produits?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try { await fetch(`/api/auth/logout/${sessionId}`, { method: 'DELETE' }); } catch (_) {}
    }
    onLogout();
  };

  const activeStyle = { color: C.orange, fontWeight: '600', borderBottom: `2px solid ${C.orange}` };
  const inactiveStyle = { color: C.white, fontWeight: '400', borderBottom: '2px solid transparent' };

  const isCatActive = (cat) => {
    const p = new URLSearchParams(location.search);
    return location.pathname === '/produits' && p.get('categorie') === cat;
  };

  return (
    <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>

      {/* ── Barre principale ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '20px' }}>

        <Link to="/produits" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: C.orange, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: C.white, letterSpacing: '-0.3px' }}>CentralShop</span>
        </Link>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: '600px' }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des produits, marques, vendeurs..."
            style={{ flex: 1, padding: '10px 16px', fontSize: '14px', border: 'none', borderRadius: '6px 0 0 6px', outline: 'none', background: C.white, color: '#111' }}
          />
          <button type="submit" style={{ padding: '10px 18px', background: C.orange, border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', color: C.white, fontWeight: '600' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </form>

        {/* Zone droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          {session ? (
            <>
              <Link to="/panier" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: C.white, fontSize: '11px', gap: '2px', textDecoration: 'none' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="21" r="1" fill="white"/><circle cx="20" cy="21" r="1" fill="white"/>
                </svg>
                Panier
              </Link>
              <Link to="/commandes" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: C.white, fontSize: '11px', gap: '2px', textDecoration: 'none' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Commandes
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <Link to={`/vendeur/${username}`} style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>
                  {username.charAt(0).toUpperCase()}
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: C.gray, fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: C.white, fontSize: '14px', fontWeight: '500', padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: '6px', textDecoration: 'none' }}>
                Connexion
              </Link>
              <Link to="/register" style={{ color: C.dark, fontSize: '14px', fontWeight: '600', padding: '8px 16px', background: C.orange, borderRadius: '6px', textDecoration: 'none' }}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Barre catégories dynamique ── */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>

          {/* Lien "Tout" */}
          <Link to="/produits" style={{
            ...(location.pathname === '/produits' && !new URLSearchParams(location.search).get('categorie') && !new URLSearchParams(location.search).get('search') ? activeStyle : inactiveStyle),
            fontSize: '13px', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'block'
          }}>
            Tout
          </Link>

          {/* Catégories dynamiques */}
          {categories.slice(0, 10).map(cat => (
            <Link key={cat} to={`/produits?categorie=${encodeURIComponent(cat)}`} style={{
              ...(isCatActive(cat) ? activeStyle : inactiveStyle),
              fontSize: '13px', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'block'
            }}>
              {cat}
            </Link>
          ))}

          {session && (
            <Link to="/stats" style={{
              ...inactiveStyle,
              fontSize: '13px', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'block', marginLeft: 'auto'
            }}>
              Analytique
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
