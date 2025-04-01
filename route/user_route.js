const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');

// Route pour créer un utilisateur
router.post('/users', userController.createUser);

// Route pour récupérer tous les utilisateurs
router.get('/users', userController.getAllUsers);

// Route pour récupérer un utilisateur par son ID
router.get('/users/:id', userController.getUserById);

// Route pour mettre à jour un utilisateur
router.put('/:id', userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/:id', userController.deleteUser);

module.exports = router;
