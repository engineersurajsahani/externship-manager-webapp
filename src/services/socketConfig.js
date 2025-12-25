import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://externship-manager-api.onrender.com';

let socket = null;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and cleared');
  }
};

export const joinProject = (projectId) => {
  if (socket && socket.connected) {
    socket.emit('join-project', { projectId });
  }
};

export const leaveProject = (projectId) => {
  if (socket && socket.connected) {
    socket.emit('leave-project', { projectId });
  }
};

export const sendMessage = (projectId, text, attachments = []) => {
  if (socket && socket.connected) {
    socket.emit('send-message', { projectId, text, attachments });
  }
};

export const startTyping = (projectId) => {
  if (socket && socket.connected) {
    socket.emit('typing-start', { projectId });
  }
};

export const stopTyping = (projectId) => {
  if (socket && socket.connected) {
    socket.emit('typing-stop', { projectId });
  }
};

const socketConfig = {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinProject,
  leaveProject,
  sendMessage,
  startTyping,
  stopTyping,
};

export default socketConfig;