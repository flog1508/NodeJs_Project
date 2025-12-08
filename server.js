// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// IMPORTS ROUTES (Respecte la casse de tes fichiers)
import habitRoutes from './routes/Habitroutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js'; 

import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIDDLEWARES
app.use(cors());
app.use(express.json()); // Indispensable pour POST
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// SERVIR LES FICHIERS DU FRONTEND (Dossier public)
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES API
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/stats', statsRoutes); // C'est ici que tes boutons se connectent

// --- MODIFICATION IMPORTANTE ICI ---
// Au lieu de renvoyer du JSON, on renvoie ton fichier HTML pour que tu puisses cliquer sur les boutons
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GESTION ERREURS
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});