// routes/analyticsRoutes.js
import express from 'express';
import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Vue d'ensemble des analytics
 */
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHabits = await Habit.countDocuments();
    const totalLogs = await Habitlog.countDocuments();

    // Habitudes créées ce mois-ci
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const habitsThisMonth = await Habit.countDocuments({
      createdAt: { $gte: firstDay }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalHabits,
        totalLogs,
        habitsThisMonth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/habits/:habitId
 * Analyse détaillée d'une habitude
 */
router.get('/habits/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;

    const habit = await Habit.findById(habitId).populate('user');
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habitude non trouvée'
      });
    }

    const logs = await Habitlog.find({ habit: habitId });
    const completedCount = logs.filter(log => log.completed).length;
    const completionRate = logs.length > 0 ? ((completedCount / logs.length) * 100).toFixed(2) : 0;

    // Calcul de la série actuelle
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    
    for (let i = 0; i < sortedLogs.length; i++) {
      if (sortedLogs[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        habit,
        totalLogs: logs.length,
        completedCount,
        completionRate: completionRate + '%',
        currentStreak,
        logs: sortedLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/users/:userId
 * Analyse des habitudes d'un utilisateur
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const habits = await Habit.find({ user: userId });
    const logs = await Habitlog.find({ user: userId });

    const habitStats = habits.map(habit => {
      const habitLogs = logs.filter(log => log.habit.toString() === habit._id.toString());
      const completedCount = habitLogs.filter(log => log.completed).length;
      const completionRate = habitLogs.length > 0 ? ((completedCount / habitLogs.length) * 100).toFixed(2) : 0;

      return {
        habitId: habit._id,
        title: habit.title,
        category: habit.category,
        totalLogs: habitLogs.length,
        completedCount,
        completionRate: completionRate + '%'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        totalHabits: habits.length,
        totalLogs: logs.length,
        habits: habitStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/trends/:userId
 * Tendances et progression d'un utilisateur
 */
router.get('/trends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await Habitlog.find({
      user: userId,
      date: { $gte: startDate }
    }).populate('habit');

    // Grouper par jour
    const trendsByDay = {};
    logs.forEach(log => {
      const dateStr = log.dateString;
      if (!trendsByDay[dateStr]) {
        trendsByDay[dateStr] = { completed: 0, total: 0 };
      }
      trendsByDay[dateStr].total++;
      if (log.completed) {
        trendsByDay[dateStr].completed++;
      }
    });

    // Calculer le taux de complétion par jour
    const trends = Object.entries(trendsByDay).map(([date, data]) => ({
      date,
      completionRate: ((data.completed / data.total) * 100).toFixed(2) + '%',
      logsCompleted: data.completed,
      totalLogs: data.total
    }));

    res.status(200).json({
      success: true,
      data: {
        period: `${days} derniers jours`,
        totalLogs: logs.length,
        trends: trends.sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;