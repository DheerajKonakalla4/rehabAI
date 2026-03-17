const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getAllAchievements,
  getUserAchievements,
  awardAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  checkAndAwardAchievements
} = require('../controllers/achievementsController');

// GET /api/achievements - Get all achievements
router.get('/', authMiddleware, getAllAchievements);

// GET /api/achievements/user - Get user's achievements
router.get('/user', authMiddleware, getUserAchievements);

// POST /api/achievements/check - Check and award achievements
router.post('/check', authMiddleware, checkAndAwardAchievements);

// POST /api/achievements/:achievementId/award - Award achievement to user
router.post('/:achievementId/award', authMiddleware, awardAchievement);

// POST /api/achievements - Create achievement (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), createAchievement);

// PUT /api/achievements/:id - Update achievement (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateAchievement);

// DELETE /api/achievements/:id - Delete achievement (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteAchievement);

module.exports = router;
