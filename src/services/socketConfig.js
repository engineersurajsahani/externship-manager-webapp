import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5050';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    if (socket.connected) {
      return socket;
    }
    // If socket exists but disconnected, try to reconnect
    socket.auth = { token };
    socket.connect();
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
    // Connected
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    // Disconnected
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null;
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
  } else {
    console.error('Cannot send message: Socket not connected', { socketExists: !!socket, connected: socket?.connected });
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

export const isConnected = () => {
  return socket && socket.connected;
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinProject,
  leaveProject,
  sendMessage,
  startTyping,
  stopTyping,
  isConnected,
};
