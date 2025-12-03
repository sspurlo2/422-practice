const { Pool } = require('pg');
require('dotenv').config();

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ WARNING: DATABASE_URL environment variable is not set!');
  console.error('   Please set DATABASE_URL environment variable');
  console.error('   Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  // Don't exit - allow server to start and handle database errors gracefully
  // Cloud Run will set this via environment variables
  console.warn('   Server will start but database queries will fail until DATABASE_URL is configured');
}

// Create PostgreSQL connection pool
// Only create pool if DATABASE_URL is set, otherwise create a dummy pool that will fail gracefully
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

// Test database connection (only if pool exists)
if (pool) {
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('Database connection error:', err);
    // Don't exit on database errors - allow server to continue running
    // Individual queries will handle errors gracefully
    console.warn('Database connection error occurred, but server will continue running');
  });
}

// Helper function to execute queries
const query = async (text, params) => {
  if (!pool || !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured. Please set the DATABASE_URL environment variable.');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    // Add more context to the error
    if (error.code === 'ECONNREFUSED') {
      error.message = 'Database connection refused. Is PostgreSQL running?';
    } else if (error.code === 'ENOTFOUND') {
      error.message = 'Database host not found. Check your DATABASE_URL.';
    } else if (error.code === '3D000') {
      error.message = 'Database does not exist. Check your DATABASE_URL.';
    } else if (error.code === '28P01') {
      error.message = 'Database authentication failed. Check your DATABASE_URL credentials.';
    }
    throw error;
  }
};

module.exports = {
  pool,
  query,
};

