// app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des routes
import userRoutes from './routes/userRoutes.js';
import habitRoutes from './routes/Habitroutes.js';
import habitLogRoutes from './routes/HabitLogRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Import des middlewares
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 
// MIDDLEWARES GLOBAUX
// 

// CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (interface de test)
app.use(express.static(path.join(__dirname, 'public')));

// Logger simple
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 
// ROUTES API
// 
// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Habit Tracker - Backend Node.js & MongoDB',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      habits: '/api/habits',
      logs: '/api/logs',
      stats: '/api/stats'
    },
    documentation: '/api/docs'
  });
});

// Routes principales
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', habitLogRoutes);
app.use('/api/stats', statsRoutes);

// Route documentation
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      users: {
        'POST /api/users/register': 'Créer un utilisateur',
        'GET /api/users/search': 'Rechercher des utilisateurs (pagination)',
        'GET /api/users/:id/stats': 'Stats utilisateur (agrégation)',
        'PUT /api/users/:id': 'Modifier un utilisateur',
        'GET /api/users/import': 'Importer depuis JSON',
        'GET /api/users/stats/global': 'Stats globales',
        'GET /api/users/stats/export': 'Exporter stats en JSON'
      },
      habits: {
        'POST /api/habits': 'Créer une habitude',
        'GET /api/habits/filters': 'Rechercher habitudes (filtres)',
        'GET /api/habits/analytics/categories': 'Stats par catégorie (agrégation)',
        'PUT /api/habits/:id': 'Modifier une habitude',
        'DELETE /api/habits/:id': 'Supprimer une habitude',
        'GET /api/habits/:id': 'Obtenir une habitude',
        'GET /api/habits/analytics/popular': 'Habitudes populaires'
      },
      logs: {
        'POST /api/logs': 'Créer un log',
        'GET /api/logs/:userId': 'Logs utilisateur (pagination)',
        'GET /api/logs/analytics/:userId/daily': 'Stats quotidiennes (agrégation)',
        'PUT /api/logs/:logId': 'Modifier un log',
        'DELETE /api/logs/:logId': 'Supprimer un log',
        'GET /api/logs/habit/:habitId': 'Logs d\'une habitude'
      },
      stats: {
        'GET /api/stats/overview': 'Vue d\'ensemble globale',
        'GET /api/stats/users/:userId': 'Stats utilisateur complètes',
        'GET /api/stats/users/:userId/trends': 'Tendances (agrégation)',
        'GET /api/stats/habits/top': 'Top habitudes ($lookup)',
        'GET /api/stats/categories': 'Stats par catégorie',
        'POST /api/stats/export': 'Export JSON',
        'GET /api/stats/aggregation': 'Agrégation Users → Habits'
      }
    }
  });
});

// 
// GESTION DES ERREURS
// 

// Route non trouvée (404)
app.use(notFound);

// Gestionnaire d'erreurs global
app.use(errorHandler);

export default app;

