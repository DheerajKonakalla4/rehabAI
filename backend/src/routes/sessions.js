const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// Appointment / Scheduling Routes
router.get('/', authMiddleware, sessionController.getAppointments);
router.post('/', authMiddleware, sessionController.createAppointment);
router.put('/:id/status', authMiddleware, sessionController.updateAppointmentStatus);

// Backward compatibility or other session types can be added here
router.get('/patient/:patientId', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Patient specific filtered sessions to be implemented if needed' });
});

module.exports = router;
