const express = require('express');
const router = express.Router();
const physiotherapistController = require('../controllers/physiotherapistController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Physiotherapist/Mentor Routes (all require authentication and physiotherapist role)
router.use(authMiddleware);
router.use(roleMiddleware('physiotherapist'));

// GET /api/mentor/patients - Get all assigned patients
router.get('/patients', physiotherapistController.getPatients);

// POST /api/mentor/add-exercise - Create new exercise
router.post('/add-exercise', physiotherapistController.addExercise);

// POST /api/mentor/assign-exercise - Assign exercise to patient
router.post('/assign-exercise', physiotherapistController.assignExercise);

// POST /api/mentor/update-progress/:sessionId - Update patient progress
router.post('/update-progress/:sessionId', physiotherapistController.updateProgress);

// GET /api/mentor/patient/:patientId/progress - Get patient's progress
router.get('/patient/:patientId/progress', physiotherapistController.getPatientProgress);

module.exports = router;
