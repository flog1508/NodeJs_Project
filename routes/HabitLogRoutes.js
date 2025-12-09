// routes/HabitLogRoutes.js
import express from 'express';
import HabitLogController from '../controllers/habitLogController.js';

const router = express.Router();

// ➤ ROUTE 1 — Créer un HabitLog (protégé contre les doublons)
router.post('/', HabitLogController.create);

// ➤ ROUTE 2 — Récupérer l’historique des logs (avec filtres et pagination)
router.get('/history', HabitLogController.getHistory);

// ➤ ROUTE 3 — Obtenir les streaks (série de jours consécutifs)
router.get('/streaks', HabitLogController.getStreaks);

// ➤ ROUTE 4 — Importer des logs depuis un fichier JSON
router.post('/import', HabitLogController.importFromJson);

// ➤ ROUTE 5 — Exporter tous les logs en fichier JSON
router.get('/export', HabitLogController.exportToJson);

// ➤ ROUTE 6 — Supprimer un log par ID
router.delete('/:id', HabitLogController.delete);

export default router;
