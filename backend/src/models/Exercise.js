const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['stretching', 'strengthening', 'balance', 'cardio', 'flexibility', 'mobility'],
    required: true
  },
  bodyParts: [String],
  instructions: String,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['seconds', 'minutes', 'reps'],
      default: 'minutes'
    }
  },
  repetitions: {
    type: Number,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate'
  },
  imageUrl: String,
  videoUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
