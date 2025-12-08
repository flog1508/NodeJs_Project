// services/statsService.js
// 🎯 SERVICE CENTRALISÉ POUR TOUS LES CALCULS STATISTIQUES

import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import User from '../models/User.js';

class StatsService {
  /**
   * Calcule le taux de complétion
   * @param {number} completed - Nombre de logs complétés
   * @param {number} total - Nombre total de logs
   * @returns {string} Taux en pourcentage (ex: "85.50%")
   */
  static calculateCompletionRate(completed, total) {
    if (total === 0) return "0%";
    return ((completed / total) * 100).toFixed(2) + "%";
  }

  /**
   * Calcule la série actuelle (streak)
   * @param {Array} logs - Tableau de logs triés par date DESC
   * @returns {number} Nombre de jours consécutifs
   */
  static calculateCurrentStreak(logs) {
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    
    for (const log of sortedLogs) {
      if (log.completed) streak++;
      else break;
    }
    
    return streak;
  }

  /**
   * Stats complètes pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Statistiques complètes
   */
  static async getUserStats(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    const habits = await Habit.find({ user: userId });
    const logs = await Habitlog.find({ user: userId });

    const completedCount = logs.filter(log => log.completed).length;
    const completionRate = this.calculateCompletionRate(completedCount, logs.length);

    // Stats par habitude
    const habitStats = habits.map(habit => {
      const habitLogs = logs.filter(log => 
        log.habit && log.habit.toString() === habit._id.toString()
      );
      const habitCompleted = habitLogs.filter(log => log.completed).length;

      return {
        habitId: habit._id,
        title: habit.title,
        category: habit.category,
        totalLogs: habitLogs.length,
        completedCount: habitCompleted,
        completionRate: this.calculateCompletionRate(habitCompleted, habitLogs.length),
        currentStreak: this.calculateCurrentStreak(habitLogs)
      };
    });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      summary: {
        totalHabits: habits.length,
        activeHabits: habits.filter(h => h.isActive !== false).length,
        totalLogs: logs.length,
        completedLogs: completedCount,
        completionRate
      },
      habits: habitStats
    };
  }

  /**
   * Stats pour une habitude spécifique
   * @param {string} habitId - ID de l'habitude
   * @returns {Object} Statistiques de l'habitude
   */
  static async getHabitStats(habitId) {
    const habit = await Habit.findById(habitId).populate('user');
    if (!habit) throw new Error('Habitude non trouvée');

    const logs = await Habitlog.find({ habit: habitId });
    const completedCount = logs.filter(log => log.completed).length;

    return {
      habit,
      totalLogs: logs.length,
      completedCount,
      completionRate: this.calculateCompletionRate(completedCount, logs.length),
      currentStreak: this.calculateCurrentStreak(logs),
      logs: logs.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }

  /**
   * Tendances sur une période
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 30)
   * @returns {Object} Tendances jour par jour
   */
  static async getTrends(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await Habitlog.find({
      user: userId,
      date: { $gte: startDate }
    }).populate('habit');

    // Grouper par jour
    const trendsByDay = {};
    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      if (!trendsByDay[dateStr]) {
        trendsByDay[dateStr] = { completed: 0, total: 0 };
      }
      trendsByDay[dateStr].total++;
      if (log.completed) trendsByDay[dateStr].completed++;
    });

    // Transformer en tableau
    const trends = Object.entries(trendsByDay)
      .map(([date, data]) => ({
        date,
        completionRate: this.calculateCompletionRate(data.completed, data.total),
        logsCompleted: data.completed,
        totalLogs: data.total
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      period: `${days} derniers jours`,
      totalLogs: logs.length,
      trends
    };
  }

  /**
   * Stats par période (semaine, mois, année)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} period - 'weekly', 'monthly', 'yearly'
   * @returns {Object} Stats de la période
   */
  static async getPeriodStats(userId, period = 'monthly') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const logs = await Habitlog.find({
      user: userId,
      date: { $gte: startDate }
    });

    const completedCount = logs.filter(log => log.completed).length;

    return {
      period,
      startDate,
      endDate: now,
      totalLogs: logs.length,
      completedLogs: completedCount,
      completionRate: this.calculateCompletionRate(completedCount, logs.length)
    };
  }

  /**
   * Top habitudes (les plus complétées)
   * @param {number} limit - Nombre de résultats (défaut: 5)
   * @returns {Array} Top habitudes
   */
  static async getTopHabits(limit = 5) {
    const topHabits = await Habitlog.aggregate([
      {
        $lookup: {
          from: 'habits',
          localField: 'habit',
          foreignField: '_id',
          as: 'habitData'
        }
      },
      { $unwind: '$habitData' },
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
      { $limit: limit }
    ]);

    return topHabits;
  }

  /**
   * Stats par catégorie
   * @returns {Array} Statistiques par catégorie
   */
  static async getStatsByCategory() {
    return await Habit.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $group: {
          _id: '$category',
          totalHabits: { $sum: 1 },
          firstCreatedAt: { $min: '$createdAt' },
          lastCreatedAt: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalHabits: 1,
          firstCreatedAt: 1,
          lastCreatedAt: 1
        }
      },
      { $sort: { totalHabits: -1 } }
    ]);
  }

  /**
   * Vue d'ensemble globale (dashboard admin)
   * @returns {Object} Statistiques globales
   */
  static async getOverview() {
    const totalUsers = await User.countDocuments();
    const totalHabits = await Habit.countDocuments();
    const totalLogs = await Habitlog.countDocuments();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const habitsThisMonth = await Habit.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    return {
      totalUsers,
      totalHabits,
      totalLogs,
      habitsThisMonth,
      usersThisMonth,
      averageHabitsPerUser: totalUsers > 0 ? (totalHabits / totalUsers).toFixed(2) : 0
    };
  }

  /**
   * Agrégation Users → Habits (avec $lookup)
   * @param {number} limit - Nombre de résultats
   * @returns {Array} Utilisateurs avec leurs habitudes
   */
  static async getUsersWithHabitsAggregation(limit = 10) {
    return await User.aggregate([
      // Étape 1 : Jointure avec Habits ($lookup)
      {
        $lookup: {
          from: 'habits',
          localField: '_id',
          foreignField: 'user',
          as: 'userHabits'
        }
      },

      // Étape 2 : Jointure avec Habitlogs
      {
        $lookup: {
          from: 'habitlogs',
          localField: '_id',
          foreignField: 'user',
          as: 'userLogs'
        }
      },

      // Étape 3 : Calculer les statistiques
      {
        $addFields: {
          totalHabits: { $size: '$userHabits' },
          totalLogs: { $size: '$userLogs' },
          completedLogs: {
            $size: {
              $filter: {
                input: '$userLogs',
                as: 'log',
                cond: { $eq: ['$$log.completed', true] }
              }
            }
          }
        }
      },

      // Étape 4 : Calculer le taux de complétion
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $gt: ['$totalLogs', 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: ['$completedLogs', '$totalLogs'] }, 100] },
                  2
                ]
              },
              else: 0
            }
          }
        }
      },

      // Étape 5 : Projection (choisir les champs à retourner)
      {
        $project: {
          username: 1,
          email: 1,
          createdAt: 1,
          totalHabits: 1,
          totalLogs: 1,
          completedLogs: 1,
          completionRate: 1,
          habits: {
            $map: {
              input: '$userHabits',
              as: 'habit',
              in: {
                id: '$$habit._id',
                title: '$$habit.title',
                category: '$$habit.category',
                frequency: '$$habit.frequency'
              }
            }
          }
        }
      },

      // Étape 6 : Tri par nombre d'habitudes
      {
        $sort: { totalHabits: -1 }
      },

      // Étape 7 : Limite
      {
        $limit: limit
      }
    ]);
  }
}

export default StatsService;