const redis = require('../services/redis');

const WINDOW_SECONDS = 60;
const MAX_REQUESTS   = 30;

/**
 * Rate limiter Redis — corrigé avec pipeline atomique ioredis
 *
 * PROBLÈME PRÉCÉDENT : INCR puis EXPIRE = 2 opérations séparées.
 * Si crash entre les deux → clé sans TTL → IP bloquée à vie.
 *
 * SOLUTION : pipeline ioredis envoie INCR + TTL en une seule transaction.
 * Si TTL = -1 (clé sans expiration), on applique EXPIRE immédiatement.
 */
async function rateLimiter(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress;
  const key = `rl:${ip}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const [[, requests], [, ttl]] = await pipeline.exec();

    // Appliquer TTL si absent (1ère requête ou récupération race condition)
    if (ttl === -1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    res.setHeader('X-RateLimit-Limit',     MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - requests));

    if (requests > MAX_REQUESTS) {
      return res.status(429).json({
        erreur:   'Trop de requêtes',
        message:  `Limite de ${MAX_REQUESTS} requêtes/${WINDOW_SECONDS}s dépassée`,
        retry_in: `${WINDOW_SECONDS} secondes`
      });
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err.message);
    next();
  }
}

module.exports = rateLimiter;