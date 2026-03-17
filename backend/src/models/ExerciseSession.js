const mongoose = require('mongoose');

const exerciseSessionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  physiotherapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  completionStatus: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'incomplete'],
    default: 'pending'
  },
  durationCompleted: {
    value: Number,
    unit: {
      type: String,
      enum: ['seconds', 'minutes', 'reps']
    }
  },
  repsCompleted: Number,
  feedback: String,
  notes: String,
  pain_level: {
    type: Number,
    min: 0,
    max: 10
  },
  effort_level: {
    type: Number,
    min: 0,
    max: 10
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

module.exports = mongoose.model('ExerciseSession', exerciseSessionSchema);
