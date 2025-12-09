# Habit Tracker - Backend Node.js & MongoDB

> API REST complète de suivi d'habitudes quotidiennes  
> Projet Backend Node.js & MongoDB - Skills4Mind - M.TAALBI RABAH

## Description du projet

Habit Tracker est une API REST permettant de gérer et suivre des habitudes quotidiennes. L'application permet aux utilisateurs de créer des habitudes, de logger leurs progrès quotidiens, et d'analyser leurs statistiques de complétion via des agrégations MongoDB avancées.

### Fonctionnalités principales

- Gestion complète des utilisateurs (CRUD + validation)
- Création et suivi d'habitudes personnalisées
- Enregistrement quotidien des logs d'habitudes
- Statistiques avancées avec agrégations MongoDB
- Export/Import de données JSON
- Filtres et pagination sur toutes les routes de lecture
- Calcul de streaks et taux de complétion
- Suppression en cascade des données

## Architecture

Le projet suit une architecture MVC (Model-View-Controller) adaptée pour une API REST.

### Structure des dossiers

```
habit-tracker-backend/
├── config/              # Configuration MongoDB
├── controllers/         # Logique métier
│   ├── userController.js       (8 routes - Flo: 5, Aya: 3)
│   ├── habitController.js      (7 routes - Ines)
│   ├── habitLogController.js   (6 routes - Felix)
│   └── statsController.js      (7 routes - Jad: 4, Antoine: 3)
├── models/              # Schémas Mongoose
├── routes/              # Définition des endpoints
├── middlewares/         # Gestion des erreurs
├── services/            # Logique réutilisable
├── data/                # Fichiers JSON (imports/exports)
├── public/              # Interface de test HTML
├── .env                 # Variables d'environnement
├── server.js            # Point d'entrée
└── package.json
```

## Modèle de données

### User (Utilisateur)

- username: String (unique, 3-30 caractères)
- email: String (unique, validé)
- password: String (hashé avec bcrypt, min 6 caractères)
- preferences: Object (theme, notifications, language)
- isActive: Boolean
- createdAt: Date

### Habit (Habitude)

- user: ObjectId (référence User)
- title: String (3-100 caractères)
- description: String
- category: String (health, work, personal, learning, social, other)
- frequency: String (daily, weekly, monthly, custom)
- isArchived: Boolean
- createdAt: Date

### Habitlog (Log quotidien)

- habit: ObjectId (référence Habit)
- user: ObjectId (référence User)
- date: Date
- dateString: String (YYYY-MM-DD, index unique)
- completed: Boolean
- notes: String (max 300 caractères)
- mood: String (excellent, bon, moyen, difficile)
- duration: Number (minutes, 0-1440)

## Installation

### Prérequis

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### Étapes

```bash
# Cloner le projet
git clone https://github.com/flog1508/NodeJs_Project.git
cd habit-tracker-backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos credentials MongoDB

# Importer les données de test (optionnel)
npm run seed

# Démarrer le serveur
npm start        # Production
npm run dev      # Développement (nodemon)
```

Le serveur démarre sur http://localhost:5000

## Variables d'environnement

```env
MONGO_URI=mongodb://localhost:27017/habit-tracker
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d
```

## Routes API

Base URL: http://localhost:5000/api

### Utilisateurs (/api/users) - 8 routes

| Méthode | Endpoint | Description | Responsable |
|---------|----------|-------------|-------------|
| POST | /register | Créer un utilisateur | Flo |
| GET | /search | Recherche avancée (pagination) | Flo |
| GET | /:id/stats | Stats utilisateur (agrégation) | Flo |
| PUT | /:id | Modifier un utilisateur | Flo |
| DELETE | /:id | Supprimer un utilisateur | Flo |
| GET | /import | Import depuis JSON | Aya |
| GET | /stats/global | Stats globales (agrégation) | Aya |
| GET | /stats/export | Export stats JSON | Aya |

### Habitudes (/api/habits) - 7 routes

| Méthode | Endpoint | Description | Responsable |
|---------|----------|-------------|-------------|
| POST | / | Créer une habitude | Ines |
| GET | /search | Recherche avancée | Ines |
| GET | /stats/categories | Stats par catégorie (agrégation) | Ines |
| GET | /stats/popular | Habitudes populaires (agrégation) | Ines |
| GET | /:id | Obtenir une habitude | Ines |
| PUT | /:id | Modifier une habitude | Ines |
| DELETE | /:id | Supprimer une habitude | Ines |

### Logs d'habitudes (/api/habitlogs) - 6 routes

| Méthode | Endpoint | Description | Responsable |
|---------|----------|-------------|-------------|
| POST | / | Créer un log | Felix |
| GET | /history | Historique avec filtres | Felix |
| GET | /streaks | Calcul des streaks (agrégation) | Felix |
| POST | /import | Import logs depuis JSON | Felix |
| GET | /export | Export logs en JSON | Felix |
| DELETE | /:id | Supprimer un log | Felix |

### Statistiques (/api/stats) - 7 routes

