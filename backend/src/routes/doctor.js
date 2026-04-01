const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Doctor Routes (all require authentication and doctor role)
router.use(authMiddleware);
router.use(roleMiddleware('doctor'));

// GET /api/doctor/all-patients - Get all patients available for connection
router.get('/all-patients', doctorController.getAllPatients);

// GET /api/doctor/patients - Get all assigned patients
router.get('/patients', doctorController.getPatients);

// GET /api/doctor/reports - Get aggregated reports for all patients
router.get('/reports', doctorController.getReports);

// GET /api/doctor/patient/:patientId/report - Get detailed report for specific patient
router.get('/patient/:patientId/report', doctorController.getPatientReport);

// POST /api/doctor/assign-patient - Assign patient to doctor
router.post('/assign-patient', doctorController.assignPatient);

// POST /api/doctor/send-request/:patientUserId - Send connection request to patient
router.post('/send-request/:patientUserId', doctorController.sendPatientRequest);

// GET /api/doctor/pending-requests - Get all pending patient requests
router.get('/pending-requests', doctorController.getPendingRequests);

// GET /api/doctor/connected-patients - Get all connected patients (accepted requests)
router.get('/connected-patients', doctorController.getConnectedPatients);

// POST /api/doctor/assign-exercise - Assign exercise to patient
router.post('/assign-exercise', doctorController.assignExercise);

// POST /api/doctor/add-diet-plan - Add diet plan to patient
router.post('/add-diet-plan', doctorController.addDietPlan);

// GET /api/doctor/patient/:patientId/exercises - Get exercises assigned to patient
router.get('/patient/:patientId/exercises', doctorController.getPatientExercises);

// GET /api/doctor/patient/:patientId/diets - Get diet plans for patient
router.get('/patient/:patientId/diets', doctorController.getPatientDietPlans);

module.exports = router;
