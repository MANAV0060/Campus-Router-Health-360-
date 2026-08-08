import React, { useState } from 'react';
import { queryCopilotML } from '../services/api';
import type { CopilotMLResponse } from '../types';
import { Bot, Send, Sparkles, AlertCircle } from 'lucide-react';

interface AICopilotDrawerProps {
  routerId?: string;
  defaultQuestion?: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ routerId, defaultQuestion }) => {
  const [question, setQuestion] = useState(defaultQuestion || (routerId ? `Why is ${routerId} at risk?` : 'What systemic patterns are detected across the fleet?'));
  const [response, setResponse] = useState<CopilotMLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await queryCopilotML(textToSend, routerId);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query Copilot');
    } finally {
      setLoading(false);
    }
  };

  const presetChips = routerId
    ? [
        `Why is ${routerId} at risk?`,
        `Why is its risk higher than other routers?`,
        `Is this part of a larger pattern?`,
        `What evidence supports the prediction?`,
        `What preventive action should IT take?`,
      ]
    : [
        'What systemic patterns are active in the fleet?',
        'Which firmware revision exhibits the highest risk rate?',
        'Explain the difference between Current Health and Future Risk.',
      ];

  return (
    <div className="glass-card p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              NetSentinel AI Copilot
              <span className="badge badge-cyan text-[10px] py-0.5">Grounded Evidence</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Technical reasoning derived strictly from ML model probabilities and telemetry history.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {presetChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuestion(chip);
              handleAsk(chip);
            }}
            className="text-[11px] bg-white/[0.04] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-200 border border-white/10 px-2.5 py-1 rounded-full transition-all text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={routerId ? `Ask about ${routerId}...` : 'Ask about fleet health and predictions...'}
          className="flex-1 bg-gray-900 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> Ask
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Copilot Response Bubble */}
      {response && (
        <div className="p-4 rounded-xl bg-gray-900/90 border border-white/10 text-xs space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Sparkles className="h-4 w-4" /> Synthesized Operations Diagnosis:
          </div>
          <p className="text-gray-200 leading-relaxed font-sans text-[13px]">
            {response.answer}
          </p>

          {/* Suggested Followups */}
          {response.suggested_followups && response.suggested_followups.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase text-gray-500 font-bold mb-1.5">
                Suggested Follow-up Inquiries:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {response.suggested_followups.map((f, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => {
                      setQuestion(f);
                      handleAsk(f);
                    }}
                    className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded hover:bg-cyan-900/80 transition-all"
                  >
                    &rarr; {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
