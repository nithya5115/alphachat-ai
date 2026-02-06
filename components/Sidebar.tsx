
import React from 'react';
import { Plus, MessageSquare, Trash2, Github, Settings } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onNewChat, 
  onSelectSession,
  onDeleteSession 
}) => {
  return (
    <div className="w-72 h-full bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-100 font-medium transition-all group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          New Chat
        </button>
      </div>

      <div className="flex-grow overflow-y-auto px-3 space-y-1">
        <div className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Conversations
        </div>
        {sessions.length === 0 ? (
          <div className="px-2 py-4 text-sm text-slate-600 italic">
            No history yet
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id 
                  ? 'bg-slate-800 text-slate-100' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="flex-grow truncate text-sm">{session.title}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors">
          <Settings size={18} />
          Settings
        </button>
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-slate-600">
          <Github size={16} />
          <span>v1.2.0-Alpha</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
