const { Message, User, PatientProfile } = require('../models');

const isDoctorPatientPair = (userA, userB) => {
  if (!userA || !userB) return false;

  const roles = [userA.role, userB.role];
  return roles.includes('doctor') && roles.includes('patient');
};

const hasDoctorPatientLink = async (userA, userB) => {
  if (!isDoctorPatientPair(userA, userB)) return false;

  const patientUser = userA.role === 'patient' ? userA : userB;
  const doctorUser = userA.role === 'doctor' ? userA : userB;

  const profile = await PatientProfile.findOne({ patientId: patientUser._id });
  if (!profile) return false;

  const isAssignedDoctor = profile.assignedDoctor && profile.assignedDoctor.toString() === doctorUser._id.toString();
  const isConnectedDoctor = (profile.connectedDoctors || []).some((entry) => entry.doctorId?.toString() === doctorUser._id.toString());

  return isAssignedDoctor || isConnectedDoctor;
};

// @route   POST /api/messages/send
// @desc    Send message to another user
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, message } = req.body;

    // Validate input
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }

    // Check if sender and receiver exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Sender or receiver not found' });
    }

    const canMessage = await hasDoctorPatientLink(sender, receiver);
    if (!canMessage) {
      return res.status(403).json({ message: 'Messages are only allowed between linked doctors and patients' });
    }

    // Create message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
      isRead: false
    });

    await newMessage.populate('senderId', 'firstName lastName email');
    await newMessage.populate('receiverId', 'firstName lastName email');

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message', error: error.message });
  }
};

// @route   GET /api/messages/history
// @desc    Get message history with a specific user
// @access  Private
exports.getMessageHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.query;

    // Validate input
    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }

    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const canMessage = await hasDoctorPatientLink(currentUser, otherUser);
    if (!canMessage) {
      return res.status(403).json({ message: 'Messages are only allowed between linked doctors and patients' });
    }

    // Get messages between current user and other user
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    })
      .populate('senderId', 'firstName lastName email profileImage')
      .populate('receiverId', 'firstName lastName email profileImage')
      .sort({ timestamp: -1 });

    // Mark messages as read if received by current user
    await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      messages: messages.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('Get message history error:', error);
    res.status(500).json({ message: 'Server error fetching messages', error: error.message });
  }
};

// @route   GET /api/messages/inbox
// @desc    Get all conversations (latest message from each conversation)
// @access  Private
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all unique users who have messages with current user
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .populate('senderId', 'firstName lastName email profileImage role')
      .populate('receiverId', 'firstName lastName email profileImage role')
      .sort({ timestamp: -1 });

    // Create conversations map
    const conversations = new Map();

    const visibleConversationIds = new Set();

    for (const msg of messages) {
      const otherUserId = msg.senderId._id.toString() === userId.toString() 
        ? msg.receiverId._id.toString() 
        : msg.senderId._id.toString();

      if (visibleConversationIds.has(otherUserId)) {
        continue;
      }

      const otherUser = msg.senderId._id.toString() === userId.toString() ? msg.receiverId : msg.senderId;
      const canMessage = await hasDoctorPatientLink(currentUser, otherUser);
      if (!canMessage) {
        continue;
      }

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          otherUser,
          lastMessage: msg.message,
          timestamp: msg.timestamp,
          isRead: msg.senderId._id.toString() === userId.toString() || msg.isRead,
          unreadCount: msg.senderId._id.toString() === userId.toString() || msg.isRead ? 0 : 1
        });
      }

      visibleConversationIds.add(otherUserId);
    }

    const conversationsList = Array.from(conversations.values()).sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      conversations: conversationsList
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Server error fetching inbox', error: error.message });
  }
};

// @route   PUT /api/messages/:messageId/mark-read
// @desc    Mark message as read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({ _id: messageId, receiverId: userId });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you are not the receiver' });
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error marking message', error: error.message });
  }
};

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message', error: error.message });
  }
};
