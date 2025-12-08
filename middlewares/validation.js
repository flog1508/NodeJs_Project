// middlewares/validation.js
import validator from 'validator';

export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email requis'
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email invalide'
    });
  }

  next();
};

export const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Mot de passe requis'
    });
  }

  if (!validator.isLength(password, { min: 6 })) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères'
    });
  }

  next();
};

export const validateUsername = (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Nom d\'utilisateur requis'
    });
  }

  if (!validator.isLength(username, { min: 3, max: 30 })) {
    return res.status(400).json({
      success: false,
      error: 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères'
    });
  }

  next();
};

export const validateHabitData = (req, res, next) => {
  const { title, category, frequency } = req.body;

  if (!title || !category) {
    return res.status(400).json({
      success: false,
      error: 'Titre et catégorie requis'
    });
  }

  if (!validator.isLength(title, { min: 3, max: 100 })) {
    return res.status(400).json({
      success: false,
      error: 'Le titre doit contenir entre 3 et 100 caractères'
    });
  }

  next();
};