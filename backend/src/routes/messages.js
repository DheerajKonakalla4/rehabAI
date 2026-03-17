const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

// Messages Routes (all require authentication)
router.use(authMiddleware);

// POST /api/messages/send - Send message
router.post('/send', messageController.sendMessage);

// GET /api/messages/history - Get message history with specific user
router.get('/history', messageController.getMessageHistory);

// GET /api/messages/inbox - Get all conversations
router.get('/inbox', messageController.getInbox);

// PUT /api/messages/:messageId/mark-read - Mark message as read
router.put('/:messageId/mark-read', messageController.markAsRead);

// DELETE /api/messages/:messageId - Delete message
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
