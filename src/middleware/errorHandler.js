// Global error handler middleware.
// Must be registered LAST in app.js (after all routes).
// Catches all errors passed via next(error) or thrown in async handlers.

const logger = require('../config/logger');

// Wraps async route handlers so we don't need try/catch in every controller.
// Usage: router.get('/', asyncHandler(myController))
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler — called when next(err) is invoked
const errorHandler = (err, req, res, next) => {
  // Log the full error including stack trace
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).render('error', {
      title: 'Validation Error',
      message: messages.join(', '),
      statusCode: 400,
    });
  }

  // Mongoose duplicate key error (e.g., duplicate username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).render('error', {
      title: 'Duplicate Error',
      message: `${field} already exists`,
      statusCode: 400,
    });
  }

  // Generic error response
  res.status(statusCode).render('error', {
    title: 'Something went wrong',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    statusCode,
  });
};

// 404 handler — called when no route matches
const notFound = (req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: `The page "${req.path}" does not exist`,
    statusCode: 404,
  });
};

module.exports = { asyncHandler, errorHandler, notFound };