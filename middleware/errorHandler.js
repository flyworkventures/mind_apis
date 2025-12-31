/**
 * Error Handler Middleware
 * Tüm hataları merkezi olarak yönetir
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message || 'Validation error'
    });
  }

  // Authentication errors
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      success: false,
      error: err.message || 'Authentication failed'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

