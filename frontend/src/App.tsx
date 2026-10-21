import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { AppLayout } from './components/layout/AppLayout';
import { Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-glow animate-pulse">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            NEXORA
          </h2>
          <p className="text-xs text-slate-400">Loading your learning workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