| Méthode | Endpoint | Description | Responsable |
|---------|----------|-------------|-------------|
| POST | /export | Exporter stats utilisateur | Jad |
| GET | /dashboard | Dashboard utilisateur | Jad |
| GET | /aggregation | Users avec Habits (agrégation) | Jad |
| GET | /top-habits | Top habitudes | Jad |
| GET | /overview | Vue d'ensemble globale | Antoine |
| GET | /categories | Stats par catégorie | Antoine |
| POST | /import | Import stats depuis JSON | Antoine |

**Total: 28 routes**

## Exemples d'utilisation

### Créer un utilisateur

```bash
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "motdepasse123",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Rechercher des utilisateurs

```bash
GET /api/users/search?search=john&page=1&limit=10&sortBy=createdAt&order=desc
```

### Créer une habitude

```bash
POST /api/habits
Content-Type: application/json

{
  "user": "6932c49e7ae4d0f61566030b",
  "title": "Faire du sport",
  "description": "30 minutes de course",
  "category": "health",
  "frequency": "daily"
}
```

### Créer un log

```bash
POST /api/habitlogs
Content-Type: application/json

{
  "habit": "6932d1234abcd0f61566030c",
  "user": "6932c49e7ae4d0f61566030b",
  "date": "2025-12-08",
  "completed": true,
  "notes": "Excellente séance",
  "mood": "excellent"
}
```

## Agrégations MongoDB

Chaque étudiant a implémenté au moins une agrégation MongoDB avec pipeline.

### Stats utilisateur avec $lookup (Flo)

```javascript
User.aggregate([
  { $match: { _id: userId } },
  { $lookup: { from: 'habits', localField: '_id', foreignField: 'user', as: 'userHabits' } },
  { $lookup: { from: 'habitlogs', localField: '_id', foreignField: 'user', as: 'userLogs' } },
  { $project: { totalHabits: { $size: '$userHabits' }, completionRate: ... } }
])
```

### Stats globales avec $facet (Aya)

```javascript
User.aggregate([
  {
    $facet: {
      totalUsers: [{ $count: 'count' }],
      usersByMonth: [
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]
    }
  }
])
```

### Stats par catégorie (Ines)

```javascript
Habit.aggregate([
  { $match: { isActive: { $ne: false } } },
  { $group: { _id: '$category', totalHabits: { $sum: 1 }, uniqueUsers: { $addToSet: '$user' } } },
  { $sort: { totalHabits: -1 } }
])
```

### Calcul des streaks (Felix)

```javascript
Habitlog.aggregate([
  { $sort: { user: 1, date: -1 } },
  { $group: { _id: '$user', logs: { $push: { date: '$date', completed: '$completed' } } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } }
])
```

### Agrégation Users avec Habits (Jad)

```javascript
User.aggregate([
  { $lookup: { from: 'habits', localField: '_id', foreignField: 'user', as: 'habits' } },
  { $lookup: { from: 'habitlogs', localField: '_id', foreignField: 'user', as: 'logs' } },
  { $project: { username: 1, totalHabits: { $size: '$habits' }, completionRate: ... } }
])
```

## Manipulation de fichiers JSON

### Lecture de fichiers (Aya, Felix, Antoine)

```javascript
const jsonData = fs.readFileSync('data/imports/initial-users.json', 'utf-8');
const users = JSON.parse(jsonData);
await User.insertMany(users);
```

### Écriture de fichiers (Flo, Aya, Felix, Jad)

```javascript
const stats = await User.aggregate([...]);
const exportPath = path.join('data', 'exports', `user-stats-${timestamp}.json`);
fs.writeFileSync(exportPath, JSON.stringify(stats, null, 2));
```

## Répartition des tâches par étudiant

### Florient-Gael Kalumuna (5 routes principales)

**Module:** Gestion utilisateurs (CRUD de base)

**Routes obligatoires du prof:**
1. POST /api/users/register - Route d'écriture (création + validation + hashage)
2. GET /api/users/search - Route de lecture avancée (pagination + filtres)
3. GET /api/users/:id/stats - Route d'agrégation ($lookup avec Habits + Logs)

**Routes supplémentaires:**
4. PUT /api/users/:id - Modification utilisateur
5. DELETE /api/users/:id - Suppression utilisateur avec cascade

**Fichiers JSON:**
- Écriture: user-logs.json (logging des actions)

**Technologies maîtrisées:**
- Validation avec ValidatorJS
- Hashage bcrypt
- Agrégation $lookup
- Suppression en cascade

### Aya Hadj Sadok (3 routes)

**Module:** Import/Export et statistiques globales utilisateurs

**Routes:**
1. GET /api/users/import - Import utilisateurs depuis JSON
2. GET /api/users/stats/global - Agrégation statistiques globales ($facet)
3. GET /api/users/stats/export - Export statistiques en JSON

**Fichiers JSON:**
- Lecture: initial-users.json
- Écriture: user-stats-*.json

**Technologies maîtrisées:**
- Lecture/écriture fichiers fs
- Agrégation $facet
- Gestion des chemins path.join()

### Ines Kheffache (7 routes)

**Module:** Gestion habitudes complète

**Routes obligatoires du prof:**
1. POST /api/habits - Route d'écriture (création + validation)
2. GET /api/habits/search - Route de lecture avancée (filtres + pagination)
3. GET /api/habits/stats/categories - Route d'agrégation ($group + $project)

**Routes supplémentaires:**
4. GET /api/habits/stats/popular - Agrégation avec $lookup
5. GET /api/habits/:id - Lecture par ID
6. PUT /api/habits/:id - Modification
7. DELETE /api/habits/:id - Suppression avec cascade logs

**Technologies maîtrisées:**
- Validation ValidatorJS
- Agrégation $group et $project
- Populate Mongoose
- Suppression en cascade

### Felix Touratier (6 routes)

**Module:** Gestion logs d'habitudes

**Routes obligatoires du prof:**
1. POST /api/habitlogs - Route d'écriture (création log)
2. GET /api/habitlogs/history - Route de lecture avancée (filtres + pagination)
3. GET /api/habitlogs/streaks - Route d'agrégation (calcul streaks)

**Routes supplémentaires:**
4. POST /api/habitlogs/import - Import logs depuis JSON
5. GET /api/habitlogs/export - Export logs en JSON
6. DELETE /api/habitlogs/:id - Suppression log

**Fichiers JSON:**
- Lecture: initial-habitLogs.json
- Écriture: habitlogs-export-*.json

**Technologies maîtrisées:**
- Agrégation complexe (streaks)
- Import/Export JSON
- Gestion dates et dateString
- Index unique MongoDB

### Jad Izargui (4 routes)

**Module:** Statistiques et dashboard

**Routes obligatoires du prof:**
1. POST /api/stats/export - Route d'écriture (export stats en JSON)
2. GET /api/stats/dashboard - Route de lecture avancée (dashboard complet)
3. GET /api/stats/aggregation - Route d'agrégation ($lookup Users → Habits)

**Route supplémentaire:**
4. GET /api/stats/top-habits - Top habitudes

**Fichiers JSON:**
- Écriture: stats-user-*.json

**Technologies maîtrisées:**
- Agrégation multi-collections
- Services réutilisables
- Export JSON avancé

### Antoine Gobron (3 routes)

**Module:** Statistiques globales et imports

**Routes:**
1. GET /api/stats/overview - Vue d'ensemble application
2. GET /api/stats/categories - Stats par catégorie
3. POST /api/stats/import - Import stats depuis JSON

**Fichiers JSON:**
- Lecture: initial-stats.json

**Responsabilités supplémentaires:**
- Configuration MongoDB (config/db.js)
- Service statsService.js
- Middlewares (errorHandler, notFound, validation)

## Technologies utilisées

- Node.js 18+
- Express 4.22
- MongoDB 6.0+
- Mongoose 8.20
- bcryptjs 2.4
- ValidatorJS 13.11
- dotenv 16.6
- cors 2.8
- nodemon 3.1

## Difficultés rencontrées

1. Gestion des imports ES Modules
   - Problème: Erreurs avec import/export
   - Solution: Ajout de "type": "module" dans package.json

2. Agrégations MongoDB complexes
   - Problème: Pipeline $lookup avec plusieurs jointures
   - Solution: Décomposition en étapes simples

3. Validation des données
   - Problème: ValidatorJS non utilisé initialement
   - Solution: Ajout de validator.isEmail(), validator.isLength()

4. Gestion des dates pour les logs
   - Problème: Doublons de logs pour le même jour
   - Solution: Ajout de dateString (YYYY-MM-DD) avec index unique

5. Suppression en cascade
   - Problème: Données orphelines après suppression d'utilisateurs
   - Solution: Suppression automatique des habitudes et logs associés

6. Répartition du travail
   - Problème: Équilibrer les tâches entre 6 étudiants
   - Solution: Séparation claire des responsabilités (userController partagé entre Flo et Aya, statsController entre Jad et Antoine)

## Améliorations possibles

### Court terme
- Authentification JWT complète
- Refresh tokens
- Rate limiting
- Upload d'images
- Tests unitaires

### Moyen terme
- GraphQL API
- WebSockets
- Cache Redis
- Docker
- CI/CD

### Long terme
- Frontend React/Vue.js
- Application mobile
- Gamification
- Analyse IA

## Licence

Ce projet est sous licence ISC.

## Auteurs

Skills4Mind - M.TAALBI RABAH

Équipe Projet (6 étudiants):
- Florient-Gael Kalumuna - Gestion utilisateurs (CRUD de base, 5 routes)
- Aya Hadj Sadok - Import/Export utilisateurs + Stats globales (3 routes)
- Ines Kheffache - Gestion habitudes complète (7 routes)
- Felix Touratier - Gestion logs + Import/Export (6 routes)
- Jad Izargui - Statistiques et dashboard (4 routes)
- Antoine Gobron - Stats globales + Configuration (3 routes + infrastructure)

## Contact

Email: florientg1508@gmail.com  
GitHub: https://github.com/flog1508/NodeJs_Project