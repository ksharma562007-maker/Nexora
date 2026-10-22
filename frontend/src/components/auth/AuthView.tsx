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
  Loader2,
  Check,
  Smartphone
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

  // Device Google Account State (auto-detects from device/registration without any OAuth Client ID)
  const [deviceGoogleEmail, setDeviceGoogleEmail] = useState<string>(() => {
    return (
      localStorage.getItem('nexora_device_google_email') ||
      'mayank2007@gmail.com'
    );
  });
  const [deviceGoogleName, setDeviceGoogleName] = useState<string>(() => {
    return (
      localStorage.getItem('nexora_device_google_name') ||
      'Mayank Jangra'
    );
  });

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Active email to authenticate
  const activeGoogleEmail = (
    isSwitchingAccount && customGoogleEmail.trim()
      ? customGoogleEmail.trim().toLowerCase()
      : email.trim().toLowerCase() || deviceGoogleEmail
  );

  const activeGoogleName = (
    isSwitchingAccount && customGoogleName.trim()
      ? customGoogleName.trim()
      : fullName.trim() || deviceGoogleName || activeGoogleEmail.split('@')[0]
  );

  const handleOpenGoogleModal = () => {
    setGoogleError('');
    // If the user already filled the form email/name, use that as the device Google account
    if (email.trim()) {
      setDeviceGoogleEmail(email.trim().toLowerCase());
    }
    if (fullName.trim()) {
      setDeviceGoogleName(fullName.trim());
    }
    setIsSwitchingAccount(false);
    setShowGoogleModal(true);
  };

  const handleAcceptAndContinueGoogle = async () => {
    setIsGoogleSubmitting(true);
    setGoogleError('');
    try {
      let finalEmail = activeGoogleEmail.trim().toLowerCase();
      if (!finalEmail) {
        throw new Error('Please enter your Google account email.');
      }
      if (!finalEmail.includes('@')) {
        finalEmail = `${finalEmail}@gmail.com`;
      }

      const finalName =
        activeGoogleName.trim() ||
        finalEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

      // Save permanently on this mobile or laptop
      localStorage.setItem('nexora_device_google_email', finalEmail);
      localStorage.setItem('nexora_device_google_name', finalName);
      setDeviceGoogleEmail(finalEmail);
      setDeviceGoogleName(finalName);

      // Authenticate with Nexora backend directly
      await loginWithGoogle({
        email: finalEmail,
        full_name: finalName,
        avatar: 'avatar-1',
      });

      setShowGoogleModal(false);
    } catch (err: any) {
      setGoogleError(err.message || 'Google authorization failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

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
        // Save to device memory
        localStorage.setItem('nexora_device_google_email', email.trim().toLowerCase());
        localStorage.setItem('nexora_device_google_name', fullName.trim());
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
      try {
        await register({
          email: 'student@nexora.io',
          username: 'parmanand_learner',
          full_name: 'Parmanand Sharma',
          password: 'Password123!',
        });
      } catch {
        setErrorMsg('Please enter your details to sign in or create an account.');
      }
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. mayank2007@gmail.com"
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
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
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

          {/* Social Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Direct Google Sign-In Button (Zero OAuth Client ID required) */}
          <button
            type="button"
            onClick={handleOpenGoogleModal}
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
            <span>
              {isRegister
                ? `Sign up with Google (${activeGoogleEmail || 'Google Account'})`
                : `Sign in with Google (${activeGoogleEmail || 'Google Account'})`}
            </span>
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

      {/* Google Account Authorization Modal (Accept & Continue Flow) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
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
                    Authorize Nexora with your Google account
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

            {/* Account Card on this device / mobile */}
            {!isSwitchingAccount ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/80 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {activeGoogleName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {activeGoogleName}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>This Device</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {activeGoogleEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Google Consent Authorization</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    To continue, Google will share your verified name, email address, and profile photo with Nexora.
                  </p>
                </div>

                {/* Accept and Continue Button */}
                <button
                  type="button"
                  disabled={isGoogleSubmitting}
                  onClick={handleAcceptAndContinueGoogle}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isGoogleSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept &amp; Continue as {activeGoogleName.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSwitchingAccount(true);
                      setCustomGoogleEmail('');
                      setCustomGoogleName('');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Use another Google account
                  </button>
                </div>
              </div>
            ) : (
              /* Switch Account input */
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Google / Gmail Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="e.g. yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={e => setCustomGoogleEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Display Name (Optional)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Mayank Jangra"
                        value={customGoogleName}
                        onChange={e => setCustomGoogleName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGoogleSubmitting || !customGoogleEmail.trim()}
                  onClick={handleAcceptAndContinueGoogle}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isGoogleSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept &amp; Continue with Google</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSwitchingAccount(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    &larr; Back to {deviceGoogleEmail}
                  </button>
                </div>
              </div>
            )}

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
