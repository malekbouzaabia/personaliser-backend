const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tshirts: [
    {
      tshirt: { type: mongoose.Schema.Types.ObjectId, ref: 'TShirt', required: true },
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['En attente', 'En cours', 'Livrée'], default: 'En attente' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);