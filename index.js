require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // au cas où tu l'utilises plus tard

const app = express(); // Doit être déclaré AVANT app.use

// Configuration de base
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monprojet';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// __dirname est déjà disponible dans CommonJS, pas besoin de fileURLToPath
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 TEST d'image directe
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', 'image-1743972143126-300602170.png'));
});

// Middlewares
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch(err => {
    console.error('❌ Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Modèles
const User = require('./modeles/user');
const Produit = require('./modeles/produit');

// Enregistrement
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir 8+ caractères, une majuscule, un chiffre et un caractère spécial'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { name: newUser.name, email: newUser.email },
      token
    });

  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      user: { name: user.name, email: user.email },
      token
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Middleware d'authentification
const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Token manquant');
    
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentification requise' });
  }
};

// Routes Produits
app.use('/api/produits', require('./route/produitRoutes'));

// Gestion des erreurs
app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({ message: 'Erreur serveur' });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
