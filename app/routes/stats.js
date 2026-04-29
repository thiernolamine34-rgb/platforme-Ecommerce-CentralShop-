const express     = require('express');
const router      = express.Router();
const redis       = require('../services/redis');
const { Produit } = require('../services/mongodb');

/**
 * POST /stats/vue/:produitId
 * Appelé automatiquement par ProduitDetail.jsx à chaque consultation.
 * L'utilisateur ne voit jamais ce mécanisme.
 */
router.post('/vue/:produitId', async (req, res) => {
  try {
    const { produitId } = req.params;

    await redis.incr(`vues:${produitId}`);
    await redis.zincrby('produits:populaires', 1, produitId);
    await Produit.findByIdAndUpdate(produitId, { $inc: { vues: 1 } }).catch(() => {});
    await redis.del(`produits:${produitId}`);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

/**
 * GET /stats/populaires
 * Retourne le top 10 des produits populaires, enrichi avec
 * les données catalogue (nom, image, prix).
 * Les produits supprimés du catalogue sont affichés avec un label générique.
 */
router.get('/populaires', async (req, res) => {
  try {
    const top = await redis.zrevrange('produits:populaires', 0, 9, 'WITHSCORES');

    if (!top.length) return res.json({ classement: [] });

    // Extraire les IDs et scores
    const ids    = [];
    const scores = {};
    for (let i = 0; i < top.length; i += 2) {
      ids.push(top[i]);
      scores[top[i]] = parseInt(top[i + 1]);
    }

    // Résoudre IDs → produits MongoDB en une seule requête
    const produits = await Produit.find({ _id: { $in: ids } }, 'nom image prix categorie');
    const map = {};
    produits.forEach(p => { map[p._id.toString()] = p; });

    const classement = ids.map((id, i) => {
      const produit = map[id];
      return {
        rang:      i + 1,
        produitId: id,
        vues:      scores[id],
        // Si le produit a été supprimé, on affiche quand même l'entrée
        nom:       produit ? produit.nom    : 'Produit supprimé',
        image:     produit ? produit.image  : '',
        prix:      produit ? produit.prix   : null,
        categorie: produit ? produit.categorie : null,
        supprime:  !produit
      };
    });

    res.json({ classement });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

/**
 * GET /stats/visiteurs
 * Compteur fenêtre glissante 5 min — usage interne uniquement.
 */
router.get('/visiteurs', async (req, res) => {
  try {
    const maintenant = Math.floor(Date.now() / 1000);
    const fenetre    = 300;
    const userId     = req.ip || req.query.userId || 'anonyme';
    const key        = 'visiteurs:actifs';

    await redis.zadd(key, maintenant, userId);
    await redis.zremrangebyscore(key, 0, maintenant - fenetre);
    const totalActifs = await redis.zcard(key);

    res.json({ visiteurs_actifs: totalActifs });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
