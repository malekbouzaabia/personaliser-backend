const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController'); // Import SINGULIER
const upload = require('../middleware/upload');

// Utilisez le même nom que dans l'import (produitController sans "s")
router.post('/', upload.single('image'), produitController.createProduit); // <- Correction ici
router.get('/', produitController.getAllProduits); // <- Et ici

module.exports = router;