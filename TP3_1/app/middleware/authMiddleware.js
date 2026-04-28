const redis = require('../services/redis');

/**
 * Middleware d'authentification — vérifie le sessionId dans le header X-Session-Id
 * Injecte req.user avec les données de session si valide
 */
async function authMiddleware(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({
        erreur: 'Authentification requise',
        detail: 'Header X-Session-Id manquant'
      });
    }

    const data = await redis.get(`session:${sessionId}`);

    if (!data) {
      return res.status(401).json({
        erreur: 'Session expirée ou invalide',
        detail: 'Veuillez vous reconnecter'
      });
    }

    // Injecter les infos utilisateur dans la requête
    req.user = JSON.parse(data);
    next();

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur vérification session', detail: err.message });
  }
}

module.exports = authMiddleware;
