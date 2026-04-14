const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// POST /api/ai/generate-plan
router.post('/generate-plan', authMiddleware, roleMiddleware('physiotherapist', 'doctor', 'patient'), aiController.generatePlan);

module.exports = router;
