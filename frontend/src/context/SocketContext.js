import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (user && token) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        if (err.description) console.error('Socket error description:', err.description);
        if (err.context) console.error('Socket error context:', err.context);
      });

      newSocket.on('user_online', ({ onlineUsers: users }) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_offline', ({ onlineUsers: users }) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_typing', ({ userId }) => {
        setTypingUsers(prev => {
          if (!prev.includes(userId)) return [...prev, userId];
          return prev;
        });
      });

      newSocket.on('user_stop_typing', ({ userId }) => {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const sendMessage = useCallback((receiverId, message) => {
    if (socket) {
      socket.emit('send_message', { receiverId, message });
    }
  }, [socket]);

  const emitTyping = useCallback((receiverId) => {
    if (socket) {
      socket.emit('typing', { receiverId });
    }
  }, [socket]);

  const emitStopTyping = useCallback((receiverId) => {
    if (socket) {
      socket.emit('stop_typing', { receiverId });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      typingUsers,
      sendMessage,
      emitTyping,
      emitStopTyping
    }}>
      {children}
    </SocketContext.Provider>
  );
};
