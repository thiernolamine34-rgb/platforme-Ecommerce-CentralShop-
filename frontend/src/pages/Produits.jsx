import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const C = {
  orange: '#ff6000', orangeLight: '#fff3ed', orangeDark: '#e55500',
  dark: '#111827', gray: '#6b7280', lightGray: '#f9fafb',
  border: '#e5e7eb', white: '#ffffff', success: '#16a34a', red: '#dc2626'
};

export default function Produits({ session }) {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const [produits, setProduits] = useState([]);
  const [categories, setCat]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [success,  setSuccess]  = useState('');
  const [showForm, setShowForm] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [form, setForm]         = useState({ nom: '', prix: '', categorie: '', stock: '', description: '', image: null });

  const searchQ    = searchParams.get('search')    || '';
  const categorieQ = searchParams.get('categorie') || '';

  const chargerProduits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQ)    params.set('search',    searchQ);
      if (categorieQ) params.set('categorie', categorieQ);
      const res = await api.get(`/api/produits/?${params}`);
      setProduits(res.data.produits || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const chargerCategories = async () => {
    try {
      const res = await api.get('/api/produits/categories');
      setCat(res.data.categories || []);
    } catch (_) {}
  };

  useEffect(() => { chargerProduits(); }, [searchQ, categorieQ]);
  useEffect(() => { chargerCategories(); }, []);

  const ajouterAuPanier = async (produit) => {
    if (!session) { navigate('/login'); return; }
    const userId = localStorage.getItem('username');
    try {
      await api.post(`/api/panier/${userId}/`, { produitId: produit._id, quantite: 1 });
      setSuccess(`"${produit.nom}" ajouté au panier`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.erreur || 'Stock insuffisant');
    }
  };

  const supprimerProduit = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/api/produits/${id}/`);
      setSuccess(`"${nom}" supprimé`);
      setTimeout(() => setSuccess(''), 3000);
      chargerProduits();
    } catch (err) { alert(err.response?.data?.erreur || 'Erreur'); }
  };

  const ajouterProduit = async () => {
    if (!form.nom || !form.prix || !form.categorie) return;
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'image') data.append(k, v); });
      if (form.image) data.append('image', form.image);
      await api.post('/api/produits/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Produit ajouté avec succès');
      setForm({ nom: '', prix: '', categorie: '', stock: '', description: '', image: null });
      setPreview(null); setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
      chargerProduits();
    } catch (err) { alert(err.response?.data?.erreur || 'Erreur'); }
  };

  const titre = searchQ    ? `Résultats pour "${searchQ}"`
              : categorieQ ? `Catégorie : ${categorieQ}`
              : 'Tous les produits';

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* Bannière hero */}
        {!searchQ && !categorieQ && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '12px', padding: '40px 48px', marginBottom: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ color: C.orange, fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Bienvenue sur CentralShop</div>
              <h1 style={{ color: C.white, fontSize: '32px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                Votre boutique,<br/>sans limites.
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', margin: 0 }}>Des milliers de produits livrés partout dans le monde.</p>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[['50k+','Clients'], ['10k+','Produits'], ['24/7','Support']].map(([v,l]) => (
                <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ color: C.orange, fontSize: '22px', fontWeight: '800' }}>{v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barre d'actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.dark, margin: '0 0 4px' }}>{titre}</h2>
            <span style={{ fontSize: '13px', color: C.gray }}>{produits.length} produit{produits.length > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={chargerProduits} style={{ padding: '9px 16px', background: C.white, color: C.gray, border: `1px solid ${C.border}`, borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
              Actualiser
            </button>
            {session && (
              <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 18px', background: C.orange, color: C.white, border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {showForm ? 'Fermer' : '+ Ajouter un produit'}
              </button>
            )}
          </div>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: C.success, fontSize: '14px' }}>
            {success}
          </div>
        )}

        {/* Formulaire ajout */}
        {showForm && session && (
          <div style={{ background: C.white, borderRadius: '12px', padding: '24px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: C.dark }}>Nouveau produit</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[['Nom *', 'nom', 'text', 'iPhone 15 Pro'], ['Prix (MAD) *', 'prix', 'number', '0.00'], ['Catégorie *', 'categorie', 'text', 'Téléphonie'], ['Stock', 'stock', 'number', '0']].map(([label, key, type, ph]) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: C.gray, display: 'block', marginBottom: '4px' }}>{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: `1px solid ${C.border}`, fontSize: '14px', outline: 'none', background: C.lightGray }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: C.gray, display: 'block', marginBottom: '4px' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez le produit..." rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: `1px solid ${C.border}`, fontSize: '14px', outline: 'none', background: C.lightGray, resize: 'vertical' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: C.gray, display: 'block', marginBottom: '4px' }}>Image</label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', border: `2px dashed ${C.border}`, borderRadius: '10px', cursor: 'pointer', background: C.lightGray, overflow: 'hidden', position: 'relative' }}>
                  {preview ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', color: C.gray }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div><div style={{ fontSize: '13px' }}>Cliquez pour uploader</div><div style={{ fontSize: '12px', marginTop: '4px' }}>JPG, PNG — max 5MB</div></div>}
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setForm({ ...form, image: f }); setPreview(URL.createObjectURL(f)); } }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={ajouterProduit} style={{ padding: '10px 24px', background: C.orange, color: C.white, border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Publier le produit
              </button>
              <button onClick={() => { setShowForm(false); setPreview(null); }} style={{ padding: '10px 20px', background: C.white, color: C.gray, border: `1px solid ${C.border}`, borderRadius: '7px', cursor: 'pointer', fontSize: '14px' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Grille produits */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: C.gray }}>Chargement...</div>
        ) : produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', background: C.white, borderRadius: '12px', color: C.gray }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: C.dark, marginBottom: '8px' }}>Aucun produit trouvé</div>
            <div style={{ fontSize: '14px' }}>{searchQ ? `Essayez d'autres mots-clés` : 'Soyez le premier à ajouter un produit'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
            {produits.map((p) => (
              <div key={p._id} style={{ background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                <Link to={`/produits/${p._id}`} style={{ display: 'block', height: '200px', background: C.lightGray, overflow: 'hidden', position: 'relative', borderBottom: `1px solid ${C.border}` }}>
                  {p.image
                    ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '40px' }}>📦</span>
                        <span style={{ fontSize: '12px' }}>Pas d'image</span>
                      </div>}
                  {p.stock === 0 && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: C.red, color: C.white, fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>Rupture</div>
                  )}
                </Link>

                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: C.orange, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{p.categorie}</span>

                  <Link to={`/produits/${p._id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: C.dark, margin: '0 0 4px', lineHeight: '1.3' }}>{p.nom}</h3>
                  </Link>

                  {p.vendeur && (
                    <Link to={`/vendeur/${p.vendeur}`} style={{ fontSize: '12px', color: C.gray, marginBottom: '8px', textDecoration: 'none' }}>
                      par <span style={{ color: C.orange }}>{p.vendeur}</span>
                    </Link>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: 'auto' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: C.dark }}>{p.prix.toLocaleString()} MAD</span>
                    <span style={{ fontSize: '11px', color: p.stock > 0 ? C.success : C.red, marginLeft: 'auto' }}>
                      {p.stock > 0 ? `${p.stock} dispo` : 'Épuisé'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: C.gray, marginBottom: '10px' }}>
                    <span>👁 {p.vues || 0} vues</span>
                    <span>·</span>
                    <span>🛒 {p.commandes || 0} vendus</span>
                  </div>

                  <button onClick={() => ajouterAuPanier(p)} disabled={p.stock === 0}
                    style={{
                      width: '100%', padding: '10px', border: 'none', borderRadius: '7px', cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                      background: p.stock > 0 ? C.orange : '#e5e7eb',
                      color:      p.stock > 0 ? C.white  : C.gray,
                      fontWeight: '700', fontSize: '13px', marginBottom: '6px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (p.stock > 0) e.target.style.background = C.orangeDark; }}
                    onMouseLeave={e => { if (p.stock > 0) e.target.style.background = C.orange; }}
                  >
                    {p.stock > 0 ? (session ? 'Ajouter au panier' : 'Se connecter pour acheter') : 'Indisponible'}
                  </button>

                  {session && (
                    <button onClick={() => supprimerProduit(p._id, p.nom)}
                      style={{ width: '100%', padding: '6px', background: C.white, color: C.red, border: `1px solid #fecaca`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}