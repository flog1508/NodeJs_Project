# Habit Tracker - Backend

Backend Node.js / Express pour le projet Habit Tracker.

## Structure

- `server.js` - point d'entrée
- `routes/` - routes Express (users, habits, stats...)
- `models/` - schémas Mongoose
- `middlewares/` - middlewares (error handler, notFound)
- `data/imports` - fichiers JSON pour seed
- `data/exports` - fichiers exportés (statistiques, backups)

## Installation

1. Installer les dépendances:

```powershell
npm install
```

2. Créer un fichier `.env` à la racine avec au minimum:

```
PORT=5000
MONGO_URI=<votre_uri_mongodb>
```

3. Seed la base de données (optionnel, fournis des exemples):

```powershell
node data/seed.js
```

4. Lancer le serveur en mode dev:

```powershell
npm run dev
```

## Routes importantes (exemples)

- POST `/api/users/register` : créer un utilisateur
  - Body: `{ "username": "alice", "email": "alice@example.com", "password": "secret" }`

- GET `/api/users/search?search=alice&page=1&limit=10` : rechercher des utilisateurs

- GET `/api/users/:id/stats` : obtenir des statistiques pour un utilisateur (aggregation)

- POST `/api/stats/export` : générer un fichier JSON avec des statistiques et l'enregistrer dans `data/exports/`

## Notes

- Les mots de passe sont hashés avec `bcryptjs`.
- Les fichiers JSON d'export sont écrits dans `data/exports/`.

## Travail en groupe

Créez un dépôt GitHub et poussez ce dossier; chaque membre peut travailler sur sa branche et ajouter ses routes.
