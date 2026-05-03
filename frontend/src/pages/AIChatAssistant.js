import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader } from '../components/Layout';
import { Card, Button, Input } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const AIChatAssistant = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    'How do I perform knee strengthening exercises?',
    'What should I do if I feel pain?',
    'Show my progress',
    'Schedule an appointment'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `Hello! I'm your AI rehabilitation assistant. How can I help you today?`,
        timestamp: new Date()
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Send to backend API
      const response = await apiClient.post('/chat/message', {
        message: inputValue,
        userId: user._id
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.reply || 'I understand. How else can I help you?',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: getAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (question) => {
    setInputValue(question);
    // Trigger send message with the quick question
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await apiClient.post('/chat/message', {
        message: question,
        userId: user._id
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.reply || 'I understand. How else can I help?',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: getAIResponse(question),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    if (message.includes('knee')) {
      return `Great question! Here are effective **knee** strengthening exercises:\n\n1. **Knee Extensions**: Sit with your back against a wall, extend one leg straight, hold for 2 seconds. Do 3 sets of 10 reps.\n2. **Wall Squats**: Stand with feet shoulder-width apart, lower your body as if sitting in a chair. Do 3 sets of 12 reps.\n3. **Step-ups**: Use a low step or stair, step up and down slowly. Do 3 sets of 10 reps per leg.\n\nStart with easy exercises and gradually increase intensity. Always warm up first!`;
    }

    if (message.includes('leg') || message.includes('thigh') || message.includes('calf') || message.includes('hamstring')) {
      return `Here are effective **leg** rehabilitation exercises:\n\n🦵 **Lower Body Recovery:**\n1. **Straight Leg Raises** — Lying flat, lift leg to 45°, hold 3 sec. 3×15 reps.\n2. **Hamstring Curls** — Standing, bend knee bringing heel to buttock. 3×12 reps.\n3. **Quad Sets** — Sitting with leg straight, tighten thigh, hold 5 sec. 3×15 reps.\n4. **Heel Slides** — Lying on back, slide heel toward buttock. 3×10 reps.\n5. **Calf Raises** — Rise onto toes slowly, hold 2 sec, lower. 3×20 reps.\n\n💡 Start with low reps and gradually increase. Apply ice after if sore.`;
    }

    if (message.includes('hip')) {
      return `Here are effective **hip** exercises:\n\n1. **Hip Flexor Stretch** — Kneel, push hips forward. Hold 30 sec per side.\n2. **Clamshells** — Lie on side, open top knee. 3×15 reps.\n3. **Bridges** — Lie on back, lift hips. 3×15 reps.\n4. **Standing Hip Abduction** — Lift leg sideways. 3×12 per leg.\n\n💡 Avoid deep squats until cleared by your physiotherapist.`;
    }

    if (message.includes('ankle') || message.includes('foot')) {
      return `Here are **ankle/foot** rehabilitation exercises:\n\n1. **Ankle Circles** — Rotate foot clockwise then counter-clockwise. 2 min each.\n2. **Towel Scrunches** — Scrunch towel with toes. 3×10 reps.\n3. **Calf Raises** — Rise onto toes, hold 3 sec. 3×15 reps.\n4. **Single-Leg Balance** — Stand on one foot for 30 sec.\n\n🧊 Apply ice after exercise. Elevate when resting.`;
    }

    if (message.includes('shoulder')) {
      return `Here are **shoulder** exercises:\n\n1. **Pendulum Swings** — Lean forward, make small arm circles. 2 min.\n2. **Doorway Stretch** — Arms at 90°, lean into doorway. Hold 30 sec.\n3. **External Rotation** — With band, rotate forearm outward. 3×15 reps.\n4. **Wall Crawl** — Walk fingers up wall. 3×10 reps.`;
    }

    if (message.includes('back') || message.includes('spine')) {
      return `**Back** rehabilitation exercises:\n\n1. **Cat-Cow Stretch** — Alternate arch and round back. 3×10.\n2. **Bird Dog** — Opposite arm/leg extension. 3×10 each side.\n3. **Knee-to-Chest** — Pull knee to chest. Hold 20 sec.\n4. **Bridge** — Lift hips. 3×15 reps.\n5. **Child's Pose** — Stretch arms forward. Hold 30 sec.`;
    }

    if (message.includes('wrist') || message.includes('hand')) {
      return `**Wrist/hand** exercises:\n\n1. **Wrist Flexion/Extension** — Bend wrist up/down. 3×15.\n2. **Grip Strengthening** — Squeeze soft ball. 3×10.\n3. **Finger Spreads** — Spread wide, hold 5 sec. 3×15.`;
    }

    if (message.includes('neck')) {
      return `**Neck** exercises:\n\n1. **Neck Tilts** — Tilt toward shoulder, hold 15 sec. 5 per side.\n2. **Chin Tucks** — Pull chin back, hold 5 sec. 3×10.\n3. **Shoulder Rolls** — Forward then backward. 3×15 each.\n\n⚠️ Move gently. Stop if you feel dizziness.`;
    }

    if (message.includes('fracture') || message.includes('broken')) {
      return `🦴 **Fracture Recovery:**\n\n**Phase 1:** Follow cast/splint instructions. Elevate to reduce swelling.\n**Phase 2:** Begin gentle range-of-motion exercises when cleared.\n**Phase 3:** Progressive strengthening and balance training.\n\n📞 Consult your doctor for a personalized plan.`;
    }

    if (message.includes('sprain') || message.includes('strain')) {
      return `🩹 **Sprain/Strain Recovery (RICE):**\n\n🧊 **Rest** — Stop activity\n❄️ **Ice** — 15-20 min every 2-3 hours\n🩹 **Compression** — Elastic bandage\n⬆️ **Elevation** — Above heart level\n\nStart gentle exercises after 48-72 hours.`;
    }

    if (message.includes('pain')) {
      return `Sorry to hear you're experiencing pain. Here's what you should do:\n\n1. **Stop immediately** if you feel sharp or severe pain\n2. **Apply ice** for 15-20 minutes if there's swelling\n3. **Rest** for a few hours\n4. **Notify your physiotherapist** — they can adjust your exercises\n5. **Log your pain level** in the Dashboard\n\nRemember: Some mild discomfort is normal, but sharp pain is a warning sign!`;
    }

    if (message.includes('progress')) {
      return `📊 **Your Progress**\n\nView detailed progress in the **Progress Report** section:\n✅ Exercise completion rate\n📈 Pain level trends\n🎯 Weekly logs\n📅 Session history\n\nKeep up the great work!`;
    }

    if (message.includes('appointment') || message.includes('schedule')) {
      return `📅 To book an appointment:\n\n1. Go to **Sessions** in your dashboard\n2. Your assigned doctor will be shown\n3. Pick date and time\n4. Confirm — your doctor will approve it\n\nOr use **Doctor Chat** to message directly!`;
    }

    return `I'm here to help with your rehabilitation! You can ask me about:\n\n🦵 **Body-Specific Exercises** — knee, leg, hip, ankle, shoulder, back, wrist, neck\n🩹 **Injury Recovery** — sprains, fractures, post-surgery\n💊 **Pain management tips**\n📊 **Your progress**\n📅 **Appointment scheduling**\n🥗 **Nutrition guidance**\n\nTry asking: *"exercises for leg injury"* or *"what to do after ankle sprain"*`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8 relative z-10">
        {/* Page Header */}
        <PageHeader
          title="🤖 AI Chat Assistant"
          subtitle="Get instant answers to your rehabilitation questions"
        />

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col min-h-96 mb-6 glass-panel border border-slate-700/50">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 scrollbar-thin">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-sm backdrop-blur-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></div>
                  <p className={`text-xs mt-2 text-right ${
                    message.type === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700 text-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm backdrop-blur-md">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (show when no message history beyond welcome) */}
          {messages.length === 1 && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-3 font-semibold uppercase tracking-wider">Quick questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left p-3 glass-card hover:bg-slate-700/50 transition-colors text-sm text-slate-300 font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-1 premium-input"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || !inputValue.trim()}
              >
                {loading ? '...' : 'Send'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Press Enter to send, Shift + Enter for new line</p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AIChatAssistant;
