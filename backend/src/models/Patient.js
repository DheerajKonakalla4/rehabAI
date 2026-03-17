const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  uniquePatientId: {
    type: String,
    unique: true,
    sparse: true
  },
  injuryType: {
    type: String,
    default: null
  },
  rehabilitationPlan: {
    type: String,
    default: null
  },
  assignedPhysiotherapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  connectedDoctors: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  medicalHistory: String,
  currentConditions: [String],
  emergencyContact: {
    name: String,
    phone: String
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

// Generate unique patient ID before saving
patientProfileSchema.pre('save', async function(next) {
  if (!this.uniquePatientId) {
    const count = await mongoose.model('PatientProfile').countDocuments();
    this.uniquePatientId = `PAT-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
