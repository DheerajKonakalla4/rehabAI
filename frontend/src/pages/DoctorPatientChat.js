import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Navbar } from '../components/Layout';
import { messagesAPI, conversationsAPI } from '../services/api';

const DoctorPatientChat = () => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers, typingUsers, sendMessage, emitTyping, emitStopTyping } = useContext(SocketContext);
  
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await conversationsAPI.getContacts();
        setContacts(response.data.contacts || []);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      const incomingSenderId = data.senderId?._id || data.senderId;
      const currentSelectedId = selectedContact?._id;
      
      if (currentSelectedId && String(incomingSenderId) === String(currentSelectedId)) {
        setMessages(prev => [...prev, data]);
      }
      // Update contact's last message in the sidebar
      setContacts(prev => prev.map(c => {
        const contactId = c._id;
        if (String(contactId) === String(incomingSenderId) || String(contactId) === String(data.receiverId)) {
          return { ...c, lastMessage: data.message, lastTime: data.timestamp };
        }
        return c;
      }));
    };

    const handleMessageSent = (data) => {
      setMessages(prev => [...prev, data]);
      setSending(false);
      setContacts(prev => prev.map(c => {
        if (String(c._id) === String(data.receiverId)) {
          return { ...c, lastMessage: data.message, lastTime: data.timestamp };
        }
        return c;
      }));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [socket, selectedContact]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load message history when selecting a contact
  const handleSelectContact = useCallback(async (contact) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
    try {
      const response = await messagesAPI.getMessageHistory(contact._id);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  }, []);

  // Send message via socket
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact || sending) return;
    setSending(true);
    sendMessage(selectedContact._id, messageText.trim());
    setMessageText('');
    emitStopTyping(selectedContact._id);
  };

  // Typing indicator
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (selectedContact) {
      emitTyping(selectedContact._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(selectedContact._id);
      }, 2000);
    }
  };

  const isOnline = (userId) => onlineUsers.includes(userId);
  const isTyping = (userId) => typingUsers.includes(userId);

  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    const sortedMsgs = [...msgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedMsgs.forEach(msg => {
      const dateLabel = formatDate(msg.timestamp);
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-center">
            <div style={{
              width: 48, height: 48, border: '3px solid rgba(99,102,241,0.3)',
              borderTopColor: '#6366f1', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto 16px'
            }} />
            <p style={{ color: '#9ca3af' }}>Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-100px)] pt-4 relative z-10">
        <div className="flex gap-6 h-full animate-fade-in-up">
          {/* Contact Sidebar */}
          <div className={`glass-panel w-full md:w-80 flex flex-col border border-slate-700/50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span>💬</span> Conversations
              </h2>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input pl-10 h-10 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleSelectContact(contact)}
                    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all relative overflow-hidden ${
                      selectedContact?._id === contact._id
                        ? 'bg-indigo-500/20 border border-indigo-500/30'
                        : 'hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    {selectedContact?._id === contact._id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    )}
                    
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
                        isOnline(contact._id) ? 'bg-green-500' : 'bg-slate-500'
                      }`} />
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={`font-bold truncate text-sm ${selectedContact?._id === contact._id ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {contact.role === 'doctor' ? 'Dr. ' : ''}{contact.firstName} {contact.lastName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 truncate capitalize font-medium">
                        {contact.role} {contact.specialization ? `• ${contact.specialization}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="text-3xl mb-3 opacity-40">👥</div>
                  <p className="text-slate-400 text-sm font-medium">No contacts yet</p>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {user?.role === 'doctor' 
                      ? 'Assign patients to start chatting'
                      : 'Conversations will appear when your doctor connects'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`glass-panel flex-1 flex flex-col overflow-hidden border border-slate-700/50 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 px-6 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { setShowMobileChat(false); setSelectedContact(null); }}
                      className="md:hidden text-slate-400 hover:text-white p-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                      {selectedContact.firstName?.[0]}{selectedContact.lastName?.[0]}
                    </div>
                    
                    <div>
                      <h3 className="text-slate-100 font-bold text-sm">
                        {selectedContact.role === 'doctor' ? 'Dr. ' : ''}{selectedContact.firstName} {selectedContact.lastName}
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        {isTyping(selectedContact._id) ? (
                          <span className="text-indigo-400 animate-pulse">Typing...</span>
                        ) : (
                          <span className={isOnline(selectedContact._id) ? 'text-green-500' : 'text-slate-500'}>
                            {isOnline(selectedContact._id) ? '● Online' : '○ Offline'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6 bg-slate-900/20">
                  {Object.keys(messageGroups).length > 0 ? (
                    Object.entries(messageGroups).map(([date, msgs]) => (
                      <div key={date} className="space-y-4">
                        <div className="flex justify-center my-8">
                          <span className="bg-slate-800/80 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700/50 shadow-sm">
                            {date}
                          </span>
                        </div>
                        {msgs.map((msg, idx) => {
                          const msgSenderId = msg.senderId?._id || msg.senderId;
                          const currentUserId = user?._id || user?.id;
                          const isMine = String(msgSenderId) === String(currentUserId);
                          
                          // Determine the role icon
                          const senderRole = isMine ? user?.role : selectedContact?.role;
                          const roleIcon = senderRole === 'doctor' ? '👨‍⚕️' : senderRole === 'physiotherapist' ? '🏋️' : '🧑';
                          const senderInitial = isMine 
                            ? (user?.firstName?.[0] || '?') 
                            : (selectedContact?.firstName?.[0] || '?');
                          
                          return (
                            <div key={msg._id || idx} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                              {/* Avatar for received messages (left side) */}
                              {!isMine && (
                                <div className="flex-shrink-0 mb-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                                    senderRole === 'doctor' 
                                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white' 
                                      : senderRole === 'physiotherapist'
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                  }`} title={senderRole === 'doctor' ? 'Doctor' : senderRole === 'physiotherapist' ? 'Physiotherapist' : 'Patient'}>
                                    {roleIcon}
                                  </div>
                                </div>
                              )}

                              <div className={`max-w-[75%] rounded-2xl p-4 shadow-lg relative ${
                                isMine 
                                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                  : 'glass-card bg-slate-800/80 text-slate-200 rounded-bl-none border border-slate-700/50'
                              }`}>
                                {/* Role label */}
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                                  isMine ? 'text-indigo-200/70' : 'text-slate-500'
                                }`}>
                                  {isMine ? 'You' : (senderRole === 'doctor' ? '👨‍⚕️ Doctor' : senderRole === 'physiotherapist' ? '🏋️ Physio' : '🧑 Patient')}
                                </p>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                <p className={`text-[10px] mt-2 font-medium opacity-60 text-right`}>
                                  {formatTime(msg.timestamp)}
                                </p>
                              </div>

                              {/* Avatar for sent messages (right side) */}
                              {isMine && (
                                <div className="flex-shrink-0 mb-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md" title="You">
                                    {senderInitial}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="font-bold text-slate-300">No messages yet</p>
                      <p className="text-xs text-slate-500 mt-1">Start the conversation below</p>
                    </div>
                  )}

                  {/* Typing Indicator Bubble */}
                  {isTyping(selectedContact._id) && (
                    <div className="flex justify-start">
                      <div className="glass-card bg-slate-800/60 p-3 px-4 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 px-6 border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-xl">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={handleTyping}
                      placeholder="Type your message..."
                      className="premium-input flex-1 px-4 py-3"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className={`px-6 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                        sending || !messageText.trim()
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><span>📤</span> Send</>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-slate-800/40 flex items-center justify-center text-5xl mb-6 shadow-inner border border-slate-700/30">
                  💬
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2 drop-shadow-sm">Select a Conversation</h3>
                <p className="text-slate-500 max-w-xs leading-relaxed text-sm">
                  Choose a contact from the sidebar to start a real-time secure conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientChat;
