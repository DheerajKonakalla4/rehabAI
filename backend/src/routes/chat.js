const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsHelpful
} = require('../controllers/chatController');

// POST /api/chat/message - Send message to AI
router.post('/message', authMiddleware, sendMessage);

// GET /api/chat/history - Get chat history
router.get('/history', authMiddleware, getChatHistory);

// GET /api/chat/conversations - Get all conversations
router.get('/conversations', authMiddleware, getConversations);

// PUT /api/chat/message/:messageId/helpful - Mark message as helpful
router.put('/message/:messageId/helpful', authMiddleware, markAsHelpful);

module.exports = router;
