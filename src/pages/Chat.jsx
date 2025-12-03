import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiMessageSquare,
  FiUsers,
  FiSend,
  FiMoreVertical,
  FiSearch,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import {
  initializeSocket,
  disconnectSocket,
  joinProject,
  leaveProject,
  sendMessage as sendSocketMessage,
  startTyping,
  stopTyping,
  getSocket
} from "../services/socketConfig";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const Chat = () => {
  const { user, getUserRole, ROLES } = useAuth();
  const userRole = getUserRole();
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // State for projects and messages
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const selectedProjectRef = useRef(selectedProject);

  // Update ref when selectedProject changes
  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  // Initialize socket connection - ONE TIME ONLY
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket if not already done
    if (!socketRef.current) {
      socketRef.current = initializeSocket(token);
    } else if (!socketRef.current.connected) {
      // If reference exists but not connected, try to get/reconnect
      socketRef.current = initializeSocket(token);
    }

    const socket = socketRef.current;
    setIsConnected(socket.connected);

    // Define event handlers
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setConnectionError('Connection failed');
    };
    const handleNewMessage = (newMessage) => {
      setMessages((prev) => {
        // Use the projectId from the message if available, otherwise fallback to selectedProject (risky but legacy support)
        const currentSelectedProject = selectedProjectRef.current;
        const projectId = newMessage.projectId || currentSelectedProject?.id;

        if (!projectId) return prev;

        const projectMessages = prev[projectId] || [];
        const isCurrentUser = newMessage.sender.id === user?.id;

        // Prevent duplicates if necessary, though React key usually handles it
        // Check if message already exists to be safe
        if (projectMessages.some(m => m.id === newMessage.id)) {
          return prev;
        }

        return {
          ...prev,
          [projectId]: [
            ...projectMessages,
            {
              ...newMessage,
              isCurrentUser,
              timestamp: new Date(newMessage.timestamp),
            },
          ],
        };
      });

      // Scroll to bottom if looking at this project
      if (selectedProjectRef.current?.id === newMessage.projectId) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    const handleUserJoined = ({ userName }) => {
      setOnlineUsers(prev => prev + 1);
    };

    const handleUserLeft = ({ userName }) => {
      setOnlineUsers(prev => Math.max(0, prev - 1));
    };

    const handleUserTyping = ({ userName, userId }) => {
      if (userId !== user?.id) {
        setTypingUsers(prev => new Set(prev).add(userName));
      }
    };

    const handleUserStoppedTyping = ({ userId }) => {
      // We need a way to map userId to userName to remove from Set correctly
      // For now, we'll just clear the set after a timeout in the UI or rely on the timeout below
      // A better approach would be to store typing users as a Map of userId -> userName
    };

    const handleActiveUsers = ({ count }) => {
      setOnlineUsers(count);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
    };

    // Attach listeners
    socket.on('new-message', handleNewMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('active-users', handleActiveUsers);
    socket.on('error', handleError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup listeners on unmount
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('active-users', handleActiveUsers);
      socket.off('error', handleError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      // We DO NOT disconnect the socket here to keep it alive across project switches
      // Only disconnect if the component is truly unmounting (e.g. navigating away from Chat page)
      // But since we might want to keep socket alive for notifications, we might leave it.
      // For this specific page logic, we'll disconnect on unmount of the page.
    };
  }, [user]); // Only re-run if user changes (login/logout)

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Handle project room joining/leaving
  useEffect(() => {
    if (!selectedProject) return;

    const projectId = selectedProject.id;
    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [selectedProject]);

  // Load user's projects on component mount
  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.data && response.data.success) {
        // Map projects to shape expected by chat UI
        const mapped = (response.data.projects || []).map((p) => ({
          id: p._id || p.id,
          name: p.name,
          description: p.description,
          participants: (p.teamMembers || [])
            .map((m) => ({
              id: m.user?._id || m.user?.id,
              firstName: m.user?.firstName,
              lastName: m.user?.lastName,
              name:
                (m.user?.firstName || m.user?.lastName)
                  ? `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()
                  : m.user?.email,
              email: m.user?.email,
              role: m.role,
            }))
            .filter(Boolean),
          lastMessage: null,
          unreadCount: 0,
        }));

        setProjects(mapped);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMessages = async (projectId) => {
    try {
      // Attempt to fetch messages from API
      if (apiService.getProjectMessages) {
        const res = await apiService.getProjectMessages(projectId);
        if (res.data && res.data.success) {
          const formattedMessages = (res.data.messages || []).map(msg => ({
            id: msg._id || msg.id,
            sender: {
              id: msg.sender?._id || msg.sender?.id,
              name: `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || msg.sender?.email,
              email: msg.sender?.email,
              role: msg.sender?.role === 'project_manager'
                ? 'Project Manager'
                : msg.sender?.role === 'team_leader'
                  ? 'Team Leader'
                  : msg.sender?.role === 'admin'
                    ? 'Admin'
                    : 'Intern',
            },
            text: msg.text,
            timestamp: new Date(msg.createdAt || msg.timestamp),
            isCurrentUser: (msg.sender?._id || msg.sender?.id) === user?.id,
            attachments: msg.attachments || [],
          }));

          setMessages((prev) => ({
            ...prev,
            [projectId]: formattedMessages,
          }));

          // Scroll to bottom after loading messages
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return;
        }
      }

      // Initialize empty messages array if no API or no messages
      setMessages((prev) => ({
        ...prev,
        [projectId]: [],
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      // Initialize empty messages array on error
      setMessages((prev) => ({
        ...prev,
        [projectId]: [],
      }));
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle project selection
  const handleProjectSelect = (project) => {
    // Leave previous project room
    if (selectedProject) {
      leaveProject(selectedProject.id);
    }

    setSelectedProject(project);

    // Load messages for the selected project
    if (project) {
      loadProjectMessages(project.id);
      // Room joining is handled by the useEffect now
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !selectedProject) return;

    const messageText = message.trim();
    setMessage(""); // Clear input immediately for better UX

    // Send via socket (socket handler will save to DB and broadcast)
    sendSocketMessage(selectedProject.id, messageText);

    // Stop typing indicator
    stopTyping(selectedProject.id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [message, selectedProject]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedProject) return;

    // Start typing indicator
    startTyping(selectedProject.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedProject.id);
    }, 2000);
  }, [selectedProject]);

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Project Manager":
        return "bg-purple-100 text-purple-800";
      case "Team Leader":
        return "bg-blue-100 text-blue-800";
      case "Intern":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
              <p className="text-gray-600 mt-1">
                Communicate with your project teams
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center text-xs ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Connected' : connectionError || 'Disconnected'}
              </div>
              {!isConnected && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (token) socketRef.current = initializeSocket(token);
                  }}
                  className="ml-2"
                >
                  Reconnect
                </Button>
              )}
              <FiMessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Project List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-6 text-center">
                <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "No projects match your search" : "No projects available"}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm ? "Try a different search term" : "You're not assigned to any projects yet"}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${selectedProject?.id === project.id
                      ? "bg-indigo-50 border-2 border-indigo-200"
                      : "hover:bg-gray-50 border-2 border-transparent"
                      }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {project.name}
                      </h3>
                      {project.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                          {project.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.lastMessage && (
                      <div className="text-xs text-gray-500">
                        <p className="truncate">
                          <span className="font-medium">{project.lastMessage.sender}:</span>{" "}
                          {project.lastMessage.text}
                        </p>
                        <p className="mt-1">{formatTime(project.lastMessage.timestamp)}</p>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <FiUsers className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {project.participants?.length || 0} members
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedProject ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedProject.name}
                    </h2>
                    <div className="flex items-center mt-1">
                      <FiUsers className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {selectedProject.participants?.length || 0} participants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedProject.participants?.map((participant) => (
                      <Badge
                        key={participant.id}
                        className={`text-xs ${getRoleColor(participant.role)}`}
                      >
                        {participant.role}
                      </Badge>
                    )) || (
                        <span className="text-xs text-gray-500">No participants loaded</span>
                      )}
                    <Button variant="outline" size="sm">
                      <FiMoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
                {messages[selectedProject.id]?.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.isCurrentUser
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-200"
                        }`}
                    >
                      {/* Always show sender name and role */}
                      <div className="flex items-center mb-1">
                        <span className={`text-xs font-medium ${msg.isCurrentUser ? "text-white" : "text-gray-900"}`}>
                          {msg.sender.name}
                        </span>
                        <Badge className={`ml-2 text-xs ${msg.isCurrentUser
                          ? "bg-indigo-500 text-white"
                          : getRoleColor(msg.sender.role)
                          }`}>
                          {msg.sender.role}
                        </Badge>
                      </div>
                      <p className={`text-sm ${msg.isCurrentUser ? "text-white" : "text-gray-900"}`}>
                        {msg.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${msg.isCurrentUser ? "text-indigo-200" : "text-gray-500"
                          }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <p className="text-xs text-gray-600">
                        {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2"
                  >
                    <FiSend className="w-4 h-4" />
                  </Button>
                </div>
                {onlineUsers > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {onlineUsers} {onlineUsers === 1 ? "user" : "users"} online
                  </p>
                )}
              </div>
            </>
          ) : (
            /* No Project Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a project to start chatting
                </h3>
                <p className="text-gray-500">
                  Choose a project from the left panel to view and send messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
