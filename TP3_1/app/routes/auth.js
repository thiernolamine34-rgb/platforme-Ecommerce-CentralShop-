const express  = require('express');
const router   = express.Router();
const redis    = require('../services/redis');
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const { User } = require('../services/mongodb');

const SESSION_TTL = 3600;

function genererSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ erreur: 'Tous les champs sont requis' });

    if (password.length < 6)
      return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 6 caractères' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ erreur: 'Format d\'email invalide' });

    const existant = await User.findOne({ $or: [{ email }, { username }] });
    if (existant)
      return res.status(409).json({ erreur: 'Nom d\'utilisateur ou email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hash });
    await user.save();

    res.status(201).json({ message: 'Compte créé avec succès', username: user.username });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ erreur: 'Identifiants requis' });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(401).json({ erreur: 'Identifiants invalides' });

    const valide = await bcrypt.compare(password, user.password);
    if (!valide) return res.status(401).json({ erreur: 'Identifiants invalides' });

    const sessionId   = genererSessionId();
    const sessionData = {
      userId:    user._id,
      username:  user.username,
      email:     user.email,
      role:      user.role,
      loginAt:   new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TTL * 1000).toISOString()
    };

    await redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(sessionData));

    res.status(200).json({
      message:   'Connexion réussie',
      sessionId,
      username:  user.username,
      email:     user.email,
      role:      user.role
    });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// GET /auth/session/:id
router.get('/session/:id', async (req, res) => {
  try {
    const { id }  = req.params;
    const data    = await redis.get(`session:${id}`);
    if (!data) return res.status(404).json({ erreur: 'Session expirée ou inexistante' });
    const ttlRestant = await redis.ttl(`session:${id}`);
    res.json({ message: 'Session valide', session: JSON.parse(data), ttl_restant: `${ttlRestant} secondes` });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// DELETE /auth/logout/:id
router.delete('/logout/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result  = await redis.del(`session:${id}`);
    if (result === 0) return res.status(404).json({ erreur: 'Session introuvable' });
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
