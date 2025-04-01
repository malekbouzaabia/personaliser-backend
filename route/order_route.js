const express = require('express');
const router = express.Router();
const Order = require('../modeles/order'); // Modèle de commande
const TShirt = require('../modeles/t-shirt'); // Modèle de T-shirt

//  Route POST : Créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    const { user, tshirts } = req.body;

    if (!user || !tshirts || tshirts.length === 0) {
      return res.status(400).json({ message: 'Données de commande invalides' });
    }

    let totalPrice = 0;
    const tshirtDetails = await Promise.all(
      tshirts.map(async (item) => {
        const tshirt = await TShirt.findById(item.tshirt);
        if (!tshirt) throw new Error('T-shirt non trouvé');
        const price = tshirt.price * item.quantity;
        totalPrice += price;
        return { tshirt: tshirt._id, quantity: item.quantity, price };
      })
    );

    const newOrder = new Order({ user, tshirts: tshirtDetails, totalPrice });
    await newOrder.save();

    res.status(201).json({ message: 'Commande créée avec succès', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la commande', error: error.message });
  }
});

// Route GET : Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('tshirts.tshirt');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes', error });
  }
});

// ✅ Route GET : Récupérer une commande spécifique
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('tshirts.tshirt');
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande', error });
  }
});

// Route PUT : Mettre à jour le statut d'une commande
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['En attente', 'En cours', 'Livrée'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.status(200).json({ message: 'Statut mis à jour', order });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la commande', error });
  }
});

module.exports = router;
