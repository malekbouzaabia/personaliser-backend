const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Pour hasher les mots de passe
const jwt = require('jsonwebtoken'); // Pour générer les JWT
const app = express();
const User = require('./modeles/user'); // Assure-toi que ton modèle User est correct
const TShirt = require('./modeles/t-shirt'); // Assure-toi d'importer ton modèle TShirt
const Order = require('./modeles/order');
const cors = require('cors');
require('dotenv').config();


// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/monprojet')
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((error) => console.log('Erreur de connexion à MongoDB:', error));

app.use(express.json()); // Pour pouvoir recevoir des requêtes JSON

// Route POST pour créer un utilisateur (Sign Up)
app.post('/api/users', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'L\'utilisateur existe déjà' });
    }

    // Vérifier si les mots de passe sont identiques
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Validation du mot de passe : minimum 8 caractères, au moins une majuscule, un chiffre, un caractère spécial
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
      'secretKey', // C'est ici que tu définis ta clé secrète, tu devrais utiliser une clé plus sécurisée
      { expiresIn: '1h' } // Le token expirera après 1 heure
    );

    // Répondre avec le message de succès et le token
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        name: newUser.name,
        email: newUser.email
      },
      token // Retourner le token JWT dans la réponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error });
  }
});

// Route POST pour connecter un utilisateur (Sign In)
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Comparer le mot de passe fourni avec celui stocké
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      'secretKey', // Utilisez une clé secrète plus sécurisée dans un fichier .env
      { expiresIn: '1h' } // Le token expire après 1 heure
    );

    // Répondre avec le message de succès et le token
    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        name: user.name,
        email: user.email
      },
      token // Retourner le token JWT dans la réponse
    });
  } catch (error) {
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

// Route PUT pour personnaliser un T-shirt
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



// Middleware
app.use(cors());
app.use(express.json()); // Pour parser le JSON

// Importer les routes
const orderRoutes = require('./route/order_route');
app.use('/api/orders', orderRoutes); // Associe les routes de commande

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tshirtDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connecté'))
.catch(err => console.error('Erreur MongoDB', err));

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});