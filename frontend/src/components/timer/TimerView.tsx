import React, { useState, useEffect, useRef } from 'react';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, StudyTask, FocusSession } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/audio';
import { useAuth } from '../../context/AuthContext';

interface TimerViewProps {
  initialTaskId?: number;
  initialSubjectId?: number;
  onTimerTick?: (secondsLeft: number | null) => void;
}

export const TimerView: React.FC<TimerViewProps> = ({
  initialTaskId,
  initialSubjectId,
  onTimerTick
}) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  // Mode: 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch'
  const [mode, setMode] = useState<string>(() => {
    return localStorage.getItem('nexora_timer_mode') || 'pomodoro';
  });

  const getPresetDuration = (m: string) => {
    if (m === 'pomodoro') return (user?.pomodoro_focus_min || 25) * 60;
    if (m === 'short_break') return (user?.pomodoro_break_min || 5) * 60;
    if (m === 'long_break') return 15 * 60;
    return 0; // stopwatch
  };

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('nexora_timer_time_left');
    if (saved) return Number(saved);
    return (user?.pomodoro_focus_min || 25) * 60;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('nexora_timer_elapsed');
    return saved ? Number(saved) : 0;
  });

  const [isActive, setIsActive] = useState<boolean>(() => {
    return localStorage.getItem('nexora_timer_active') === 'true';
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>(() => {
    if (initialSubjectId) return initialSubjectId;
    const saved = localStorage.getItem('nexora_timer_subject_id');
    return saved ? Number(saved) : '';
  });

  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>(() => {
    if (initialTaskId) return initialTaskId;
    const saved = localStorage.getItem('nexora_timer_task_id');
    return saved ? Number(saved) : '';
  });

  const [sessionNotes, setSessionNotes] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);

  const timerRef = useRef<any>(null);

  // Load telemetry and subjects
  const loadStatsAndData = async () => {
    try {
      const [statsData, subjectsData, tasksData] = await Promise.all([
        api.getTimerStats(),
        api.getSubjects(),
        api.getTasks('pending'),
      ]);
      setStats(statsData);
      setRecentSessions(statsData.recent_sessions || []);
      setSubjects(subjectsData);
      setTasks(tasksData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatsAndData();
  }, []);

  // Timer Tick Interval
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(prev => {
            const next = prev + 1;
            localStorage.setItem('nexora_timer_time_left', next.toString());
            return next;
          });
          setElapsedSeconds(prev => {
            const next = prev + 1;
            localStorage.setItem('nexora_timer_elapsed', next.toString());
            return next;
          });
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleSessionComplete();
              return 0;
            }
            const next = prev - 1;
            localStorage.setItem('nexora_timer_time_left', next.toString());
            return next;
          });
          setElapsedSeconds(prev => {
            const next = prev + 1;
            localStorage.setItem('nexora_timer_elapsed', next.toString());
            return next;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    // Inform parent navbar
    if (onTimerTick) {
      onTimerTick(isActive ? timeLeft : null);
    }

    localStorage.setItem('nexora_timer_active', isActive.toString());
    localStorage.setItem('nexora_timer_mode', mode);
    localStorage.setItem('nexora_timer_subject_id', selectedSubjectId.toString());
    localStorage.setItem('nexora_timer_task_id', selectedTaskId.toString());

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, selectedSubjectId, selectedTaskId]);

  const handleStart = () => {
    sound.playClick();
    setIsActive(true);
  };

  const handlePause = () => {
    sound.playClick();
    setIsActive(false);
  };

  const handleReset = () => {
    sound.playClick();
    setIsActive(false);
    const duration = getPresetDuration(mode);
    setTimeLeft(duration);
    setElapsedSeconds(0);
    localStorage.setItem('nexora_timer_time_left', duration.toString());
    localStorage.setItem('nexora_timer_elapsed', '0');
  };

  const handleModeSwitch = (newMode: string) => {
    sound.playClick();
    setIsActive(false);
    setMode(newMode);
    const duration = getPresetDuration(newMode);
    setTimeLeft(duration);
    setElapsedSeconds(0);
    localStorage.setItem('nexora_timer_mode', newMode);
    localStorage.setItem('nexora_timer_time_left', duration.toString());
    localStorage.setItem('nexora_timer_elapsed', '0');
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    sound.playTimerBell();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const recordedSeconds = elapsedSeconds > 0 ? elapsedSeconds : getPresetDuration(mode);
    if (recordedSeconds >= 10) {
      try {
        await api.recordFocusSession({
          duration_seconds: recordedSeconds,
          subject_id: selectedSubjectId ? Number(selectedSubjectId) : null,
          task_id: selectedTaskId ? Number(selectedTaskId) : null,
          focus_mode: mode,
          completed: true,
          notes: sessionNotes || `Completed ${mode} block`,
        });
        loadStatsAndData();
      } catch (e) {
        console.error(e);
      }
    }

    // Reset for next block
    setElapsedSeconds(0);
    setTimeLeft(getPresetDuration(mode));
  };

  const handleStopAndSave = async () => {
    sound.playClick();
    if (elapsedSeconds < 10) {
      handleReset();
      return;
    }

    setIsActive(false);
    try {
      await api.recordFocusSession({
        duration_seconds: elapsedSeconds,
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : null,
        task_id: selectedTaskId ? Number(selectedTaskId) : null,
        focus_mode: mode,
        completed: false,
        notes: sessionNotes || 'Manual stop session',
      });
      loadStatsAndData();
    } catch (e) {
      console.error(e);
    }
    handleReset();
  };

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetDuration = getPresetDuration(mode);
  const progressRatio = mode === 'stopwatch'
    ? 1.0
    : targetDuration > 0
    ? Math.max(0, Math.min(1, (targetDuration - timeLeft) / targetDuration))
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Deep Focus Studio
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Eliminate digital distractions and log actual study minutes into your learning analytics.
        </p>
      </div>

      {/* Main Focus Console Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-2xl mx-auto space-y-8 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-md mx-auto">
          <button
            onClick={() => handleModeSwitch('pomodoro')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Pomodoro ({user?.pomodoro_focus_min || 25}m)
          </button>
          <button
            onClick={() => handleModeSwitch('short_break')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'short_break'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Break ({user?.pomodoro_break_min || 5}m)
          </button>
          <button
            onClick={() => handleModeSwitch('long_break')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'long_break'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Long (15m)
          </button>
          <button
            onClick={() => handleModeSwitch('stopwatch')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'stopwatch'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Stopwatch
          </button>
        </div>

        {/* Circular Progress & Digital Counter */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center">
          {isActive && (
            <div className="absolute inset-2 rounded-full border border-indigo-500/30 dark:border-indigo-400/30 animate-wave-ping pointer-events-none" />
          )}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated progress ring */}
            {mode !== 'stopwatch' && (
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-indigo-600 dark:text-indigo-500 transition-all duration-500 ease-linear"
                strokeWidth="5"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 * (1 - progressRatio)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            )}
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="font-mono text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {isActive ? 'Session in progress' : 'Ready to focus'}
            </span>
            {elapsedSeconds > 0 && (
              <span className="text-[10px] text-indigo-500 font-medium">
                {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s logged
              </span>
            )}
          </div>
        </div>

        {/* Link Subject & Task Selectors */}
        <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Link Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">General Focus</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Link Study Task
            </label>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No task linked</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Focus</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-xl shadow-amber-500/30 flex items-center gap-2.5 transition-all"
            >
              <Pause className="w-5 h-5 fill-white" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            title="Reset Timer"
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {elapsedSeconds >= 10 && (
            <button
              onClick={handleStopAndSave}
              title="Save & Finish Session"
              className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-4 h-4 fill-slate-700 dark:fill-slate-300" />
              <span>Finish Early</span>
            </button>
          )}
        </div>
      </div>

      {/* Focus Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-semibold">Today's Focus</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.today_minutes}m
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-semibold">Weekly Focus</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.weekly_minutes}m
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-semibold">Total Sessions</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total_sessions}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-semibold">All-Time Hours</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total_hours}h
            </p>
          </div>
        </div>
      )}

      {/* Recent Focus Log Table */}
      {recentSessions.length > 0 && (
        <div className="max-w-4xl mx-auto p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Recent Completed Sessions</span>
            <span>Elapsed Duration</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {recentSessions.slice(0, 5).map(sess => (
              <div key={sess.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sess.subject_color || '#6366F1' }}
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sess.subject_name}
                    </span>
                    <span className="text-slate-400 ml-2 text-[11px]">
                      {new Date(sess.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                  {sess.duration_minutes} mins
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
