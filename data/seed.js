import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { Habit } from '../models/Habit.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connecté à MongoDB');

    // Nettoyer les collections existantes
    await User.deleteMany({});
    await Habit.deleteMany({});
    console.log('🗑️  Collections nettoyées');

    // Lire les fichiers JSON
    const usersPath = path.join(process.cwd(), 'data/imports/initial-users.json');
    const habitsPath = path.join(process.cwd(), 'data/imports/initial-habits.json');

    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    const habitsData = JSON.parse(fs.readFileSync(habitsPath, 'utf-8'));

    console.log(`📖 Lecture des fichiers: ${usersData.length} users, ${habitsData.length} habits`);

    // Insérer les utilisateurs
    const insertedUsers = await User.insertMany(usersData);
    console.log(`✅ ${insertedUsers.length} utilisateurs créés`);

    // Préparer et insérer les habitudes en mappant les userId fictifs vers les ObjectId créés
    const userIdMap = {};
    insertedUsers.forEach((u, idx) => {
      userIdMap[`user${idx + 1}`] = u._id;
    });

    const habitsToInsert = habitsData.map((h) => {
      const habit = { ...h };
      // Si le fichier utilise une clé userId (ex: "user1"), la remplacer par l'_id réel
      if (habit.userId) {
        if (typeof habit.userId === 'string' && userIdMap[habit.userId]) {
          habit.user = userIdMap[habit.userId];
        } else {
          // tentative de récupérer un index si userId vaut 'userN'
          const m = String(habit.userId).match(/^user(\d+)$/i);
          if (m) {
            const i = parseInt(m[1], 10) - 1;
            if (insertedUsers[i]) habit.user = insertedUsers[i]._id;
          }
        }
      }
      // nettoyer la propriété userId utilisée uniquement pour l'import
      delete habit.userId;
      return habit;
    });

    const insertedHabits = await Habit.insertMany(habitsToInsert);
    console.log(`✅ ${insertedHabits.length} habitudes créées`);

    console.log('🎉 Seeding terminé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    process.exit(1);
  }
};

seedDatabase();
