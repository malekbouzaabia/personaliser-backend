const Produit = require('../modeles/produit');
const fs = require('fs');
const path = require('path');

// Configuration de l'URL de base (à adapter selon l'environnement)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/';

exports.createProduit = async (req, res) => {
  try {
    const { nom, description, prix, categorie } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Une image est requise' });
    }

    // Enregistrement du chemin relatif + nom du fichier
    const imagePath = 'uploads/' + req.file.filename;

    const produit = new Produit({
      nom,
      description,
      prix,
      categorie,
      imageUrl: imagePath // Stocke le chemin relatif
    });

    await produit.save();
    
    // Renvoie l'URL complète dans la réponse
    const produitResponse = produit.toObject();
    produitResponse.imageUrl = `${BASE_URL}/${imagePath}`;
    
    res.status(201).json(produitResponse);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: "Erreur lors de la création du produit" 
    });
  }
};

exports.getAllProduits = async (req, res) => {
  try {
    const produits = await Produit.find().sort({ dateCreation: -1 });
    
    // Transforme les chemins relatifs en URLs absolues
    const produitsWithFullUrls = produits.map(produit => {
      const produitObj = produit.toObject();
      return {
        ...produitObj,
        imageUrl: `${BASE_URL}${produitObj.imageUrl}`
      };
    });
    
    res.status(200).json(produitsWithFullUrls);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: "Erreur lors de la récupération des produits" 
    });
  }
};

exports.getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const produitResponse = produit.toObject();
    produitResponse.imageUrl = `${BASE_URL}/${produit.imageUrl}`;
    
    res.status(200).json(produitResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduit = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (req.file) {
      // Supprime l'ancienne image si elle existe
      const oldProduit = await Produit.findById(req.params.id);
      if (oldProduit && oldProduit.imageUrl) {
        const oldPath = path.join(__dirname, '../', oldProduit.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updates.imageUrl = 'uploads/' + req.file.filename;
    }
    
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const produitResponse = produit.toObject();
    produitResponse.imageUrl = `${BASE_URL}/${produit.imageUrl}`;
    
    res.status(200).json(produitResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findByIdAndDelete(req.params.id);
    
    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Supprime le fichier image associé
    if (produit.imageUrl) {
      const imagePath = path.join(__dirname, '../', produit.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};