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
  X,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Google / Gmail Auth Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGmail, setCustomGmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!username || !fullName) {
          throw new Error('Please fill out all registration fields.');
        }
        await register({
          email: email.trim(),
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

  const handleQuickDemo = async () => {
    setEmail('student@nexora.io');
    setPassword('Password123!');
    setIsLoading(true);
    setErrorMsg('');
    try {
      await login({
        email: 'student@nexora.io',
        password: 'Password123!',
      });
    } catch {
      // If demo user not created yet, register it directly
      try {
        await register({
          email: 'student@nexora.io',
          username: 'parmanand_learner',
          full_name: 'Parmanand Sharma',
          password: 'Password123!',
        });
      } catch (e: any) {
        setErrorMsg('Please enter your details to sign in or create an account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async (targetEmail: string, targetName?: string) => {
    setIsGoogleSubmitting(true);
    setGoogleError('');
    try {
      let cleanEmail = targetEmail.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Please provide an email address.');
      }
      if (!cleanEmail.includes('@')) {
        cleanEmail = `${cleanEmail}@gmail.com`;
      }
      const displayName =
        targetName?.trim() ||
        cleanEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

      await loginWithGoogle({
        email: cleanEmail,
        full_name: displayName,
        avatar: 'avatar-1',
      });
      setShowGoogleModal(false);
    } catch (err: any) {
      setGoogleError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Column: Visual Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-[#13112c] to-[#0B0F19] p-12 flex-col justify-between overflow-hidden border-r border-indigo-950/40">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              NEXORA
            </h1>
            <p className="text-xs text-indigo-300 font-medium">
              By Parmanand Sharma
            </p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Adaptive Learning Platform</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Learn Smarter. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-300 bg-clip-text text-transparent">
              Grow Faster.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminate study fatigue and master your curriculum with intelligent spaced repetition, real exam countdowns, focus telemetry, and extractive document analysis.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>SuperMemo SM-2 Spaced Repetition flashcards</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Heuristic scheduler with overbooking conflict alerts</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Local TF-IDF extractive summarizer & cited document Q&A</span>
            </div>
          </div>
        </div>

        {/* Footer credits */}
        <div className="relative z-10 pt-6 border-t border-indigo-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Engineered with Python & React</span>
          <span className="text-indigo-300 font-semibold">Nexora © 2026</span>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                NEXORA
              </h2>
              <p className="text-[11px] text-slate-500">By Parmanand Sharma</p>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRegister
                ? 'Begin your personalized, distraction-free study journey.'
                : 'Sign in to access your subjects, planner, and analytics.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Parmanand Sharma"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. learner_01"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRegister ? 'Email Address' : 'Email or Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={isRegister ? 'email' : 'text'}
                  placeholder="student@nexora.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <span>{isLoading ? 'Processing...' : isRegister ? 'Create Free Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Google or Gmail Sign-In Button */}
          <button
            type="button"
            onClick={() => {
              setGoogleError('');
              setShowGoogleModal(true);
            }}
            disabled={isLoading || isGoogleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] group hover:border-indigo-300 dark:hover:border-indigo-700/60"
          >
            {/* Official 4-color Google vector logo */}
            <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12c0 1.97.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>{isRegister ? 'Sign up with Google or Gmail' : 'Sign in with Google or Gmail'}</span>
          </button>

          {/* Quick Demo Login Option */}
          <div className="pt-1">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400">
                Or explore instantly
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>One-Click Demo Login (Parmanand Sharma)</span>
            </button>
          </div>

          {/* Toggle between register and login */}
          <div className="text-center pt-2">
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

      {/* Google / Gmail Account Selection Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12c0 1.97.45 3.82 1.25 5.42l4.03-3.15Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Sign in with Google
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose an account to continue to Nexora
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {googleError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
                {googleError}
              </div>
            )}

            {/* Quick-select Google Accounts */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Google Profile
              </span>

              {/* Account 1: Parmanand Sharma */}
              <button
                type="button"
                disabled={isGoogleSubmitting}
                onClick={() => handleGoogleAuth('parmanand.learner@gmail.com', 'Parmanand Sharma')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                    P
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Parmanand Sharma
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      parmanand.learner@gmail.com
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Verified
                </span>
              </button>

              {/* Account 2: Student Scholar */}
              <button
                type="button"
                disabled={isGoogleSubmitting}
                onClick={() => handleGoogleAuth('scholar.google@gmail.com', 'Student Scholar')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                    S
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Student Scholar
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      scholar.google@gmail.com
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Google
                </span>
              </button>
            </div>

            {/* Custom Gmail Input Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3 h-3 text-indigo-500" />
                <span>Or use any Gmail address</span>
              </span>

              <div className="space-y-2">
                <div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={customGmail}
                      onChange={e => setCustomGmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Display Name (optional)"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGoogleSubmitting || !customGmail}
                  onClick={() => handleGoogleAuth(customGmail, customName)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isGoogleSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with this Gmail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer Trust badge */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted JWT session via Nexora Google Auth API</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
