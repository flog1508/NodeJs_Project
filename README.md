#  Habit Tracker - Backend Node.js & MongoDB

> **API REST complète de suivi d'habitudes quotidiennes**  
> Projet Backend Node.js & MongoDB - Skills4Mind - M.TAALBI RABAH

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.22-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Table des matières

- [Description du projet](#-description-du-projet)
- [Architecture](#-architecture)
- [Modèle de données](#-modèle-de-données)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Routes API](#-routes-api)
- [Agrégations MongoDB](#-agrégations-mongodb)
- [Manipulation de fichiers JSON](#-manipulation-de-fichiers-json)
- [Répartition des tâches](#-répartition-des-tâches-entre-étudiants)
- [Technologies utilisées](#-technologies-utilisées)
- [Difficultés rencontrées](#-difficultés-rencontrées)
- [Améliorations possibles](#-améliorations-possibles)

---

## Description du projet

**Habit Tracker** est une API REST permettant de gérer et suivre des habitudes quotidiennes. L'application permet aux utilisateurs de créer des habitudes, de logger leurs progrès quotidiens, et d'analyser leurs statistiques de complétion via des agrégations MongoDB avancées.

### Fonctionnalités principales

✅ Gestion complète des utilisateurs (CRUD + validation)  
✅ Création et suivi d'habitudes personnalisées  
✅ Enregistrement quotidien des logs d'habitudes  
✅ Statistiques avancées avec agrégations MongoDB  
✅ Export/Import de données JSON  
✅ Filtres et pagination sur toutes les routes de lecture  
✅ Calcul de streaks et taux de complétion  

---

##  Architecture

Le projet suit une architecture **MVC** (Model-View-Controller) adaptée pour une API REST :

```
habit-tracker-backend/
│
├── config/
│   ├── constants.js       # Constantes globales
│   └── db.js             # Configuration MongoDB
│
├── controllers/          #  Logique métier (1 par étudiant)
│   ├── userController.js         # ÉTUDIANT 1
│   ├── habitController.js        # ÉTUDIANT 2
│   ├── habitLogController.js     # ÉTUDIANT 3
│   └── statsController.js        # ÉTUDIANT 4
│
├── models/               # Schémas Mongoose
│   ├── User.js
│   ├── Habit.js
│   ├── Habitlog.js
│   └── Statistics.js
│
├── routes/               # Définition des endpoints
│   ├── userRoutes.js
│   ├── Habitroutes.js
│   ├── HabitLogRoutes.js
│   └── statsRoutes.js
│
├── middlewares/          #  Middlewares personnalisés
│   ├── auth.js
│   ├── errorHandler.js
│   ├── notFound.js
│   └── validation.js
│
├── services/             #  Services métier
│   └── statsService.js
│
├── utils/                #  Utilitaires
│   └── exports.js        # Gestion export JSON
│
├── data/                 #  Fichiers JSON
│   ├── imports/          # Fichiers d'import
│   │   ├── initial-users.json
│   │   ├── initial-habits.json
│   │   └── initial-habitLogs.json
│   └── exports/          # Fichiers générés
│       ├── stats-*.json
│       └── habitlogs-*.json
│
├── public/               #  Interface de test (HTML)
│   ├── index.html
│   └── favicon.ico
│
├── .env                  # Variables d'environnement
├── .gitignore
├── app.js                # Configuration Express
├── server.js             # Point d'entrée
├── package.json
└── README.md
```

---

## 📊 Modèle de données

### **User** (Utilisateur)
```javascript
{
  username: String,         // Unique, 3-30 caractères
  email: String,            // Unique, validé par ValidatorJS
  password: String,         // Hashé avec bcrypt (min 6 caractères)
  preferences: {
    theme: String,          // 'light' | 'dark' | 'auto'
    notifications: Boolean,
    language: String        // 'fr' | 'en' | 'es'
  },
  stats: {
    totalHabits: Number,
    currentStreak: Number,
    longestStreak: Number
  },
  isActive: Boolean,
  createdAt: Date
}
```

### **Habit** (Habitude)
```javascript
{
  user: ObjectId,           // Référence User
  title: String,            // 3-100 caractères
  description: String,
  category: String,         // 'health' | 'work' | 'personal' | 'learning' | 'social' | 'other'
  frequency: String,        // 'daily' | 'weekly' | 'monthly' | 'custom'
  isArchived: Boolean,
  createdAt: Date
}
```

### **Habitlog** (Log quotidien)
```javascript
{
  habit: ObjectId,          // Référence Habit
  user: ObjectId,           // Référence User
  date: Date,
  dateString: String,       // 'YYYY-MM-DD' (index unique)
  completed: Boolean,
  notes: String,            // Max 300 caractères
  mood: String,             // 'excellent' | 'bon' | 'moyen' | 'difficile'
  duration: Number,         // Minutes (0-1440)
  metadata: {
    location: String,
    weather: String,
    companions: [String]
  }
}
```

### **Statistics** (Statistiques)
```javascript
{
  user: ObjectId,
  habit: ObjectId,
  period: String,           // 'daily' | 'weekly' | 'monthly' | 'yearly'
  totalCompleted: Number,
  totalAttempts: Number,
  completionRate: Number,   // 0-100%
  streak: Number,
  bestStreak: Number,
  startDate: Date,
  endDate: Date
}
```

---

## Installation

### Prérequis

- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0 (local ou Atlas)
- **npm** >= 9.0.0

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/habit-tracker-backend.git
cd habit-tracker-backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (voir section suivante)
cp .env.example .env

# 4. Modifier .env avec vos credentials MongoDB

# 5. (Optionnel) Importer les données de test
npm run seed

# 6. Démarrer le serveur
npm start        # Production
npm run dev      # Développement (nodemon)
```

Le serveur démarre sur **http://localhost:5000**

---

## 🔐 Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/habit-tracker
# OU pour MongoDB Atlas :
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/habit-tracker

# Serveur
PORT=5000
NODE_ENV=development

# JWT (si authentification)
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRE=7d
```

---

## 🛣️ Routes API

### Base URL
```
http://localhost:5000/api
```

---

### 👤 **UTILISATEURS** (`/api/users`)

| Méthode | Endpoint | Description | Étudiant |
|---------|----------|-------------|----------|
| `POST` | `/register` | Créer un utilisateur | 1 |
| `GET` | `/search` | Recherche avancée (pagination) | 1 |
| `GET` | `/:id/stats` | Stats utilisateur (agrégation) | 1 |
| `PUT` | `/:id` | Modifier un utilisateur | 1 |
| `GET` | `/import` | Import depuis JSON | 1 |
| `GET` | `/stats/global` | Stats globales | 1 |
| `GET` | `/stats/export` | Export stats JSON | 1 |

#### Exemple : Créer un utilisateur
```bash
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "motdepasse123",
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "fr"
  }
}
```

#### Exemple : Recherche avec filtres
```bash
GET /api/users/search?search=john&isActive=true&page=1&limit=10&sortBy=createdAt&order=desc
```

---

###  **HABITUDES** (`/api/habits`)

| Méthode | Endpoint | Description | Étudiant |
|---------|----------|-------------|----------|
| `POST` | `/` | Créer une habitude | 2 |
| `GET` | `/search` | Recherche avancée (filtres) | 2 |
| `GET` | `/stats/categories` | Stats par catégorie (agrégation) | 2 |
| `GET` | `/stats/popular` | Habitudes populaires (agrégation) | 2 |
| `GET` | `/:id` | Obtenir une habitude | 2 |
| `PUT` | `/:id` | Modifier une habitude | 2 |
| `DELETE` | `/:id` | Supprimer une habitude | 2 |

#### Exemple : Créer une habitude
```bash
POST /api/habits
Content-Type: application/json

{
  "user": "6932c49e7ae4d0f61566030b",
  "title": "Faire du sport",
  "description": "30 minutes de course à pied",
  "category": "health",
  "frequency": "daily"
}
```

#### Exemple : Stats par catégorie
```bash
GET /api/habits/stats/categories

# Retourne :
{
  "success": true,
  "data": [
    {
      "category": "health",
      "totalHabits": 12,
      "uniqueUsers": 5,
      "activityDays": 45
    },
    ...
  ]
}
```

---

###  **LOGS D'HABITUDES** (`/api/habitlogs`)

| Méthode | Endpoint | Description | Étudiant |
|---------|----------|-------------|----------|
| `POST` | `/` | Créer un log | 3 |
| `GET` | `/history` | Historique avec filtres (pagination) | 3 |
| `GET` | `/streaks` | Calcul des streaks (agrégation) | 3 |
| `POST` | `/import` | Import logs depuis JSON | 3 |
| `GET` | `/export` | Export logs en JSON | 3 |

#### Exemple : Créer un log
```bash
POST /api/habitlogs
Content-Type: application/json

{
  "habit": "6932d1234abcd0f61566030c",
  "user": "6932c49e7ae4d0f61566030b",
  "date": "2025-12-08",
  "completed": true,
  "notes": "Excellente séance !",
  "mood": "excellent",
  "duration": 35
}
```

#### Exemple : Historique avec filtres
```bash
GET /api/habitlogs/history?user=6932c49e7ae4d0f61566030b&completed=true&startDate=2025-12-01&endDate=2025-12-08&page=1&limit=20
```

---

###  **STATISTIQUES** (`/api/stats`)

| Méthode | Endpoint | Description | Étudiant |
|---------|----------|-------------|----------|
| `POST` | `/export` | Exporter stats utilisateur (JSON) | 4 |
| `GET` | `/dashboard` | Dashboard utilisateur | 4 |
| `GET` | `/aggregation` | Users → Habits (agrégation) | 4 |
| `GET` | `/top-habits` | Top habitudes | 4 |
| `GET` | `/overview` | Vue d'ensemble globale | 4 |
| `GET` | `/categories` | Stats par catégorie | 4 |

#### Exemple : Dashboard utilisateur
```bash
GET /api/stats/dashboard?userId=6932c49e7ae4d0f61566030b&period=monthly

# Retourne :
{
  "success": true,
  "data": {
    "user": { ... },
    "summary": {
      "totalHabits": 8,
      "completionRate": 78.5,
      "currentStreak": 12
    },
    "period": { ... },
    "trends": [ ... ]
  }
}
```

---

## Agrégations MongoDB

Chaque étudiant a implémenté **au moins une agrégation MongoDB** avec pipeline :

### **Étudiant 1** - Stats utilisateur avec $lookup
```javascript
// GET /api/users/:id/stats
User.aggregate([
  { $match: { _id: userId } },
  { $lookup: { from: 'habits', localField: '_id', foreignField: 'user', as: 'userHabits' } },
  { $lookup: { from: 'habitlogs', localField: '_id', foreignField: 'user', as: 'userLogs' } },
  { $project: { totalHabits: { $size: '$userHabits' }, completionRate: ... } }
])
```

### **Étudiant 2** - Stats par catégorie
```javascript
// GET /api/habits/stats/categories
Habit.aggregate([
  { $match: { isActive: { $ne: false } } },
  { $group: { _id: '$category', totalHabits: { $sum: 1 }, uniqueUsers: { $addToSet: '$user' } } },
  { $project: { category: '$_id', uniqueUsers: { $size: '$uniqueUsers' } } },
  { $sort: { totalHabits: -1 } }
])
```

### **Étudiant 3** - Calcul des streaks
```javascript
// GET /api/habitlogs/streaks
Habitlog.aggregate([
  { $sort: { user: 1, date: -1 } },
  { $group: { _id: '$user', logs: { $push: { date: '$date', completed: '$completed' } } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
  { $project: { completionRate: ..., currentStreak: ... } }
])
```

### **Étudiant 4** - Agrégation Users → Habits
```javascript
// GET /api/stats/aggregation
User.aggregate([
  { $lookup: { from: 'habits', localField: '_id', foreignField: 'user', as: 'habits' } },
  { $lookup: { from: 'habitlogs', localField: '_id', foreignField: 'user', as: 'logs' } },
  { $project: { username: 1, totalHabits: { $size: '$habits' }, completionRate: ... } }
])
```

---

##  Manipulation de fichiers JSON

### **Lecture de fichiers JSON**

#### Étudiant 1 - Import utilisateurs
```javascript
// GET /api/users/import
const jsonData = fs.readFileSync('data/imports/initial-users.json', 'utf-8');
const users = JSON.parse(jsonData);
await User.insertMany(users);
```

#### Étudiant 3 - Import logs
```javascript
// POST /api/habitlogs/import
const jsonData = fs.readFileSync('data/imports/initial-habitLogs.json', 'utf-8');
const logs = JSON.parse(jsonData);
await Habitlog.insertMany(logs);
```

### **Écriture de fichiers JSON**

#### Étudiant 1 - Export stats utilisateurs
```javascript
// GET /api/users/stats/export
const stats = await User.aggregate([...]);
const exportPath = path.join('data', 'exports', `user-stats-${timestamp}.json`);
fs.writeFileSync(exportPath, JSON.stringify(stats, null, 2));
```

#### Étudiant 3 - Export logs
```javascript
// GET /api/habitlogs/export
const logs = await Habitlog.find(query).populate('habit user').lean();
const exportPath = path.join('data', 'exports', `habitlogs-${timestamp}.json`);
fs.writeFileSync(exportPath, JSON.stringify({ logs }, null, 2));
```

#### Étudiant 4 - Export statistiques
```javascript
// POST /api/stats/export
const statsData = await StatsService.getUserStats(userId);
const exportPath = path.join('data', 'exports', `stats-user-${userId}.json`);
fs.writeFileSync(exportPath, JSON.stringify(statsData, null, 2));
```

---

##  Répartition des tâches entre étudiants

| Étudiant | Module | Routes | Agrégation | Fichiers JSON |
|----------|--------|--------|-----------|---------------|
| **1** | Users | 7 routes | Stats user ($lookup) | Import + Export |
| **2** | Habits | 7 routes | Stats catégories ($group) | - |
| **3** | Logs | 5 routes | Streaks ($group + $lookup) | Import + Export |
| **4** | Stats | 6 routes | Users → Habits ($lookup) | Export |
| **5** | Analytics | 4 routes | Trends ($facet) | - |
| **6** | Config/Setup | DB + Seed | - | Fichiers initiaux |

### **Étudiant 1** - Gestion des utilisateurs
✅ Route d'écriture : `POST /api/users/register`  
✅ Route de lecture avancée : `GET /api/users/search` (pagination + filtres)  
✅ Route d'agrégation : `GET /api/users/:id/stats` (pipeline avec $lookup)  
📖 Lecture JSON : `GET /api/users/import`  
📝 Écriture JSON : `GET /api/users/stats/export`

### **Étudiant 2** - Gestion des habitudes
✅ Route d'écriture : `POST /api/habits`  
✅ Route de lecture avancée : `GET /api/habits/search` (filtres + pagination)  
✅ Route d'agrégation : `GET /api/habits/stats/categories` (pipeline avec $group)

### **Étudiant 3** - Gestion des logs
✅ Route d'écriture : `POST /api/habitlogs`  
✅ Route de lecture avancée : `GET /api/habitlogs/history` (filtres + pagination)  
✅ Route d'agrégation : `GET /api/habitlogs/streaks` (pipeline avec $group + $lookup)  
📖 Lecture JSON : `POST /api/habitlogs/import`  
📝 Écriture JSON : `GET /api/habitlogs/export`

### **Étudiant 4** - Statistiques centralisées
✅ Route d'écriture : `POST /api/stats/export`  
✅ Route de lecture avancée : `GET /api/stats/dashboard`  
✅ Route d'agrégation : `GET /api/stats/aggregation` (pipeline avec $lookup)  
📝 Écriture JSON : `POST /api/stats/export`

### **Étudiant 5** - Analytics avancées
✅ Route d'agrégation : `GET /api/analytics/users/:userId` (agrégation complexe)  
✅ Route de lecture : `GET /api/analytics/trends/:userId` (filtres avancés)  
✅ Route d'analyse : `GET /api/analytics/habits/:habitId`

### **Étudiant 6** - Configuration & Setup
✅ Configuration MongoDB (`config/db.js`)  
✅ Seed initial (`data/seed.js`)  
✅ Middlewares (`errorHandler.js`, `notFound.js`)  
✅ Services (`statsService.js`)

---

## Technologies utilisées

| Technologie | Version | Usage |
|------------|---------|-------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 4.22 | Framework web |
| **MongoDB** | 6.0+ | Base de données NoSQL |
| **Mongoose** | 8.20 | ODM MongoDB |
| **bcryptjs** | 2.4 | Hashage des mots de passe |
| **ValidatorJS** | 13.11 | Validation des données |
| **dotenv** | 16.6 | Variables d'environnement |
| **cors** | 2.8 | Gestion CORS |
| **nodemon** | 3.1 | Auto-reload en dev |

---

##  Difficultés rencontrées

### 1. **Gestion des imports ES Modules**
- **Problème** : Erreurs avec `import/export` au lieu de `require()`
- **Solution** : Ajout de `"type": "module"` dans `package.json`

### 2. **Agrégations MongoDB complexes**
- **Problème** : Pipeline $lookup avec plusieurs jointures
- **Solution** : Décomposition en étapes simples avec $project

### 3. **Validation des données**
- **Problème** : ValidatorJS non utilisé initialement
- **Solution** : Ajout de `validator.isEmail()`, `validator.isLength()`, etc.

### 4. **Gestion des dates pour les logs**
- **Problème** : Doublons de logs pour le même jour
- **Solution** : Ajout de `dateString` (YYYY-MM-DD) avec index unique

### 5. **Export/Import JSON**
- **Problème** : Chemins de fichiers incorrects en ES Modules
- **Solution** : Utilisation de `path.join(process.cwd(), 'data', ...)`

### 6. **Middleware d'erreurs**
- **Problème** : Erreurs non catchées
- **Solution** : Middleware `errorHandler.js` global

---

## 🎨 Améliorations possibles

### Court terme
- ✅ Authentification JWT complète
- ✅ Refresh tokens
- ✅ Rate limiting (express-rate-limit)
- ✅ Upload d'images pour les habitudes
- ✅ Notifications push
- ✅ Tests unitaires (Jest)

### Moyen terme
- ✅ GraphQL API
- ✅ WebSockets pour notifications temps réel
- ✅ Cache avec Redis
- ✅ Docker & Docker Compose
- ✅ CI/CD (GitHub Actions)

### Long terme
- ✅ Frontend React/Vue.js
- ✅ Application mobile (React Native)
- ✅ Gamification (badges, récompenses)
- ✅ Partage social entre utilisateurs
- ✅ Analyse IA des habitudes

---

## 📝 Licence

Ce projet est sous licence **ISC**.

---

## 👨‍💻 Auteurs

**Skills4Mind - M.TAALBI RABAH**

**Équipe Projet** :
- Étudiant 1 : [Florient-Gael Kalumuna] - Gestion utilisateurs
- Étudiant 2 : [Ines Kheffache] - Gestion habitudes
- Étudiant 3 : [Felix Touratier] - Gestion logs
- Étudiant 4 : [Jad Izargui] - Statistiques
- Étudiant 5 : [Antoine Gobron] - Analytics
- Étudiant 6 : [Aya Hadj Sadok] - Configuration

---

## 📞 Contact

Pour toute question ou suggestion :
- 📧 Email : [florientg1508@gmail.com]
- 🔗 GitHub : [https://github.com/flog1508/NodeJs_Project/settings/access?guidance_task=]

---

