// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js'; // Assure-toi que ce fichier existe

// --- IMPORTS DES ROUTES ---
import habitRoutes from './routes/Habitroutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js'; // <--- IMPORTANT

// --- MIDDLEWARES ---
import notFound from './middlewares/notFound.js';       // Vérifie si ces fichiers existent
import errorHandler from './middlewares/errorHandler.js'; // ou supprime ces lignes si tu ne les as pas

dotenv.config();
connectDB(); // Connexion à MongoDB

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json()); // Indispensable pour lire le JSON envoyé par le front
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// --- MONTAGE DES ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/stats', statsRoutes); // <--- C'est ici que la magie opère

// Route de base
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion erreurs
if (notFound) app.use(notFound);
if (errorHandler) app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});