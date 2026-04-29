const express        = require('express');
const router         = express.Router();
const { User, Produit, Commande } = require('../services/mongodb');
const authMiddleware = require('../middleware/authMiddleware');

// GET /vendeurs — Liste tous les vendeurs (public)
router.get('/', async (req, res) => {
  try {
    const vendeurs = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json({ vendeurs });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// GET /vendeurs/:username — Profil d'un vendeur (public)
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const vendeur = await User.findOne({ username }, { password: 0 });
    if (!vendeur) return res.status(404).json({ erreur: 'Vendeur introuvable' });

    const produits = await Produit.find({ vendeur: username }).sort({ vues: -1 });
    const totalCommandes = produits.reduce((acc, p) => acc + (p.commandes || 0), 0);
    const totalVues      = produits.reduce((acc, p) => acc + (p.vues    || 0), 0);

    res.json({
      vendeur: {
        username:    vendeur.username,
        email:       vendeur.email,
        bio:         vendeur.bio,
        telephone:   vendeur.telephone,
        role:        vendeur.role,
        membre_depuis: vendeur.createdAt
      },
      stats: {
        nb_produits:   produits.length,
        total_commandes: totalCommandes,
        total_vues:    totalVues
      },
      produits
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// PUT /vendeurs/profil — Modifier son propre profil (authentifié)
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { bio, telephone } = req.body;
    const update = {};
    if (bio       !== undefined) update.bio       = bio;
    if (telephone !== undefined) update.telephone = telephone;

    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true, select: '-password' });
    res.json({ message: 'Profil mis à jour', user });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
