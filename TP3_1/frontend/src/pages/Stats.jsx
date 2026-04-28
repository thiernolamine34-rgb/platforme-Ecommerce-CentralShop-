import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', dark: '#111827', gray: '#6b7280',
  border: '#e5e7eb', lightGray: '#f9fafb', white: '#ffffff', success: '#16a34a'
};

const MEDALS = ['#f59e0b', '#9ca3af', '#b45309'];

export default function Stats() {
  const [visiteurs,  setVisiteurs]  = useState(null);
  const [classement, setClassement] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const chargerDonnees = useCallback(async () => {
    try {
      const [resVisiteurs, resClassement] = await Promise.all([
        api.get('/api/stats/visiteurs/'),
        api.get('/api/stats/populaires/')
      ]);
      setVisiteurs(resVisiteurs.data.visiteurs_actifs);
      setClassement(resClassement.data.classement || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  // Chargement initial + rafraîchissement silencieux toutes les 30s
  useEffect(() => {
    chargerDonnees();
    const interval = setInterval(chargerDonnees, 30000);
    return () => clearInterval(interval);
  }, [chargerDonnees]);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Chargement...</div>;

  const top3    = classement.slice(0, 3);
  const restant = classement.slice(3);

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: C.dark, margin: '0 0 4px' }}>Tableau de bord</h1>
          <p style={{ color: C.gray, fontSize: '14px', margin: 0 }}>Activité et popularité des produits</p>
        </div>

        {/* KPI visiteurs */}
        <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: C.orangeLight || '#fff3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: C.dark, lineHeight: 1 }}>{visiteurs ?? '—'}</div>
            <div style={{ fontSize: '14px', color: C.gray, marginTop: '4px' }}>visiteurs actifs en ce moment</div>
          </div>
        </div>

        {/* Podium top 3 */}
        {top3.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: C.dark, marginBottom: '14px' }}>Produits les plus consultés</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {top3.map((p, i) => (
                <Link key={p.produitId} to={p.supprime ? '#' : `/produits/${p.produitId}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden',
                    opacity: p.supprime ? 0.6 : 1,
                    transition: 'box-shadow 0.2s'
                  }}
                    onMouseEnter={e => { if (!p.supprime) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Badge rang */}
                    <div style={{ position: 'relative' }}>
                      <div style={{ height: '140px', background: C.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.image
                          ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '40px' }}>📦</span>}
                      </div>
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: MEDALS[i], color: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        {i + 1}
                      </div>
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: C.dark, marginBottom: '6px', lineHeight: '1.3' }}>{p.nom}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {p.prix !== null && <span style={{ fontSize: '14px', fontWeight: '700', color: C.orange }}>{p.prix.toLocaleString()} MAD</span>}
                        <span style={{ fontSize: '12px', color: C.gray, background: C.lightGray, padding: '3px 8px', borderRadius: '12px' }}>
                          👁 {p.vues} vue{p.vues > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reste du classement */}
        {restant.length > 0 && (
          <div style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: C.dark, margin: 0 }}>Classement complet</h2>
            </div>
            {restant.map((p) => (
              <Link key={p.produitId} to={p.supprime ? '#' : `/produits/${p.produitId}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                  borderBottom: `1px solid ${C.border}`, opacity: p.supprime ? 0.5 : 1,
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => { if (!p.supprime) e.currentTarget.style.background = C.lightGray; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: C.gray }}>{p.rang}</div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', background: C.lightGray, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image
                      ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '20px' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</div>
                    {p.categorie && <div style={{ fontSize: '12px', color: C.gray }}>{p.categorie}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    {p.prix !== null && <span style={{ fontSize: '14px', fontWeight: '700', color: C.orange }}>{p.prix.toLocaleString()} MAD</span>}
                    <span style={{ fontSize: '13px', color: C.gray, background: C.lightGray, padding: '4px 10px', borderRadius: '12px' }}>
                      👁 {p.vues}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {classement.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, color: C.gray }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: C.dark, marginBottom: '8px' }}>Aucune donnée disponible</div>
            <div style={{ fontSize: '14px' }}>Les statistiques s'alimentent automatiquement à chaque consultation de produit.</div>
          </div>
        )}

      </div>
    </div>
  );
}
