class ErrorHandler {
  // Global error handler middleware
  static handleError(err, req, res, next) {
    console.error('Error:', err);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation error';
      details = err.message;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    } else if (err.code === '23505') { // PostgreSQL unique violation
      statusCode = 409;
      message = 'Duplicate entry';
      details = err.detail;
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
      statusCode = 400;
      message = 'Referenced record does not exist';
    } else if (err.code === '23502') { // PostgreSQL not null violation
      statusCode = 400;
      message = 'Required field missing';
    } else if (err.statusCode) {
      statusCode = err.statusCode;
      message = err.message;
    } else if (err.message) {
      message = err.message;
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal server error';
      details = null;
    }

    res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle 404 errors
  static handleNotFound(req, res, next) {
    // Silently ignore favicon requests to avoid cluttering logs
    if (req.originalUrl === '/favicon.ico') {
      return res.status(204).end();
    }
    
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Validation error handler
  static handleValidationError(errors) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.statusCode = 400;
    error.details = errors.map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    throw error;
  }

  // Database error handler
  static handleDatabaseError(err) {
    console.error('Database error:', err);
    
    if (err.code === '23505') {
      const error = new Error('Duplicate entry');
      error.statusCode = 409;
      error.details = err.detail;
      throw error;
    }
    
    if (err.code === '23503') {
      const error = new Error('Referenced record does not exist');
      error.statusCode = 400;
      throw error;
    }
    
    if (err.code === '23502') {
      const error = new Error('Required field missing');
      error.statusCode = 400;
      throw error;
    }
    
    // Re-throw unknown database errors
    throw err;
  }
}

module.exports = ErrorHandler;

