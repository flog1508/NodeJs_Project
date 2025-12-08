// controllers/habitController.js
// 🎯 ÉTUDIANT 2 - GESTION HABITUDES

import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import User from '../models/User.js';
import validator from 'validator';

class HabitController {
  /**
   * ROUTE 1 (POST) - Créer une habitude
   * Exigence prof : Route d'écriture
   */
  static async create(req, res) {
    try {
      const {
        user,
        title,
        description,
        category,
        frequency,
        targetDays,
        icon,
        color
      } = req.body;

      // Validation des champs obligatoires
      if (!user || !title || !category) {
        return res.status(400).json({
          success: false,
          error: 'user, title et category sont requis'
        });
      }

      // Validation du titre avec ValidatorJS
      if (!validator.isLength(title, { min: 3, max: 100 })) {
        return res.status(400).json({
          success: false,
          error: 'Le titre doit contenir entre 3 et 100 caractères'
        });
      }

      // Vérifier que l'utilisateur existe
      const existingUser = await User.findById(user);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      // Création de l'habitude
      const habit = await Habit.create({
        user,
        title: validator.trim(title),
        description: description ? validator.trim(description) : '',
        category,
        frequency: frequency || 'daily',
        targetDays: targetDays && Array.isArray(targetDays) ? targetDays : [
          'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
        ],
        icon: icon || '✓',
        color: color || '#3B82F6'
      });

      // Peupler avec les infos user
      const populatedHabit = await Habit.findById(habit._id)
        .populate('user', 'username email');

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
  }

  /**
   * ROUTE 2 (GET) - Recherche avancée avec filtres
   * Exigence prof : Route de lecture avancée
   */
  static async search(req, res) {
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
        order = 'desc'
      } = req.query;

      // Construction de la query
      const query = {};

      if (user) query.user = user;
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

      // Pagination
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
          limit: Number(limit)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * ROUTE 3 (GET) - Agrégation MongoDB : Stats par catégorie
   * Exigence prof : Route d'agrégation
   */
  static async getStatsByCategory(req, res) {
    try {
      // Agrégation MongoDB avec $group et $project
      const stats = await Habit.aggregate([
        // Étape 1 : Filtrer les habitudes actives
        {
          $match: { isActive: { $ne: false } }
        },

        // Étape 2 : Grouper par catégorie ($group)
        {
          $group: {
            _id: '$category',
            totalHabits: { $sum: 1 },
            firstCreatedAt: { $min: '$createdAt' },
            lastCreatedAt: { $max: '$createdAt' },
            // Collecter les utilisateurs uniques
            uniqueUsers: { $addToSet: '$user' }
          }
        },

        // Étape 3 : Projection ($project)
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalHabits: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            firstCreatedAt: 1,
            lastCreatedAt: 1,
            // Calculer la durée d'activité
            activityDays: {
              $dateDiff: {
                startDate: '$firstCreatedAt',
                endDate: '$lastCreatedAt',
                unit: 'day'
              }
            }
          }
        },

        // Étape 4 : Tri ($sort)
        {
          $sort: { totalHabits: -1 }
        }
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
  }

  /**
   * ROUTE 4 (PUT) - Modifier une habitude
   * Route d'écriture supplémentaire
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        frequency,
        targetDays,
        icon,
        color,
        isActive
      } = req.body;

      const updates = {};

      if (title) {
        if (!validator.isLength(title, { min: 3, max: 100 })) {
          return res.status(400).json({
            success: false,
            error: 'Le titre doit contenir entre 3 et 100 caractères'
          });
        }
        updates.title = validator.trim(title);
      }

      if (description !== undefined) {
        updates.description = validator.trim(description);
      }

      if (category) updates.category = category;
      if (frequency) updates.frequency = frequency;
      if (targetDays && Array.isArray(targetDays)) updates.targetDays = targetDays;
      if (icon) updates.icon = icon;
      if (color) updates.color = color;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const habit = await Habit.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('user', 'username email');

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
  }

  /**
   * ROUTE 5 (DELETE) - Supprimer une habitude
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const habit = await Habit.findByIdAndDelete(id);

      if (!habit) {
        return res.status(404).json({
          success: false,
          error: 'Habitude non trouvée'
        });
      }

      // Optionnel : Supprimer aussi les logs associés
      await Habitlog.deleteMany({ habit: id });

      res.json({
        success: true,
        message: 'Habitude supprimée avec succès'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * ROUTE 6 (GET) - Obtenir une habitude par ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const habit = await Habit.findById(id)
        .populate('user', 'username email');

      if (!habit) {
        return res.status(404).json({
          success: false,
          error: 'Habitude non trouvée'
        });
      }

      res.json({
        success: true,
        data: habit
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * ROUTE 7 (GET) - Agrégation : Habitudes les plus populaires
   * Agrégation supplémentaire avec $lookup
   */
  static async getMostPopular(req, res) {
    try {
      const { limit = 10 } = req.query;

      const popularHabits = await Habit.aggregate([
        // Jointure avec les logs
        {
          $lookup: {
            from: 'habitlogs',
            localField: '_id',
            foreignField: 'habit',
            as: 'logs'
          }
        },

        // Calculer le nombre de logs
        {
          $addFields: {
            logsCount: { $size: '$logs' },
            completedCount: {
              $size: {
                $filter: {
                  input: '$logs',
                  as: 'log',
                  cond: { $eq: ['$$log.completed', true] }
                }
              }
            }
          }
        },

        // Projection
        {
          $project: {
            title: 1,
            category: 1,
            user: 1,
            logsCount: 1,
            completedCount: 1,
            completionRate: {
              $cond: {
                if: { $gt: ['$logsCount', 0] },
                then: {
                  $round: [
                    { $multiply: [{ $divide: ['$completedCount', '$logsCount'] }, 100] },
                    2
                  ]
                },
                else: 0
              }
            }
          }
        },

        // Tri par nombre de logs
        {
          $sort: { logsCount: -1 }
        },

        // Limite
        {
          $limit: Number(limit)
        }
      ]);

      res.json({
        success: true,
        data: popularHabits
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default HabitController;