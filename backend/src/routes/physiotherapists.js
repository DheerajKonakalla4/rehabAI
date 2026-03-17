const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Physiotherapist Routes
// GET /api/physiotherapists - Get all physiotherapists
router.get('/', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Get all physiotherapists endpoint to be implemented' });
});

// GET /api/physiotherapists/:id - Get physiotherapist details
router.get('/:id', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Get physiotherapist details endpoint to be implemented' });
});

// GET /api/physiotherapists/:id/patients - Get patients assigned to physiotherapist
router.get('/:id/patients', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), (req, res) => {
  res.status(501).json({ message: 'Get physiotherapist patients endpoint to be implemented' });
});

module.exports = router;
