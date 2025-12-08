// models/Habitlog.js
import mongoose from 'mongoose';

const habitlogSchema = new mongoose.Schema({
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: [true, 'L\'habitude est requise'],
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },
  
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now,
    index: true
  },
  
  // Date au format YYYY-MM-DD pour faciliter les requêtes quotidiennes
  dateString: {
    type: String,

    index: true
  },
  
  completed: {
    type: Boolean,
    default: true,
    index: true
  },
  
  notes: {
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
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index composés pour optimiser les requêtes fréquentes
habitlogSchema.index({ habit: 1, date: -1 });
habitlogSchema.index({ user: 1, date: -1 });
habitlogSchema.index({ dateString: 1, habit: 1 }, { unique: true }); // Éviter les doublons par jour

// Middleware pre-save pour générer dateString automatiquement
habitlogSchema.pre('save', function(next) {
  if (this.date) {
    const date = new Date(this.date);
    this.dateString = date.toISOString().split('T')[0];
  }
  this.updatedAt = new Date();
  next();
});

const Habitlog = mongoose.model('Habitlog', habitlogSchema);

export default Habitlog;