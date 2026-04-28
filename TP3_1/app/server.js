require('dotenv').config();

const express     = require('express');
const { connectMongo }    = require('./services/mongodb');
const { connectRabbitMQ } = require('./services/rabbitmq');

const commandesRoutes = require('./routes/commandes');
const authRoutes      = require('./routes/auth');
const produitsRoutes  = require('./routes/produits');
const panierRoutes    = require('./routes/panier');
const statsRoutes     = require('./routes/stats');
const vendeursRoutes  = require('./routes/vendeurs');
const rateLimiter     = require('./middleware/rateLimiter');

const app      = express();
const PORT     = process.env.PORT || 3001;
const INSTANCE = process.env.INSTANCE || 'Instance-?';

// ─── CORS ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(rateLimiter);

app.use('/commandes', commandesRoutes);
app.use('/auth',      authRoutes);
app.use('/produits',  produitsRoutes);
app.use('/panier',    panierRoutes);
app.use('/stats',     statsRoutes);
app.use('/vendeurs',  vendeursRoutes);

app.get('/health', (req, res) => {
  res.json({
    status:   'OK',
    instance: INSTANCE,
    services: { redis: 'connecté', mongodb: 'connecté', rabbitmq: 'connecté' }
  });
});

async function start() {
  await connectMongo();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`🚀 ${INSTANCE} lancée sur le port ${PORT}`);
    console.log('📦 Routes : /auth /produits /panier /stats /commandes /vendeurs /health');
  });
}

start();
