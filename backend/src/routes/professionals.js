const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getAllProfessionals,
  getProfessionalById,
  getProfessionalsBySpecialization,
  createProfessional,
  updateProfessional,
  bookAppointment,
  getProfessionalAppointments,
  setOnlineStatus
} = require('../controllers/professionalsController');

// GET /api/professionals - Get all professionals
router.get('/', authMiddleware, getAllProfessionals);

// GET /api/professionals/:id - Get professional by ID
router.get('/:id', authMiddleware, getProfessionalById);

// GET /api/professionals/specialization/:specialization - Get professionals by specialization
router.get('/specialization/:specialization', authMiddleware, getProfessionalsBySpecialization);

// POST /api/professionals - Create professional profile
router.post('/', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), createProfessional);

// PUT /api/professionals/:id - Update professional profile
router.put('/:id', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), updateProfessional);

// POST /api/professionals/:professionalId/appointments - Book appointment
router.post('/:professionalId/appointments', authMiddleware, bookAppointment);

// GET /api/professionals/:professionalId/appointments - Get professional's appointments
router.get('/:professionalId/appointments', authMiddleware, getProfessionalAppointments);

// PUT /api/professionals/online-status - Set online status
router.put('/online-status', authMiddleware, setOnlineStatus);

module.exports = router;
