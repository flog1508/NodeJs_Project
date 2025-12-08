// routes/userRoutes.js
// Routes utilisateur (appelle le controller)

import express from 'express';
import UserController from '../controllers/userController.js';

const router = express.Router();

// 📝 ROUTES ÉTUDIANT 1

// Route 1 (POST) - Créer un utilisateur
router.post('/register', UserController.register);

// Route 2 (GET) - Recherche avancée
router.get('/search', UserController.search);

// Route 3 (GET) - Agrégation stats utilisateur
router.get('/:id/stats', UserController.getStats);

// Route 4 (PUT) - Modifier un utilisateur
router.put('/:id', UserController.update);

// Route 5 (GET) - Import depuis JSON
router.get('/import', UserController.importFromJson);

// Route 6 (GET) - Stats globales
router.get('/stats/global', UserController.getGlobalStats);

// Route 7 (GET) - Export stats en JSON
router.get('/stats/export', UserController.exportStats);

export default router;