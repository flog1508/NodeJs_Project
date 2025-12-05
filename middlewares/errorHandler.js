// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: errors
    });
  }

  // Erreur de duplication (ex: email déjà existant)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `Le ${field} existe déjà`
    });
  }

  // Erreur de cast (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'ID invalide'
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }

  // Erreur JWT expirée
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expiré'
    });
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;