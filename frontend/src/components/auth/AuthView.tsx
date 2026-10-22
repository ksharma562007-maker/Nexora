import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Brain,
  Zap,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!username.trim() || !fullName.trim()) {
          throw new Error('Please fill out all registration fields.');
        }
        await register({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          full_name: fullName.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Column: Visual Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-[#13112c] to-[#0B0F19] p-12 flex-col justify-between overflow-hidden border-r border-indigo-950/40">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float" />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none animate-float"
          style={{ animationDelay: '1.5s' }}
        />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              NEXORA
            </h1>
            <p className="text-xs font-semibold text-indigo-300/90 tracking-wide uppercase">
              By Parmanand Sharma
            </p>
          </div>
        </div>

        {/* Main hero showcase text */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Smart Adaptive Learning SaaS • Production Grade</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Learn Smarter. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              Grow Faster.
            </span>
          </h2>

          <p className="text-slate-300/90 text-sm xl:text-base leading-relaxed">
            The next-generation autonomous study studio. Master curricula with SuperMemo SM-2 spaced repetition, cited PDF intelligence, and heuristic exam planning.
          </p>

          {/* Key capability bullet pills */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-200">SM-2 Spaced Repetition</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-200">Local NLP Extractive Q&A</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-200">Zero-API Cited PDF Engine</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-200">Heuristic Conflict Planning</span>
            </div>
          </div>
        </div>

        {/* Footer architect branding */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Architected by <strong className="text-slate-200">Parmanand Sharma</strong></span>
          <span className="flex items-center gap-1.5 text-indigo-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Leakage Privacy
          </span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">NEXORA</h2>
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                By Parmanand Sharma
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {isRegister
                ? 'Begin your personalized, distraction-free study journey.'
                : 'Sign in to resume your active learning streaks and retention goals.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium animate-fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mayank Jangra"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. mayank_0806"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={isRegister ? "email" : "text"}
                  required
                  placeholder={isRegister ? "e.g. mayank2007@gmail.com" : "e.g. mayank2007@gmail.com or mayank_0806"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Free Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between register and login */}
          <div className="text-center pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
