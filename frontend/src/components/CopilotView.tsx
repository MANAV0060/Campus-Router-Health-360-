import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, User, Terminal } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'copilot';
  source?: string;
}

export const CopilotView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hello, I am NetSentinel Copilot, your campus network operations AI assistant. You can ask me questions about router health scores, location outages, firmware issues, or prioritization queue details.',
      sender: 'copilot',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shortcuts = [
    'Why is R-1042 unhealthy?',
    'Which firmware has the most unhealthy routers?',
    'What should IT investigate first?',
    'What is wrong with the routers in Hostel B?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    fetch(`${API_BASE_URL}/copilot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: textToSend }),
    })
      .then((res) => res.json())
      .then((data) => {
        const copilotMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'copilot',
          source: data.source,
        };
        setMessages((prev) => [...prev, copilotMsg]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error in Copilot query:', err);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I encountered an error connecting to the API server. Please make sure the FastAPI backend is running.',
          sender: 'copilot',
        };
        setMessages((prev) => [...prev, errorMsg]);
        setLoading(false);
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* Short Description & shortcut command list */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="glass-panel p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Terminal size={16} className="text-emerald-400" />
            <span>AI Operations Console</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            NetSentinel Copilot interprets device telemetry, peer locations, and user complaints. It outputs structured, data-grounded explanations.
          </p>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-3">
          <span className="text-xs text-slate-400 font-semibold uppercase">Shortcut Commands</span>
          <div className="flex flex-col gap-2">
            {shortcuts.map((s) => (
              <button
                key={s}
                disabled={loading}
                onClick={() => handleSend(s)}
                className="text-left text-xs bg-[#0b0f19] border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg text-slate-300 hover:text-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat window layout */}
      <div className="lg:col-span-3 glass-panel p-5 flex flex-col justify-between h-full overflow-hidden">
        {/* Messages Timeline */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-full h-9 w-9 flex items-center justify-center border shrink-0 ${isUser ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {isUser ? <User size={16} /> : <Cpu size={16} />}
                </div>

                {/* Message Body */}
                <div className="flex flex-col gap-1.5">
                  <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-emerald-500/10 text-slate-200 border border-emerald-500/20 rounded-tr-none' : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 rounded-tl-none font-sans'}`}>
                    {m.text}
                  </div>
                  {!isUser && m.source && (
                    <span className="text-[10px] text-slate-500 self-start uppercase px-2">
                      Engine: {m.source}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 self-start">
              <div className="p-2 rounded-full h-9 w-9 flex items-center justify-center bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                <Cpu size={16} className="animate-pulse" />
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-slate-400">Synthesizing telemetry data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Text Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2 border-t border-slate-800 pt-4"
        >
          <input
            type="text"
            disabled={loading}
            placeholder="Type network query (e.g. why is latency high on R-1010?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 p-3 rounded-lg flex items-center justify-center transition-all disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
