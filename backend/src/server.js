const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedExercises } = require('../seeds/exercises');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-seed exercises on startup
app.use(async (req, res, next) => {
  // Only run once on first request
  if (!app.locals.exercisesSeedDone) {
    try {
      await seedExercises();
      app.locals.exercisesSeedDone = true;
    } catch (error) {
      console.error('Error auto-seeding exercises:', error);
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/mentor', require('./routes/physiotherapist'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/advanced', require('./routes/advancedFeatures'));

// Initialize Background Tasks
const startCronJobs = require('./utils/cronJobs');
startCronJobs();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RehabAI Backend Server is running on port ${PORT}`);
});

module.exports = app;
