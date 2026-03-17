const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Doctor Routes
// GET /api/doctors - Get all doctors
router.get('/', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Get all doctors endpoint to be implemented' });
});

// GET /api/doctors/:id - Get doctor details
router.get('/:id', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Get doctor details endpoint to be implemented' });
});

// GET /api/doctors/:id/patients - Get patients assigned to doctor
router.get('/:id/patients', authMiddleware, roleMiddleware('doctor'), (req, res) => {
  res.status(501).json({ message: 'Get doctor patients endpoint to be implemented' });
});

module.exports = router;
