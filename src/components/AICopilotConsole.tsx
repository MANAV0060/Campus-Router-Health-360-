import React, { useState, useRef, useEffect } from 'react';
import { sendCopilotQuestion } from '../services/api';
import { Bot, Send, User, Sparkles, Terminal, Copy, Check, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: string;
}

export const AICopilotConsole: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `### 📡 Welcome to NetSentinel AI Copilot

I have real-time access to campus gNMI telemetry streams and router diagnostics.

#### **Current System Alerts:**
- **RTR-ENG-301** (Engineering Center): Critical 184ms latency & 12.8% packet loss.
- **RTR-SCI-104** (Science Hall): Critical 9.4% packet loss on firmware \`v3.9.4-VULN\`.

How can I assist your network engineering workflow today?`,
      timestamp: 'Just now',
      source: 'NetSentinel AI Copilot (Gemini 2.5 Flash)'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const shortcuts = [
    'Explain RTR-ENG-301 root cause & fix',
    'Which routers have outdated firmware?',
    'List all critical nodes in Engineering Center',
    'Generate technician dispatch checklist for Science Hall'
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await sendCopilotQuestion(q);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: res.source
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Copilot send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple Markdown renderer
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // end code block
          elements.push(
            <div
              key={`code-${idx}`}
              className="my-3 bg-gray-950 text-emerald-400 font-mono text-xs p-3.5 rounded-xl border border-gray-800 shadow-inner overflow-x-auto"
            >
              <pre>{codeBuffer.join('\n')}</pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-bold text-gray-900 dark:text-white mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-xs text-gray-700 dark:text-gray-300 my-0.5">
            {line.substring(2)}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed my-0.5">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col h-[680px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#445EF2] text-white shadow-xs">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI Copilot Console
              <span className="text-[10px] px-2 py-0.5 font-mono font-bold rounded bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2] border border-[#445EF2]/20">
                LIVE TELEMETRY
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Interactive diagnostic assistant powered by Google Gemini 2.5 Flash
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-[#445EF2] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed transition-all shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-[#445EF2] text-white font-medium rounded-tr-none'
                  : 'bg-[#F2F2F2] dark:bg-[#121829] text-gray-900 dark:text-gray-100 border border-[#C9CFF2] dark:border-[#1e284a] rounded-tl-none'
              }`}
            >
              {msg.sender === 'ai' ? (
                <div>
                  {renderFormattedText(msg.text)}
                  <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between text-[10px] text-gray-400">
                    <span>{msg.source || 'NetSentinel AI'}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Output
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#445EF2] text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-[#F2F2F2] dark:bg-[#121829] border border-[#C9CFF2] dark:border-[#1e284a] rounded-2xl p-3 text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#445EF2] animate-ping" />
              NetSentinel Copilot is querying gNMI telemetry & synthesizing response...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Query Shortcut Pills */}
      <div className="pt-3 border-t border-gray-200 dark:border-[#1e284a] mb-3">
        <span className="text-[10px] font-semibold uppercase text-gray-400 block mb-1.5">
          Suggested Copilot Queries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {shortcuts.map((sc) => (
            <button
              key={sc}
              onClick={() => handleSend(sc)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F2F2F2] dark:bg-[#121829] hover:bg-[#C9CFF2]/40 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-[#C9CFF2] dark:border-[#1e284a] transition-all active:scale-95 text-left"
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask Copilot about router health, diagnostics, or technician scripts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs font-medium bg-[#F2F2F2] dark:bg-[#121829] text-gray-900 dark:text-white border border-[#C9CFF2] dark:border-[#1e284a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#445EF2]/40 focus:border-[#445EF2]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-[#445EF2] hover:bg-[#334bd9] disabled:opacity-40 text-white transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
