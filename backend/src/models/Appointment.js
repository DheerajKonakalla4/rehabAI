const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:MM AM/PM
    required: true
  },
  type: {
    type: String,
    enum: ['Video Call', 'In-person Clinic', 'Home Visit'],
    default: 'Video Call'
  },
  status: {
    type: String,
    enum: ['pending', 'upcoming', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
