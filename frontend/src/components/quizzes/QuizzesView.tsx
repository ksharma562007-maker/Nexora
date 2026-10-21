import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Trash2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion, QuizAttempt, Subject, Note } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/audio';

export const QuizzesView: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active quiz session state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizAttemptResult, setQuizAttemptResult] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | ''>('');
  const [newPassingScore, setNewPassingScore] = useState(70);
  const [newQuestions, setNewQuestions] = useState<Array<{
    question_text: string;
    question_type: 'mcq' | 'true_false' | 'short_answer';
    options: string[];
    correct_answer: string;
    explanation: string;
    points: number;
  }>>([
    {
      question_text: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 1
    }
  ]);

  // Generate form state
  const [selectedNoteId, setSelectedNoteId] = useState<number | ''>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qData, sData, nData] = await Promise.all([
        api.getQuizzes(),
        api.getSubjects(),
        api.getNotes(),
      ]);
      setQuizzes(qData);
      setSubjects(sData);
      setNotes(nData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartQuiz = async (quizId: number) => {
    try {
      const detail = await api.getQuizDetail(quizId);
      setActiveQuiz(detail);
      setCurrentQIndex(0);
      setAnswers({});
      setQuizAttemptResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to start quiz');
    }
  };

  const handleSelectAnswer = (qId: number, val: string) => {
    sound.playClick();
    setAnswers(prev => ({
      ...prev,
      [qId.toString()]: val
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const attempt = await api.submitQuiz(activeQuiz.id, answers);
      setQuizAttemptResult(attempt);
      if (attempt.passed) {
        sound.playSuccess();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Delete this quiz and all questions?')) return;
    try {
      await api.deleteQuiz(quizId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const handleGenerateFromNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNoteId) return;
    setIsSubmitting(true);
    try {
      await api.generateQuizFromNote({ note_id: Number(selectedNoteId) });
      setIsGenerateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuestionToForm = () => {
    setNewQuestions(prev => [
      ...prev,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        points: 1
      }
    ]);
  };

  const handleSaveCustomQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuiz({
        title: newTitle.trim(),
        description: newDesc.trim(),
        subject_id: newSubjectId ? Number(newSubjectId) : null,
        passing_score: Number(newPassingScore),
        questions: newQuestions.filter(q => q.question_text.trim() && q.correct_answer.trim())
      });
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create quiz');
    }
  };

  // --- Active Quiz Taking Mode ---
  if (activeQuiz && !quizAttemptResult) {
    const questions = activeQuiz.questions || [];
    const currentQ = questions[currentQIndex];

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {activeQuiz.subject_name || 'General Assessment'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeQuiz.title}
            </h3>
          </div>

          <button
            onClick={() => setActiveQuiz(null)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-semibold">
            <span>Question {currentQIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {currentQ.question_type.toUpperCase().replace('_', ' ')}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question_text}
              </h4>
            </div>

            {/* MCQ & True/False Options */}
            {currentQ.question_type !== 'short_answer' ? (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id.toString()] === opt;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(currentQ.id, opt)}
                      className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Short Answer input */
              <div>
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id.toString()] || ''}
                  onChange={e => handleSelectAnswer(currentQ.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Grading Answers...' : 'Submit Assessment'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Quiz Attempt Results Review Mode ---
  if (quizAttemptResult && activeQuiz) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Score Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-3 ${
            quizAttemptResult.passed
              ? 'bg-gradient-to-br from-emerald-900/90 to-[#0B0F19] border-emerald-800 text-white'
              : 'bg-gradient-to-br from-rose-950/90 to-[#0B0F19] border-rose-900 text-white'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
            {quizAttemptResult.passed ? (
              <span className="text-emerald-400">PASSED ASSESSMENT</span>
            ) : (
              <span className="text-rose-400">NEEDS REVISION</span>
            )}
          </div>

          <h3 className="text-4xl sm:text-5xl font-black tracking-tight">
            {quizAttemptResult.percentage.toFixed(0)}%
          </h3>

          <p className="text-sm text-slate-300">
            Scored {quizAttemptResult.score} of {quizAttemptResult.max_score} points • Passing threshold: {activeQuiz.passing_score}%
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => handleStartQuiz(activeQuiz.id)}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizAttemptResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20"
            >
              Back to Catalog
            </button>
          </div>
        </div>

        {/* Identified Weak Topics */}
        {quizAttemptResult.weak_topics.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>Identified Knowledge Gaps from this Attempt</span>
            </div>
            <ul className="text-xs text-amber-900 dark:text-amber-200 space-y-1 list-disc list-inside">
              {quizAttemptResult.weak_topics.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Question-by-Question Detailed Review */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Detailed Solution & Explanation Review
          </h4>

          {quizAttemptResult.results.map((res, idx) => (
            <div
              key={res.question_id}
              className={`p-5 rounded-2xl border space-y-2.5 ${
                res.is_correct
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Question {idx + 1}: {res.question_text}
                </span>
                {res.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                )}
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <p>
                  Your Answer: <strong className={res.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{res.user_answer}</strong>
                </p>
                {!res.is_correct && (
                  <p>
                    Correct Answer: <strong className="text-emerald-600 dark:text-emerald-400">{res.correct_answer}</strong>
                  </p>
                )}
                {res.explanation && (
                  <p className="pt-1.5 text-[11px] text-slate-500 italic">
                    Reason: {res.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Quiz Catalog Mode ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quizzes & Assessments</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real scoring, detailed explanations, and automated question generation from study notes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate from Notes</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Quiz</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No quizzes available yet.</p>
          <p>Create your own questions or automatically extract practice assessments from your study notes.</p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Auto-Generate from Notes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                    {quiz.subject_name || 'General'}
                  </span>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {quiz.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{quiz.question_count} questions</span>
                  <span>Pass: {quiz.passing_score}%</span>
                  {quiz.latest_score !== null && quiz.latest_score !== undefined && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Best: {quiz.latest_score.toFixed(0)}%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleStartQuiz(quiz.id)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Take Quiz Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-Generate from Note Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Auto-Generate Quiz</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateFromNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Source Note
                </label>
                <select
                  value={selectedNoteId}
                  onChange={e => setSelectedNoteId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a note...</option>
                  {notes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.subject_name || 'General'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Our local engine parses definitions, concepts, and bullet points to generate authentic questions.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedNoteId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {isSubmitting ? 'Extracting & Generating...' : 'Generate Practice Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Quiz Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Custom Quiz
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomQuiz} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems Final Review"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={e => setNewSubjectId(e.target.value ? Number(e.target.value) : '')}
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
              </div>

              {/* Questions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Questions ({newQuestions.length})</span>
                  <button
                    type="button"
                    onClick={handleAddQuestionToForm}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {newQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Question #{idx + 1}
                      </span>
                      {newQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Question text..."
                      value={q.question_text}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQuestions(prev => {
                          const copy = [...prev];
                          copy[idx].question_text = val;
                          return copy;
                        });
                      }}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Correct answer..."
                        value={q.correct_answer}
                        onChange={e => {
                          const val = e.target.value;
                          setNewQuestions(prev => {
                            const copy = [...prev];
                            copy[idx].correct_answer = val;
                            return copy;
                          });
                        }}
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <input
                        type="text"
                        placeholder="Explanation / source cite..."
                        value={q.explanation}
                        onChange={e => {
                          const val = e.target.value;
                          setNewQuestions(prev => {
                            const copy = [...prev];
                            copy[idx].explanation = val;
                            return copy;
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
