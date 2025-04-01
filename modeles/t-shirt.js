const mongoose = require('mongoose');

const tshirtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL'] // Liste des tailles autorisées
  },
  image: {
    type: String // URL de l'image si l'utilisateur en ajoute une
  },
  customText: {
    type: String // Texte personnalisé ajouté par le client
  },
  fontStyle: {
    type: String,
    enum: ['Arial', 'Times New Roman', 'Verdana', 'Courier New', 'Georgia', 'Comic Sans MS'], // Liste des styles de texte possibles
    default: 'Arial'
  },
  fontColor: {
    type: String, // Couleur du texte personnalisé (ex: #FF0000 pour rouge)
    default: '#000000' // Noir par défaut
  },
  price: {
    type: Number,
    required: true,
    default: 19.99 // Prix de base
  }
 
});

// Avant de sauvegarder un T-shirt, recalculer le prix en fonction des options choisies
tshirtSchema.pre('save', function (next) {
  let calculatedPrice = 19.99; // Prix de base

  if (this.image) {
    calculatedPrice += 5; // Ajouter 5€ si une image est ajoutée
  }
  if (this.customText) {
    calculatedPrice += 3; // Ajouter 3€ pour un texte personnalisé
  }

  if (this.fontStyle) {
    calculatedPrice += 2; // Ajouter 2€ si une image est ajoutée
  }

  if (this.fontColor) {
    calculatedPrice += 2; // Ajouter 2€ si une image est ajoutée
  }
 

  this.price = calculatedPrice; // Mettre à jour le prix du t-shirt
  next();
});

const TShirt = mongoose.model('TShirt', tshirtSchema);
module.exports = TShirt;
