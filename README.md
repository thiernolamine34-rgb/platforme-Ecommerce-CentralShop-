# 🛒 CentralShop — Plateforme E-Commerce Full Stack

![Redis](https://img.shields.io/badge/Redis-7.0-DC2626?style=flat-square&logo=redis&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-16A34A?style=flat-square&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-22C55E?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-38BDF8?style=flat-square&logo=react&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2563EB?style=flat-square&logo=docker&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.0-F59E0B?style=flat-square&logo=rabbitmq&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Load%20Balancer-0F172A?style=flat-square&logo=nginx&logoColor=white)

> Application e-commerce full-stack conteneurisée avec Docker, intégrant Redis comme système de cache multi-pattern pour l'optimisation des performances sous forte charge.  
> **Module : Big Data & Bases de Données NoSQL — ENSA Béni Mellal | IACS 2025/2026**

---

## 📸 Aperçu

| Page de connexion | Catalogue produits |
|:-:|:-:|
| ![Login]("C:\Users\admin\Pictures\Screenshots\Capture d'écran 2026-04-29 230417.png") | ![Catalogue](screenshots/catalogue.png) |

| Panier enrichi | Espace vendeur |
|:-:|:-:|
| ![Panier](screenshots/panier.png) | ![Vendeur](screenshots/vendeur.png) |

---

## ⚡ Architecture

```
[Navigateur]
     ↓
[Nginx :80]  ← Reverse Proxy + Load Balancer (round-robin)
  ↙       ↘
[app1:3001] [app2:3002]  ← 2 instances Node.js / Express
      ↓          ↓          ↓
  [MongoDB]   [Redis]   [RabbitMQ]
                               ↓
                        [consumer.js]  ← Traitement asynchrone
```

**7 services Docker :** Nginx · Node.js ×2 · React · MongoDB · Redis · RabbitMQ

---

## 🔴 Redis — Cache Multi-Pattern

Redis est le cœur de l'optimisation de performance. Il est utilisé selon **4 patterns distincts** :

| Pattern | Structure | Clé | TTL | Rôle |
|---|---|---|---|---|
| Cache catalogue | `STRING` | `produits:tous:p{n}` | 60s | Évite les appels MongoDB répétés |
| Sessions auth | `STRING` | `session:{id}` | 3600s | Authentification sans BDD |
| Panier utilisateur | `HASH` | `panier:{userId}` | 1800s | Stockage temporaire des articles |
| Statistiques | `INCR + ZSET` | `vues:{id}` / `populaires` | — | Analytics temps réel |

### Pattern Cache-Aside (produits)
```js
const cached = await redis.get(`produits:tous:p${page}`);
if (cached) return res.json(JSON.parse(cached)); // Cache HIT — < 5ms

const produits = await Produit.find(query);
await redis.setex(`produits:tous:p${page}`, 60, JSON.stringify(produits));
```

### Rate Limiter — Pipeline atomique (sans race condition)
```js
const pipeline = redis.pipeline();
pipeline.incr(`rl:${ip}`);
pipeline.ttl(`rl:${ip}`);
const [[, requests], [, ttl]] = await pipeline.exec();
if (ttl === -1) await redis.expire(`rl:${ip}`, 60);
if (requests > 30) return res.status(429).json({ erreur: 'Trop de requêtes' });
```

---

## 📊 Résultats de performance (k6 — 1000 VUs, 1 minute)

| Métrique | Sans Redis | Avec Redis | Gain |
|---|---|---|---|
| Requêtes traitées | 30 540 | 38 664 | **+26,6 %** |
| Taux de succès | 87,26 % | 99,29 % | **+12 pts** |
| Temps moyen — Produits | 489 ms | 217 ms | **−55,5 %** |
| Percentile 95 % — Produits | 1698 ms | 806 ms | **−52,5 %** |
| Temps moyen global | 421 ms | 243 ms | **−42,1 %** |

---

## 🚀 Lancement rapide

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

### Installation
```bash
# 1. Cloner le dépôt
git clone https://github.com/thiernolamine34-rgb/platforme-Ecommerce-CentralShop-.git
cd platforme-Ecommerce-CentralShop-

# 2. Lancer tous les services
docker-compose up --build

# 3. Accéder à l'application
# http://localhost
```

> Le premier démarrage télécharge les images Docker (~2-3 minutes). Les suivants sont instantanés.

---

## 📁 Structure du projet

```
CentralShop/
├── docker-compose.yml          # Orchestration des 7 services
├── .env                        # Variables d'environnement (credentials)
├── nginx/
│   └── nginx.conf              # Load balancing + routing /api/*
├── app/                        # Backend Node.js
│   ├── server.js               # Point d'entrée Express + CORS
│   ├── consumer.js             # Worker RabbitMQ (commandes async)
│   ├── middleware/
│   │   ├── authMiddleware.js   # Vérification session Redis (X-Session-Id)
│   │   └── rateLimiter.js      # 30 req/min par IP — pipeline atomique
│   ├── routes/
│   │   ├── produits.js         # CRUD + cache Redis + upload Multer
│   │   ├── panier.js           # HASH Redis + enrichissement MongoDB
│   │   ├── stats.js            # INCR vues + SORTED SET classement
│   │   ├── commandes.js        # Vérif. stock + décrément + RabbitMQ
│   │   ├── auth.js             # Inscription bcrypt + sessions Redis
│   │   └── vendeurs.js         # Profil vendeur + stats agrégées
│   └── services/
│       ├── redis.js            # Instance ioredis partagée
│       ├── mongodb.js          # Schémas Mongoose + index
│       └── rabbitmq.js         # Connexion + retry RabbitMQ
└── frontend/                   # React 18 SPA
    └── src/
        ├── App.jsx             # Routeur + session localStorage
        ├── services/api.js     # Axios + injection X-Session-Id
        ├── components/
        │   └── Navbar.jsx      # Recherche + catégories dynamiques
        └── pages/
            ├── Produits.jsx    # Catalogue public + filtres
            ├── ProduitDetail.jsx # Fiche produit + similaires
            ├── Panier.jsx      # Panier enrichi + totaux
            ├── Commandes.jsx   # Dashboard vendeur
            ├── Stats.jsx       # Classement + visiteurs actifs
            └── Vendeur.jsx     # Profil vendeur public
```

---

## 🔒 Sécurité

- **Mots de passe** hashés avec `bcrypt` (10 rounds)
- **Sessions** stockées dans Redis (révocables instantanément, TTL 1h)
- **Routes protégées** via `authMiddleware` — header `X-Session-Id` vérifié à chaque requête
- **Rate limiting** partagé entre les 2 instances via Redis (30 req/min par IP)
- **Validation** des entrées côté serveur (email regex, longueur mot de passe, stock)
- **Credentials** externalisés dans `.env`, jamais dans le code source

---

## 🛠️ Technologies

| Technologie | Version | Usage |
|---|---|---|
| Node.js + Express | 20 / 5 | Backend REST API |
| React | 18 | Frontend SPA |
| MongoDB + Mongoose | 6 | Base de données principale |
| Redis + ioredis | 7 | Cache multi-pattern |
| RabbitMQ | 3 | Messagerie asynchrone |
| Nginx | Alpine | Reverse proxy + load balancer |
| Docker Compose | 3.8 | Orchestration |
| Multer | — | Upload d'images produits |
| bcrypt | — | Hachage des mots de passe |
| k6 | 0.49 | Tests de charge |

---

## 👥 Équipe

| Membre | Contribution |
|---|---|
| **Adam El Mansour** | Architecture, Backend, Redis, Tests k6 |
| **Tohani Marwa** | Frontend React, UI/UX, Intégration API |
| **Diallo Thierno Mohammed Lamine** | Architecture, Backend, Redis, Tests k6 |

---

## 📄 Licence

Ce projet est réalisé dans un cadre académique — ENSA Béni Mellal, module Big Data & Bases de Données NoSQL.
