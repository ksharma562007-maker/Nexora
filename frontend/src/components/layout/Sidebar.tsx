import React from 'react';
import {
  LayoutDashboard,
  Layers,
  CalendarClock,
  Timer,
  HelpCircle,
  BookOpenCheck,
  FileText,
  Award,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 
  | 'dashboard'
  | 'subjects'
  | 'planner'
  | 'timer'
  | 'quizzes'
  | 'flashcards'
  | 'notes'
  | 'exams'
  | 'analytics';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenSettings,
  onSeedData,
  isSeeding
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects' as NavTab, label: 'Subjects', icon: Layers },
    { id: 'planner' as NavTab, label: 'Study Planner', icon: CalendarClock },
    { id: 'timer' as NavTab, label: 'Focus Timer', icon: Timer },
    { id: 'quizzes' as NavTab, label: 'Quizzes', icon: HelpCircle },
    { id: 'flashcards' as NavTab, label: 'Flashcards', icon: BookOpenCheck },
    { id: 'notes' as NavTab, label: 'Notes & PDF', icon: FileText },
    { id: 'exams' as NavTab, label: 'Exams & Goals', icon: Award },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#0f1422] border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  NEXORA
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  Smart Learning
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                By Parmanand Sharma
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Learning Hub
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-indigo-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Demo Seeder Banner */}
          <div className="pt-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100/80 dark:border-indigo-800/40">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Interactive Demo
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Load sample academic curriculum with quizzes, flashcards, and notes.
              </p>
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/60 hover:bg-indigo-50 dark:hover:bg-slate-700/70 shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {isSeeding ? 'Seeding Data...' : 'Seed Sample Data'}
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div
              onClick={onOpenSettings}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/20">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSettings}
                title="Settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
