import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
    maxlength: [30, 'Le nom ne peut pas dépasser 30 caractères']
  },
  
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Email invalide'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le password par défaut
  },
  
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['fr', 'en', 'es'],
      default: 'fr'
    }
  },
  
  stats: {
    totalHabits: {
      type: Number,
      default: 0
    },
    completedToday: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// NOTE: Avoid duplicate index definitions.
// We already declare `unique: true` on `email` and `username` above which
// creates the corresponding indexes. Defining the same indexes again with
// `userSchema.index(...)` causes Mongoose to emit duplicate-index warnings.
// Therefore we remove the explicit `schema.index(...)` calls and rely on the
// `unique: true` declarations to create the indexes.

// Virtual pour les habitudes de l'utilisateur
// Virtual relationship: connect User -> Habit. The Habit schema stores the
// reference in the `user` field (ObjectId), so foreignField must be `user`.
userSchema.virtual('habits', {
  ref: 'Habit',
  localField: '_id',
  foreignField: 'user'
});

const User = mongoose.model('User', userSchema);

export default User;