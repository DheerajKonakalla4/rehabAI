const Exercise = require('../models/Exercise');
const ExerciseLog = require('../models/ExerciseLog');

// Get all exercises with stats
exports.getAllExercises = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Get all exercises
    const exercises = await Exercise.find({ isActive: true }).populate('createdBy', 'firstName lastName');
    
    // Get user's exercise stats
    let stats = {
      total: exercises.length,
      completed: 0,
      thisWeek: 0
    };

    if (userId) {
      // Get completed exercises count
      const completedLogs = await ExerciseLog.find({ userId });
      stats.completed = completedLogs.length;

      // Get this week's exercises
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekLogs = await ExerciseLog.find({
        userId,
        date: { $gte: weekAgo }
      });
      stats.thisWeek = weekLogs.length;
    }

    // Add completion status to exercises
    const exercisesWithStatus = exercises.map(ex => ({
      ...ex.toObject(),
      status: Math.random() > 0.5 ? 'completed' : 'pending' // Mock status
    }));

    res.json({
      success: true,
      exercises: exercisesWithStatus,
      stats
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ success: false, message: 'Error fetching exercises', error: error.message });
  }
};

// Get single exercise
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate('createdBy', 'firstName lastName');
    
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    res.json({ success: true, exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ success: false, message: 'Error fetching exercise', error: error.message });
  }
};

// Get exercises by category
exports.getExercisesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const exercises = await Exercise.find({
      category,
      isActive: true
    }).populate('createdBy', 'firstName lastName');

    res.json({ success: true, exercises });
  } catch (error) {
    console.error('Error fetching exercises by category:', error);
    res.status(500).json({ success: false, message: 'Error fetching exercises', error: error.message });
  }
};

// Get exercises by body part
exports.getExercisesByBodyPart = async (req, res) => {
  try {
    const { bodyPart } = req.params;
    
    const exercises = await Exercise.find({
      bodyParts: { $in: [bodyPart] },
      isActive: true
    }).populate('createdBy', 'firstName lastName');

    res.json({ success: true, exercises });
  } catch (error) {
    console.error('Error fetching exercises by body part:', error);
    res.status(500).json({ success: false, message: 'Error fetching exercises', error: error.message });
  }
};

// Create new exercise (admin/doctor only)
exports.createExercise = async (req, res) => {
  try {
    const { name, description, category, bodyParts, instructions, duration, repetitions, difficulty, imageUrl, videoUrl } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const exercise = new Exercise({
      name,
      description,
      category,
      bodyParts,
      instructions,
      duration,
      repetitions,
      difficulty,
      imageUrl,
      videoUrl,
      createdBy: req.user.id
    });

    await exercise.save();
    res.status(201).json({ success: true, message: 'Exercise created successfully', exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ success: false, message: 'Error creating exercise', error: error.message });
  }
};

// Update exercise
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    res.json({ success: true, message: 'Exercise updated successfully', exercise });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ success: false, message: 'Error updating exercise', error: error.message });
  }
};

// Delete exercise (soft delete)
exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    res.json({ success: true, message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ success: false, message: 'Error deleting exercise', error: error.message });
  }
};
