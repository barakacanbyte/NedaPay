const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const transactionRoutes = require('./routes/transactions');
const reserveRoutes = require('./routes/reserves');
const tokenRoutes = require('./routes/tokens');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // HTTP request logger

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neda-pay')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/reserves', reserveRoutes);
app.use('/api/tokens', tokenRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`NEDA Pay backend server running on port ${PORT}`);
});

module.exports = app;
