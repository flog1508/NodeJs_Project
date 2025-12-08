// routes/HabitLogRoutes.js
import express from 'express';
import Habitlog from '../models/Habitlog.js';
import { Habit } from '../models/Habit.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/logs
 * Enregistrer une exécution d'habitude
 * Body: { habitId, userId, date, completed, notes }
 */
router.post('/', async (req, res) => {
  try {
    const { habitId, userId, date, completed, notes } = req.body;

    if (!habitId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'habitId et userId sont requis'
      });
    }

    const habitLog = new Habitlog({
      habit: habitId,
      user: userId,
      date: date || new Date(),
      completed: completed || true,
      notes: notes || ''
    });

    const savedLog = await habitLog.save();
    
    res.status(201).json({
      success: true,
      message: 'Log d\'habitude créé',
      data: savedLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/logs/:userId
 * Récupérer tous les logs d'un utilisateur
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const logs = await Habitlog.find({ user: userId })
      .populate('habit')
      .populate('user')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/logs/habit/:habitId
 * Récupérer tous les logs d'une habitude
 */
router.get('/habit/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;

    const logs = await Habitlog.find({ habit: habitId })
      .populate('user')
      .populate('habit')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/logs/:logId
 * Mettre à jour un log
 */
router.put('/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { completed, notes, mood, duration } = req.body;

    const updatedLog = await Habitlog.findByIdAndUpdate(
      logId,
      { 
        completed, 
        notes, 
        mood, 
        duration,
        updatedAt: new Date() 
      },
      { new: true }
    ).populate('habit').populate('user');

    if (!updatedLog) {
      return res.status(404).json({
        success: false,
        error: 'Log non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Log mis à jour',
      data: updatedLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/logs/:logId
 * Supprimer un log
 */
router.delete('/:logId', async (req, res) => {
  try {
    const { logId } = req.params;

    const deletedLog = await Habitlog.findByIdAndDelete(logId);

    if (!deletedLog) {
      return res.status(404).json({
        success: false,
        error: 'Log non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Log supprimé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/logs/stats/user/:userId
 * Récupérer les statistiques des logs d'un utilisateur
 */
router.get('/stats/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const logs = await Habitlog.find({ user: userId });
    const completedCount = logs.filter(log => log.completed).length;
    const completionRate = logs.length > 0 ? ((completedCount / logs.length) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLogs: logs.length,
        completedCount,
        completionRate: completionRate + '%'
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