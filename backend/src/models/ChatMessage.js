const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [String], // Tags for categorizing messages (e.g., 'exercise', 'pain', 'progress')
  conversationId: {
    type: String,
    default: null
  },
  isHelpful: {
    type: Boolean,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ conversationId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
