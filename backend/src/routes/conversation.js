const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const conversationController = require('../controllers/conversationController');

// GET /api/conversations/contacts - Get chat contacts based on role
router.get('/contacts', authMiddleware, conversationController.getContacts);

module.exports = router;
