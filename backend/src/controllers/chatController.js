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

  // ─── Body-Part Specific Exercises ───

  if (message.includes('knee')) {
    return `Here are effective **knee** rehabilitation exercises:\n\n1. **Knee Extensions** — Sit, extend one leg straight, hold 2 seconds. 3×10 reps.\n2. **Wall Squats** — Back flat on wall, slide down to 90°. 3×12 reps.\n3. **Step-ups** — Use a low step, step up/down slowly. 3×10 per leg.\n4. **Straight Leg Raises** — Lying flat, raise one leg to 45°. 3×15 reps.\n5. **Calf Raises** — Rise onto toes, lower slowly. 3×20 reps.\n\n⚠️ Always warm up first. Stop if you feel sharp pain!`;
  }

  if (message.includes('leg') || message.includes('thigh') || message.includes('calf') || message.includes('hamstring') || message.includes('quadricep')) {
    return `Here are effective **leg** rehabilitation exercises:\n\n🦵 **Lower Body Recovery Program:**\n1. **Straight Leg Raises** — Lying flat, lift leg to 45°, hold 3 sec. 3×15 reps.\n2. **Hamstring Curls** — Standing, bend knee bringing heel to buttock. 3×12 reps.\n3. **Quad Sets** — Sitting with leg straight, tighten thigh muscle, hold 5 sec. 3×15 reps.\n4. **Heel Slides** — Lying on back, slide heel toward buttock. 3×10 reps.\n5. **Calf Raises** — Rise onto toes slowly, hold 2 sec, lower. 3×20 reps.\n6. **Side-Lying Leg Lifts** — Lie on side, lift top leg slowly. 3×12 per side.\n\n💡 **Tips:** Start with low reps and gradually increase. Apply ice for 15 min after exercises if sore.\n⚠️ Stop immediately if you feel sharp or shooting pain!`;
  }

  if (message.includes('hip')) {
    return `Here are effective **hip** rehabilitation exercises:\n\n🧘 **Hip Recovery Program:**\n1. **Hip Flexor Stretch** — Kneel on one knee, push hips forward gently. Hold 30 sec per side.\n2. **Clamshells** — Lie on side with knees bent, open top knee like a clam. 3×15 reps.\n3. **Bridges** — Lie on back, feet flat, lift hips. 3×15 reps.\n4. **Standing Hip Abduction** — Stand on one leg, lift other leg sideways. 3×12 per leg.\n5. **Seated Hip Rotations** — Sit, rotate knee inward/outward slowly. 3×10 each direction.\n6. **Supine Figure-4 Stretch** — Lie on back, cross ankle over opposite knee, pull toward chest. Hold 30 sec.\n\n💡 Avoid deep squats until cleared by your physiotherapist.`;
  }

  if (message.includes('ankle') || message.includes('foot') || message.includes('feet')) {
    return `Here are effective **ankle/foot** rehabilitation exercises:\n\n🦶 **Ankle Recovery Program:**\n1. **Ankle Circles** — Sit with leg elevated, rotate foot clockwise then counter-clockwise. 2 min each.\n2. **Towel Scrunches** — Place towel on floor, scrunch it with toes. 3×10 reps.\n3. **Calf Raises** — Rise onto toes, hold 3 sec, lower slowly. 3×15 reps.\n4. **Resistance Band Dorsiflexion** — Pull foot up against resistance band. 3×12 reps.\n5. **Single-Leg Balance** — Stand on one foot for 30 sec. Repeat 5 times per foot.\n6. **Heel-to-Toe Walk** — Walk in a straight line placing heel to toe. 3×10 steps.\n\n🧊 **Recovery Tip:** Apply ice for 15-20 min after exercise. Elevate when resting.`;
  }

  if (message.includes('shoulder')) {
    return `Here are **shoulder** rehabilitation exercises:\n\n1. **Pendulum Swings** — Lean forward, let arm hang, make small circles. 2 min each direction.\n2. **Doorway Stretch** — Arms at 90°, lean into doorway. Hold 30 seconds.\n3. **External Rotation** — With resistance band, rotate forearm outward. 3×15 reps.\n4. **Wall Crawl** — Walk fingers up wall as high as comfortable. 3×10 reps.\n5. **Shoulder Shrugs** — Raise shoulders toward ears, hold 3 sec, release. 3×15 reps.\n\nAlways check with your therapist before starting new exercises!`;
  }

  if (message.includes('back') || message.includes('spine') || message.includes('lumbar')) {
    return `**Back** rehabilitation exercises:\n\n1. **Cat-Cow Stretch** — On hands/knees, alternate arch and round back. 3×10 reps.\n2. **Bird Dog** — Opposite arm/leg extension, hold 5 seconds. 3×10 each side.\n3. **Knee-to-Chest** — Lying on back, pull knee to chest. Hold 20 seconds each side.\n4. **Bridge** — Lying on back, lift hips. 3×15 reps.\n5. **Pelvic Tilts** — Flatten lower back to floor, hold 5 seconds. 3×10 reps.\n6. **Child's Pose** — Kneel, sit back on heels, stretch arms forward. Hold 30 sec.\n\n⚠️ Avoid twisting motions until cleared by your doctor.`;
  }

  if (message.includes('wrist') || message.includes('hand') || message.includes('finger')) {
    return `Here are **wrist/hand** rehabilitation exercises:\n\n✋ **Wrist Recovery Program:**\n1. **Wrist Flexion/Extension** — Rest forearm on table, bend wrist up/down slowly. 3×15 reps.\n2. **Wrist Circles** — Rotate wrist clockwise then counter-clockwise. 2 min each.\n3. **Grip Strengthening** — Squeeze a soft ball, hold 5 sec. 3×10 reps.\n4. **Finger Spreads** — Spread fingers wide, hold 5 sec, relax. 3×15 reps.\n5. **Rubber Band Extensions** — Place rubber band around fingers, open hand against resistance. 3×12 reps.\n\n💡 Apply warm compress before exercises and ice after if swollen.`;
  }

  if (message.includes('elbow') || message.includes('forearm')) {
    return `Here are **elbow** rehabilitation exercises:\n\n💪 **Elbow Recovery Program:**\n1. **Elbow Flexion/Extension** — Slowly bend and straighten elbow. 3×15 reps.\n2. **Forearm Pronation/Supination** — Hold light weight, rotate palm up/down. 3×12 reps.\n3. **Wrist Curls** — Rest forearm on table, curl light weight up. 3×12 reps.\n4. **Towel Twist** — Hold towel with both hands, twist in opposite directions. 3×10 reps.\n5. **Bicep Curls (light)** — Use very light weight, full range of motion. 3×10 reps.\n\n⚠️ Avoid heavy lifting until cleared by your doctor.`;
  }

  if (message.includes('neck') || message.includes('cervical')) {
    return `Here are **neck** rehabilitation exercises:\n\n🧘 **Neck Recovery Program:**\n1. **Neck Tilts** — Tilt head toward each shoulder, hold 15 sec. Repeat 5 times each side.\n2. **Chin Tucks** — Pull chin straight back (double chin motion), hold 5 sec. 3×10 reps.\n3. **Neck Rotations** — Slowly turn head left/right, hold 10 sec each side. 5 reps each.\n4. **Shoulder Rolls** — Roll shoulders forward then backward. 3×15 reps each direction.\n5. **Isometric Holds** — Press hand against head (front/side), resist with neck. Hold 5 sec. 3×8 reps.\n\n⚠️ Move gently. Stop if you feel dizziness or radiating pain.`;
  }

  // ─── Injury-Type Handlers ───

  if (message.includes('fracture') || message.includes('broken')) {
    return `🦴 **Fracture Recovery Guidance:**\n\nRecovery depends on the fracture location and severity, but general guidelines include:\n\n**Phase 1 (Immobilization):**\n• Follow your doctor's cast/splint instructions strictly\n• Keep the area elevated to reduce swelling\n• Gentle movement of nearby joints to prevent stiffness\n\n**Phase 2 (Early Mobility):**\n• Begin gentle range-of-motion exercises as cleared by your doctor\n• Gradual weight-bearing as recommended\n\n**Phase 3 (Strengthening):**\n• Progressive resistance exercises\n• Balance and coordination training\n\n📞 Please consult your assigned doctor for a personalized plan. Use the **Sessions** page to book an appointment.`;
  }

  if (message.includes('sprain') || message.includes('strain') || message.includes('twist')) {
    return `🩹 **Sprain/Strain Recovery:**\n\n**Immediate Care (RICE Protocol):**\n🧊 **Rest** — Stop activity, avoid weight-bearing\n❄️ **Ice** — Apply 15-20 min every 2-3 hours\n🩹 **Compression** — Use elastic bandage for support\n⬆️ **Elevation** — Keep injured area above heart level\n\n**Recovery Phase:**\n• Gentle range-of-motion exercises after 48-72 hours\n• Gradual strengthening once pain subsides\n• Balance exercises to prevent re-injury\n\n⚠️ If swelling doesn't reduce in 48 hours or you can't bear weight, see your doctor immediately.`;
  }

  if (message.includes('surgery') || message.includes('post-op') || message.includes('operation')) {
    return `🏥 **Post-Surgery Rehabilitation:**\n\nPost-surgical rehab typically follows 3 phases:\n\n**Phase 1 (Weeks 1-2): Protection**\n• Follow surgeon's wound care instructions\n• Gentle movements as permitted\n• Ice and elevation for swelling\n\n**Phase 2 (Weeks 3-6): Early Recovery**\n• Gradual range-of-motion exercises\n• Light resistance training\n• Walking/mobility as tolerated\n\n**Phase 3 (Weeks 6+): Strengthening**\n• Progressive strengthening exercises\n• Functional training\n• Return to normal activities\n\n📋 Your personalized plan is available in the **AI Rehab Plan** section. Check your assigned exercises daily!`;
  }

  if (message.includes('swell') || message.includes('swollen') || message.includes('inflammation')) {
    return `🧊 **Managing Swelling & Inflammation:**\n\n**Immediate Relief:**\n1. ❄️ Apply ice wrapped in cloth for 15-20 min\n2. ⬆️ Elevate the area above heart level\n3. 🩹 Use compression bandage if appropriate\n4. 💊 Take anti-inflammatory medication as prescribed\n\n**Prevention:**\n• Don't overdo exercises — follow prescribed reps/sets\n• Warm up before and cool down after exercises\n• Stay hydrated (8-10 glasses of water daily)\n• Get adequate rest between sessions\n\n⚠️ If swelling is severe, sudden, or accompanied by fever, contact your doctor immediately.`;
  }

  // ─── General Topics ───

  if (message.includes('pain')) {
    return `I'm sorry you're experiencing pain. Here's what to do:\n\n🛑 **Immediate Steps:**\n1. Stop the activity if you feel sharp or severe pain\n2. Apply ice for 15-20 minutes (wrap in cloth)\n3. Rest and elevate if there's swelling\n\n📞 **Contact Your Care Team:**\n• Notify your physiotherapist — they can adjust your program\n• Log your pain level via "Log Daily Health"\n• If pain level is 8+ out of 10, your doctor is automatically alerted\n\n⚠️ Mild discomfort is normal, but sharp pain is always a warning sign!`;
  }

  if (message.includes('progress') || message.includes('how am i doing')) {
    return `📊 **Your Progress**\n\nView detailed progress in the **Progress Report** section. You'll find:\n\n✅ Exercise completion rate\n📈 Pain level trends over time\n🎯 Weekly exercise logs\n📅 Session history\n\n**To maximize recovery:**\n• Complete all assigned exercises\n• Log pain levels consistently\n• Communicate via Doctor Chat\n• Book regular sessions`;
  }

  if (message.includes('appointment') || message.includes('schedule') || message.includes('book')) {
    return `📅 **Book a Session:**\n1. Go to **"Sessions"** in your dashboard\n2. Your assigned doctor will be shown automatically\n3. Pick a preferred date and time slot\n4. Confirm the booking — your doctor will approve it\n\nOr use **"Doctor Chat"** to message your assigned doctor directly!`;
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
  return `I'm here to support your rehabilitation journey! I can help with:\n\n🦵 **Body-Specific Exercises** — Knee, leg, hip, ankle, shoulder, back, wrist, elbow, neck\n🩹 **Injury Recovery** — Sprains, fractures, post-surgery, swelling\n💊 **Pain Management** — What to do, when to worry\n📊 **Progress Insights** — Understanding your recovery\n📅 **Scheduling** — Booking appointments and sessions\n🥗 **Nutrition** — Recovery diet guidance\n😴 **Recovery Tips** — Sleep, rest, lifestyle\n\nTry asking something like: *"exercises for leg injury"* or *"what to do after ankle sprain"*`;
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
    sleep: ['sleep', 'rest', 'tired'],
    knee: ['knee'],
    leg: ['leg', 'thigh', 'calf', 'hamstring', 'quadricep'],
    hip: ['hip'],
    ankle: ['ankle', 'foot', 'feet'],
    shoulder: ['shoulder'],
    back: ['back', 'spine', 'lumbar'],
    wrist: ['wrist', 'hand', 'finger'],
    elbow: ['elbow', 'forearm'],
    neck: ['neck', 'cervical'],
    injury: ['fracture', 'broken', 'sprain', 'strain', 'surgery', 'swelling', 'swollen']
  };

  const messageLower = message.toLowerCase();
  Object.keys(keywords).forEach(tag => {
    if (keywords[tag].some(keyword => messageLower.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}
