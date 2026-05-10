const express        = require('express');
const router         = express.Router();
const { User, Produit, Commande } = require('../services/mongodb');
const authMiddleware = require('../middleware/authMiddleware');
const redis          = require('../services/redis');

// ─────────────────────────────────────────────────────────────
// PUT /vendeurs/devenir-vendeur — Basculer vers le rôle vendeur
// ─────────────────────────────────────────────────────────────
// IMPORTANT : cette route doit être déclarée AVANT /:username
// pour éviter qu'Express l'interprète comme un paramètre de route.
router.put('/devenir-vendeur', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'vendeur') {
      return res.json({ message: 'Vous êtes déjà vendeur', role: 'vendeur' });
    }
    if (req.user.role === 'admin') {
      return res.json({ message: 'Les admins peuvent déjà publier des produits', role: 'admin' });
    }

    // 1. Mettre à jour MongoDB
    await User.findByIdAndUpdate(req.user.userId, { role: 'vendeur' });

    // 2. Mettre à jour la session Redis pour que le changement soit immédiat
    //    sans déconnexion/reconnexion
    const sessionId   = req.headers['x-session-id'];
    const sessionData = { ...req.user, role: 'vendeur' };
    const ttlRestant  = await redis.ttl(`session:${sessionId}`);
    // Conserver le TTL restant (ou 3600s si indéfini)
    await redis.setex(
      `session:${sessionId}`,
      ttlRestant > 0 ? ttlRestant : 3600,
      JSON.stringify(sessionData)
    );

    res.json({
      message:   'Félicitations ! Vous êtes maintenant vendeur.',
      role:      'vendeur',
      username:  req.user.username
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /vendeurs/profil — Modifier bio et téléphone (authentifié)
// ─────────────────────────────────────────────────────────────
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { bio, telephone } = req.body;
    const update = {};
    if (bio       !== undefined) update.bio       = bio;
    if (telephone !== undefined) update.telephone = telephone;

    const user = await User.findByIdAndUpdate(
      req.user.userId, update, { new: true, select: '-password' }
    );
    res.json({ message: 'Profil mis à jour', user });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /vendeurs — Liste tous les vendeurs (public)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const vendeurs = await User.find(
      { role: { $in: ['vendeur', 'admin'] } },
      { password: 0 }
    ).sort({ createdAt: -1 });
    res.json({ vendeurs });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /vendeurs/:username — Profil public d'un vendeur
// ─────────────────────────────────────────────────────────────
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const vendeur = await User.findOne({ username }, { password: 0, email: 0 });
    if (!vendeur) return res.status(404).json({ erreur: 'Vendeur introuvable' });

    const produits = await Produit.find({ vendeur: username }).sort({ vues: -1 });

    const totalCommandes = produits.reduce((acc, p) => acc + (p.commandes || 0), 0);
    const totalVues      = produits.reduce((acc, p) => acc + (p.vues     || 0), 0);
    const caEstime       = produits.reduce((acc, p) => acc + (p.commandes || 0) * p.prix, 0);

    res.json({
      vendeur: {
        username:      vendeur.username,
        bio:           vendeur.bio,
        telephone:     vendeur.telephone,
        role:          vendeur.role,
        membre_depuis: vendeur.createdAt
      },
      stats: {
        nb_produits:      produits.length,
        total_commandes:  totalCommandes,
        total_vues:       totalVues,
        ca_estime:        +caEstime.toFixed(2)
      },
      produits
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
