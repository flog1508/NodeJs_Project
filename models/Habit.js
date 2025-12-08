// models/Habit.js
import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['health', 'work', 'personal', 'learning', 'social', 'other'],
    default: 'other'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Habit = mongoose.model('Habit', habitSchema);

// 👇 LA SOLUTION MAGIQUE : On exporte des deux façons !
export { Habit };       // Pour Habitroutes.js (import { Habit })
export default Habit;   // Pour statsRoutes.js (import Habit)