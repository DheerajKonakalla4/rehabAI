const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Patient Routes (all require authentication and patient role)
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

// POST /api/patient/daily-log - Log daily pain and mood
router.post('/daily-log', patientController.addDailyLog);

// GET /api/patient/profile - Get patient profile
router.get('/profile', patientController.getProfile);

// PUT /api/patient/profile - Update patient profile
router.put('/profile', patientController.updateProfile);

// GET /api/patient/incoming-requests - Get all incoming requests from doctors
router.get('/incoming-requests', patientController.getIncomingRequests);

// PUT /api/patient/accept-request/:requestId - Accept a doctor's connection request
router.put('/accept-request/:requestId', patientController.acceptRequest);

// PUT /api/patient/reject-request/:requestId - Reject a doctor's connection request
router.put('/reject-request/:requestId', patientController.rejectRequest);

// GET /api/patient/connected-doctors - Get all connected doctors
router.get('/connected-doctors', patientController.getConnectedDoctors);

// GET /api/patient/assigned-doctor - Get assigned doctor
router.get('/assigned-doctor', patientController.getAssignedDoctor);

// GET /api/patient/diet-plans - Get diet plans
router.get('/diet-plans', patientController.getDietPlans);

// PUT /api/patient/exercise-session/:sessionId/update-status - Update exercise session status
router.put('/exercise-session/:sessionId/update-status', patientController.updateExerciseSessionStatus);

// POST /api/patient/complete-exercise/:assignmentId - Mark exercise as completed
router.post('/complete-exercise/:assignmentId', patientController.completeExercise);

// POST /api/patient/start-exercise/:assignmentId - Mark exercise as in-progress
router.post('/start-exercise/:assignmentId', patientController.startExercise);

module.exports = router;
