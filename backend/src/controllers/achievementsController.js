const Achievement = require('../models/Achievement');
const User = require('../models/User');
const ExerciseLog = require('../models/ExerciseLog');

// Get all achievements
exports.getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true })
      .select('name description icon badge criteria');

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
};

// Get user achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    const userAchievements = await Achievement.find({
      'earnedBy.userId': userId,
      isActive: true
    }).select('name description icon badge earnedAt');

    const earnedAchievementsList = userAchievements.map(achievement => {
      const earned = achievement.earnedBy.find(e => e.userId.toString() === userId);
      return {
        _id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        badge: achievement.badge,
        earnedAt: earned ? earned.earnedAt : null
      };
    });

    res.json({
      success: true,
      achievements: earnedAchievementsList,
      count: earnedAchievementsList.length
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user achievements',
      error: error.message
    });
  }
};

// Award achievement to user
exports.awardAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user.id;

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Check if user already earned this achievement
    const alreadyEarned = achievement.earnedBy.find(e => e.userId.toString() === userId);
    if (alreadyEarned) {
      return res.status(400).json({
        success: false,
        message: 'User already earned this achievement'
      });
    }

    // Add user to earnedBy array
    achievement.earnedBy.push({
      userId,
      earnedAt: new Date()
    });

    await achievement.save();

    res.json({
      success: true,
      message: 'Achievement awarded successfully',
      achievement
    });
  } catch (error) {
    console.error('Error awarding achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding achievement',
      error: error.message
    });
  }
};

// Create achievement (admin only)
exports.createAchievement = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      badge,
      criteria
    } = req.body;

    const achievement = new Achievement({
      name,
      description,
      icon,
      badge,
      criteria,
      isActive: true
    });

    await achievement.save();

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      achievement
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating achievement',
      error: error.message
    });
  }
};

// Update achievement (admin only)
exports.updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const achievement = await Achievement.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.json({
      success: true,
      message: 'Achievement updated successfully',
      achievement
    });
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating achievement',
      error: error.message
    });
  }
};

// Delete achievement (admin only)
exports.deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting achievement',
      error: error.message
    });
  }
};

// Check and award automatic achievements
exports.checkAndAwardAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's exercise logs
    const exerciseLogs = await ExerciseLog.find({ userId });
    const allAchievements = await Achievement.find({ isActive: true });
    const awardedAchievements = [];

    for (const achievement of allAchievements) {
      // Check if user already earned it
      const alreadyEarned = achievement.earnedBy.find(e => e.userId.toString() === userId);
      if (alreadyEarned) continue;

      // Check criteria
      const { type, value } = achievement.criteria;

      let criteriasMet = false;

      switch (type) {
        case 'exercises_count':
          if (exerciseLogs.length >= value) {
            criteriasMet = true;
          }
          break;

        case 'streak':
          // Simple streak calculation (can be improved)
          if (exerciseLogs.length >= value) {
            criteriasMet = true;
          }
          break;

        case 'days_active':
          const uniqueDays = new Set(
            exerciseLogs.map(log => log.date.toDateString())
          );
          if (uniqueDays.size >= value) {
            criteriasMet = true;
          }
          break;
      }

      if (criteriasMet) {
        achievement.earnedBy.push({
          userId,
          earnedAt: new Date()
        });
        await achievement.save();
        awardedAchievements.push(achievement);
      }
    }

    res.json({
      success: true,
      message: `${awardedAchievements.length} achievement(s) awarded`,
      achievements: awardedAchievements
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking achievements',
      error: error.message
    });
  }
};
