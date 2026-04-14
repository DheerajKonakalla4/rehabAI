const ChatMessage = require('../models/ChatMessage');

// Send message to AI chat
exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.userId; // FIX: was req.user.id

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
    const userId = req.user.userId; // FIX: was req.user.id
    const { conversationId } = req.query;

    let query = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(50);

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
    const userId = req.user.userId; // FIX: was req.user.id

    const messages = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const seen = new Set();
    const conversations = [];
    messages.forEach(m => {
      const key = m.conversationId || 'default';
      if (!seen.has(key)) {
        seen.add(key);
        conversations.push({ _id: key, lastMessage: m.content, lastTime: m.createdAt });
      }
    });

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

// Helper: comprehensive AI responses for rehabilitation
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();

  if (message.includes('hello') || message.includes('hi ') || message === 'hi' || message.includes('hey')) {
    return `Hello! 👋 I'm your AI Rehabilitation Assistant. I'm here to help you with:\n\n• 🏋️ Exercise guidance and proper form\n• 💊 Pain management strategies\n• 📊 Progress tracking support\n• 📅 Appointment scheduling help\n• 🧠 General rehabilitation advice\n\nWhat would you like help with today?`;
  }

  if (message.includes('escalate')) {
    return `I've escalated your query to your assigned physiotherapist. They've been notified and will review your messages shortly. Is there anything else you'd like to add?`;
  }

  if (message.includes('knee')) {
    return `Here are effective knee rehabilitation exercises:\n\n1. **Knee Extensions** — Sit, extend one leg straight, hold 2 seconds. 3×10 reps.\n2. **Wall Squats** — Back flat on wall, slide down to 90°. 3×12 reps.\n3. **Step-ups** — Use a low step, step up/down slowly. 3×10 per leg.\n4. **Straight Leg Raises** — Lying flat, raise one leg to 45°. 3×15 reps.\n5. **Calf Raises** — Rise onto toes, lower slowly. 3×20 reps.\n\n⚠️ Always warm up first. Stop if you feel sharp pain!`;
  }

  if (message.includes('shoulder')) {
    return `Here are shoulder rehabilitation exercises:\n\n1. **Pendulum Swings** — Lean forward, let arm hang, make small circles. 2 min each direction.\n2. **Doorway Stretch** — Arms at 90°, lean into doorway. Hold 30 seconds.\n3. **External Rotation** — With resistance band, rotate forearm outward. 3×15 reps.\n4. **Wall Crawl** — Walk fingers up wall as high as comfortable. 3×10 reps.\n\nAlways check with your therapist before starting new exercises!`;
  }

  if (message.includes('back')) {
    return `Back rehabilitation exercises:\n\n1. **Cat-Cow Stretch** — On hands/knees, alternate arch and round back. 3×10 reps.\n2. **Bird Dog** — Opposite arm/leg extension, hold 5 seconds. 3×10 each side.\n3. **Knee-to-Chest** — Lying on back, pull knee to chest. Hold 20 seconds each side.\n4. **Bridge** — Lying on back, lift hips. 3×15 reps.\n5. **Pelvic Tilts** — Flatten lower back to floor, hold 5 seconds. 3×10 reps.`;
  }

  if (message.includes('pain')) {
    return `I'm sorry you're experiencing pain. Here's what to do:\n\n🛑 **Immediate Steps:**\n1. Stop the activity if you feel sharp or severe pain\n2. Apply ice for 15-20 minutes (wrap in cloth)\n3. Rest and elevate if there's swelling\n\n📞 **Contact Your Care Team:**\n• Notify your physiotherapist — they can adjust your program\n• Log your pain level via "Log Daily Health"\n• If pain level is 8+ out of 10, your doctor is automatically alerted\n\n⚠️ Mild discomfort is normal, but sharp pain is always a warning sign!`;
  }

  if (message.includes('progress') || message.includes('how am i doing')) {
    return `📊 **Your Progress**\n\nView detailed progress in the **Progress Report** section. You'll find:\n\n✅ Exercise completion rate\n📈 Pain level trends over time\n🎯 Weekly exercise logs\n📅 Session history\n\n**To maximize recovery:**\n• Complete all assigned exercises\n• Log pain levels consistently\n• Communicate via Doctor Chat\n• Book regular sessions`;
  }

  if (message.includes('appointment') || message.includes('schedule') || message.includes('book')) {
    return `📅 **Book a Session:**\n1. Go to **"Sessions"** in your dashboard\n2. Select your doctor or physiotherapist\n3. Pick a preferred date and time slot\n4. Confirm the booking\n\nOr use **"Doctor Chat"** to message your assigned doctor directly!`;
  }

  if (message.includes('form') || message.includes('technique') || message.includes('posture')) {
    return `Proper exercise form is crucial for effective rehabilitation!\n\n**General Form Tips:**\n✓ **Posture** — Keep spine neutral, shoulders relaxed\n✓ **Movement** — Slow and controlled, never jerky\n✓ **Breathing** — Exhale on exertion, never hold breath\n✓ **Range** — Full range of motion unless limited by pain\n✓ **Alignment** — Keep joints aligned properly\n\n🎯 **Use AI Motion Tracking:**\nOur platform has a real-time AI tracker that analyzes your form via camera. Go to **"Exercise Tracking"** to use it!`;
  }

  if (message.includes('diet') || message.includes('nutrition') || message.includes('food') || message.includes('eat')) {
    return `Nutrition plays a vital role in rehabilitation!\n\n**Key Recovery Nutrients:**\n🥩 **Protein** — Chicken, fish, eggs, legumes — muscle repair\n🥦 **Vitamin C** — Citrus, berries — collagen synthesis\n🐟 **Omega-3** — Salmon, walnuts — reduces inflammation\n🥛 **Calcium & Vitamin D** — Bone health\n💧 **Hydration** — 8-10 glasses water daily\n\nCheck your **Diet Plans** tab in the Patient Dashboard for your personalized plan!`;
  }

  if (message.includes('sleep') || message.includes('rest')) {
    return `Rest and sleep are critical for rehabilitation!\n\n**Recovery Sleep Tips:**\n😴 Aim for 7-9 hours per night\n🛏️ Ask your therapist about best sleep position for your injury\n📵 Avoid screens 1 hour before bed\n🧘 Gentle stretching before sleep helps\n\n**Active Recovery:**\nOn rest days, light walking or gentle stretching improves blood flow to healing tissues.`;
  }

  // Default response
  return `I'm here to support your rehabilitation journey! I can help with:\n\n🏋️ **Exercise Guidance** — Form, technique, modifications\n💊 **Pain Management** — What to do, when to worry\n📊 **Progress Insights** — Understanding your recovery\n📅 **Scheduling** — Booking appointments and sessions\n🥗 **Nutrition** — Recovery diet guidance\n😴 **Recovery Tips** — Sleep, rest, lifestyle\n\nJust type your question or use the quick buttons above!`;
}

// Helper: extract tags from message
function extractTags(message) {
  const tags = [];
  const keywords = {
    exercise: ['exercise', 'workout', 'stretch', 'strengthen', 'reps', 'sets'],
    pain: ['pain', 'hurt', 'ache', 'sore', 'discomfort', 'sharp'],
    progress: ['progress', 'improve', 'better', 'recovery'],
    appointment: ['appointment', 'schedule', 'book', 'session'],
    form: ['form', 'technique', 'posture', 'correct'],
    nutrition: ['diet', 'food', 'nutrition', 'eat'],
    sleep: ['sleep', 'rest', 'tired']
  };

  const messageLower = message.toLowerCase();
  Object.keys(keywords).forEach(tag => {
    if (keywords[tag].some(keyword => messageLower.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}
