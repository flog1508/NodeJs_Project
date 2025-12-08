// controllers/userController.js
// 🎯 ÉTUDIANT 1 - GESTION UTILISATEURS

import User from '../models/User.js';
import { Habit } from '../models/Habit.js';
import Habitlog from '../models/Habitlog.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

class UserController {
  /**
   * ROUTE 1 (POST) - Créer un utilisateur avec validation
   * Exigence prof : Route d'écriture
   */
  static async register(req, res) {
    try {
      const { username, email, password, preferences } = req.body;

      // Validation des champs obligatoires
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Tous les champs sont requis (username, email, password)'
        });
      }

      // Validation email avec ValidatorJS
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Email invalide'
        });
      }

      // Validation longueur password
      if (!validator.isLength(password, { min: 6 })) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({
        $or: [
          { email: validator.normalizeEmail(email) },
          { username: validator.trim(username) }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Cet email ou nom d\'utilisateur est déjà utilisé'
        });
      }

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Créer l'utilisateur
      const user = await User.create({
        username: validator.trim(username),
        email: validator.normalizeEmail(email),
        password: hashedPassword,
        preferences: preferences || {}
      });

      // 📝 ÉCRITURE FICHIER JSON (Exigence prof)
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const logPath = path.join(dataDir, 'user-logs.json');
      const logData = {
        action: 'USER_CREATED',
        userId: user._id,
        username: user.username,
        timestamp: new Date().toISOString()
      };

      let logs = [];
      if (fs.existsSync(logPath)) {
        const existingLogs = fs.readFileSync(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      }
      logs.push(logData);
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 2 (GET) - Recherche avancée avec filtres et pagination
   * Exigence prof : Route de lecture avancée
   */
  static async search(req, res) {
    try {
      const {
        search = '',
        isActive,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Construction de la query
      const query = {};

      // Recherche textuelle
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Filtre par statut actif
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      // Exécution de la requête
      const users = await User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .select('-password'); // Ne pas renvoyer les passwords

      // Compte total pour la pagination
      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalUsers: total,
          limit: Number(limit)
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 3 (GET) - Agrégation MongoDB : Stats utilisateur
   * Exigence prof : Route d'agrégation avec $lookup
   */
  static async getStats(req, res) {
    try {
      const { id } = req.params;

      // Agrégation MongoDB avec $lookup (jointure)
      const stats = await User.aggregate([
        // Étape 1 : Filtrer l'utilisateur
        {
          $match: { _id: new mongoose.Types.ObjectId(id) }
        },

        // Étape 2 : Jointure avec Habits ($lookup)
        {
          $lookup: {
            from: 'habits',
            localField: '_id',
            foreignField: 'user',
            as: 'userHabits'
          }
        },

        // Étape 3 : Jointure avec Habitlogs
        {
          $lookup: {
            from: 'habitlogs',
            localField: '_id',
            foreignField: 'user',
            as: 'userLogs'
          }
        },

        // Étape 4 : Projection et calculs ($project)
        {
          $project: {
            username: 1,
            email: 1,
            createdAt: 1,
            
            // Stats habitudes
            totalHabits: { $size: '$userHabits' },
            activeHabits: {
              $size: {
                $filter: {
                  input: '$userHabits',
                  as: 'habit',
                  cond: { $eq: ['$$habit.isActive', true] }
                }
              }
            },

            // Stats par catégorie
            habitsByCategory: {
              $reduce: {
                input: '$userHabits',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [[{
                        k: '$$this.category',
                        v: {
                          $add: [
                            { $ifNull: [{ $getField: { input: '$$value', field: '$$this.category' } }, 0] },
                            1
                          ]
                        }
                      }]]
                    }
                  ]
                }
              }
            },

            // Stats logs
            totalLogs: { $size: '$userLogs' },
            completedLogs: {
              $size: {
                $filter: {
                  input: '$userLogs',
                  as: 'log',
                  cond: { $eq: ['$$log.completed', true] }
                }
              }
            },

            // Taux de complétion
            completionRate: {
              $cond: {
                if: { $gt: [{ $size: '$userLogs' }, 0] },
                then: {
                  $multiply: [
                    { $divide: [
                      { $size: { $filter: { input: '$userLogs', as: 'log', cond: { $eq: ['$$log.completed', true] } } } },
                      { $size: '$userLogs' }
                    ]},
                    100
                  ]
                },
                else: 0
              }
            },

            // Jours d'activité
            memberSince: {
              $dateDiff: {
                startDate: '$createdAt',
                endDate: new Date(),
                unit: 'day'
              }
            }
          }
        },

        // Étape 5 : Arrondir le taux
        {
          $addFields: {
            completionRate: { $round: ['$completionRate', 2] }
          }
        }
      ]);

      if (stats.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: stats[0]
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 4 (PUT) - Modifier un utilisateur
   * Route d'écriture supplémentaire
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, preferences, isActive } = req.body;

      const updates = {};

      if (username) {
        updates.username = validator.trim(username);
      }

      if (email) {
        if (!validator.isEmail(email)) {
          return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        updates.email = validator.normalizeEmail(email);
      }

      if (typeof isActive === 'boolean') {
        updates.isActive = isActive;
      }

      if (preferences) {
        updates.preferences = preferences;
      }

      if (password) {
        if (!validator.isLength(password, { min: 6 })) {
          return res.status(400).json({
            success: false,
            error: 'Le mot de passe doit contenir au moins 6 caractères'
          });
        }
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }

      // Vérifier les conflits
      if (updates.email || updates.username) {
        const conflict = await User.findOne({
          $or: [
            updates.email ? { email: updates.email } : null,
            updates.username ? { username: updates.username } : null
          ].filter(Boolean),
          _id: { $ne: id }
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            error: 'Email ou username déjà utilisé par un autre utilisateur'
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Utilisateur mis à jour',
        data: user
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 5 (GET) - Lecture fichier JSON (import)
   * Exigence prof : Lecture de fichier JSON
   */
  static async importFromJson(req, res) {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'imports', 'initial-users.json');

      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({
          success: false,
          error: 'Fichier initial-users.json non trouvé dans data/imports/'
        });
      }

      // 📖 LECTURE FICHIER JSON
      const jsonData = fs.readFileSync(dataPath, 'utf-8');
      const usersData = JSON.parse(jsonData);

      const usersToImport = [];
      for (const userData of usersData) {
        const exists = await User.findOne({
          $or: [
            { email: validator.normalizeEmail(userData.email) },
            { username: validator.trim(userData.username) }
          ]
        });

        if (!exists) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(userData.password, salt);

          usersToImport.push({
            username: validator.trim(userData.username),
            email: validator.normalizeEmail(userData.email),
            password: hashedPassword,
            preferences: userData.preferences || {}
          });
        }
      }

      if (usersToImport.length === 0) {
        return res.json({
          success: true,
          message: 'Tous les utilisateurs existent déjà',
          imported: 0
        });
      }

      const imported = await User.insertMany(usersToImport);

      res.json({
        success: true,
        message: `${imported.length} utilisateurs importés avec succès`,
        imported: imported.map(u => ({
          id: u._id,
          username: u.username,
          email: u.email
        }))
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 6 (GET) - Stats globales avec agrégation
   * Agrégation supplémentaire pour stats admin
   */
  static async getGlobalStats(req, res) {
    try {
      const stats = await User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: 'count' }],
            usersByMonth: [
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.year': -1, '_id.month': -1 } },
              { $limit: 12 }
            ],
            activeStatus: [
              {
                $group: {
                  _id: '$isActive',
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]);

      res.json({
        success: true,
        data: stats[0]
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ROUTE 7 (GET) - Export stats en JSON
   * Exigence prof : Écriture de fichier JSON
   */
  static async exportStats(req, res) {
    try {
      const stats = await User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: 'count' }],
            recentUsers: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              { $project: { username: 1, email: 1, createdAt: 1 } }
            ]
          }
        }
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        statistics: stats[0],
        metadata: {
          totalUsersCount: stats[0].totalUsers[0]?.count || 0,
          exportedBy: 'API Habit Tracker',
          version: '1.0'
        }
      };

      // 📝 ÉCRITURE FICHIER JSON
      const exportsDir = path.join(process.cwd(), 'data', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `user-stats-${timestamp}.json`;
      const exportPath = path.join(exportsDir, filename);

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      res.json({
        success: true,
        message: 'Statistiques exportées avec succès',
        file: filename,
        path: exportPath,
        data: exportData
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default UserController;