import React, { useState, useEffect } from "react";
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
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const Chat = () => {
  const { user, getUserRole, ROLES } = useAuth();
  const userRole = getUserRole();
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State for projects and messages
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

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
      // Placeholder: later implement messages API
      // Attempt to fetch messages if API available
      if (apiService.getProjectMessages) {
        const res = await apiService.getProjectMessages(projectId);
        if (res.data && res.data.success) {
          setMessages((prev) => ({
            ...prev,
            [projectId]: res.data.messages || [],
          }));
          return;
        }
      }

      setMessages((prev) => ({
        ...prev,
        [projectId]: [],
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Load messages for the selected project
    if (project && !messages[project.id]) {
      loadProjectMessages(project.id);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedProject) return;

    const messageText = message.trim();
    setMessage(""); // Clear input immediately for better UX

    try {
      // Send to backend
      const res = await apiService.sendMessage(selectedProject.id, { text: messageText });
      if (res.data && res.data.success) {
        const saved = res.data.message;

        const newMessage = {
          id: saved._id || Date.now().toString(),
          sender: saved.sender
            ? {
                name: `${saved.sender.firstName || ''} ${saved.sender.lastName || ''}`.trim() || saved.sender.email,
                role: saved.sender.role === 'project_manager' ? 'Project Manager' : saved.sender.role === 'team_leader' ? 'Team Leader' : 'Intern',
                email: saved.sender.email,
                id: saved.sender._id || saved.sender.id,
              }
            : { name: `${user?.firstName} ${user?.lastName}`, role: userRole, email: user?.email },
          text: saved.text,
          timestamp: new Date(saved.createdAt || Date.now()),
          isCurrentUser: true,
        };

        setMessages((prev) => ({
          ...prev,
          [selectedProject.id]: [...(prev[selectedProject.id] || []), newMessage],
        }));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message in input on error
      setMessage(messageText);
    }
  };

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
                    className={`p-4 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                      selectedProject?.id === project.id
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
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isCurrentUser
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {!msg.isCurrentUser && (
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {msg.sender.name}
                          </span>
                          <Badge className={`ml-2 text-xs ${getRoleColor(msg.sender.role)}`}>
                            {msg.sender.role}
                          </Badge>
                        </div>
                      )}
                      <p className={`text-sm ${msg.isCurrentUser ? "text-white" : "text-gray-900"}`}>
                        {msg.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isCurrentUser ? "text-indigo-200" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
