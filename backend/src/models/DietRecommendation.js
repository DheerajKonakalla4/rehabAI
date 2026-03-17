const mongoose = require('mongoose');

const dietRecommendationSchema = new mongoose.Schema({
  injuryType: {
    type: String,
    required: true
  },
  foods: [{
    name: String,
    quantity: String,
    benefits: String
  }],
  description: String,
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

module.exports = mongoose.model('DietRecommendation', dietRecommendationSchema);
