import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options recommandées pour MongoDB 6+
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(` MongoDB connecté: ${conn.connection.host}`);
    console.log(` Base de données: ${conn.connection.name}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('disconnected', () => {
      console.log(' MongoDB déconnecté');
    });

    mongoose.connection.on('error', (err) => {
      console.error(' Erreur MongoDB:', err);
    });

  } catch (error) {
    console.error(` Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;