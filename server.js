import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

// Import des routes
import userRoutes from './routes/userRoutes.js';
import habitRoutes from './routes/Habitroutes.js';
import statsRoutes from './routes/statsRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (si nécessaire)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: ' API Habit Tracker v1.0',
    status: 'operational',
    endpoints: {
      users: '/api/users',
      habits: '/api/habits',
      stats: '/api/stats'
    }
  });
});

// Routes principales
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/stats', statsRoutes);

// Middlewares d'erreurs (à la fin)
app.use(notFound);
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(` Serveur démarré sur le port ${PORT}`);
  console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL: http://localhost:${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error(' Erreur non gérée:', err);
  process.exit(1);
});


// Routes pour la gestion des habitudes
app.use('/api/habits', habitRoutes);

// Routes pour les statistiques et analyses avancées
app.use('/api/analytics', analyticsRoutes);