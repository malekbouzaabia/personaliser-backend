// models/Tshirt.js
const Produit = require("./produit");
const mongoose = require("mongoose");

const tshirtSchema = new mongoose.Schema({
  taille: { type: String, enum: ['S', 'M', 'L', 'XL'], required: true },
  couleur: { type: String, required: true },
  
});

const Tshirt = Produit.discriminator("tshirt", tshirtSchema);

module.exports = Tshirt;
