const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'physiotherapist', 'doctor'],
    required: true
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  phone: String,
  profileImage: String,
  specialization: String,
  isActive: {
    type: Boolean,
    default: true
  },
  // Password reset fields
  passwordResetToken: String,
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate unique ID based on role
userSchema.pre('save', async function(next) {
  if (!this.uniqueId) {
    let prefix = 'USR';
    if (this.role === 'doctor') prefix = 'DOC';
    else if (this.role === 'patient') prefix = 'PAT';
    else if (this.role === 'physiotherapist') prefix = 'PHY';
    
    const count = await mongoose.model('User').countDocuments({ role: this.role });
    this.uniqueId = `${prefix}-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
