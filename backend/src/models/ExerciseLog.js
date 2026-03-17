const mongoose = require('mongoose');

const exerciseLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  completedSets: {
    type: Number,
    required: true,
    min: 0
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10
  },
  notes: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
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

module.exports = mongoose.model('ExerciseLog', exerciseLogSchema);
