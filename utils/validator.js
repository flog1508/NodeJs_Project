// utils/validator.js
import Joi from 'joi';
import validator from 'validator';

// --- Validation avec Joi ---
/**
 * Schéma Joi pour la mise à jour d'une habitude.
 */
export const habitUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  frequency: Joi.string().valid('daily', 'weekly', 'custom').optional(),
  isArchived: Joi.boolean().optional(),
}).options({ abortEarly: false });

/**
 * Valide les données de mise à jour d'une habitude.
 */
export const validateHabitUpdate = (data) => {
  const { error, value } = habitUpdateSchema.validate(data);
  return { error, value };
};

// --- Validation avec `validator` ---
/**
 * Valide un email.
 */
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Valide un ID MongoDB.
 */
export const isValidObjectId = (id) => {
  return validator.isMongoId(id);
};

/**
 * Valide une date au format ISO.
 */
export const isValidDate = (date) => {
  return validator.isISO8601(date);
};

// --- Validation pour Habitlog ---
/**
 * Schéma Joi pour la création d'un log d'habitude.
 */
export const habitLogSchema = Joi.object({
  habitId: Joi.string().required().custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId Validation'),
  userId: Joi.string().required().custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId Validation'),
  completedAt: Joi.date().iso().optional(),
  dateString: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
  note: Joi.string().max(300).optional(),
  mood: Joi.string().valid('excellent', 'bon', 'moyen', 'difficile').optional(),
  duration: Joi.number().min(0).max(1440).optional(),
  metadata: Joi.object({
    location: Joi.string().optional(),
    weather: Joi.string().optional(),
    companions: Joi.array().items(Joi.string()).optional(),
  }).optional(),
}).options({ abortEarly: false });

/**
 * Valide les données d'un log d'habitude.
 */
export const validateHabitLog = (data) => {
  const { error, value } = habitLogSchema.validate(data);
  return { error, value };
};
