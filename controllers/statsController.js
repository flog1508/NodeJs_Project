// controllers/statsController.js
// 🎯 JAD - GESTION STATISTIQUES GLOBALES ET COMPARATIVES
// Responsabilité : Stats de toute l'application (top habitudes, comparaisons, vue d'ensemble admin)
// Différence avec UserController : UserController = stats personnelles d'UN user, StatsController = stats globales

import StatsService from '../services/statsService.js';
import fs from 'fs';
import path from 'path';

class StatsController {
  /**
   * ROUTE 1 (POST) - Exporter les statistiques d'un utilisateur
   * Exigence prof : Route d'écriture avec fichier JSON
   */
  static async exportStats(req, res) {
    try {
      const { userId, period = 'monthly' } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId est requis'
        });
      }

      // Récupérer les stats complètes
      const userStats = await StatsService.getUserStats(userId);
      const periodStats = await StatsService.getPeriodStats(userId, period);
      const trends = await StatsService.getTrends(userId, 30);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        period,
        userStats,
        periodStats,
        trends,
        metadata: {
          exportedBy: 'Habit Tracker API',
          version: '1.0'
        }
      };

      // 📝 ÉCRITURE FICHIER JSON
      const exportsDir = path.join(process.cwd(), 'data', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stats-user-${userId}-${timestamp}.json`;
      const exportPath = path.join(exportsDir, filename);

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      res.json({
        success: true,
        message: 'Statistiques exportées avec succès',
        file: filename,
        path: exportPath,
        data: exportData
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 2 (GET) - Dashboard utilisateur (lecture avancée avec filtres)
   * Exigence prof : Route de lecture avancée
   */
  static async getDashboard(req, res) {
    try {
      const { userId, period = 'monthly' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId est requis'
        });
      }

      // Récupérer toutes les stats nécessaires
      const userStats = await StatsService.getUserStats(userId);
      const periodStats = await StatsService.getPeriodStats(userId, period);
      const trends = await StatsService.getTrends(userId, 30);

      res.json({
        success: true,
        data: {
          user: userStats.user,
          summary: userStats.summary,
          period: periodStats,
          trends: trends.trends,
          habits: userStats.habits
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 3 (GET) - Agrégation MongoDB : Users avec leurs Habits
   * Exigence prof : Route d'agrégation avec $lookup
   */
  static async getUsersWithHabits(req, res) {
    try {
      const { limit = 10 } = req.query;

      // Agrégation MongoDB complexe avec $lookup
      const usersWithHabits = await StatsService.getUsersWithHabitsAggregation(Number(limit));

      res.json({
        success: true,
        data: usersWithHabits
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 4 (GET) - Top habitudes (agrégation)
   * Agrégation supplémentaire : Habitudes les plus populaires
   */
  static async getTopHabits(req, res) {
    try {
      const { limit = 5 } = req.query;

      const topHabits = await StatsService.getTopHabits(Number(limit));

      res.json({
        success: true,
        data: topHabits
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 5 (GET) - Vue d'ensemble globale
   * Stats globales de toute l'application
   */
  static async getOverview(req, res) {
    try {
      const overview = await StatsService.getOverview();

      res.json({
        success: true,
        data: overview
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 6 (GET) - Stats par catégorie
   * Agrégation supplémentaire : Grouper par catégorie
   */
  static async getStatsByCategory(req, res) {
    try {
      const stats = await StatsService.getStatsByCategory();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 7 (POST) - Import stats depuis JSON
   * Exigence prof : Lecture fichier JSON
   */
  static async importStats(req, res) {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'imports', 'initial-stats.json');

      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({
          success: false,
          error: 'Fichier initial-stats.json non trouvé dans data/imports/'
        });
      }

      // 📖 LECTURE FICHIER JSON
      const jsonData = fs.readFileSync(dataPath, 'utf-8');
      const statsData = JSON.parse(jsonData);

      // Optionnel : Traiter/valider les données
      const { globalStats, categories, topHabits } = statsData;

      // Vous pouvez sauvegarder ces données dans une collection "AppStats" 
      // ou simplement les retourner pour affichage/traitement

      res.json({
        success: true,
        message: `Statistiques importées avec succès`,
        imported: {
          globalStats: globalStats || {},
          categoriesCount: categories?.length || 0,
          topHabitsCount: topHabits?.length || 0
        },
        data: statsData
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default StatsController;