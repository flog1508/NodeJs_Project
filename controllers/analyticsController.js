// controllers/analyticsController.js
import Habitlog from '../models/Habitlog.js';
import mongoose from 'mongoose';

/**
 * Retourne le top 3 des habitudes les plus complétées.
 */
export const getTopCompletedHabits = async (req, res, next) => {
  try {
    const { userId } = req.user; // Supposons que req.user est défini par le middleware auth

    const topHabits = await Habitlog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: "$habitId",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 3
      },
      {
        $lookup: {
          from: "habits",
          localField: "_id",
          foreignField: "_id",
          as: "habitInfo"
        }
      },
      {
        $unwind: "$habitInfo"
      },
      {
        $project: {
          habitId: "$_id",
          title: "$habitInfo.title",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(topHabits);
  } catch (error) {
    next(error);
  }
};

/**
 * Retourne les tendances d'humeur par habitude.
 */
export const getMoodTrendsByHabit = async (req, res, next) => {
  try {
    //const { userId } = req.user;
    const userId = "6932c49e7ae4d0f61566030b"; 

    const moodTrends = await Habitlog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: {
            habitId: "$habitId",
            mood: "$mood"
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "habits",
          localField: "_id.habitId",
          foreignField: "_id",
          as: "habitInfo"
        }
      },
      {
        $unwind: "$habitInfo"
      },
      {
        $project: {
          habitId: "$_id.habitId",
          title: "$habitInfo.title",
          mood: "$_id.mood",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { habitId: 1, mood: 1 }
      }
    ]);

    res.status(200).json(moodTrends);
  } catch (error) {
    next(error);
  }
};

/**
 * Retourne les statistiques mensuelles par habitude.
 */
export const getMonthlyStats = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { year } = req.query; // Ex: ?year=2025

    const monthlyStats = await Habitlog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dateString: { $regex: `^${year}-` } // Filtre par année
        }
      },
      {
        $group: {
          _id: {
            habitId: "$habitId",
            month: { $substr: ["$dateString", 0, 7] } // Ex: "2025-12"
          },
          avgDuration: { $avg: "$duration" },
          moodStats: {
            $push: {
              mood: "$mood",
              count: 1
            }
          },
          totalLogs: { $sum: 1 }
        }
      },
      {
        $unwind: "$moodStats"
      },
      {
        $group: {
          _id: "$_id",
          avgDuration: { $first: "$avgDuration" },
          moodStats: {
            $push: {
              mood: "$moodStats.mood",
              count: { $sum: "$moodStats.count" }
            }
          },
          totalLogs: { $first: "$totalLogs" }
        }
      },
      {
        $lookup: {
          from: "habits",
          localField: "_id.habitId",
          foreignField: "_id",
          as: "habitInfo"
        }
      },
      {
        $unwind: "$habitInfo"
      },
      {
        $project: {
          habitId: "$_id.habitId",
          title: "$habitInfo.title",
          month: "$_id.month",
          avgDuration: 1,
          moodStats: 1,
          totalLogs: 1,
          _id: 0
        }
      },
      {
        $sort: { month: 1, title: 1 }
      }
    ]);

    res.status(200).json(monthlyStats);
  } catch (error) {
    next(error);
  }
};
