import mongoose from 'mongoose';

const shoeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia a tu modelo de Usuario
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  nickname: {
    type: String, // "Las de carrera", "Las viejas"
    trim: true
  },
  image: {
    type: String, // URL de la imagen (Cloudinary o donde subas fotos)
    default: 'https://cdn-icons-png.flaticon.com/512/2558/2558162.png'
  },
  currentKm: {
    type: Number,
    default: 0
  },
  maxKm: {
    type: Number,
    default: 800 // Vida útil estándar, se puede editar
  },
  isActive: {
    type: Boolean,
    default: true // true = En uso, false = Retirada
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Crea createdAt y updatedAt solos
});

// Método opcional para saber si está gastada
shoeSchema.methods.needsReplacement = function() {
  return this.currentKm >= this.maxKm;
};

const Shoe = mongoose.model('Shoe', shoeSchema);

export default Shoe;