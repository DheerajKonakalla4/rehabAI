const mongoose = require('mongoose');

const assignedExerciseSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  completedDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    default: 'daily' // daily, weekly, as-needed
  },
  sets: {
    type: Number,
    default: 1
  },
  reps: {
    type: Number,
    default: null
  },
  duration: {
    type: Number,
    default: null // in minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
assignedExerciseSchema.index({ patientId: 1, status: 1 });
assignedExerciseSchema.index({ doctorId: 1, patientId: 1 });
assignedExerciseSchema.index({ assignedDate: -1 });

module.exports = mongoose.model('AssignedExercise', assignedExerciseSchema);
