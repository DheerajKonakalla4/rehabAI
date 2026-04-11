const ChatMessage = require('../models/ChatMessage');
const mongoose = require('mongoose');

const getAuthUserId = (req) => req.user?.userId || req.user?.id || req.user?._id || null;

// Send message to AI chat
exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId,
      type: 'user',
      content: message,
      conversationId
    });

    await userMessage.save();

    // Generate AI response based on keywords
    const reply = generateAIResponse(message);

    // Save bot response
    const botMessage = new ChatMessage({
      userId,
      type: 'bot',
      content: reply,
      conversationId,
      tags: extractTags(message)
    });

    await botMessage.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      reply
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { conversationId } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let query = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(50); // Last 50 messages

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Error fetching chat history', error: error.message });
  }
};

// Get all conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const conversations = await ChatMessage.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$conversationId', lastMessage: { $last: '$content' }, lastTime: { $last: '$createdAt' } } },
      { $sort: { lastTime: -1 } }
    ]);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations', error: error.message });
  }
};

// Mark message as helpful
exports.markAsHelpful = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isHelpful } = req.body;

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      { isHelpful },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, message: 'Feedback recorded', data: message });
  } catch (error) {
    console.error('Error marking message:', error);
    res.status(500).json({ success: false, message: 'Error recording feedback', error: error.message });
  }
};

// Helper function to generate AI responses
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();

  if (message.includes('knee') && message.includes('strengthen')) {
    return `Great question! Here are some effective knee strengthening exercises:\n\n1. **Knee Extensions**: Sit with your back against a wall, extend one leg straight, hold for 2 seconds. Do 3 sets of 10 reps.\n\n2. **Squats**: Stand with feet shoulder-width apart, lower your body as if sitting in a chair. Do 3 sets of 12 reps.\n\n3. **Step-ups**: Use a low step or stair, step up and down slowly. Do 3 sets of 10 reps per leg.\n\nStart with easy exercises and gradually increase intensity. Always warm up first!`;
  }

  if (message.includes('pain')) {
    return `Sorry to hear you're experiencing pain. Here's what you should do:\n\n1. **Stop immediately** if you feel sharp or severe pain\n2. **Apply ice** for 15-20 minutes if there's swelling\n3. **Rest** for a few hours\n4. **Notify your physiotherapist** as soon as possible\n5. **Schedule a consultation** with your doctor if pain persists\n\nRemember: Some mild discomfort is normal, but sharp pain is a warning sign!`;
  }

  if (message.includes('progress') || message.includes('show progress')) {
    return `📊 **Your Recent Progress**\n\n✅ Exercises Completed: 42\n📅 Days Active: 28\n📈 Recovery Progress: 78%\n🎯 Current Streak: 7 days\n\n🏆 **Recent Achievements:**\n- 7 Day Streak\n- First Exercise\n- 50% Recovery\n- 25 Exercises\n\nYou're making excellent progress! Keep up the great work!`;
  }

  if (message.includes('appointment') || message.includes('schedule')) {
    return `I can help you schedule an appointment! To book:\n\n1. Go to the **Support** section in your dashboard\n2. Find a physiotherapist or doctor\n3. Click **Book Appointment**\n4. Select your preferred date and time\n5. Confirm the booking\n\nAlternatively, you can ask me to help you find an available specialist. Would you like me to suggest some options?`;
  }

  if (message.includes('exercise') && message.includes('form')) {
    return `Proper exercise form is crucial for effective rehabilitation! Here are general tips:\n\n✓ **Posture**: Keep your spine neutral and shoulders relaxed\n✓ **Movement**: Move slowly and controlled, avoid jerky motions\n✓ **Breathing**: Breathe steadily - never hold your breath\n✓ **Range**: Perform full range of motion unless limited by pain\n✓ **Pain**: Stop if you feel sharp pain (mild discomfort is normal)\n\nIf you're unsure about a specific exercise, ask your physiotherapist to demonstrate!`;
  }

  // Default response
  return `I understand. I'm here to help with your rehabilitation journey. You can ask me about:\n\n• Exercise instructions and proper form\n• Pain management tips\n• Your progress and achievements\n• Appointment scheduling\n• General rehabilitation advice\n\nHow can I assist you further?`;
}

// Helper function to extract tags from message
function extractTags(message) {
  const tags = [];
  const keywords = {
    exercise: ['exercise', 'workout', 'stretch', 'strengthen'],
    pain: ['pain', 'hurt', 'ache', 'sore', 'discomfort'],
    progress: ['progress', 'improve', 'better', 'recovery'],
    appointment: ['appointment', 'schedule', 'book', 'doctor', 'physiotherapist'],
    form: ['form', 'technique', 'how', 'proper', 'correct']
  };

  const messageLower = message.toLowerCase();
  Object.keys(keywords).forEach(tag => {
    if (keywords[tag].some(keyword => messageLower.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}
