/**
 * vendeurMiddleware — Vérifie que l'utilisateur connecté est vendeur ou admin.
 * Doit être utilisé APRÈS authMiddleware (qui injecte req.user).
 *
 * Pourquoi un middleware séparé plutôt que dans authMiddleware ?
 * → Séparation des responsabilités : authMiddleware vérifie "est-il connecté ?",
 *   vendeurMiddleware vérifie "a-t-il le droit de vendre ?".
 *   Cela permet d'appliquer les deux indépendamment selon la route.
 */
function vendeurMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ erreur: 'Authentification requise' });
  }

  if (req.user.role !== 'vendeur' && req.user.role !== 'admin') {
    return res.status(403).json({
      erreur:  'Accès réservé aux vendeurs',
      detail:  'Activez le compte vendeur depuis votre profil pour publier des produits.',
      role_actuel: req.user.role
    });
  }

  next();
}

module.exports = vendeurMiddleware;
