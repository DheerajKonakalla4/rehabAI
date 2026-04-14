const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  painLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  symptoms: {
    type: String,
    default: ''
  },
  mood: {
    type: String,
    enum: ['Great', 'Good', 'Okay', 'Bad', 'Terrible'],
    default: 'Okay'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
