const mongoose = require('mongoose');

const doctorPatientRequestSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  indexes: [
    { doctorId: 1, patientId: 1, unique: true },
    { patientId: 1, status: 1 },
    { doctorId: 1, status: 1 }
  ]
});

module.exports = mongoose.model('DoctorPatientRequest', doctorPatientRequestSchema);
