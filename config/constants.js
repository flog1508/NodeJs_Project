// config/constants.js
export const HABIT_CATEGORIES = [
  'health',
  'fitness',
  'productivity',
  'learning',
  'finance',
  'personal',
  'other'
];

export const HABIT_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'custom'
];

export const HABIT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const API_MESSAGES = {
  SUCCESS: 'Opération réussie',
  ERROR: 'Une erreur est survenue',
  NOT_FOUND: 'Ressource non trouvée',
  UNAUTHORIZED: 'Non autorisé',
  VALIDATION_ERROR: 'Erreur de validation'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};