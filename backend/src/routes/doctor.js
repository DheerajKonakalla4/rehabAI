const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Doctor Routes (all require authentication and doctor role)
router.use(authMiddleware);
router.use(roleMiddleware('doctor'));

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

module.exports = router;
