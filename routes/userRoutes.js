import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {Habit}  from '../models/Habit.js';
import validator from 'validator';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * ============================================
 * ÉTUDIANT 1 - ROUTES USER MANAGEMENT
 * ============================================
 */

/**
 * ROUTE 1 - POST /api/users/register
 * Créer un nouvel utilisateur avec validation complète
 * Body: { username, email, password, preferences }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, preferences } = req.body;

    // Basic presence validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Tous les champs sont requis (username, email, password)' });
    }

    // Email format validation using validator.js
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Email invalide' });
    }

    // Password length validation
    if (!validator.isLength(password, { min: 6 })) {
      return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Check for existing user by email or username
    const existingUser = await User.findOne({ $or: [{ email: validator.normalizeEmail(email) }, { username: validator.trim(username) }] });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Cet email ou nom d\'utilisateur est déjà utilisé' });
    }

    // Hash the password before saving. bcrypt with 10 salt rounds is a reasonable default.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user document
    const user = await User.create({
      username: validator.trim(username),
      email: validator.normalizeEmail(email),
      password: hashedPassword,
      preferences: preferences || {}
    });

    // Log the creation event into a JSON file for traceability / backup
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const logPath = path.join(dataDir, 'user-logs.json');
    const logData = { action: 'USER_CREATED', userId: user._id, username: user.username, timestamp: new Date().toISOString() };

    let logs = [];
    if (fs.existsSync(logPath)) {
      try {
        const existingLogs = fs.readFileSync(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      } catch (e) {
        logs = [];
      }
    }
    logs.push(logData);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    // Return safe user data (do not expose password)
    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès', data: { id: user._id, username: user.username, email: user.email, preferences: user.preferences, createdAt: user.createdAt } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 2 - GET /api/users/search
 * Recherche avancée avec filtres multiples et pagination
 * Query params: search, isActive, page, limit, sortBy
 */
router.get('/search', async (req, res) => {
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
      .select('-password');

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ROUTE 3 - GET /api/users/:id/stats
 * AGRÉGATION COMPLEXE : Statistiques utilisateur avec $lookup et $project
 * Jointure avec les habitudes et calcul de métriques avancées
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await User.aggregate([
      // Étape 1 : Filtrer l'utilisateur spécifique
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },

      // Étape 2 : Jointure avec la collection Habit ($lookup)
      {
        $lookup: {
          from: 'habits',
          localField: '_id',
          foreignField: 'userId',
          as: 'userHabits'
        }
      },

      // Étape 3 : Jointure avec la collection Habitlog
      {
        $lookup: {
          from: 'habitlogs',
          localField: '_id',
          foreignField: 'userId',
          as: 'userLogs'
        }
      },

      // Étape 4 : Projection et calculs ($project)
      {
        $project: {
          username: 1,
          email: 1,
          createdAt: 1,
          
          // Statistiques sur les habitudes
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
          archivedHabits: {
            $size: {
              $filter: {
                input: '$userHabits',
                as: 'habit',
                cond: { $eq: ['$$habit.isActive', false] }
              }
            }
          },

          // Statistiques par catégorie
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
                      v: { $add: [{ $ifNull: [{ $getField: { input: '$$value', field: '$$this.category' } }, 0] }, 1] }
                    }]]
                  }
                ]
              }
            }
          },

          // Statistiques sur les logs
          totalCompletions: { $size: '$userLogs' },
          completionsThisMonth: {
            $size: {
              $filter: {
                input: '$userLogs',
                as: 'log',
                cond: {
                  $gte: [
                    '$$log.completedAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                }
              }
            }
          },

          // Taux de complétion (%)
          completionRate: {
            $cond: {
              if: { $gt: [{ $size: '$userHabits' }, 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$userLogs' }, { $multiply: [{ $size: '$userHabits' }, 30] }] },
                  100
                ]
              },
              else: 0
            }
          },

          // Jours actifs (membre depuis)
          memberSince: {
            $dateDiff: {
              startDate: '$createdAt',
              endDate: new Date(),
              unit: 'day'
            }
          }
        }
      },

      // Étape 5 : Arrondir le taux de complétion
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ROUTE 4 - PUT /api/users/:id
 * Mettre à jour un utilisateur (username, email, password, preferences)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, preferences, isActive } = req.body;

    const updates = {};

    if (username) updates.username = validator.trim(username);

    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, error: 'Email invalide' });
      }
      updates.email = validator.normalizeEmail(email);
    }

    if (typeof isActive === 'boolean') updates.isActive = isActive;

    if (preferences) updates.preferences = preferences;

    if (password) {
      if (!validator.isLength(password, { min: 6 })) {
        return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    if (updates.email || updates.username) {
      const conflict = await User.findOne({
        $or: [
          updates.email ? { email: updates.email } : null,
          updates.username ? { username: updates.username } : null
        ].filter(Boolean),
        _id: { $ne: id }
      });
      if (conflict) {
        return res.status(400).json({ success: false, error: 'Email ou username déjà utilisé par un autre utilisateur' });
      }
    }

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select('-password');

    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });

    res.json({ success: true, message: 'Utilisateur mis à jour', data: user });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 5 - GET /api/users/stats/global
 * Statistiques globales de tous les utilisateurs (agrégation)
 */
router.get('/stats/global', async (req, res) => {
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
          ],
          themePreferences: [
            {
              $group: {
                _id: '$preferences.theme',
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ROUTE 6 - GET /api/users/import
 * LECTURE DE FICHIER JSON : Importer des utilisateurs depuis initial-users.json
 */
router.get('/import', async (req, res) => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'imports', 'initial-users.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Fichier initial-users.json non trouvé dans data/imports/' 
      });
    }

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

    // Logger l'import
    const dataDir = path.join(process.cwd(), 'data');
    const logPath = path.join(dataDir, 'user-logs.json');
    const logData = { 
      action: 'USERS_IMPORTED', 
      count: imported.length, 
      timestamp: new Date().toISOString() 
    };

    let logs = [];
    if (fs.existsSync(logPath)) {
      try {
        const existingLogs = fs.readFileSync(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      } catch (e) {
        logs = [];
      }
    }
    logs.push(logData);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    res.json({ 
      success: true, 
      message: `${imported.length} utilisateurs importés avec succès`,
      imported: imported.map(u => ({ id: u._id, username: u.username, email: u.email }))
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ROUTE 7 - GET /api/users/stats/export
 * ÉCRITURE DE FICHIER JSON : Exporter les statistiques dans un fichier
 */
router.get('/stats/export', async (req, res) => {
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
          ],
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
});

export default router;