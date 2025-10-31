
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendMessageToChat } from '../services/geminiService';
import { ChatIcon, CloseIcon, SendIcon } from './icons';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await sendMessageToChat(input);
      const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 mb-5 mr-5 w-full max-w-sm z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl flex flex-col h-[70vh] border border-blue-500/30">
        <header className="bg-gray-900 p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold text-white flex items-center"><ChatIcon /> <span className="ml-2">Helpful Assistant</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>

        <main className="flex-1 p-4 overflow-y-auto bg-gray-800/50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-xl bg-gray-700 text-gray-200">
                      <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                      </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-4 bg-gray-900 rounded-b-lg">
          <div className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="ml-3 bg-blue-600 hover:bg-blue-700 rounded-full p-3 text-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatBot;
