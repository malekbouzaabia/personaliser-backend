// models/Mug.js
const Produit = require("./produit");
const mongoose = require("mongoose");

const mugSchema = new mongoose.Schema({
  couleurInterieur: { type: String, required: true },
  texte: { type: String }, // texte personnalisé imprimé sur le mug
});

const Mug = Produit.discriminator("mug", mugSchema);

module.exports = Mug;
