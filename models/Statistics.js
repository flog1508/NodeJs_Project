// models/Statistics.js
import mongoose from 'mongoose';

const statisticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  
  totalCompleted: {
    type: Number,
    default: 0
  },
  
  totalAttempts: {
    type: Number,
    default: 0
  },
  
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  streak: {
    type: Number,
    default: 0
  },
  
  bestStreak: {
    type: Number,
    default: 0
  },
  
  averageMood: {
    type: String,
    enum: ['excellent', 'bon', 'moyen', 'difficile'],
    default: 'bon'
  },
  
  totalDuration: {
    type: Number,
    default: 0
  },
  
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
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

// Index pour optimiser les requêtes
statisticsSchema.index({ user: 1, habit: 1, period: 1 });
statisticsSchema.index({ user: 1, startDate: 1 });

const Statistics = mongoose.model('Statistics', statisticsSchema);

export default Statistics;