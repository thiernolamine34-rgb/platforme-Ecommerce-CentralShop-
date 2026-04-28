const mongoose = require('mongoose');

// ─── Schéma Commande ───────────────────────────────────────────
const CommandeSchema = new mongoose.Schema({
  produit:  { type: String, required: true },
  quantite: { type: Number, required: true, min: 1 },
  client:   { type: String, required: true },
  statut:   { type: String, default: 'en_attente', enum: ['en_attente', 'confirmee', 'expediee', 'livree'] },
  date:     { type: Date,   default: Date.now }
});
CommandeSchema.index({ client: 1, date: -1 });

// ─── Schéma Produit ────────────────────────────────────────────
const ProduitSchema = new mongoose.Schema({
  nom:         { type: String, required: true },
  prix:        { type: Number, required: true, min: 0 },
  categorie:   { type: String, required: true },
  stock:       { type: Number, default: 0, min: 0 },
  vues:        { type: Number, default: 0 },
  commandes:   { type: Number, default: 0 },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  vendeur:     { type: String, default: '' }   // username du créateur
});
ProduitSchema.index({ categorie: 1 });
ProduitSchema.index({ vendeur: 1 });
ProduitSchema.index({ nom: 'text', description: 'text' });

// ─── Schéma User (inchangé, déjà dans auth.js — référence partagée) ──
const UserSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, default: 'user', enum: ['user', 'vendeur', 'admin'] },
  bio:       { type: String, default: '' },
  telephone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Commande = mongoose.models.Commande || mongoose.model('Commande', CommandeSchema);
const Produit  = mongoose.models.Produit  || mongoose.model('Produit',  ProduitSchema);
const User     = mongoose.models.User     || mongoose.model('User',     UserSchema);

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://mongodb:27017/boutique';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connecté');
}

module.exports = { connectMongo, Commande, Produit, User };
