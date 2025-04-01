// models/User.js
const mongoose = require('mongoose');

// Définir le schéma d'un utilisateur
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Créer un modèle basé sur le schéma
const User = mongoose.model('User', userSchema);

module.exports = User;
