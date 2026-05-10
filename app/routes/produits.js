const express           = require('express');
const router            = express.Router();
const redis             = require('../services/redis');
const multer            = require('multer');
const path              = require('path');
const fs                = require('fs');
const { Produit }       = require('../services/mongodb');
const authMiddleware    = require('../middleware/authMiddleware');
const vendeurMiddleware = require('../middleware/vendeurMiddleware');

const CACHE_TTL = 60;

// ─── Multer ────────────────────────────────────────────────────
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
      return cb(null, true);
    cb(new Error('Format image non supporté'));
  }
});

async function invaliderCacheListe() {
  const keys = await redis.keys('produits:tous:*');
  if (keys.length) await redis.del(...keys);
}

// ─────────────────────────────────────────────────────────────
// GET /produits — Liste paginée avec filtres (PUBLIC)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { categorie, search, vendeur, page = 1, limit = 20 } = req.query;

    if (!categorie && !search && !vendeur) {
      const cacheKey = `produits:tous:p${page}`;
      const cached   = await redis.get(cacheKey);
      if (cached) return res.json({ source: '⚡ CACHE Redis', ...JSON.parse(cached) });
    }

    const query = {};
    if (categorie) query.categorie = { $regex: new RegExp(categorie, 'i') };
    if (vendeur)   query.vendeur   = vendeur;
    if (search)    query.$text     = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [produits, total] = await Promise.all([
      Produit.find(query).sort({ vues: -1 }).skip(skip).limit(parseInt(limit)),
      Produit.countDocuments(query)
    ]);

    const result = {
      produits,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    };

    if (!categorie && !search && !vendeur) {
      await redis.setex(`produits:tous:p${page}`, CACHE_TTL, JSON.stringify(result));
    }

    res.json({ source: '🗄 MongoDB', ...result });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /produits/categories (PUBLIC)
// ─────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const cached = await redis.get('produits:categories');
    if (cached) return res.json({ categories: JSON.parse(cached) });
    const categories = await Produit.distinct('categorie');
    await redis.setex('produits:categories', 120, JSON.stringify(categories));
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /produits/:id/similaires (PUBLIC)
// ─────────────────────────────────────────────────────────────
router.get('/:id/similaires', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' });
    const similaires = await Produit.find({
      categorie: produit.categorie,
      _id:       { $ne: produit._id }
    }).limit(6).sort({ vues: -1 });
    res.json({ similaires });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /produits/:id (PUBLIC)
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id }   = req.params;
    const cached   = await redis.get(`produits:${id}`);
    if (cached) return res.json({ source: '⚡ CACHE Redis', produit: JSON.parse(cached) });
    const produit = await Produit.findById(id);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' });
    await redis.setex(`produits:${id}`, CACHE_TTL, JSON.stringify(produit));
    res.json({ source: '🗄 MongoDB', produit });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /produits — Créer (AUTHENTIFIÉ + VENDEUR)
// ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, vendeurMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { nom, prix, categorie, stock, description } = req.body;
    if (!nom || !prix || !categorie)
      return res.status(400).json({ erreur: 'nom, prix et categorie sont requis' });

    const produit = new Produit({
      nom, prix: parseFloat(prix), categorie,
      stock:       parseInt(stock) || 0,
      description: description || '',
      image:       req.file ? `/uploads/${req.file.filename}` : '',
      vendeur:     req.user.username  // Toujours le username du créateur
    });

    await produit.save();
    await invaliderCacheListe();
    await redis.del('produits:categories');

    res.status(201).json({ message: 'Produit créé', produit });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /produits/:id — Modifier (AUTHENTIFIÉ + VENDEUR + PROPRIÉTAIRE)
// ─────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, vendeurMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const produit = await Produit.findById(id);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' });

    // Vérification propriété : seul le créateur ou un admin peut modifier
    if (req.user.role !== 'admin' && produit.vendeur !== req.user.username) {
      return res.status(403).json({ erreur: 'Vous ne pouvez modifier que vos propres produits' });
    }

    const { nom, prix, categorie, stock, description } = req.body;
    const update = {};
    if (nom         !== undefined) update.nom         = nom;
    if (prix        !== undefined) update.prix        = parseFloat(prix);
    if (categorie   !== undefined) update.categorie   = categorie;
    if (stock       !== undefined) update.stock       = parseInt(stock);
    if (description !== undefined) update.description = description;
    if (req.file)                  update.image       = `/uploads/${req.file.filename}`;

    const produitMaj = await Produit.findByIdAndUpdate(id, update, { new: true, runValidators: true });

    await redis.del(`produits:${id}`);
    await invaliderCacheListe();
    await redis.del('produits:categories');

    res.json({ message: 'Produit modifié', produit: produitMaj });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /produits/:id — Supprimer (AUTHENTIFIÉ + VENDEUR + PROPRIÉTAIRE)
//
// Règle métier :
//   - Un vendeur peut supprimer UNIQUEMENT ses propres produits
//   - Un admin peut supprimer N'IMPORTE QUEL produit
// ─────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, vendeurMiddleware, async (req, res) => {
  try {
    const { id }  = req.params;
    const produit = await Produit.findById(id);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' });

    // Vérification propriété
    if (req.user.role !== 'admin' && produit.vendeur !== req.user.username) {
      return res.status(403).json({
        erreur:  'Vous ne pouvez supprimer que vos propres produits',
        detail:  `Ce produit appartient au vendeur "${produit.vendeur}"`
      });
    }

    // Supprimer le fichier image du disque si existant
    if (produit.image) {
      const filePath = `/app${produit.image}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Produit.findByIdAndDelete(id);
    await redis.del(`produits:${id}`);
    await invaliderCacheListe();
    await redis.del('produits:categories');

    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
