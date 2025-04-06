const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

const Produit = mongoose.model('produit', produitSchema);

module.exports = Produit;
