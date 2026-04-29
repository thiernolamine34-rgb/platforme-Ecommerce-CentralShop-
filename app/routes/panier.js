const express        = require('express');
const router         = express.Router();
const redis          = require('../services/redis');
const authMiddleware = require('../middleware/authMiddleware');
const { Produit }    = require('../services/mongodb');

const PANIER_TTL = 1800; // 30 minutes

/**
 * OPTION B : le panier stocke { produitId: quantite } dans Redis
 * au lieu de { nomProduit: quantite }.
 *
 * Avantage : relation stricte avec le catalogue via _id MongoDB.
 * Deux produits ne peuvent jamais entrer en collision, même nom identique.
 *
 * Le GET enrichit chaque entrée avec les données produit complètes
 * (nom, prix, image, stock) avant de répondre au frontend.
 */

// GET /panier/:userId — Retourne le panier enrichi avec données produit
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey   = `panier:${userId}`;

    const raw = await redis.hgetall(cacheKey);

    if (!raw || Object.keys(raw).length === 0) {
      return res.json({ panier: [] });
    }

    // Résoudre chaque produitId → données complètes MongoDB
    const ids      = Object.keys(raw);
    const produits = await Produit.find({ _id: { $in: ids } }, 'nom prix image stock categorie');

    const produitMap = {};
    produits.forEach(p => { produitMap[p._id.toString()] = p; });

    const lignes = ids.map(id => {
      const quantite = parseInt(raw[id]);
      const produit  = produitMap[id];

      if (!produit) {
        // Produit supprimé du catalogue depuis l'ajout — on le signale
        return { produitId: id, quantite, introuvable: true };
      }

      return {
        produitId:  id,
        nom:        produit.nom,
        prix:       produit.prix,
        image:      produit.image || '',
        stock:      produit.stock,
        categorie:  produit.categorie,
        quantite,
        sousTotal:  +(produit.prix * quantite).toFixed(2)
      };
    });

    const total = lignes
      .filter(l => !l.introuvable)
      .reduce((acc, l) => acc + l.sousTotal, 0);

    res.json({
      panier: lignes,
      total:  +total.toFixed(2)
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// POST /panier/:userId — Ajouter via produitId (AUTHENTIFIÉ)
router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId }               = req.params;
    const { produitId, quantite }  = req.body;
    const cacheKey                 = `panier:${userId}`;

    if (!produitId || !quantite) {
      return res.status(400).json({ erreur: 'produitId et quantite sont requis' });
    }

    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({ erreur: 'Produit introuvable dans le catalogue' });
    }

    // Vérifier la quantité totale (déjà dans le panier + nouveau)
    const qteActuelle    = parseInt(await redis.hget(cacheKey, produitId)) || 0;
    const qteTotale      = qteActuelle + parseInt(quantite);

    if (qteTotale > produit.stock) {
      return res.status(400).json({
        erreur:           'Stock insuffisant',
        stock_disponible: produit.stock,
        deja_au_panier:   qteActuelle,
        quantite_demandee: parseInt(quantite)
      });
    }

    await redis.hset(cacheKey, produitId, qteTotale);
    await redis.expire(cacheKey, PANIER_TTL);

    res.status(201).json({
      message:  `"${produit.nom}" ajouté au panier`,
      produitId,
      quantite: qteTotale
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// PATCH /panier/:userId/:produitId — Modifier la quantité d'un article (AUTHENTIFIÉ)
router.patch('/:userId/:produitId', authMiddleware, async (req, res) => {
  try {
    const { userId, produitId } = req.params;
    const { quantite }          = req.body;
    const cacheKey              = `panier:${userId}`;

    if (!quantite || parseInt(quantite) < 1) {
      return res.status(400).json({ erreur: 'Quantité invalide (minimum 1)' });
    }

    const produit = await Produit.findById(produitId);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' });

    if (parseInt(quantite) > produit.stock) {
      return res.status(400).json({ erreur: 'Stock insuffisant', stock_disponible: produit.stock });
    }

    await redis.hset(cacheKey, produitId, parseInt(quantite));
    await redis.expire(cacheKey, PANIER_TTL);

    res.json({ message: 'Quantité mise à jour', produitId, quantite: parseInt(quantite) });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// DELETE /panier/:userId/:produitId — Retirer un article (AUTHENTIFIÉ)
router.delete('/:userId/:produitId', authMiddleware, async (req, res) => {
  try {
    const { userId, produitId } = req.params;
    const cacheKey              = `panier:${userId}`;

    const result = await redis.hdel(cacheKey, produitId);
    if (result === 0) return res.status(404).json({ erreur: 'Article non trouvé dans le panier' });

    await redis.expire(cacheKey, PANIER_TTL);
    res.json({ message: 'Article retiré du panier' });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// DELETE /panier/:userId — Vider tout le panier (AUTHENTIFIÉ)
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    await redis.del(`panier:${req.params.userId}`);
    res.json({ message: 'Panier vidé' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
