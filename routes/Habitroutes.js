import express from 'express';
import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import User from '../models/User.js';
import validator from 'validator';

const router = express.Router();

/**
 * 1) POST /api/habits
 * Créer une nouvelle habitude
 *
 * Body attendu :
 * {
 *   "user": "ID_USER",
 *   "title": "...",
 *   "description": "...",
 *   "category": "health",
 *   "frequency": "daily"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      user,        // 👈 maintenant le front envoie "user"
      title,
      description,
      category,
      frequency,
      targetDays,
      icon,
      color,
    } = req.body;

    // Validation des champs obligatoires
    if (!user || !title || !category) {
      return res.status(400).json({
        success: false,
        error: 'user, title et category sont requis',
      });
    }

    // Validation du titre
    if (!validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({
        success: false,
        error: 'Le titre doit contenir entre 3 et 100 caractères',
      });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await User.findById(user);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
    }

    // Création de l’habitude
    const habit = await Habit.create({
      user,   // 👈 correspond au champ du modèle
      title: validator.trim(title),
      description: description ? validator.trim(description) : '',
      category,
      frequency: frequency || 'daily',
      targetDays:
        targetDays && Array.isArray(targetDays) ? targetDays : [
          'lundi', 'mardi', 'mercredi',
          'jeudi', 'vendredi', 'samedi', 'dimanche'
        ],
      icon: icon || '✓',
      color: color || '#3B82F6',
    });

    // On renvoie l'habitude avec infos user
    const populatedHabit = await Habit.findById(habit._id)
      .populate('user', 'username email');

    res.status(201).json({
      success: true,
      message: 'Habitude créée avec succès',
      data: populatedHabit,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 2) GET /api/habits/filters
 * Recherche avancée
 */
router.get('/filters', async (req, res) => {
  try {
    const {
      user,
      category,
      frequency,
      isActive,
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (user) query.user = user;               // 👈 ici aussi
    if (category) query.category = category;
    if (frequency) query.frequency = frequency;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const habits = await Habit.find(query)
      .populate('user', 'username email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Habit.countDocuments(query);

    res.json({
      success: true,
      data: habits,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalHabits: total,
        limit: Number(limit),
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
/**
 * 3) GET /api/habits/analytics/categories
 * Statistiques simples : nombre d'habitudes par catégorie
 */
router.get('/analytics/categories', async (req, res) => {
  try {
    const stats = await Habit.aggregate([
      // On peut filtrer uniquement les habitudes actives
      { $match: { isActive: { $ne: false } } },

      // Grouper par catégorie
      {
        $group: {
          _id: '$category',
          totalHabits: { $sum: 1 },
          // Exemple de métrique simple : date min/max
          firstCreatedAt: { $min: '$createdAt' },
          lastCreatedAt: { $max: '$createdAt' }
        }
      },

      // Renommer les champs pour la réponse
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalHabits: 1,
          firstCreatedAt: 1,
          lastCreatedAt: 1
        }
      },

      // Trier par nombre d'habitudes décroissant
      { $sort: { totalHabits: -1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


export default router;
