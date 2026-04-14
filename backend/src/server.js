const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const { seedExercises } = require('../seeds/exercises');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Init cron jobs
const initCronJobs = require('./utils/cronJobs');
initCronJobs();

const app = express();
const server = http.createServer(app);

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Track online users: { userId: socketId }
const onlineUsers = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  const userId = socket.user.userId;
  console.log(`User connected: ${userId} (socket: ${socket.id})`);

  // Register user as online
  onlineUsers.set(userId, socket.id);

  // Broadcast online status to all connected users
  io.emit('user_online', { userId, onlineUsers: Array.from(onlineUsers.keys()) });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { receiverId, message } = data;

    try {
      // Save message to database
      const { Message, User } = require('./models');
      const sender = await User.findById(userId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        socket.emit('message_error', { error: 'User not found' });
        return;
      }

      const newMessage = await Message.create({
        senderId: userId,
        receiverId,
        message,
        timestamp: new Date(),
        isRead: false
      });

      await newMessage.populate('senderId', 'firstName lastName email profileImage');
      await newMessage.populate('receiverId', 'firstName lastName email profileImage');

      const messageData = {
        _id: newMessage._id,
        senderId: userId,
        receiverId,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
        isRead: false,
        senderName: `${sender.firstName} ${sender.lastName}`,
        receiverName: `${receiver.firstName} ${receiver.lastName}`
      };

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', messageData);
      }

      // Send back to sender for confirmation
      socket.emit('message_sent', messageData);
    } catch (error) {
      console.error('Socket send_message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId });
    }
  });

  socket.on('stop_typing', ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { userId });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    io.emit('user_offline', { userId, onlineUsers: Array.from(onlineUsers.keys()) });
  });
});

// Make io accessible to route handlers
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Auto-seed exercises on startup
app.use(async (req, res, next) => {
  // Only run once on first request
  if (!app.locals.exercisesSeedDone) {
    try {
      await seedExercises();
      app.locals.exercisesSeedDone = true;
    } catch (error) {
      console.error('Error auto-seeding exercises:', error);
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/mentor', require('./routes/physiotherapist'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/conversations', require('./routes/conversation'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`RehabAI Backend Server is running on port ${PORT}`);
  console.log(`Socket.IO is ready for real-time connections`);
});

module.exports = app;
