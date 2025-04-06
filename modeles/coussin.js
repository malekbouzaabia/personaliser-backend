// models/Bijou.js
const Produit = require("./produit");
const mongoose = require("mongoose");

const bijouSchema = new mongoose.Schema({
  materiau: { type: String, required: true },
  forme: { type: String },
  couleur: { type: String, required: true },
});

const Bijou = Produit.discriminator("bijou", bijouSchema);

module.exports = Bijou;
