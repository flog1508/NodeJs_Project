import mongoose from 'mongoose';

const habitlogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: [true, 'L\'habitude est requise'],
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },
  
  completedAt: {
    type: Date,
    required: [true, 'La date de completion est requise'],
    default: Date.now,
    index: true
  },
  
  // Date au format YYYY-MM-DD pour faciliter les requêtes quotidiennes
  dateString: {
    type: String,
    required: true,
    index: true
  },
  
  note: {
    type: String,
    trim: true,
    maxlength: [300, 'La note ne peut pas dépasser 300 caractères']
  },
  
  mood: {
    type: String,
    enum: ['excellent', 'bon', 'moyen', 'difficile'],
    default: 'bon'
  },
  
  // Durée en minutes (optionnel)
  duration: {
    type: Number,
    min: [0, 'La durée ne peut pas être négative'],
    max: [1440, 'La durée ne peut pas dépasser 24h']
  },
  
  // Métadonnées optionnelles
  metadata: {
    location: String,
    weather: String,
    companions: [String]
  }
}, {
  timestamps: true
});

// Index composés pour optimiser les requêtes fréquentes
habitlogSchema.index({ habitId: 1, completedAt: -1 });
habitlogSchema.index({ userId: 1, completedAt: -1 });
habitlogSchema.index({ dateString: 1, habitId: 1 }, { unique: true }); // Éviter les doublons par jour

// Middleware pre-save pour générer dateString automatiquement
habitlogSchema.pre('save', function(next) {
  if (this.completedAt) {
    const date = new Date(this.completedAt);
    this.dateString = date.toISOString().split('T')[0];
  }
  next();
});

const Habitlog = mongoose.model('Habitlog', habitlogSchema);

export default Habitlog;