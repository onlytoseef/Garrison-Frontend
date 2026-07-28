import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { FiSend, FiUser } from "react-icons/fi";
import { IoSchoolOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const AlfalahAI = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your Quaid-e-Azam AI Assistant. How can I help you with your educational journey today?",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message with animation
    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call backend API
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: input,
      });

      // Add AI response with animation
      const aiMessage = {
        text: response.data.reply,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = {
        text: "I'm experiencing some technical difficulties. Please try again shortly.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  // Color palette
  const colors = {
    primary: "from-[#2F5DAA] to-[#1E3F72]",
    secondary: "from-blue-400 to-cyan-400",
    userBg: "from-[#1E3F72] to-[#2F5DAA]",
    aiBg: "bg-white",
    text: "text-gray-800",
    highlight: "text-[#2F5DAA]",
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Add Nunito font import and apply to body */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap");
        body {
          font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      {/* Centered header with larger title */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-white/70 backdrop-blur-lg border-b border-gray-200/50 p-4 shadow-sm"
      >
        <div className="container mx-auto flex flex-col items-center justify-center gap-1 max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-xl bg-gradient-to-br ${colors.primary} text-white shadow-lg mb-2`}
          >
            <IoSchoolOutline className="text-2xl" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Quaid-e-Azam AI Assistant
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Your intelligent learning companion
          </p>
        </div>
      </motion.header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl xl:max-w-2xl rounded-3xl px-5 py-4 relative shadow-lg ${
                  msg.sender === "user"
                    ? `bg-gradient-to-br ${colors.userBg} text-white rounded-br-none`
                    : `${colors.aiBg} text-gray-800 border border-gray-100 rounded-bl-none`
                }`}
              >
                {/* Message header */}
                <div className="flex items-center gap-2 mb-2">
                  {msg.sender === "user" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-white/20 rounded-full">
                        <FiUser className="text-xs" />
                      </div>
                      <span className="text-xs font-semibold">You</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-full bg-gradient-to-br ${colors.secondary} text-white`}
                      >
                        <RiRobot2Line className="text-xs" />
                      </div>
                      <span className="text-xs font-semibold">
                        AI Assistant
                      </span>
                    </div>
                  )}
                  <span className="text-xs opacity-70 ml-auto">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message content */}
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.text}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white text-gray-800 rounded-3xl rounded-bl-none px-5 py-4 max-w-xs sm:max-w-sm border border-gray-100 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"
                      animate={{
                        y: [0, -5, 0],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 bg-gradient-to-t from-white/90 to-white/70 backdrop-blur-lg border-t border-gray-200/50 p-4"
      >
        <form
          onSubmit={handleSubmit}
          className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div whileHover={{ scale: 1.005 }} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Quaid-e-Azam Schools..."
              className="w-full border-0 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-4 focus:ring-[#2F5DAA]/20 text-[15px] shadow-lg bg-white/90 placeholder-gray-400"
              disabled={isLoading}
              autoFocus
            />
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              whileHover={!isLoading && input.trim() ? { scale: 1.1 } : {}}
              whileTap={!isLoading && input.trim() ? { scale: 0.9 } : {}}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                isLoading || !input.trim()
                  ? "text-gray-400 bg-gray-100"
                  : `text-white bg-gradient-to-br ${colors.primary} shadow-md`
              } transition-all`}
            >
              <FiSend className="text-lg" />
            </motion.button>
          </motion.div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3 font-medium">
          Quaid-e-Azam AI Assistant may produce inaccurate information •{" "}
          <span className={colors.highlight}>v2.0</span>
        </p>
      </motion.div>

      {/* Decorative elements */}
      <div className="fixed -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#2F5DAA]/10 blur-3xl -z-10"></div>
      <div className="fixed -top-40 left-1/4 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl -z-10"></div>
    </div>
  );
};

export default AlfalahAI;

