import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  primary: '#2563eb', dark: '#0f172a', gray: '#64748b',
  border: '#e2e8f0', error: '#dc2626', bg: '#f8fafc'
};

export default function Login({ onLogin }) {
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [erreur,  setErreur]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setErreur('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setErreur('');
    try {
      const res = await api.post('/api/auth/login/', form);
      onLogin(res.data.sessionId, res.data.username);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:           '100vh',
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily:          'Inter, sans-serif'
    }}>

      {/* ── Panneau gauche ── */}
      <div style={{
        background:     'linear-gradient(145deg, #0f172a, #1e3a8a)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        padding:        '48px 56px',
        color:          'white'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', background: '#2563eb',
            borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            CentralShop
          </span>
        </div>

        {/* Texte central */}
        <div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px', letterSpacing: '-0.5px' }}>
            Votre boutique,<br />sans limites.
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.7, lineHeight: '1.7', maxWidth: '380px' }}>
            Découvrez des milliers de produits soigneusement sélectionnés,
            livrés rapidement partout dans le monde.
          </p>
        </div>

        {/* Témoignages / stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { val: '50k+',  label: 'Clients satisfaits' },
            { val: '10k+',  label: 'Produits disponibles' },
            { val: '24/7',  label: 'Support client' }
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: '10px',
              padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{s.val}</div>
              <div style={{ fontSize: '12px', opacity: 0.65 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div style={{
        background:     'white',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '60px 64px'
      }}>
        <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>

          {/* Titre */}
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: C.dark, marginBottom: '6px', letterSpacing: '-0.3px' }}>
            Bon retour parmi nous
          </h1>
          <p style={{ color: C.gray, fontSize: '15px', marginBottom: '32px' }}>
            Connectez-vous pour accéder à votre compte
          </p>

          {/* Erreur */}
          {erreur && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '20px', color: C.error, fontSize: '14px'
            }}>
              {erreur}
            </div>
          )}

          {/* Champs */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: C.dark, marginBottom: '6px' }}>
              Nom d'utilisateur ou email
            </label>
            <input
              type="text"
              placeholder="Votre identifiant"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: `1.5px solid ${C.border}`, fontSize: '14px',
                outline: 'none', color: C.dark, background: C.bg
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: C.dark, marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: `1.5px solid ${C.border}`, fontSize: '14px',
                outline: 'none', color: C.dark, background: C.bg
              }}
            />
          </div>

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', background: loading ? '#93c5fd' : C.primary,
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px', letterSpacing: '0.2px'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span style={{ fontSize: '13px', color: C.gray }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          {/* Lien inscription */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: C.gray }}>
            Nouveau sur CentralShop ?{' '}
            <Link to="/register" style={{ color: C.primary, fontWeight: '700' }}>
              Créer un compte gratuitement
            </Link>
          </p>

          {/* Continuer sans connexion */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/produits" style={{ fontSize: '14px', color: C.gray }}>
              Continuer sans connexion <span style={{ color: C.primary }}>→ Voir le catalogue</span>
            </a>
          </div>

          {/* Mentions */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '16px', lineHeight: '1.6' }}>
            En vous connectant, vous acceptez nos{' '}
            <span style={{ color: C.primary, cursor: 'pointer' }}>Conditions d'utilisation</span>
            {' '}et notre{' '}
            <span style={{ color: C.primary, cursor: 'pointer' }}>Politique de confidentialité</span>
          </p>
        </div>
      </div>
    </div>
  );
}