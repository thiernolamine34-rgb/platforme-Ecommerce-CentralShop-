const express        = require('express');
const router         = express.Router();
const { Commande, Produit } = require('../services/mongodb');
const redis          = require('../services/redis');
const { publierCommande }   = require('../services/rabbitmq');
const authMiddleware = require('../middleware/authMiddleware');

const INSTANCE = process.env.INSTANCE || 'Instance-?';
const TTL      = 30;

// ─────────────────────────────────────────────────────────────
// POST /commandes — Créer une commande (authentifié)
// ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { produit, quantite, client } = req.body;

    if (!produit || !quantite || !client) {
      return res.status(400).json({ erreur: 'Champs manquants : produit, quantite, client requis' });
    }

    const produitDoc = await Produit.findOne({ nom: produit });
    if (produitDoc) {
      if (produitDoc.stock < parseInt(quantite)) {
        return res.status(400).json({
          erreur:            'Stock insuffisant',
          stock_disponible:  produitDoc.stock,
          quantite_demandee: parseInt(quantite)
        });
      }

      await Produit.findByIdAndUpdate(produitDoc._id, {
        $inc: { stock: -parseInt(quantite), commandes: 1 }
      });

      await redis.del(`produits:${produitDoc._id}`);
      const keys = await redis.keys('produits:tous:*');
      if (keys.length) await redis.del(...keys);
    }

    const commande = new Commande({ produit, quantite: parseInt(quantite), client });
    await commande.save();

    await redis.del('toutes_commandes');
    publierCommande({ id: commande._id, produit, client });

    res.status(201).json({ message: 'Commande créée', commande, traitee_par: INSTANCE });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /commandes/vendeur/:username — Commandes reçues sur les
// produits d'un vendeur (détaillées : qui, quoi, quand)
// IMPORTANT : déclaré AVANT /user/:client pour éviter les conflits
// ─────────────────────────────────────────────────────────────
router.get('/vendeur/:username', authMiddleware, async (req, res) => {
  try {
    const { username }              = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Récupérer les noms de tous les produits de ce vendeur
    const produitsVendeur = await Produit.find({ vendeur: username }, 'nom prix');
    if (produitsVendeur.length === 0) {
      return res.json({ commandes: [], pagination: { total: 0, pages: 0 } });
    }

    const nomsProduits = produitsVendeur.map(p => p.nom);
    const prixMap      = {};
    produitsVendeur.forEach(p => { prixMap[p.nom] = p.prix; });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commandes, total] = await Promise.all([
      Commande.find({ produit: { $in: nomsProduits } })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Commande.countDocuments({ produit: { $in: nomsProduits } })
    ]);

    // Enrichir chaque commande avec le prix unitaire et le total
    const commandesEnrichies = commandes.map(c => ({
      ...c.toObject(),
      prix_unitaire: prixMap[c.produit] || 0,
      total:         (prixMap[c.produit] || 0) * c.quantite
    }));

    res.json({
      commandes: commandesEnrichies,
      pagination: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /commandes/user/:client — Historique acheteur paginé
// ─────────────────────────────────────────────────────────────
router.get('/user/:client', authMiddleware, async (req, res) => {
  try {
    const { client }                = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commandes, total] = await Promise.all([
      Commande.find({ client }).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Commande.countDocuments({ client })
    ]);

    res.json({
      commandes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /commandes — Toutes les commandes (authentifié)
// ─────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cached = await redis.get('toutes_commandes');
    if (cached) {
      return res.json({ commandes: JSON.parse(cached) });
    }
    const commandes = await Commande.find().sort({ date: -1 });
    await redis.setex('toutes_commandes', TTL, JSON.stringify(commandes));
    res.json({ commandes });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
