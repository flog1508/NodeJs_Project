// routes/statsRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// --- IMPORTS DES MODÈLES SÉCURISÉS ---
import User from '../models/User.js';


// Cela permet de gérer si tu as fait "export default" ou "export const Habit" dans ton modèle.
import HabitModel from '../models/Habit.js';
const Habit = HabitModel.Habit || HabitModel; 

import HabitlogModel from '../models/Habitlog.js';
const Habitlog = HabitlogModel.Habitlog || HabitlogModel;

// (Optionnel) Si Statistics n'est pas utilisé, on peut l'ignorer, mais je le laisse :
import Statistics from '../models/Statistics.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔍 Vérification des modèles au chargement (Debugging)
console.log('✅ statsRoutes.js - Vérification des modèles :', {
  User: !!User,
  Habit: !!Habit,
  Habitlog: !!Habitlog
});

/**
 * ============================================
 * ÉTUDIANT 4 - ROUTES STATISTICS & ANALYTICS
 * ============================================
 */

/**
 * ROUTE TEST
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Stats routes sont chargées!' });
});

/**
 * ROUTE 1 - POST /api/stats/export
 * Générer statistiques & export JSON
 */
router.post('/export', async (req, res) => {
  try {
    const { userId, period = 'monthly' } = req.body;
    console.log('📊 Export - userId reçu:', userId);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId est requis' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'userId invalide' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const habits = await Habit.find({ user: userId });
    // Note : Assure-toi que le champ dans Habitlog est bien 'habit' (singulier)
    const logs = await Habitlog.find({ user: userId }).populate('habit');

    const habitsStats = habits.map(habit => {
      // Sécurisation : on vérifie que log.habit existe avant de lire _id
      const habitLogs = logs.filter(log => log.habit && log.habit._id.toString() === habit._id.toString());
      const completedCount = habitLogs.filter(log => log.completed).length;
      const completionRate = habitLogs.length > 0 ? ((completedCount / habitLogs.length) * 100).toFixed(2) : 0;

      return {
        habitId: habit._id,
        title: habit.title,
        totalLogs: habitLogs.length,
        completedCount,
        completionRate: completionRate + '%'
      };
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      period: period,
      user: { id: user._id, username: user.username, email: user.email },
      summary: {
        totalHabits: habits.length,
        totalLogs: logs.length,
        totalCompleted: logs.filter(l => l.completed).length,
        overallCompletionRate: logs.length > 0 ? ((logs.filter(l => l.completed).length / logs.length) * 100).toFixed(2) + '%' : '0%'
      },
      habits: habitsStats
    };

    // Gestion du dossier d'export
    const exportsDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `user-stats-${userId}-${Date.now()}.json`;
    const filePath = path.join(exportsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

    res.status(200).json({
      success: true,
      message: 'Statistiques exportées',
      file: fileName,
      data: exportData
    });

  } catch (error) {
    console.error('❌ Erreur export:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 2 - GET /api/stats/dashboard
 * Statistiques avancées du tableau de bord
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { userId, period = 'monthly' } = req.query; // GET = req.query
    console.log('📊 Dashboard - userId reçu:', userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'userId invalide ou manquant' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const habits = await Habit.find({ user: userId });
    const logs = await Habitlog.find({ user: userId }); // Populate non nécessaire ici pour juste compter

    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const periodLogs = logs.filter(log => new Date(log.date) >= startDate);
    const periodCompleted = periodLogs.filter(log => log.completed).length;
    const periodRate = periodLogs.length > 0 ? ((periodCompleted / periodLogs.length) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, username: user.username },
        period: period,
        totalHabits: habits.length,
        totalLogs: logs.length,
        periodStats: {
          totalLogs: periodLogs.length,
          completedLogs: periodCompleted,
          completionRate: periodRate + '%'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur dashboard:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 3 - GET /api/stats/aggregation
 * Agrégation avec $lookup : Users → Habits
 */
router.get('/aggregation', async (req, res) => {
  try {
    // NOTE : Assure-toi que les noms de collections dans 'from' correspondent à ta base MongoDB
    // Par défaut mongoose met 'habits' pour le modèle Habit et 'habitlogs' pour le modèle Habitlog
    const result = await User.aggregate([
      {
        $lookup: {
          from: 'habits', // Nom de la collection dans MongoDB
          localField: '_id',
          foreignField: 'user',
          as: 'habits'
        }
      },
      {
        $lookup: {
          from: 'habitlogs', // Nom de la collection dans MongoDB
          localField: '_id',
          foreignField: 'user',
          as: 'logs'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          totalHabits: { $size: '$habits' },
          totalLogs: { $size: '$logs' },
          completedLogs: {
            $size: {
              $filter: {
                input: '$logs',
                as: 'log',
                cond: { $eq: ['$$log.completed', true] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          averageCompletionRate: {
            $cond: [
              { $eq: ['$totalLogs', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completedLogs', '$totalLogs'] }, 100] }, 2] }
            ]
          }
        }
      },
      { $sort: { averageCompletionRate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Agrégation Users → Habits',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur aggregation:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 4 - GET /api/stats/top-habits
 * Top 5 habitudes les plus populaires
 */
router.get('/top-habits', async (req, res) => {
  try {
    const topHabits = await Habitlog.aggregate([
      {
        $lookup: {
          from: 'habits', // Nom de la collection MongoDB
          localField: 'habit',
          foreignField: '_id',
          as: 'habitData'
        }
      },
      { $unwind: '$habitData' }, // Attention : ceci masque les logs dont l'habitude a été supprimée
      {
        $group: {
          _id: '$habitData._id',
          title: { $first: '$habitData.title' },
          category: { $first: '$habitData.category' },
          totalLogs: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $round: [{ $multiply: [{ $divide: ['$completedCount', '$totalLogs'] }, 100] }, 2]
          }
        }
      },
      { $sort: { totalLogs: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Top 5 habitudes',
      data: topHabits
    });

  } catch (error) {
    console.error('❌ Erreur top-habits:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;