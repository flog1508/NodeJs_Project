// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔗 Connexion MongoDB
import connectDB from './config/db.js';

// 🛣️ Routes
import habitRoutes from './routes/Habitroutes.js';   // Étudiant 2 – Habits
import userRoutes from './routes/userRoutes.js';     // Étudiant 1 – Users

// 🧱 Middlewares d’erreurs
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

// ⚙️ Gestion de __dirname avec ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔌 Connexion à la base MongoDB
connectDB();

// 🌍 Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 📄 Servir les fichiers statiques du dossier /public
// -> http://localhost:5000/ affichera public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// (optionnel) évite l’erreur /favicon.ico dans la console
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Route de santé pour tester rapidement l’API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Habit Tracker is running!'
  });
});

// 🧭 Montage des routes API
// Étudiant 2 – Habit Management
app.use('/api/habits', habitRoutes);

// Étudiant 1 – Users
app.use('/api/users', userRoutes);

// ❌ 404 + gestion des erreurs (toujours à la fin)
app.use(notFound);
app.use(errorHandler);

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${ENV}`);
  console.log(`URL: http://localhost:${PORT}`);
});
