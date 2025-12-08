// routes/HabitLogRoutes.js
import express from 'express';
import HabitLogController from '../controllers/HabitLogController.js';

const router = express.Router();

//  ROUTES ÉTUDIANT 3
router.post('/', HabitLogController.create);
router.get('/history', HabitLogController.getHistory);
router.get('/streaks', HabitLogController.getStreaks);
router.post('/import', HabitLogController.importFromJson);
router.get('/export', HabitLogController.exportToJson);


export default router;