// controllers/statsController.js
// Jad - GESTION STATISTIQUES CENTRALISÉES

import StatsService from '../services/statsService.js';
import fs from 'fs';
import path from 'path';

class StatsController {
  /**
   * ROUTE 1 (POST) - Exporter les statistiques d'un utilisateur
   * Exigence prof : Route d'écriture + Écriture fichier JSON
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

      // ÉCRITURE FICHIER JSON 
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
   * ROUTE 3 (GET) - Agrégation MongoDB : Users → Habits
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
   * Agrégation supplémentaire
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
}

export default StatsController;