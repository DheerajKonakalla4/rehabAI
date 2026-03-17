import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { messagesAPI } from '../services/api';

export default function Messaging() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await messagesAPI.getInbox();
        const allMessages = response.data.messages || [];
        const uniqueConversations = {};

        allMessages.forEach(msg => {
          const otherId = msg.senderId === user._id ? msg.receiverId : msg.senderId;
          const otherName = msg.senderName === user.firstName
            ? msg.receiverName
            : msg.senderName;

          if (!uniqueConversations[otherId]) {
            uniqueConversations[otherId] = {
              userId: otherId,
              userName: otherName,
              lastMessage: msg.message,
              lastTime: msg.timestamp,
              unread: msg.senderId !== user._id && !msg.isRead
            };
          } else if (new Date(msg.timestamp) > new Date(uniqueConversations[otherId].lastTime)) {
            uniqueConversations[otherId].lastMessage = msg.message;
            uniqueConversations[otherId].lastTime = msg.timestamp;
          }
        });

        setConversations(Object.values(uniqueConversations));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [user]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await messagesAPI.getMessageHistory(conversation.userId);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const newMessage = await messagesAPI.sendMessage({
        receiverId: selectedConversation.userId,
        message: messageText
      });
      setMessages([...messages, newMessage.data.message]);
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Messages</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-96 sm:h-screen sm:max-h-screen flex">
          {/* Conversations List */}
          <div className="w-full sm:w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Conversations</h2>
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.userId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedConversation?.userId === conversation.userId
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200 bg-white'
                      }`}
                    >
                      <p className="font-semibold">{conversation.userName}</p>
                      <p className={`text-sm truncate ${
                        selectedConversation?.userId === conversation.userId
                          ? 'text-blue-100'
                          : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                      <p className={`text-xs mt-1 ${
                        selectedConversation?.userId === conversation.userId
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {new Date(conversation.lastTime).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No conversations yet</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="w-full sm:flex-1 flex flex-col hidden sm:flex">
              {/* Chat Header */}
              <div className="bg-blue-600 text-white p-4 border-b">
                <h3 className="text-lg font-bold">{selectedConversation.userName}</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === user._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        <p className="break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === user._id
                            ? 'text-blue-100'
                            : 'text-gray-600'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="w-full sm:flex-1 hidden sm:flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          )}

          {/* Mobile View */}
          {selectedConversation && (
            <div className="w-full sm:hidden flex flex-col">
              {/* Chat Header */}
              <div className="bg-blue-600 text-white p-4 border-b flex items-center justify-between">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-white hover:text-blue-100"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-bold">{selectedConversation.userName}</h3>
                <div className="w-6"></div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === user._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        <p className="break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === user._id
                            ? 'text-blue-100'
                            : 'text-gray-600'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
