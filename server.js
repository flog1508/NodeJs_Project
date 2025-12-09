// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des routes
import userRoutes from './routes/userRoutes.js';
import habitRoutes from './routes/Habitroutes.js';
import statsRoutes from './routes/statsRoutes.js';
import habitLogRoutes from './routes/HabitLogRoutes.js';

// Import des middlewares
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Pour ES Modules (nécessaire pour __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SERVIR LES FICHIERS STATIQUES (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connecté avec succès');
  } catch (error) {
    console.error(' Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

// Routes API
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/habitlogs', habitLogRoutes);

// Route de test API
app.get('/api', (req, res) => {
  res.json({ message: 'API Habit Tracker fonctionne !' });
});

// 🔹 ROUTE POUR SERVIR L'INTERFACE (optionnel, car express.static le fait déjà)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middlewares d'erreur (à la fin)
app.use(notFound);
app.use(errorHandler);

// Démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📄 Interface de test : http://localhost:${PORT}`);
    console.log(`🔌 API disponible sur : http://localhost:${PORT}/api`);
  });
});