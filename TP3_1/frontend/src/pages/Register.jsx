import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const C = {
  primary: '#2563eb',
  dark:    '#0f172a',
  gray:    '#64748b',
  border:  '#e2e8f0',
  error:   '#dc2626',
  success: '#16a34a',
  bg:      '#f8fafc'
};

export default function Register() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ username: '', email: '', password: '', confirm: '' });
  const [erreur,  setErreur]  = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password || !form.confirm) {
      setErreur('Veuillez remplir tous les champs');
      return;
    }
    if (form.password !== form.confirm) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setErreur('');

    try {
      await api.post('/api/auth/register/', {
        username: form.username,
        email:    form.email,
        password: form.password
      });
      setSuccess('Compte créé avec succès ! Redirection...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, type, key_, placeholder }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: C.dark, marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key_]}
        onChange={e => setForm({ ...form, [key_]: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{
          width:        '100%',
          padding:      '11px 14px',
          borderRadius: '8px',
          border:       `1.5px solid ${C.border}`,
          fontSize:     '14px',
          outline:      'none',
          color:        C.dark,
          background:   C.bg
        }}
      />
    </div>
  );

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily:     'Inter, sans-serif'
    }}>
      {/* Panneau gauche */}
      <div style={{
        background:     'linear-gradient(145deg, #1e3a8a, #2563eb)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '60px',
        color:          'white'
      }}>
        <div style={{
          width:          '48px',
          height:         '48px',
          background:     'rgba(255,255,255,0.15)',
          borderRadius:   '12px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   '24px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' }}>
          CentralShop
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: '1.6', marginBottom: '40px' }}>
          Rejoignez la plateforme de gestion e-commerce nouvelle génération.
        </p>

        <div style={{
          background:   'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding:      '24px'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ce que vous obtenez
          </div>
          {[
            'Gestion de catalogue produits',
            'Panier d\'achat en temps réel',
            'Tableau de bord analytique',
            'Suivi des commandes'
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '14px', opacity: 0.85 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{
        background:     'white',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '60px'
      }}>
        <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: C.dark, marginBottom: '8px' }}>
            Créer un compte
          </h2>
          <p style={{ color: C.gray, fontSize: '14px', marginBottom: '32px' }}>
            Renseignez vos informations pour commencer
          </p>

          {erreur && (
            <div style={{
              background:   '#fef2f2',
              border:       '1px solid #fecaca',
              borderRadius: '8px',
              padding:      '12px 16px',
              marginBottom: '20px',
              color:        C.error,
              fontSize:     '14px'
            }}>
              {erreur}
            </div>
          )}

          {success && (
            <div style={{
              background:   '#f0fdf4',
              border:       '1px solid #bbf7d0',
              borderRadius: '8px',
              padding:      '12px 16px',
              marginBottom: '20px',
              color:        C.success,
              fontSize:     '14px'
            }}>
              {success}
            </div>
          )}

          <Field label="Nom d'utilisateur"  type="text"     key_="username" placeholder="ex: jean.dupont"     />
          <Field label="Adresse email"       type="email"    key_="email"    placeholder="vous@exemple.com"    />
          <Field label="Mot de passe"        type="password" key_="password" placeholder="Min. 6 caractères"  />
          <Field label="Confirmer le mot de passe" type="password" key_="confirm" placeholder="••••••••"      />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width:        '100%',
              padding:      '12px',
              background:   loading ? '#93c5fd' : C.primary,
              color:        'white',
              border:       'none',
              borderRadius: '8px',
              fontSize:     '15px',
              fontWeight:   '600',
              cursor:       loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              marginTop:    '8px'
            }}
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: C.gray }}>
            Déjà un compte ?{' '}
            <Link to="/" style={{ color: C.primary, fontWeight: '600' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}