import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Info,
  Sparkles,
  Timer as TimerIcon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  runningTimerSeconds?: number | null;
  onJumpToTimer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenAbout,
  onOpenSettings,
  runningTimerSeconds,
  onJumpToTimer
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'subjects':
        return 'Subjects';
      case 'planner':
        return 'Study Planner';
      case 'timer':
        return 'Focus Timer';
      case 'quizzes':
        return 'Quizzes';
      case 'flashcards':
        return 'Flashcards';
      case 'notes':
        return 'Notes & PDF';
      case 'exams':
        return 'Exams & Goals';
      case 'analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{getTabTitle(currentTab)}</span>
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-400">
            Nexora Smart Learning • Learn Smarter. Grow Faster.
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Timer Pill if running in background */}
        {runningTimerSeconds !== null && runningTimerSeconds !== undefined && runningTimerSeconds > 0 && (
          <button
            onClick={onJumpToTimer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 text-xs font-semibold animate-pulse hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
          >
            <TimerIcon className="w-3.5 h-3.5" />
            <span>Focus Active: {formatTimer(runningTimerSeconds)}</span>
          </button>
        )}

        {/* About Modal Button */}
        <button
          onClick={onOpenAbout}
          title="About Nexora"
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar Click */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-300">
            {user?.full_name?.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};
