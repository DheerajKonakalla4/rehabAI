const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getAllExercises,
  getExerciseById,
  getExercisesByCategory,
  getExercisesByBodyPart,
  createExercise,
  updateExercise,
  deleteExercise
} = require('../controllers/exercisesController');

// GET /api/exercises - Get all exercises
router.get('/', authMiddleware, getAllExercises);

// GET /api/exercises/category/:category - Get exercises by category
router.get('/category/:category', authMiddleware, getExercisesByCategory);

// GET /api/exercises/bodypart/:bodyPart - Get exercises by body part
router.get('/bodypart/:bodyPart', authMiddleware, getExercisesByBodyPart);

// GET /api/exercises/:id - Get exercise details
router.get('/:id', authMiddleware, getExerciseById);

const upload = require('../middleware/upload');

// POST /api/exercises - Create new exercise
router.post('/', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), upload.single('video'), createExercise);

// PUT /api/exercises/:id - Update exercise
router.put('/:id', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), upload.single('video'), updateExercise);

// DELETE /api/exercises/:id - Delete exercise
router.delete('/:id', authMiddleware, roleMiddleware('physiotherapist', 'doctor'), deleteExercise);

module.exports = router;
