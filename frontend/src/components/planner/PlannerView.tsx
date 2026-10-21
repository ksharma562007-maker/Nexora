import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import { StudyTask, Subject } from '../../types';
import { api } from '../../services/api';
import { NavTab } from '../layout/Sidebar';

interface PlannerViewProps {
  onNavigateToTimer: (taskId?: number, subjectId?: number) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ onNavigateToTimer }) => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [dailyCapacity, setDailyCapacity] = useState(120);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Add/Edit Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState<number | ''>('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskMinutes, setTaskMinutes] = useState(30);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskScheduledDate, setTaskScheduledDate] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, subjectsData, recData] = await Promise.all([
        api.getTasks(),
        api.getSubjects(),
        api.getRecommendations(),
      ]);
      setTasks(tasksData);
      setSubjects(subjectsData);
      setConflicts(recData.conflicts || []);
      setDailyCapacity(recData.daily_capacity_minutes || 120);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await api.recalculateSchedule();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to recalculate');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setTaskPriority('medium');
    setTaskMinutes(30);
    setTaskDueDate('');
    setTaskScheduledDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: StudyTask) => {
    setEditingTaskId(t.id);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskSubjectId(t.subject_id || '');
    setTaskPriority(t.priority);
    setTaskMinutes(t.estimated_minutes || 30);
    setTaskDueDate(t.due_date ? t.due_date.split('T')[0] : '');
    setTaskScheduledDate(t.scheduled_date || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<StudyTask> = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        subject_id: taskSubjectId ? Number(taskSubjectId) : null,
        priority: taskPriority,
        estimated_minutes: Number(taskMinutes),
        due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        scheduled_date: taskScheduledDate || null,
      };

      if (editingTaskId) {
        await api.updateTask(editingTaskId, payload);
      } else {
        await api.createTask(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save task');
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus as any });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'skipped');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Smart Study Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Heuristic priority scheduler balancing exam proximity, weak topics, and daily study capacity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Priorities</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Task</span>
          </button>
        </div>
      </div>

      {/* Conflict / Overbooking Alerts */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Schedule Conflict Warning</span>
          </div>
          <div className="space-y-1">
            {conflicts.map((c, i) => (
              <p key={i} className="text-xs">
                • <strong>{c.date}:</strong> Scheduled for {c.allocated_minutes} minutes, which exceeds your daily study target of {c.capacity_minutes}m by <strong>{c.overbooked_by} minutes</strong>. Consider rescheduling some tasks.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Main Tasks Lists */}
      <div className="space-y-6">
        {/* Pending Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Pending & In-Progress Tasks ({pendingTasks.length})</span>
            <span>Target: {dailyCapacity}m / day</span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>No pending study tasks! Plan your next session or relax.</p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Create New Task
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.subject_name && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-xs"
                            style={{ backgroundColor: task.subject_color || '#6366F1' }}
                          >
                            {task.subject_name}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : task.priority === 'low'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.status === 'in_progress' && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            In Progress
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0">
                      <button
                        onClick={() => onNavigateToTimer(task.id, task.subject_id || undefined)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
                        <span>Focus</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(task.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Telemetry and Heuristic Reason */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Est: {task.estimated_minutes}m (Done: {task.actual_minutes}m)</span>
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>

                    {/* Section 7: Explain why a particular task is recommended */}
                    {task.recommendation_reason && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-100 dark:border-indigo-800/40">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>{task.recommendation_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks (Collapsible) */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Completed Tasks ({completedTasks.length})
            </div>

            <div className="space-y-2 opacity-75 hover:opacity-100 transition-opacity">
              {completedTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 line-through">
                      {task.title}
                    </span>
                    {task.subject_name && (
                      <span className="text-[10px] text-slate-400">
                        ({task.subject_name})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(task.id, 'pending')}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                      title="Reopen Task"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTaskId ? 'Edit Study Task' : 'New Study Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solve 5 Dijkstra Graph Problems"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={taskSubjectId}
                  onChange={e => setTaskSubjectId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General / None</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Duration (Min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    value={taskMinutes}
                    onChange={e => setTaskMinutes(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={taskScheduledDate}
                    onChange={e => setTaskScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Study Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific chapters, exercises, or objectives..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {editingTaskId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
