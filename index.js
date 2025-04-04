const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Pour hasher les mots de passe
const jwt = require('jsonwebtoken'); // Pour générer les JWT
const cors = require('cors');
require('dotenv').config();

const app = express();

// Importation des modèles
const User = require('./modeles/user');           // Assure-toi que ton modèle User est correct
const TShirt = require('./modeles/t-shirt');        // Assure-toi d'importer ton modèle TShirt
const Order = require('./modeles/order');

// Middleware
app.use(cors());
app.use(express.json()); // Pour parser le JSON dans les requêtes

// Connexion à MongoDB avec l'URI "monprojet"
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/monprojet';
mongoose.connect(mongoURI)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((error) => console.log('Erreur de connexion à MongoDB:', error));

// Route POST pour créer un utilisateur (Sign Up)
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Vérifier le format de l'email avec une regex simple
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'L\'adresse email est invalide' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'L\'utilisateur existe déjà' });
    }

    // Validation du mot de passe : minimum 8 caractères, au moins une majuscule, un chiffre et un caractère spécial
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit comporter au moins 8 caractères, une majuscule, un chiffre et un caractère spécial'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur avec le mot de passe hashé
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    // Créer un token JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      'secretKey', // Pense à sécuriser ta clé dans une variable d'environnement
      { expiresIn: '1h' }
    );

    // Répondre avec le message de succès et le token
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        name: newUser.name,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error });
  }
});


app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });  // Recherche par email dans la base de données
    if (!user) {
      // Si l'utilisateur n'existe pas, on renvoie une erreur
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Comparer le mot de passe fourni avec celui stocké
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Si l'utilisateur existe et que le mot de passe est correct
    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      'secretKey',  // Choisis une clé secrète sécurisée (et place-la dans un fichier .env)
      { expiresIn: '1h' }
    );

    // Répondre avec les informations de l'utilisateur et le token JWT
    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: 'Erreur lors de la connexion', error });
  }
});




// Route POST pour ajouter un T-shirt avec calcul automatique du prix
app.post('/api/tshirts', async (req, res) => {
  const { name, color, size, image, customText, fontColor } = req.body;

  try {
    let calculatedPrice = 19.99; // Prix de base
    if (image) calculatedPrice += 5; // Ajout d'une image
    if (customText) calculatedPrice += 3; // Ajout de texte personnalisé
    
    const newTShirt = new TShirt({
      name,
      price: calculatedPrice,
      color,
      size,
      image,
      customText,
      fontColor: fontColor || '#000000' // Couleur par défaut noire si non précisée
    });

    await newTShirt.save();

    res.status(201).json({
      message: 'T-shirt ajouté avec succès',
      tshirt: newTShirt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du T-shirt', error });
  }
});

// Route GET pour récupérer tous les T-shirts
app.get('/api/tshirts', async (req, res) => {
  try {
    const tshirts = await TShirt.find();
    res.status(200).json(tshirts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des T-shirts', error });
  }
});

// Route PUT pour personnaliser un T-shirt (avec l'ID dans l'URL)
app.put('/api/tshirts/:id', async (req, res) => {
  const { customText, fontColor } = req.body;

  try {
    let tshirt = await TShirt.findById(req.params.id);
    if (!tshirt) {
      return res.status(404).json({ message: 'T-shirt non trouvé' });
    }

    if (customText) tshirt.customText = customText;
    if (fontColor) tshirt.fontColor = fontColor;

    await tshirt.save();
    res.status(200).json({
      message: 'T-shirt mis à jour avec succès',
      tshirt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du T-shirt', error });
  }
});

// Importation et utilisation des routes de commandes
const orderRoutes = require('./route/order_route');
app.use('/api/orders', orderRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('API T-Shirt fonctionne !');
});

// Lancer le serveur sur le port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Serveur démarré sur http://localhost:${PORT}');
})