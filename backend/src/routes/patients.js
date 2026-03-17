const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Patient Routes (all require authentication)
router.use(authMiddleware);
router.use(roleMiddleware('patient'));

// GET /api/patient/dashboard - Get patient dashboard
router.get('/dashboard', patientController.getDashboard);

// GET /api/patient/exercises - Get assigned exercises
router.get('/exercises', patientController.getExercises);

// GET /api/patient/exercise-logs - Get exercise logs with optional date filter
router.get('/exercise-logs', patientController.getExerciseLogs);

// POST /api/patient/exercise-log - Log completed exercise
router.post('/exercise-log', patientController.logExercise);

// GET /api/patient/profile - Get patient profile
router.get('/profile', patientController.getDashboard);

// PUT /api/patient/profile - Update patient profile
router.put('/profile', patientController.updateProfile);

module.exports = router;
