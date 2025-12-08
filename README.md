# 🎯 Habit Tracker - Backend API

> **Projet Backend Node.js & MongoDB - Skills4Mind**  
> API REST complète pour le suivi d'habitudes quotidiennes

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.22-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 📋 Table des matières
- [Présentation](#-présentation)
- [Architecture](#-architecture)
- [Modèle de données](#-modèle-de-données)
- [Installation](#-installation)
- [Routes API](#-routes-api)
- [Exemples d'utilisation](#-exemples-dutilisation)
- [Agrégations MongoDB](#-agrégations-mongodb)
- [Gestion des fichiers JSON](#-gestion-des-fichiers-json)
- [Équipe & Contributions](#-équipe--contributions)
- [Technologies](#-technologies)

---

## 🎯 Présentation

**Habit Tracker** est une application backend permettant de :
- ✅ Gérer des utilisateurs (inscription, recherche, statistiques)
- ✅ Créer et suivre des habitudes quotidiennes
- ✅ Logger les complétions d'habitudes avec notes et humeur
- ✅ Analyser les statistiques de progression (streaks, taux de complétion)
- ✅ Importer/exporter des données JSON
- ✅ Effectuer des agrégations MongoDB avancées

**Contexte** : Projet académique démontrant la maîtrise de :
- Node.js + Express + MongoDB
- Opérations CRUD avancées
- Agrégations MongoDB complexes
- Manipulation de fichiers JSON
- Architecture MVC propre et maintenable

---

## 🏗️ Architecture

### Structure du projet
```
habit-tracker-backend/
├── 📂 config/
│   ├── db.js                    # Connexion MongoDB
│   └── constants.js             # Constantes globales
├── 📂 controllers/
│   ├── userController.js        # Logique utilisateurs
│   ├── habitController.js       # Logique habitudes
│   ├── habitLogController.js    # Logique logs
│   └── statsController.js       # Logique statistiques
├── 📂 data/
│   ├── imports/                 # Fichiers JSON pour seed
│   │   ├── initial-users.json
│   │   └── initial-habits.json
│   ├── exports/                 # Statistiques exportées
│   └── user-logs.json           # Logs des actions
├── 📂 middlewares/
│   ├── errorHandler.js          # Gestion centralisée des erreurs
│   ├── validation.js            # Validation avec ValidatorJS
│   └── notFound.js              # Routes 404
├── 📂 models/
│   ├── User.js                  # Schéma utilisateur
│   ├── Habit.js                 # Schéma habitude
│   ├── Habitlog.js              # Schéma log d'habitude
│   └── Statistics.js            # Schéma statistiques
├── 📂 routes/
│   ├── userRoutes.js            # Routes /api/users
│   ├── Habitroutes.js           # Routes /api/habits
│   ├── HabitLogRoutes.js        # Routes /api/habitlogs
│   └── statsRoutes.js           # Routes /api/stats
├── 📂 services/
│   └── statsService.js          # Service d'agrégations
├── 📂 utils/
│   └── fileManager.js           # Utilitaires fichiers JSON
├── 📂 public/
│   └── index.html               # Interface de test
├── server.js                    # Point d'entrée
├── .env                         # Variables d'environnement
├── package.json
└── README.md
```

### Stack technique
- **Runtime** : Node.js v18+
- **Framework** : Express.js 4.22+
- **Base de données** : MongoDB 7.0+ (avec Mongoose 8.x)
- **Validation** : Validator.js
- **Sécurité** : bcryptjs (hachage de mots de passe)
- **Variables d'env** : dotenv
- **Dev tools** : nodemon, morgan

---

## 📊 Modèle de données

### Collection `users`
```javascript
{
  _id: ObjectId,
  username: String (unique, 3-30 caractères),
  email: String (unique, format email validé),
  password: String (haché avec bcrypt),
  preferences: {
    theme: String ('light' | 'dark' | 'auto'),
    notifications: Boolean,
    language: String ('fr' | 'en' | 'es')
  },
  stats: {
    totalHabits: Number,
    completedToday: Number,
    currentStreak: Number,
    longestStreak: Number
  },
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Collection `habits`
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  title: String (requis, 3-100 caractères),
  description: String,
  category: String ('health' | 'work' | 'personal' | 'learning' | 'social' | 'other'),
  frequency: String ('daily' | 'weekly' | 'monthly' | 'custom'),
  targetDays: [String] (jours de la semaine),
  icon: String (default: '✓'),
  color: String (default: '#3B82F6'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Collection `habitlogs`
```javascript
{
  _id: ObjectId,
  habit: ObjectId (ref: 'Habit'),
  user: ObjectId (ref: 'User'),
  date: Date (default: now),
  dateString: String (format: YYYY-MM-DD, index unique),
  completed: Boolean (default: true),
  notes: String (max: 300 caractères),
  mood: String ('excellent' | 'bon' | 'moyen' | 'difficile'),
  duration: Number (en minutes, 0-1440),
  metadata: {
    location: String,
    weather: String,
    companions: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection `statistics`
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  habit: ObjectId (ref: 'Habit'),
  period: String ('daily' | 'weekly' | 'monthly' | 'yearly'),
  totalCompleted: Number,
  totalAttempts: Number,
  completionRate: Number (0-100),
  streak: Number,
  bestStreak: Number,
  averageMood: String,
  totalDuration: Number,
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Installation

### 1. Prérequis
- Node.js v18+ installé
- MongoDB (local ou MongoDB Atlas)
- Git

### 2. Cloner le projet
```bash
git clone https://github.com/votre-username/habit-tracker-backend.git
cd habit-tracker-backend
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configuration
Créer un fichier `.env` à la racine :
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/habit_tracker
NODE_ENV=development
```

### 5. Seed initial (optionnel)
```bash
npm run seed
```

### 6. Lancer le serveur
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

**Serveur disponible sur** : `http://localhost:5000`  
**Interface de test** : `http://localhost:5000`

---

## 🛣️ Routes API

### 👤 Routes Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Type |
|---------|----------|-------------|------|
| POST | `/register` | Créer un utilisateur | Écriture |
| GET | `/search` | Recherche avancée (filtres + pagination) | Lecture avancée |
| GET | `/:id/stats` | Statistiques utilisateur (agrégation $lookup) | Agrégation |
| PUT | `/:id` | Modifier un utilisateur | Écriture |
| GET | `/import` | Importer users depuis JSON | Lecture JSON |
| GET | `/stats/global` | Stats globales tous users (agrégation) | Agrégation |
| GET | `/stats/export` | Exporter stats en JSON | Écriture JSON |

### 🎯 Routes Habitudes (`/api/habits`)

| Méthode | Endpoint | Description | Type |
|---------|----------|-------------|------|
| POST | `/` | Créer une habitude | Écriture |
| GET | `/search` | Recherche avancée avec filtres | Lecture avancée |
| GET | `/stats/categories` | Stats par catégorie (agrégation $group) | Agrégation |
| GET | `/stats/popular` | Habitudes populaires (agrégation $lookup) | Agrégation |
| GET | `/:id` | Obtenir une habitude | Lecture |
| PUT | `/:id` | Modifier une habitude | Écriture |
| DELETE | `/:id` | Supprimer une habitude | Suppression |

### 📝 Routes Logs (`/api/habitlogs`)

| Méthode | Endpoint | Description | Type |
|---------|----------|-------------|------|
| POST | `/` | Créer un log | Écriture |
| GET | `/history` | Historique avec filtres (dates, user, habit) | Lecture avancée |
| GET | `/streaks` | Calcul des streaks (agrégation complexe) | Agrégation |
| POST | `/import` | Importer logs depuis JSON | Lecture JSON |
| GET | `/export` | Exporter logs en JSON | Écriture JSON |

### 📊 Routes Statistiques (`/api/stats`)

| Méthode | Endpoint | Description | Type |
|---------|----------|-------------|------|
| POST | `/export` | Exporter stats utilisateur | Écriture JSON |
| GET | `/dashboard` | Dashboard complet utilisateur | Lecture avancée |
| GET | `/aggregation` | Users + Habits (agrégation $lookup) | Agrégation |
| GET | `/top-habits` | Top habitudes globales | Agrégation |
| GET | `/overview` | Vue d'ensemble globale | Lecture |
| GET | `/categories` | Stats par catégorie | Agrégation |

---

## 💡 Exemples d'utilisation

### 1. Créer un utilisateur
```bash
POST /api/users/register
Content-Type: application/json

{
  "username": "alice_martin",
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "id": "674a5b2c3f1a2b3c4d5e6f7a",
    "username": "alice_martin",
    "email": "alice@example.com",
    "preferences": {
      "theme": "light",
      "notifications": true,
      "language": "fr"
    },
    "createdAt": "2024-12-07T10:30:00.000Z"
  }
}
```

### 2. Rechercher des utilisateurs
```bash
GET /api/users/search?search=alice&limit=10&page=1
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a5b2c3f1a2b3c4d5e6f7a",
      "username": "alice_martin",
      "email": "alice@example.com",
      "isActive": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalUsers": 1,
    "limit": 10
  }
}
```

### 3. Créer une habitude
```bash
POST /api/habits
Content-Type: application/json

{
  "user": "674a5b2c3f1a2b3c4d5e6f7a",
  "title": "Faire du sport",
  "description": "30 minutes de cardio",
  "category": "health",
  "frequency": "daily",
  "icon": "🏃",
  "color": "#10B981"
}
```

### 4. Logger une complétion
```bash
POST /api/habitlogs
Content-Type: application/json

{
  "habit": "674b6c3d4e2a3b4c5d6e7f8b",
  "user": "674a5b2c3f1a2b3c4d5e6f7a",
  "completed": true,
  "notes": "Excellente séance !",
  "mood": "excellent",
  "duration": 35
}
```

### 5. Statistiques utilisateur (avec agrégation)
```bash
GET /api/users/674a5b2c3f1a2b3c4d5e6f7a/stats
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "username": "alice_martin",
    "email": "alice@example.com",
    "totalHabits": 5,
    "activeHabits": 3,
    "habitsByCategory": {
      "health": 2,
      "work": 3
    },
    "totalLogs": 42,
    "completedLogs": 38,
    "completionRate": 90.48,
    "memberSince": 45
  }
}
```

---

## 🔍 Agrégations MongoDB

### Exemple 1 : Statistiques utilisateur avec $lookup
```javascript
// userController.js - getStats()
User.aggregate([
  { $match: { _id: new mongoose.Types.ObjectId(userId) } },
  
  // Jointure avec Habits
  {
    $lookup: {
      from: 'habits',
      localField: '_id',
      foreignField: 'user',
      as: 'userHabits'
    }
  },
  
  // Jointure avec Habitlogs
  {
    $lookup: {
      from: 'habitlogs',
      localField: '_id',
      foreignField: 'user',
      as: 'userLogs'
    }
  },
  
  // Calculs avancés
  {
    $project: {
      username: 1,
      totalHabits: { $size: '$userHabits' },
      completionRate: {
        $multiply: [
          { $divide: ['$completedLogs', '$totalLogs'] },
          100
        ]
      }
    }
  }
])
```

### Exemple 2 : Streaks par utilisateur
```javascript
// habitLogController.js - getStreaks()
Habitlog.aggregate([
  { $sort: { user: 1, date: -1 } },
  
  {
    $group: {
      _id: '$user',
      logs: { $push: { date: '$date', completed: '$completed' } },
      totalLogs: { $sum: 1 },
      completedLogs: { $sum: { $cond: ['$completed', 1, 0] } }
    }
  },
  
  // Lookup pour récupérer les infos user
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'userInfo'
    }
  },
  
  {
    $project: {
      username: '$userInfo.username',
      completionRate: {
        $round: [
          { $multiply: [{ $divide: ['$completedLogs', '$totalLogs'] }, 100] },
          2
        ]
      }
    }
  }
])
```

### Exemple 3 : Stats par catégorie
```javascript
// habitController.js - getStatsByCategory()
Habit.aggregate([
  { $match: { isActive: { $ne: false } } },
  
  {
    $group: {
      _id: '$category',
      totalHabits: { $sum: 1 },
      uniqueUsers: { $addToSet: '$user' },
      firstCreatedAt: { $min: '$createdAt' },
      lastCreatedAt: { $max: '$createdAt' }
    }
  },
  
  {
    $project: {
      category: '$_id',
      totalHabits: 1,
      uniqueUsers: { $size: '$uniqueUsers' },
      activityDays: {
        $dateDiff: {
          startDate: '$firstCreatedAt',
          endDate: '$lastCreatedAt',
          unit: 'day'
        }
      }
    }
  },
  
  { $sort: { totalHabits: -1 } }
])
```

---

## 📂 Gestion des fichiers JSON

### Lecture de fichiers JSON
**Fichiers lus** :
- `data/imports/initial-users.json` - Import utilisateurs
- `data/imports/initial-habits.json` - Import habitudes
- `data/imports/initial-logs.json` - Import logs

**Exemple de lecture** :
```javascript
// userController.js - importFromJson()
const dataPath = path.join(process.cwd(), 'data/imports/initial-users.json');
const jsonData = fs.readFileSync(dataPath, 'utf-8');
const usersData = JSON.parse(jsonData);
```

### Écriture de fichiers JSON
**Fichiers générés** :
- `data/user-logs.json` - Logs des actions utilisateurs
- `data/exports/user-stats-[timestamp].json` - Export stats users
- `data/exports/stats-user-[userId]-[timestamp].json` - Export stats détaillées
- `data/exports/habitlogs-export-[timestamp].json` - Export logs habitudes

**Exemple d'écriture** :
```javascript
// userController.js - exportStats()
const exportData = { exportDate: new Date().toISOString(), statistics: stats };
const filename = `user-stats-${timestamp}.json`;
const exportPath = path.join(process.cwd(), 'data/exports', filename);
fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
```

---

## 👥 Équipe & Contributions

### Répartition des tâches (6 étudiants)

**Étudiant 1** - Gestion Utilisateurs
- Modèle User
- 7 routes (register, search, getStats, update, import, globalStats, export)
- Agrégation avec $lookup (Habits + Habitlogs)
- Export JSON

**Étudiant 2** - Gestion Habitudes
- Modèle Habit
- 7 routes (create, search, statsCategories, popular, getById, update, delete)
- Agrégation $group + $lookup
- Stats par catégorie

**Étudiant 3** - Gestion Logs
- Modèle Habitlog
- 5 routes (create, history, streaks, import, export)
- Agrégation complexe pour streaks
- Import/Export JSON

**Étudiant 4** - Statistiques Centralisées
- Modèle Statistics + Service
- 6 routes (export, dashboard, aggregation, topHabits, overview, categories)
- Agrégations multi-collections
- Export JSON

**Étudiant 5** - Infrastructure
- Configuration MongoDB
- Middlewares (errorHandler, validation, notFound)
- Utilitaires (fileManager)
- Point d'entrée (server.js)

**Étudiant 6** - Documentation & Seeding
- Script de seeding
- Fichiers JSON initiaux
- README complet
- Interface de test HTML

---

## 🛠️ Technologies

### Backend
- **Node.js** 18+ - Runtime JavaScript
- **Express.js** 4.22+ - Framework web
- **Mongoose** 8.20+ - ODM MongoDB

### Base de données
- **MongoDB** 7.0+ - Base NoSQL

### Validation & Sécurité
- **Validator.js** 13+ - Validation des données
- **bcryptjs** 2.4+ - Hachage de mots de passe
- **dotenv** 16+ - Variables d'environnement

### Développement
- **Nodemon** 3+ - Auto-reload
- **Morgan** 1.10+ - Logs HTTP
- **CORS** 2.8+ - Cross-Origin Resource Sharing

---

## 📈 Améliorations futures

- [ ] **Authentification JWT** - Sécuriser les routes
- [ ] **Rate limiting** - Limiter les requêtes par IP
- [ ] **Tests unitaires** - Jest + Supertest
- [ ] **Documentation Swagger** - API interactive
- [ ] **Notifications push** - Rappels d'habitudes
- [ ] **Webhooks** - Intégrations tierces
- [ ] **Cache Redis** - Optimiser les performances
- [ ] **Déploiement** - Heroku / Render / Railway

---

## 📄 Licence

Projet académique - Skills4Mind - M.TAALBI RABAH  
ISC License

---

## 🤝 Support

Pour toute question :
- 📧 Email : [votre-email@example.com]
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/habit-tracker-backend/issues)
- 📖 Documentation : [Ce README]

---

**⭐ Si ce projet vous a aidé, n'hésitez pas à mettre une étoile sur GitHub !**