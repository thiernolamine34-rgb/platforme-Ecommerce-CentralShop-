const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT) || 6379
});

redis.on('connect', () => console.log('✅ Redis connecté'));
redis.on('error',   (err) => console.error('❌ Redis erreur:', err.message));

module.exports = redis;
