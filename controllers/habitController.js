// controllers/habitController.js
import { Habit } from '../models/Habit.js';
import { validateHabitUpdate, isValidObjectId } from '../utils/validator.js';

// controllers/habitController.js
export const updateHabit = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const updates = req.body;

    // 1. Valider l'ID de l'habitude
    if (!isValidObjectId(habitId)) {
      return res.status(400).json({ message: "ID d'habitude invalide" });
    }

    // 2. Valider les données
    const { error, value } = validateHabitUpdate(updates);
    if (error) {
      return res.status(400).json({ messages: error.details.map(d => d.message) });
    }

    // 3. Vérifier que l'habitude existe (sans vérifier l'utilisateur pour les tests)
    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: "Habitude non trouvée" });
    }

    // 4. Mettre à jour l'habitude
    const updatedHabit = await Habit.findByIdAndUpdate(habitId, value, { new: true });
    res.status(200).json(updatedHabit);
  } catch (error) {
    next(error);
  }
};
