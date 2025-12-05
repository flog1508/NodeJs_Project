import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { Habit } from '../models/Habit.js';

const router = express.Router();

/**
 * ============================================
 * ROUTES STATS
 * ============================================
 */

// Route de test
router.get('/', (req, res) => {
  res.json({
    message: 'Stats endpoints',
    status: 'operational'
  });
});

/**
 * POST /api/stats/export
 * Génère des statistiques simples (exemple) et écrit le résultat dans
 * `data/exports/stats-<timestamp>.json`. Utile pour le rendu / backup.
 */
router.post('/export', async (req, res) => {
  try {
    // Exemple d'agrégation: nombre d'utilisateurs, nombre d'habitudes
    const [usersCount] = await User.aggregate([{ $count: 'count' }]);
    const [habitsCount] = await mongoose.connection.collection('habits').aggregate([{ $count: 'count' }]).toArray();

    const result = {
      generatedAt: new Date().toISOString(),
      users: usersCount ? usersCount.count : 0,
      habits: habitsCount ? habitsCount.count : 0
    };

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

    const fileName = `stats-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(exportsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');

    res.json({ success: true, file: `/data/exports/${fileName}`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
