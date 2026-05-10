import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const C = {
  dark:   '#0f172a',
  blue:   '#1e3a8a',
  orange: '#ff6000',
  white:  '#ffffff',
  gray:   '#9ca3af',
  border: 'rgba(255,255,255,0.12)',
  menuBg: '#1e293b',
};

export default function Navbar({ session, role, username, onLogout, onRoleUpdate }) {
  const [search,       setSearch]       = useState('');
  const [categories,   setCategories]   = useState([]);
  const [menuOuvert,   setMenuOuvert]   = useState(false);
  const [loadingRole,  setLoadingRole]  = useState(false);
  const [msgRole,      setMsgRole]      = useState('');

  const navigate    = useNavigate();
  const location    = useLocation();
  const menuRef     = useRef(null);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Catégories dynamiques depuis le backend
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
    setMenuOuvert(false);
    onLogout();
  };

  // Devenir vendeur — met à jour Redis + localStorage + état React sans reconnexion
  const devenirVendeur = async () => {
    setLoadingRole(true);
    setMsgRole('');
    try {
      const res = await api.put('/api/vendeurs/devenir-vendeur/');
      onRoleUpdate(res.data.role);
      setMsgRole('✓ Vous êtes maintenant vendeur !');
      setTimeout(() => { setMsgRole(''); setMenuOuvert(false); }, 2000);
    } catch (err) {
      setMsgRole(err.response?.data?.erreur || 'Erreur');
    } finally {
      setLoadingRole(false);
    }
  };

  const isCatActive = (cat) => {
    const p = new URLSearchParams(location.search);
    return location.pathname === '/produits' && p.get('categorie') === cat;
  };

  const isToutActive = location.pathname === '/produits'
    && !new URLSearchParams(location.search).get('categorie')
    && !new URLSearchParams(location.search).get('search');

  const linkStyle = (active) => ({
    color:        active ? C.orange : C.white,
    fontWeight:   active ? '600'    : '400',
    fontSize:     '13px',
    padding:      '8px 14px',
    whiteSpace:   'nowrap',
    borderBottom: active ? `2px solid ${C.orange}` : '2px solid transparent',
    display:      'block',
    textDecoration: 'none'
  });

  return (
    <header style={{
      background: `linear-gradient(135deg, ${C.dark} 0%, ${C.blue} 100%)`,
      position: 'sticky', top: 0, zIndex: 200,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>

      {/* ── Barre principale ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Logo */}
        <Link to="/produits" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: C.orange, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: C.white, letterSpacing: '-0.3px' }}>CentralShop</span>
        </Link>

        {/* Recherche */}
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: '600px' }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des produits, marques, vendeurs..."
            style={{ flex: 1, padding: '10px 16px', fontSize: '14px', border: 'none', borderRadius: '6px 0 0 6px', outline: 'none', background: C.white, color: '#111' }}
          />
          <button type="submit" style={{ padding: '10px 18px', background: C.orange, border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </form>

        {/* Droite */}
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
                {role === 'vendeur' ? 'Espace vendeur' : 'Commandes'}
              </Link>

              {/* ── Menu profil ── */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOuvert(!menuOuvert)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.orange, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: C.white, fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Mon profil"
                >
                  {username.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown */}
                {menuOuvert && (
                  <div style={{
                    position: 'absolute', top: '42px', right: 0,
                    background: C.menuBg, borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    minWidth: '220px', overflow: 'hidden', zIndex: 300
                  }}>
                    {/* Infos utilisateur */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: C.white }}>{username}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px',
                          background: role === 'vendeur' ? 'rgba(255,96,0,0.2)' : 'rgba(255,255,255,0.08)',
                          color:      role === 'vendeur' ? C.orange               : C.gray,
                          border:     `1px solid ${role === 'vendeur' ? 'rgba(255,96,0,0.4)' : 'rgba(255,255,255,0.1)'}`
                        }}>
                          {role === 'vendeur' ? '🏪 Vendeur' : role === 'admin' ? '⚙️ Admin' : '🛒 Acheteur'}
                        </span>
                      </div>
                    </div>

                    {/* Lien espace vendeur */}
                    {role === 'vendeur' && (
                      <Link to={`/vendeur/${username}`} onClick={() => setMenuOuvert(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: C.white, fontSize: '13px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>🏪</span> Mon profil vendeur
                      </Link>
                    )}

                    {/* Bouton "Devenir vendeur" — uniquement si rôle user */}
                    {role === 'user' && (
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {msgRole ? (
                          <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>{msgRole}</div>
                        ) : (
                          <>
                            <div style={{ fontSize: '12px', color: C.gray, marginBottom: '8px' }}>
                              Publiez vos produits sur CentralShop
                            </div>
                            <button
                              onClick={devenirVendeur}
                              disabled={loadingRole}
                              style={{
                                width: '100%', padding: '9px', background: C.orange,
                                color: C.white, border: 'none', borderRadius: '7px',
                                cursor: loadingRole ? 'wait' : 'pointer',
                                fontWeight: '600', fontSize: '13px',
                                opacity: loadingRole ? 0.7 : 1
                              }}
                            >
                              {loadingRole ? 'Activation...' : '🏪 Devenir vendeur'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Déconnexion */}
                    <button
                      onClick={handleLogout}
                      style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span> Déconnexion
                    </button>
                  </div>
                )}
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

      {/* ── Barre catégories ── */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          <Link to="/produits" style={linkStyle(isToutActive)}>Tout</Link>
          {categories.slice(0, 10).map(cat => (
            <Link key={cat} to={`/produits?categorie=${encodeURIComponent(cat)}`} style={linkStyle(isCatActive(cat))}>
              {cat}
            </Link>
          ))}
          {session && (
            <Link to="/stats" style={{ ...linkStyle(false), color: C.gray, marginLeft: 'auto' }}>
              Analytique
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
