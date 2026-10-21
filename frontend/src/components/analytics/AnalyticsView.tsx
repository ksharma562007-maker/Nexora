import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Sparkles,
  Play,
  RotateCw,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { api } from '../../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [graphDrawKey, setGraphDrawKey] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDeepAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-spin">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-400">Aggregating historical learning analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No historical analytics available yet. Complete focus sessions and quizzes to populate trends.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-up">
      {/* Header with Animation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Performance & Learning Telemetry</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Dynamic Charts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Strictly calculated from stored database records. Compares actual focus telemetry against initial planner estimates.
          </p>
        </div>

        {/* Button to Replay / Trigger Graph Drawing Animation */}
        <div>
          <button
            type="button"
            onClick={() => setGraphDrawKey(prev => prev + 1)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95 group"
            title="Click to replay and watch all graphs draw dynamically"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-45 transition-transform" />
            <span>Draw / Re-animate Graphs</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stat Bar */}
      {data.tasks_summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="interactive-card p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center hover:border-indigo-300 dark:hover:border-indigo-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {data.tasks_summary.completion_rate}%
            </p>
          </div>

          <div className="interactive-card p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center hover:border-emerald-300 dark:hover:border-emerald-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {data.tasks_summary.completed}
            </p>
          </div>

          <div className="interactive-card p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center hover:border-indigo-300 dark:hover:border-indigo-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {data.tasks_summary.in_progress}
            </p>
          </div>

          <div className="interactive-card p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center hover:border-slate-300 dark:hover:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
              {data.tasks_summary.pending}
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: 14-Day Focus Trend Area Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                14-Day Study Focus Progression
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Animated Curve
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Daily minutes logged in Deep Work timer vs daily target baseline
            </p>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            Actual Telemetry
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart key={`area-${graphDrawKey}`} data={data.focus_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="focusColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-scale-in">
                        <p className="font-bold">{item.date}</p>
                        <p className="text-indigo-300 mt-1">Logged: {item.minutes} mins</p>
                        <p className="text-slate-400">Target: {item.target} mins</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#6366f1"
                strokeWidth={2.8}
                fillOpacity={1}
                fill="url(#focusColor)"
                isAnimationActive={true}
                animationDuration={1700}
                animationEasing="ease-in-out"
                animationBegin={100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Charts: Planned vs Actual & Quiz Accuracy */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Planned vs Actual Study Time */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Planned vs Actual Study Minutes
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Bar Draw
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates whether planner estimates align with actual focus sessions
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {data.planned_vs_actual.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No subject tasks planned yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={`bar-${graphDrawKey}`} data={data.planned_vs_actual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-scale-in">
                            <p className="font-bold">{item.subject}</p>
                            <p className="text-indigo-400 mt-1">Planned: {item.planned}m</p>
                            <p className="text-emerald-400">Actual Focus: {item.actual}m</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar
                    dataKey="planned"
                    name="Planned (Est)"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                    animationBegin={200}
                  />
                  <Bar
                    dataKey="actual"
                    name="Actual (Logged)"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                    animationBegin={350}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quiz Accuracy Progression */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quiz Accuracy Progression
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Line Animation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Historical accuracy trend over recent assessment attempts
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {data.quiz_trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No quiz attempts logged yet. Take a quiz to populate accuracy curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart key={`line-${graphDrawKey}`} data={data.quiz_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="attempt" name="Attempt" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-scale-in">
                            <p className="font-bold">{item.quiz_title}</p>
                            <p className="text-emerald-400 mt-1">Score: {item.score_pct}%</p>
                            <p className="text-slate-400">{item.passed ? 'Passed' : 'Failed'}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score_pct"
                    name="Score %"
                    stroke="#10b981"
                    strokeWidth={2.8}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1700}
                    animationEasing="ease-out"
                    animationBegin={250}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
