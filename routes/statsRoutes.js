// routes/statsRoutes.js
// Routes statistiques centralisées

import express from 'express';
import StatsController from '../controllers/statsController.js';

const router = express.Router();

// 📝 ROUTES ÉTUDIANT 4 - STATISTIQUES

// Route 1 (POST) - Exporter les statistiques (avec écriture JSON)
router.post('/export', StatsController.exportStats);

// Route 2 (GET) - Dashboard utilisateur (lecture avancée)
router.get('/dashboard', StatsController.getDashboard);

// Route 3 (GET) - Agrégation Users → Habits ($lookup)
router.get('/aggregation', StatsController.getUsersWithHabits);

// Route 4 (GET) - Top habitudes
router.get('/top-habits', StatsController.getTopHabits);

// Route 5 (GET) - Vue d'ensemble globale
router.get('/overview', StatsController.getOverview);

// Route 6 (GET) - Stats par catégorie
router.get('/categories', StatsController.getStatsByCategory);

export default router;