import React, { useEffect, useState } from 'react';
import {
  Award,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  MapPin,
  Target,
  Sparkles,
  X
} from 'lucide-react';
import { Exam, Goal, Subject } from '../../types';
import { api } from '../../services/api';

export const ExamsView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState<number | ''>('');
  const [examDate, setExamDate] = useState('');
  const [examTargetScore, setExamTargetScore] = useState(90);
  const [examWeight, setExamWeight] = useState(20);
  const [examLocation, setExamLocation] = useState('');
  const [examNotes, setExamNotes] = useState('');

  // Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('study_hours');
  const [goalTargetValue, setGoalTargetValue] = useState(10);
  const [goalUnit, setGoalUnit] = useState('hours');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eData, gData, sData] = await Promise.all([
        api.getExams(),
        api.getGoals(),
        api.getSubjects(),
      ]);
      setExams(eData);
      setGoals(gData);
      setSubjects(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateExam = () => {
    setEditingExamId(null);
    setExamTitle('');
    setExamSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setExamDate('');
    setExamTargetScore(90);
    setExamWeight(20);
    setExamLocation('');
    setExamNotes('');
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Exam> = {
        title: examTitle.trim(),
        subject_id: examSubjectId ? Number(examSubjectId) : null,
        exam_date: new Date(examDate).toISOString(),
        target_score: Number(examTargetScore),
        weight_percentage: Number(examWeight),
        location: examLocation.trim(),
        notes: examNotes.trim(),
      };

      if (editingExamId) {
        await api.updateExam(editingExamId, payload);
      } else {
        await api.createExam(payload);
      }
      setIsExamModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save exam');
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.deleteExam(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGoal({
        title: goalTitle.trim(),
        category: goalCategory,
        target_value: Number(goalTargetValue),
        unit: goalUnit,
      });
      setIsGoalModalOpen(false);
      setGoalTitle('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await api.deleteGoal(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Exams Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Upcoming Exams & Deadlines</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time countdowns, weight percentages, and target scores feeding the Smart Planner.
          </p>
        </div>

        <button
          onClick={handleOpenCreateExam}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Exam Cards Grid */}
      {exams.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p>No exams logged. Add an upcoming midterm or final to enable countdown alerts.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => {
            const isUrgent = exam.days_remaining <= 3;
            return (
              <div
                key={exam.id}
                className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                  isUrgent
                    ? 'bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/20 dark:to-[#111827] border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {exam.days_remaining === 0
                        ? 'Due Today!'
                        : `${exam.days_remaining} day${exam.days_remaining !== 1 ? 's' : ''} left`}
                    </span>

                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {exam.title}
                  </h4>

                  {exam.subject_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: exam.subject_color || '#6366F1' }}
                      />
                      <span>{exam.subject_name}</span>
                    </div>
                  )}

                  {exam.location && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{exam.location}</span>
                    </div>
                  )}

                  {exam.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                      {exam.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Weight: {exam.weight_percentage}%
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Target: {exam.target_score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goals Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>Target Study Goals</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set weekly milestone targets for study hours, completed quizzes, and flashcard repetitions.
            </p>
          </div>

          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => (
            <div
              key={goal.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {goal.title}
                </span>

                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                  title="Remove Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {goal.current_value} / {goal.target_value} {goal.unit}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExamId ? 'Edit Exam' : 'Add Upcoming Exam'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Algorithms & Complexity Midterm"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={examSubjectId}
                  onChange={e => setExamSubjectId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Score (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={examTargetScore}
                    onChange={e => setExamTargetScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade Weight (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={examWeight}
                    onChange={e => setExamWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall C"
                    value={examLocation}
                    onChange={e => setExamLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered in exam..."
                  value={examNotes}
                  onChange={e => setExamNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Target Study Goal
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete 15 Focus Hours This Week"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={goalTargetValue}
                    onChange={e => setGoalTargetValue(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={goalUnit}
                    onChange={e => setGoalUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="cards">Cards</option>
                    <option value="quizzes">Quizzes</option>
                    <option value="topics">Topics</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
