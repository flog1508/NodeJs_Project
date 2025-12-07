// routes/analyticsRoutes.js
import express from 'express';
import {
  getTopCompletedHabits,
  getMoodTrendsByHabit,
  getMonthlyStats
} from '../controllers/analyticsController.js';

const router = express.Router();

// Routes pour les analytics
router.get('/top-habits', getTopCompletedHabits);
router.get('/mood-trends', getMoodTrendsByHabit);
router.get('/monthly-stats', getMonthlyStats);

export default router;
