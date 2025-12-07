import express from 'express';
import mongoose from 'mongoose';
import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import User from '../models/User.js';
import validator from 'validator';
import { updateHabit } from '../controllers/habitController.js';

const router = express.Router();


// Route pour mettre à jour une habitude
router.put('/:habitId', updateHabit);


// Route temporaire pour lister toutes les habitudes
router.get('/list', async (req, res) => {
  try {
    const habits = await Habit.find({});
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des habitudes" });
  }
});




/**
 * ============================================
 * ÉTUDIANT 2 - ROUTES HABITS CRUD
 * ============================================
 */

/**
 * ROUTE 1 - POST /api/habits
 * Créer une nouvelle habitude avec validation complète
 * Body: { userId, title, description, category, frequency, targetDays, icon, color }
 */
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      description, 
      category, 
      frequency, 
      targetDays,
      icon,
      color 
    } = req.body;

    // Validation des champs obligatoires
    if (!userId || !title || !category) {
      return res.status(400).json({
        success: false,
        error: 'userId, title et category sont requis'
      });
    }

    // Validation du titre
    if (!validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({
        success: false,
        error: 'Le titre doit contenir entre 3 et 100 caractères'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Créer l'habitude
    const habit = await Habit.create({
      userId,
      title: validator.trim(title),
      description: description ? validator.trim(description) : '',
      category,
      frequency: frequency || 'quotidien',
      targetDays: targetDays || ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
      icon: icon || '✓',
      color: color || '#3B82F6'
    });

    // Populate pour retourner les infos user
    const populatedHabit = await Habit.findById(habit._id)
      .populate('userId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Habitude créée avec succès',
      data: populatedHabit
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ROUTE 2 - GET /api/habits/search
 * Recherche avancée avec filtres multiples et pagination
 * Query params: userId, category, frequency, isActive, search, page, limit, sortBy
 */
router.get('/search', async (req, res) => {
  try {
    const {
      userId,
      category,
      frequency,
      isActive,
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construction de la query
    const query = {};

    if (userId) query.userId = userId;
    if (category) query.category = category;
    if (frequency) query.frequency = frequency;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Recherche textuelle
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination et tri
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    // Exécution avec populate
    const habits = await Habit.find(query)
      .populate('userId', 'username email')
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
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ROUTE 3 - GET /api/habits/analytics/categories
 * AGRÉGATION AVANCÉE : Statistiques par catégorie avec $lookup et métriques
 * Résultat : habitudes par catégorie avec stats de complétion
 */
router.get('/analytics/categories', async (req, res) => {
  try {
    const stats = await Habit.aggregate([
      // Étape 1 : Ne garder que les habitudes actives
      {
        $match: { isActive: true }
      },

      // Étape 2 : Jointure avec Habitlog pour avoir les complétions
      {
        $lookup: {
          from: 'habitlogs',
          localField: '_id',
          foreignField: 'habitId',
          as: 'completions'
        }
      },

      // Étape 3 : Grouper par catégorie
      {
        $group: {
          _id: '$category',
          totalHabits: { $sum: 1 },
          avgCompletions: { $avg: { $size: '$completions' } },
          totalCompletions: { $sum: { $size: '$completions' } },
          
          // Streak moyen par catégorie
          avgCurrentStreak: { $avg: '$stats.currentStreak' },
          avgLongestStreak: { $avg: '$stats.longestStreak' },
          
          // Exemples d'habitudes
          habitExamples: {
            $push: {
              title: '$title',
              completions: { $size: '$completions' },
              currentStreak: '$stats.currentStreak'
            }
          }
        }
      },

      // Étape 4 : Trier par nombre d'habitudes (décroissant)
      {
        $sort: { totalHabits: -1 }
      },

      // Étape 5 : Projection pour formater les résultats
      {
        $project: {
          category: '$_id',
          _id: 0,
          totalHabits: 1,
          totalCompletions: 1,
          avgCompletions: { $round: ['$avgCompletions', 2] },
          avgCurrentStreak: { $round: ['$avgCurrentStreak', 2] },
          avgLongestStreak: { $round: ['$avgLongestStreak', 2] },
          
          // Limiter les exemples à 3
          habitExamples: { $slice: ['$habitExamples', 3] },
          
          // Calculer un score de popularité
          popularityScore: {
            $round: [
              {
                $multiply: [
                  '$totalHabits',
                  { $add: ['$avgCurrentStreak', 1] }
                ]
              },
              2
            ]
          }
        }
      },

      // Étape 6 : Ajouter un classement
      {
        $setWindowFields: {
          sortBy: { popularityScore: -1 },
          output: {
            rank: { $rank: {} }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats,
      summary: {
        totalCategories: stats.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * BONUS - GET /api/habits/top
 * Top 10 des habitudes les plus complétées (avec $lookup)
 */
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topHabits = await Habit.aggregate([
      // Jointure avec les logs
      {
        $lookup: {
          from: 'habitlogs',
          localField: '_id',
          foreignField: 'habitId',
          as: 'logs'
        }
      },

      // Jointure avec les users
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },

      // Dépaqueter le user (tableau -> objet)
      {
        $unwind: '$user'
      },

      // Projection
      {
        $project: {
          title: 1,
          category: 1,
          username: '$user.username',
          totalCompletions: { $size: '$logs' },
          currentStreak: '$stats.currentStreak',
          longestStreak: '$stats.longestStreak',
          lastCompleted: '$stats.lastCompleted',
          createdAt: 1
        }
      },

      // Tri par complétions
      {
        $sort: { totalCompletions: -1 }
      },

      // Limiter les résultats
      {
        $limit: Number(limit)
      }
    ]);

    res.json({
      success: true,
      data: topHabits
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * BONUS - GET /api/habits/:id
 * Détails d'une habitude avec ses stats
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findById(id)
      .populate('userId', 'username email preferences');

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habitude non trouvée'
      });
    }

    // Récupérer les logs récents
    const recentLogs = await Habitlog.find({ habitId: id })
      .sort({ completedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        habit,
        recentLogs,
        stats: habit.stats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * BONUS - PUT /api/habits/:id
 * Modifier une habitude
 */
/*router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ne pas permettre de modifier userId
    delete updates.userId;
    delete updates.stats;

    const habit = await Habit.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'username email');

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habitude non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Habitude mise à jour',
      data: habit
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/


/**
 * BONUS - DELETE /api/habits/:id (soft delete)
 * Archiver une habitude au lieu de la supprimer
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habitude non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Habitude archivée',
      data: habit
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;