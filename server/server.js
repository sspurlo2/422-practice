// Catch uncaught exceptions and unhandled rejections
// Log but don't exit immediately - let the server try to start
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION!');
  console.error(err.name, err.message);
  console.error(err.stack);
  // Only exit if it's a critical error
  if (err.code === 'EADDRINUSE' || err.message.includes('listen')) {
    console.error('Critical error - exiting');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit on unhandled rejections - log and continue
  // This allows the server to start even if some async operations fail
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('Starting server initialization...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Import routes
console.log('Loading routes...');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const roleRoutes = require('./routes/roleRoutes');
const workplaceRoutes = require('./routes/workplaceRoutes');
console.log('Routes loaded successfully');

// Import middleware
const ErrorHandler = require('./middleware/errorHandler');

// Import database connection
console.log('Loading database configuration...');
const { pool } = require('./config/db');
console.log('Database configuration loaded');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthStatus = {
    success: true,
    message: 'Flock Manager API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'unknown'
  };

  // Check database connection if pool exists
  if (pool) {
    try {
      await pool.query('SELECT 1');
      healthStatus.database = 'connected';
    } catch (err) {
      healthStatus.database = 'disconnected';
      healthStatus.databaseError = err.message;
    }
  } else {
    healthStatus.database = 'not_configured';
  }

  // Return 200 even if database is not connected (server is still running)
  res.status(200).json(healthStatus);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/workplaces', workplaceRoutes);

// 404 handler
app.use(ErrorHandler.handleNotFound);

// Global error handler
app.use(ErrorHandler.handleError);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  try {
    if (pool) {
      await pool.end();
      console.log('Database connection closed.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  try {
    if (pool) {
      await pool.end();
      console.log('Database connection closed.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start server
// Listen on 0.0.0.0 to accept connections from Cloud Run
console.log(`Attempting to start server on port ${PORT}...`);
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Flock Manager API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`📚 API Base URL: http://0.0.0.0:${PORT}/api`);
    console.log('✅ Server started successfully and listening for connections');
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error(error.stack);
  process.exit(1);
}

module.exports = app;

