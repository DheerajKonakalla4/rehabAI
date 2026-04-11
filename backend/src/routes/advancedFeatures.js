const express = require('express');
const router = express.Router();
const advancedFeaturesController = require('../controllers/advancedFeaturesController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Note: these routes can be protected by specific roles. Using authMiddleware at router level
router.use(authMiddleware);

// Generate customized rehab plan (Doctor / Physiotherapist)
router.post('/plan/generate/:patientId', roleMiddleware('doctor', 'physiotherapist'), advancedFeaturesController.generateRehabPlan);

// Modify active plan
router.put('/plan/modify/:patientId', roleMiddleware('doctor', 'physiotherapist'), advancedFeaturesController.modifyRehabPlan);

// Log advanced session metrics
router.post('/session/log', roleMiddleware('patient'), advancedFeaturesController.logSessionData);

// Fetch AI insights
router.get('/insights/:patientId', advancedFeaturesController.getRecoveryInsights);

module.exports = router;
