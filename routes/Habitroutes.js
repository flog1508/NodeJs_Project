// routes/Habitroutes.js
// 🎯 ROUTES HABITUDES - Appelle le controller

import express from 'express';
import HabitController from '../controllers/habitController.js';

const router = express.Router();

// 📝 ROUTES ÉTUDIANT 2 - GESTION HABITUDES

// Route 1 (POST) - Créer une habitude
router.post('/', HabitController.create);

// Route 2 (GET) - Recherche avancée avec filtres
router.get('/search', HabitController.search);

// Route 3 (GET) - Agrégation : Stats par catégorie
router.get('/stats/categories', HabitController.getStatsByCategory);

// Route 4 (GET) - Agrégation : Habitudes les plus populaires
router.get('/stats/popular', HabitController.getMostPopular);

// Route 5 (GET) - Obtenir une habitude par ID
router.get('/:id', HabitController.getById);

// Route 6 (PUT) - Modifier une habitude
router.put('/:id', HabitController.update);

// Route 7 (DELETE) - Supprimer une habitude
router.delete('/:id', HabitController.delete);

export default router;