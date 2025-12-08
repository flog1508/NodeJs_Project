# 🎯 Habit Tracker - Backend API

API REST complète pour le suivi d'habitudes quotidiennes, construite avec Node.js, Express et MongoDB.

## 📋 Table des matières
- [Présentation du projet](#présentation)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Installation](#installation)
- [Routes API](#routes-api)
- [Exemples d'appels](#exemples-dappels)
- [Équipe](#équipe)

---

## Présentation du projet {#présentation}

**Habit Tracker** est une application backend permettant de :
- Gérer des utilisateurs (inscription, recherche, modification)
- Suivre des habitudes quotidiennes
- Analyser les statistiques de progression
- Importer/exporter des données JSON

**Contexte** : Projet académique pour démontrer la maîtrise de Node.js, Express, MongoDB et des opérations CRUD avancées.

---

## Architecture {#architecture}

### Structure du projet
```
habit-tracker-backend/
├── config/
│   ├── db.js              # Connexion MongoDB
│   └── constants.js       # Constantes de l'application
├── data/
│   ├── imports/           # Fichiers JSON pour seed
│   │   ├── initial-users.json
│   │   └── initial-habits.json
│   ├── exports/           # Statistiques exportées
│   └── user-logs.json     # Logs des actions
├── middlewares/
│   ├── errorHandler.js    # Gestion des erreurs
│   ├── notFound.js        # Routes 404
│   └── auth.js            # Authentification (futur)
├── models/
│   ├── User.js            # Schéma utilisateur
│   ├── Habit.js           # Schéma habitude
│   ├── Habitlog.js        # Schéma log d'habitude
│   └── Statistics.js      # Schéma statistiques
├── routes/
│   ├── userRoutes.js      # Routes utilisateurs
│   ├── Habitroutes.js     # Routes habitudes
│   └── statsRoutes.js     # Routes statistiques
├── public/
│   └── index.html         # Interface de test
├── server.js              # Point d'entrée
├── .env                   # Variables d'environnement
└── README.md
```

### Stack technique
- **Runtime** : Node.js v18+
- **Framework** : Express.js
- **Base de données** : MongoDB + Mongoose
- **Validation** : Validator.js
- **Sécurité** : bcryptjs pour le hachage
- **Variables d'env** : dotenv

---

## Modèle de données {#modèle-de-données}

### Collection `users`
```javascript
{
  _id: ObjectId,
  username: String (unique, 3-50 caractères),
  email: String (unique, format email),
  password: String (haché avec bcrypt),
  isActive: Boolean (default: true),
  preferences: {
    theme: String (default: 'light'),
    notifications: Boolean (default: true)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection `habits`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String (requis),
  description: String,
  category: String,
  frequency: String (daily, weekly, monthly),
  targetDays: Number,
  color: String,
  icon: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Collection `habitlogs`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  habitId: ObjectId (ref: Habit),
  completedAt: Date,
  notes: String,
  createdAt: Date
}
```

---

## Installation {#installation}

### 1. Cloner le projet
```bash
git clone https://github.com/votre-repo/habit-tracker-backend.git
cd habit-tracker-backend
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créer un fichier `.env` à la racine :
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/habit_tracker
NODE_ENV=development
```

### 4. Lancer le serveur
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000`

---

## Routes API {#routes-api}

### 👤 Routes Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Créer un nouvel utilisateur |
| GET | `/search` | Rechercher des utilisateurs (filtres, pagination) |
| GET | `/:id/stats` | Statistiques d'un utilisateur (agrégation) |
| PUT | `/:id` | Modifier un utilisateur |
| GET | `/import` | Importer des utilisateurs depuis JSON |
| GET | `/stats/export` | Exporter les statistiques en JSON |
| GET | `/stats/global` | Statistiques globales (tous les utilisateurs) |

---

## Exemples d'appels {#exemples-dappels}

### 1. Créer un utilisateur
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_martin",
    "email": "alice@example.com",
    "password": "secret123"
  }'
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
    "createdAt": "2024-12-07T10:30:00.000Z"
  }
}
```

### 2. Rechercher des utilisateurs
```bash
curl "http://localhost:5000/api/users/search?search=alice&limit=10&page=1"
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

### 3. Statistiques utilisateur (agrégation)
```bash
curl "http://localhost:5000/api/users/674a5b2c3f1a2b3c4d5e6f7a/stats"
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
    "archivedHabits": 2,
    "habitsByCategory": {
      "Santé": 2,
      "Productivité": 3
    },
    "totalCompletions": 42,
    "completionsThisMonth": 15,
    "completionRate": 67.89,
    "memberSince": 45
  }
}
```

### 4. Importer des utilisateurs
```bash
curl "http://localhost:5000/api/users/import"
```

### 5. Exporter les statistiques
```bash
curl "http://localhost:5000/api/users/stats/export"
```

**Réponse** :
```json
{
  "success": true,
  "message": "Statistiques exportées avec succès",
  "file": "user-stats-2024-12-07T10-30-00-000Z.json",
  "path": "/data/exports/user-stats-2024-12-07T10-30-00-000Z.json"
}
```

### 6. Modifier un utilisateur
```bash
curl -X PUT http://localhost:5000/api/users/674a5b2c3f1a2b3c4d5e6f7a \
  -H "Content-Type: application/json" \
  -d '{"username": "alice_updated"}'
```

---

## 🧪 Tests

### Interface de test
Ouvrir `http://localhost:5000` dans le navigateur pour accéder à l'interface de test HTML.

### Avec Postman / Thunder Client
Importer la collection depuis `/docs/postman-collection.json` (à créer).

---

## 👥 Équipe {#équipe}

**Étudiant 1** : Routes utilisateurs + Agrégations  
**Étudiant 2** : Routes habitudes  
**Étudiant 3** : Routes statistiques + Analyse  

---

## 📦 Technologies utilisées

- Node.js
- Express.js
- MongoDB / Mongoose
- bcryptjs
- validator.js
- dotenv
- nodemon

---

## 🚀 Améliorations futures

- [ ] Authentification JWT
- [ ] Rate limiting
- [ ] Tests unitaires (Jest)
- [ ] Documentation Swagger
- [ ] Déploiement (Heroku / Render)

---

## 📄 Licence

Projet académique - Skills4Mind - M.TAALBI RABAH