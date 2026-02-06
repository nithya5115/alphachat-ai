
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, ChevronLeft, Menu } from 'lucide-react';
import { Message, ChatSession } from './types';
import { sendMessageToGemini } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: inputValue.trim().slice(0, 30),
        messages: [],
        updatedAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage],
            title: s.messages.length === 0 ? userMessage.content.slice(0, 30) : s.title,
            updatedAt: new Date()
          } 
        : s
    ));

    setInputValue('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, assistantMessage] } 
        : s
    ));

    try {
      const history = sessions.find(s => s.id === currentSessionId)?.messages || [];
      const updatedHistory = [...history, userMessage];

      await sendMessageToGemini(updatedHistory, (chunk) => {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? {
                ...s,
                messages: s.messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: m.content + chunk } 
                    : m
                )
              }
            : s
        ));
      });
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? {
              ...s,
              messages: s.messages.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: "I'm sorry, I encountered an error. Please check your API key and try again." } 
                  : m
              )
            }
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out h-full ${isSidebarOpen ? 'w-72' : 'w-0'} overflow-hidden lg:relative absolute z-40`}>
        <Sidebar 
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={createNewChat}
          onSelectSession={setActiveSessionId}
          onDeleteSession={deleteSession}
        />
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-12 bg-slate-800 border border-slate-700 rounded-r-lg flex items-center justify-center text-slate-500 hover:text-slate-300 lg:flex hidden"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-300 lg:block hidden"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={24} />
              <h1 className="font-bold text-lg tracking-tight">AlphaChat <span className="text-slate-500 font-medium">AI</span></h1>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 hidden sm:block">
            Gemini-3-Flash-Preview Engine
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto">
          {(!activeSession || activeSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center space-y-8">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-indigo-500" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-100">How can I help you today?</h2>
                <p className="text-slate-400">Ask me anything about coding, creative writing, or data analysis.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {[
                  "Help me debug some React code",
                  "Write a short story about a neon city",
                  "Explain quantum computing simply",
                  "Analyze this text for sentiment"
                ].map((prompt) => (
                  <button 
                    key={prompt}
                    onClick={() => {
                      setInputValue(prompt);
                      inputRef.current?.focus();
                    }}
                    className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left text-sm text-slate-300 hover:bg-slate-900 hover:border-slate-700 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {activeSession.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12 pb-6 px-4 md:px-6">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="relative flex items-end w-full bg-slate-900 border border-slate-700 group-focus-within:border-indigo-500/50 rounded-2xl p-2 transition-all shadow-2xl">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message AlphaChat AI..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-slate-100 py-3 px-4 resize-none overflow-y-auto max-h-48 text-base placeholder:text-slate-600"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="mb-1 mr-1 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white transition-all shadow-lg hover:shadow-indigo-500/20"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-500 uppercase tracking-widest">
              AlphaChat AI may produce inaccurate information about people, places, or facts.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
