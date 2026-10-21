import React from 'react';
import { X, Sparkles, CheckCircle2, Shield, Brain, Layers, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Adaptive Learning Platform</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            NEXORA
          </h2>
          <p className="text-indigo-100 text-sm font-medium mt-1">
            “Learn Smarter. Grow Faster.”
          </p>

          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <span>Created & Architected by</span>
            <span className="font-bold text-white px-2.5 py-1 rounded-lg bg-white/15">
              Parmanand Sharma
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
              Platform Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Nexora is an all-in-one educational platform engineered to maximize retention and eliminate study fatigue. Powered by genuine mathematical algorithms and localized intelligence, Nexora guarantees private, distraction-free learning without external data leaks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Brain className="w-4 h-4 text-indigo-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">SM-2 Spaced Repetition</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Calculates optimal review intervals based on recall ease.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Cpu className="w-4 h-4 text-violet-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Local TF-IDF Extractor</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Extractive summarizer and cited document Q&A engine.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-indigo-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Heuristic Scheduler</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Prioritizes tasks by exam dates and weak topic mastery.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Shield className="w-4 h-4 text-emerald-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Strict Data Privacy</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Zero external API dependencies. Strict multi-user isolation.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>FastAPI • React • TypeScript • SQLite/Postgres</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
