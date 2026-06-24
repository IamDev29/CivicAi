import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Loader2, CheckCheck, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface CivicBotProps {
  issues: CivicIssue[];
}

export default function CivicBot({ issues }: CivicBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Namaskar! I am **CivicBot**, your local municipal virtual assistant. 🏛️\n\nI have real-time access to our neighborhood database of reported hazards. You can ask me about issues in specific areas, how to submit reports, or find out which departments handle repairs! How can I help you keep our streets safe today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail !== undefined) {
        setIsOpen(e.detail);
      } else {
        setIsOpen(prev => !prev);
      }
    };
    const handleSend = (e: any) => {
      if (e.detail) {
        handleSendMessage(e.detail);
      }
    };
    window.addEventListener('civicbot-toggle', handleToggle as any);
    window.addEventListener('civicbot-send-message', handleSend as any);
    return () => {
      window.removeEventListener('civicbot-toggle', handleToggle as any);
      window.removeEventListener('civicbot-send-message', handleSend as any);
    };
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Format messages history for server endpoint
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: chatHistory,
          issues: issues
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      
      const botMessage: Message = {
        id: `msg-bot-${Date.now()}`,
        role: 'model',
        text: data.text || "I'm sorry, I couldn't formulate a response right now. Please try again!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("CivicBot Chat Error:", error);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        text: "It seems I had trouble connecting to the municipal cloud server. Let me know if you would like me to retry! You can always ask: *'What are the biggest problems near Patia?'*",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const suggestions = [
    "What are the biggest problems near Patia?",
    "How do I report a water leakage?",
    "Which department handles potholes?",
    "How long does my issue usually take?"
  ];

  // Render markdown helper for simple bold/bullet formatting
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      const renderLineWithFormatting = (txt: string) => {
        const subParts = [];
        const bits = txt.split('**');
        for (let i = 0; i < bits.length; i++) {
          if (i % 2 === 1) {
            subParts.push(<strong key={`bold-${i}`} className="font-extrabold text-gray-900">{bits[i]}</strong>);
          } else {
            const bulletBits = bits[i].split('*');
            for (let j = 0; j < bulletBits.length; j++) {
              if (j % 2 === 1) {
                subParts.push(<em key={`em-${j}`} className="italic text-gray-800">{bulletBits[j]}</em>);
              } else {
                subParts.push(bulletBits[j]);
              }
            }
          }
        }
        return subParts;
      };

      return (
        <p key={lineIdx} className="mb-1 last:mb-0 leading-relaxed text-[11.5px] font-medium text-gray-800 whitespace-pre-wrap">
          {renderLineWithFormatting(line)}
        </p>
      );
    });
  };

  return (
    <div className="absolute bottom-18 right-4 z-40 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-[340px] h-[520px] bg-[#efeae2] rounded-[24px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col mb-4 pointer-events-auto"
            id="civicbot-chat-panel"
          >
            {/* WhatsApp Green Header */}
            <div className="bg-[#075e54] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-[#075e54] shadow-sm relative">
                    <Bot className="w-5 h-5" />
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                      <div className="bg-[#075e54] text-white p-0.5 rounded-full text-[8px] flex items-center justify-center">
                        <Landmark className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#075e54] rounded-full animate-pulse"></span>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <h3 className="font-black text-xs uppercase tracking-wider">CivicBot</h3>
                    <span className="bg-[#128c7e] text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-widest text-emerald-100">Municipal API</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/80 font-semibold">Typically replies instantly</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                id="civicbot-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-none flex flex-col">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'self-end' : 'self-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-3xs relative ${
                      msg.role === 'user'
                        ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none border border-emerald-100'
                        : 'bg-white text-gray-900 rounded-tl-none border border-gray-150'
                    }`}
                  >
                    {/* Message content */}
                    {renderMessageText(msg.text)}

                    {/* Meta info: time & read receipts */}
                    <div className="flex items-center justify-end space-x-1.5 mt-1.5 text-[8.5px] text-gray-400 font-bold select-none">
                      <span>{msg.time}</span>
                      {msg.role === 'user' && (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="self-start flex flex-col max-w-[85%] animate-pulse">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-3xs border border-gray-150 flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#075e54]" />
                    <span className="text-[10px] font-black text-[#075e54] uppercase tracking-wider">CivicBot is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Strip */}
            <div className="bg-white/80 backdrop-blur-xs px-3 py-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 select-none">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold px-3 py-1.5 rounded-full border border-emerald-100/60 whitespace-nowrap transition cursor-pointer active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="bg-[#f0f2f5] p-2.5 flex items-center space-x-2 border-t border-gray-200 shrink-0 pointer-events-auto"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a municipal query..."
                className="flex-1 bg-white text-gray-800 border border-gray-200 rounded-full px-4 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                id="civicbot-input-field"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition shrink-0 ${
                  inputValue.trim()
                    ? 'bg-[#128c7e] hover:bg-[#0b665c] cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                id="civicbot-send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Bubble Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-600 hover:bg-[#128c7e] text-white p-4 rounded-full shadow-2xl transition pointer-events-auto flex items-center justify-center relative cursor-pointer"
        id="civicbot-bubble-toggle"
      >
        <MessageSquare className="w-6 h-6 shrink-0" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
          1
        </span>
      </motion.button>
    </div>
  );
}
