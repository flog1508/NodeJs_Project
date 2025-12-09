// controllers/habitLogController.js
//  Felix - GESTION LOGS D'HABITUDES

import Habitlog from '../models/Habitlog.js';
import { Habit } from '../models/Habit.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

class HabitLogController {
  /**
   * ROUTE 1 (POST) - Créer un log
   */
  static async create(req, res) {
    try {
      const { habit, user, date, completed, notes } = req.body;

      if (!habit || !user) {
        return res.status(400).json({
          success: false,
          error: 'habit et user sont requis'
        });
      }

      // Vérifier que l'habite existe
      const existingHabit = await Habit.findById(habit);
      if (!existingHabit) {
        return res.status(404).json({
          success: false,
          error: 'Habitude non trouvée'
        });
      }

      // Générer dateString
      const dateObj = date ? new Date(date) : new Date();
      const dateString = dateObj.toISOString().split('T')[0];

      // Vérifier doublon (habitude + dateString)
      const duplicate = await Habitlog.findOne({ habit, dateString });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: 'Un log existe déjà pour cette habitude ce jour-là',
          existingLog: duplicate
        });
      }

      // Créer le log
      const log = await Habitlog.create({
        habit,
        user,
        date: dateObj,
        dateString,
        completed: completed !== undefined ? completed : true,
        notes: notes || ''
      });

      const populatedLog = await Habitlog.findById(log._id)
        .populate('habit', 'title category')
        .populate('user', 'username');

      res.status(201).json({
        success: true,
        message: 'Log créé avec succès',
        data: populatedLog
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 2 (GET) - Historique avec filtres et pagination
   */
  static async getHistory(req, res) {
    try {
      const {
        habit,
        user,
        completed,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'date',
        order = 'desc'
      } = req.query;

      const query = {};

      if (habit) query.habit = habit;
      if (user) query.user = user;
      if (completed !== undefined) query.completed = completed === 'true';

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      const logs = await Habitlog.find(query)
        .populate('habit', 'title category icon color')
        .populate('user', 'username email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit));

      const total = await Habitlog.countDocuments(query);

      res.json({
        success: true,
        data: logs,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalLogs: total,
          limit: Number(limit)
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 3 (GET) - Agrégation MongoDB : Streaks par utilisateur
   */
  static async getStreaks(req, res) {
    try {
      const streaks = await Habitlog.aggregate([
        { $sort: { user: 1, date: -1 } },
        {
          $group: {
            _id: '$user',
            logs: {
              $push: {
                date: '$date',
                completed: '$completed',
                habit: '$habit'
              }
            },
            totalLogs: { $sum: 1 },
            completedLogs: {
              $sum: { $cond: ['$completed', 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            username: '$userInfo.username',
            email: '$userInfo.email',
            totalLogs: 1,
            completedLogs: 1,
            completionRate: {
              $round: [
                { $multiply: [{ $divide: ['$completedLogs', '$totalLogs'] }, 100] },
                2
              ]
            },
            currentStreak: {
              $size: {
                $filter: {
                  input: { $slice: ['$logs', 10] },
                  as: 'log',
                  cond: { $eq: ['$$log.completed', true] }
                }
              }
            }
          }
        },
        { $sort: { completionRate: -1 } }
      ]);

      res.json({ success: true, data: streaks });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 4 (POST) - Import logs depuis JSON
   */
  static async importFromJson(req, res) {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'imports', 'initial-habitLogs.json');

      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({
          success: false,
          error: 'Fichier initial-habitLogs.json non trouvé'
        });
      }

      const jsonData = fs.readFileSync(dataPath, 'utf-8');
      const logsData = JSON.parse(jsonData);

      const logsWithDateString = logsData.map(log => ({
        ...log,
        dateString: new Date(log.date).toISOString().split('T')[0]
      }));

      const imported = await Habitlog.insertMany(logsWithDateString);

      res.json({
        success: true,
        message: `${imported.length} logs importés avec succès`,
        imported: imported.length
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 5 (GET) - Export logs en JSON
   */
  static async exportToJson(req, res) {
    try {
      const { userId, habitId, startDate, endDate } = req.query;

      const query = {};
      if (userId) query.user = userId;
      if (habitId) query.habit = habitId;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const logs = await Habitlog.find(query)
        .populate('habit', 'title category')
        .populate('user', 'username email')
        .lean();

      const exportData = {
        exportDate: new Date().toISOString(),
        totalLogs: logs.length,
        filters: { userId, habitId, startDate, endDate },
        logs
      };

      const exportsDir = path.join(process.cwd(), 'data', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `habitlogs-export-${timestamp}.json`;
      const exportPath = path.join(exportsDir, filename);

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      res.json({
        success: true,
        message: 'Logs exportés avec succès',
        file: filename,
        data: exportData
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 6 (DELETE) - Supprimer un log
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const log = await Habitlog.findByIdAndDelete(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Log non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Log supprimé avec succès'
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default HabitLogController;
