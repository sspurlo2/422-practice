const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const roleRoutes = require('./routes/roleRoutes');
const workplaceRoutes = require('./routes/workplaceRoutes');

// Import middleware
const ErrorHandler = require('./middleware/errorHandler');

// Import database connection
const { pool } = require('./config/db');

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Flock Manager API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;

