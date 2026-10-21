import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  HelpCircle,
  Award,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Play
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DashboardSummary } from '../../types';
import { api } from '../../services/api';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSeedData,
  isSeeding
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartKey, setChartKey] = useState(0);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading personalized telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40 text-sm">
          {error || 'Could not load dashboard.'}
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Section 5 Requirement: "For new users, show a helpful onboarding screen instead of fake progress statistics."
  if (!data.has_activity) {
    return (
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Nexora</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hello, {data.user_name}! Let's build your study plan.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            You don't have any subjects or study history yet. Choose how you'd like to get started:
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Load Interactive Demo Curriculum
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Immediately populate realistic computer science subjects, dynamic programming quizzes, machine learning flashcards, notes, and exams to explore all platform features.
              </p>
            </div>
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Loading Sample Curriculum...' : 'Load Sample Curriculum'}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Your Own Subjects
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Start clean with your actual course syllabus. Create subjects, add topics, configure your target study hours, and upload your lecture notes or PDFs.
              </p>
            </div>
            <button
              onClick={() => onNavigate('subjects')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Add First Subject</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Dashboard
  const todayProgressPct = Math.min(
    100,
    Math.round((data.today_focus_minutes / (data.daily_goal_minutes || 120)) * 100)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-[#0f172a] text-white shadow-lg relative overflow-hidden border border-indigo-900/50">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-400/20">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Nexora Smart Learning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {data.user_name.split(' ')[0]}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
            You're on a <strong className="text-white font-bold">{data.active_streak_days}-day study streak</strong>. Ready for today's session?
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('timer')}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-900" />
            <span>Start Timer</span>
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Study Planner</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Daily Focus */}
        <div className="interactive-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Focus
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.today_focus_minutes}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {data.daily_goal_minutes}m
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${todayProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Streak */}
        <div className="interactive-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Streak
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 shadow-sm">
              <Flame className="w-4 h-4 fill-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.active_streak_days}
              </span>
              <span className="text-xs font-medium text-slate-400">days in a row</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {data.total_study_hours} total focus hours logged
            </p>
          </div>
        </div>

        {/* Metric 3: Due Flashcards */}
        <div
          onClick={() => onNavigate('flashcards')}
          className="interactive-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Due Flashcards
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.due_flashcards_count}
              </span>
              <span className="text-xs font-medium text-slate-400">cards ready</span>
            </div>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 flex items-center gap-1">
              <span>Review with SM-2</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Metric 4: Upcoming Exams */}
        <div
          onClick={() => onNavigate('exams')}
          className="interactive-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Exams & Deadlines
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.upcoming_exams_count}
              </span>
              <span className="text-xs font-medium text-slate-400">upcoming</span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 flex items-center gap-1">
              <span>View countdowns</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Recommendations */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Study Activity Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Weekly Focus Activity
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Graph
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Study minutes recorded over the past 7 days
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChartKey(k => k + 1)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
                title="Click to replay graph drawing animation"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-45 transition-transform" />
                <span>Draw Graph</span>
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Deep Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart key={chartKey} data={data.weekly_focus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-scale-in">
                          <p className="font-bold">{item.date} ({item.day})</p>
                          <p className="text-indigo-300 font-semibold mt-1">{item.minutes} focus minutes</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="minutes"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  animationBegin={150}
                >
                  {data.weekly_focus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.minutes >= (data.daily_goal_minutes || 120) ? '#4f46e5' : '#818cf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Adaptive Recommendations */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Recommended Next</span>
              </h3>
              <p className="text-xs text-slate-400">
                Algorithmic study priority
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              Smart
            </span>
          </div>

          <div className="space-y-3">
            {data.recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All caught up! No critical pending items right now.
              </p>
            ) : (
              data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const tabMap: Record<string, NavTab> = {
                      task: 'planner',
                      flashcard: 'flashcards',
                      quiz: 'quizzes',
                      exam_prep: 'exams',
                    };
                    onNavigate(tabMap[rec.type] || 'planner');
                  }}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/60 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        rec.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : rec.priority === 'high'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {rec.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {rec.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Subject Mastery & Weak Topics Attention */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Mastery List */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subject Mastery Index
            </h3>
            <button
              onClick={() => onNavigate('subjects')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Curriculum
            </button>
          </div>

          <div className="space-y-3">
            {data.subject_mastery.map(subj => (
              <div
                key={subj.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subj.color || '#6366F1' }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {subj.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({subj.topics_count} topics)
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {subj.mastery_percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${subj.mastery_percentage}%`,
                      backgroundColor: subj.color || '#6366F1'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics Attention Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Weak Topics Requiring Attention
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Low Confidence / Mastery &lt; 50%
            </span>
          </div>

          <div className="space-y-3">
            {data.weak_topics.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p>Outstanding! No weak topics detected at this time.</p>
              </div>
            ) : (
              data.weak_topics.map(t => (
                <div
                  key={t.topic_id}
                  className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        {t.subject_name}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Mastery: {t.mastery_score.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t.topic_title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.recommendation}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('quizzes')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm transition-colors"
                  >
                    Practice
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
