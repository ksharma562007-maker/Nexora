import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { Subject, Topic } from '../../types';
import { api } from '../../services/api';

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subject Modal
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [editingSubjId, setEditingSubjId] = useState<number | null>(null);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjDesc, setSubjDesc] = useState('');
  const [subjColor, setSubjColor] = useState('#6366F1');
  const [subjTargetHours, setSubjTargetHours] = useState(25);

  // Topic Modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicPriority, setTopicPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [topicConfidence, setTopicConfidence] = useState(3);
  const [topicMastery, setTopicMastery] = useState(0);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSubjects();
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        loadSubjectDetail(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjectDetail = async (subj: Subject) => {
    setSelectedSubject(subj);
    try {
      const detail = await api.getSubjectDetail(subj.id);
      setTopics(detail.topics || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenCreateSubj = () => {
    setEditingSubjId(null);
    setSubjName('');
    setSubjCode('');
    setSubjDesc('');
    setSubjColor('#6366F1');
    setSubjTargetHours(25);
    setIsSubjModalOpen(true);
  };

  const handleOpenEditSubj = (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubjId(s.id);
    setSubjName(s.name);
    setSubjCode(s.code || '');
    setSubjDesc(s.description || '');
    setSubjColor(s.color || '#6366F1');
    setSubjTargetHours(s.target_hours || 25);
    setIsSubjModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubjId) {
        await api.updateSubject(editingSubjId, {
          name: subjName,
          code: subjCode,
          description: subjDesc,
          color: subjColor,
          target_hours: Number(subjTargetHours),
        });
      } else {
        await api.createSubject({
          name: subjName,
          code: subjCode,
          description: subjDesc,
          color: subjColor,
          target_hours: Number(subjTargetHours),
        });
      }
      setIsSubjModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to save subject');
    }
  };

  const handleDeleteSubject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this subject and all its topics?')) return;
    try {
      await api.deleteSubject(id);
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
        setTopics([]);
      }
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  // Topic handlers
  const handleOpenCreateTopic = () => {
    setEditingTopicId(null);
    setTopicTitle('');
    setTopicDesc('');
    setTopicPriority('medium');
    setTopicConfidence(3);
    setTopicMastery(0);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: Topic) => {
    setEditingTopicId(t.id);
    setTopicTitle(t.title);
    setTopicDesc(t.description || '');
    setTopicPriority(t.priority);
    setTopicConfidence(t.confidence_level);
    setTopicMastery(t.mastery_score);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      if (editingTopicId) {
        await api.updateTopic(editingTopicId, {
          title: topicTitle,
          description: topicDesc,
          priority: topicPriority,
          confidence_level: topicConfidence,
          mastery_score: Number(topicMastery),
        });
      } else {
        await api.createTopic({
          subject_id: selectedSubject.id,
          title: topicTitle,
          description: topicDesc,
          priority: topicPriority,
          confidence_level: topicConfidence,
          mastery_score: Number(topicMastery),
        });
      }
      setIsTopicModalOpen(false);
      loadSubjectDetail(selectedSubject);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(id);
      if (selectedSubject) {
        loadSubjectDetail(selectedSubject);
      }
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete topic');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Curriculum & Topics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Organize coursework into subjects and track individual topic mastery scores.
          </p>
        </div>

        <button
          onClick={handleOpenCreateSubj}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Main Split Layout: Subjects list on left / Topics on right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Subjects ({subjects.length})
          </div>

          {subjects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No subjects yet.</p>
              <button
                onClick={handleOpenCreateSubj}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Create Subject
              </button>
            </div>
          ) : (
            subjects.map(subj => {
              const isSelected = selectedSubject?.id === subj.id;
              return (
                <div
                  key={subj.id}
                  onClick={() => loadSubjectDetail(subj)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#111827] border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 dark:bg-[#111827]/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                        style={{ backgroundColor: subj.color || '#6366F1' }}
                      >
                        {subj.code ? subj.code.slice(0, 3) : subj.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {subj.name}
                          </h4>
                          {subj.code && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {subj.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {subj.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                      <button
                        onClick={e => handleOpenEditSubj(subj, e)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDeleteSubject(subj.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {subj.topics_count} topic{subj.topics_count !== 1 ? 's' : ''} • {subj.target_hours}h target
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {subj.mastery_average}% Mastery
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Topics Inside Selected Subject (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSubject ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedSubject.color || '#6366F1' }}
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedSubject.name} Topics
                    </h3>
                    <p className="text-xs text-slate-400">
                      {topics.length} concept modules configured
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenCreateTopic}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>

              {topics.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p>No topics added to this subject yet.</p>
                  <button
                    onClick={handleOpenCreateTopic}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    Add First Topic
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map(topic => (
                    <div
                      key={topic.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {topic.title}
                            </h5>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                topic.priority === 'high'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : topic.priority === 'low'
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}
                            >
                              {topic.priority} priority
                            </span>
                          </div>
                          {topic.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {topic.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                          <button
                            onClick={() => handleOpenEditTopic(topic)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600"
                            title="Edit Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Confidence & Mastery Telemetry */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Confidence:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= topic.confidence_level
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Mastery:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {topic.mastery_score.toFixed(0)}%
                          </span>
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${topic.mastery_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Select a subject on the left to view its topics.
            </div>
          )}
        </div>
      </div>

      {/* Subject Modal */}
      {isSubjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubjId ? 'Edit Subject' : 'New Academic Subject'}
              </h3>
              <button
                onClick={() => setIsSubjModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subjName}
                  onChange={e => setSubjName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS201"
                    value={subjCode}
                    onChange={e => setSubjCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={subjTargetHours}
                    onChange={e => setSubjTargetHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'].map(col => (
                    <button
                      type="button"
                      key={col}
                      onClick={() => setSubjColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        subjColor === col ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Course overview or goals..."
                  value={subjDesc}
                  onChange={e => setSubjDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {editingSubjId ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTopicId ? 'Edit Topic' : 'New Concept Topic'}
              </h3>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graph Traversal & Dijkstra"
                  value={topicTitle}
                  onChange={e => setTopicTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={topicPriority}
                    onChange={e => setTopicPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confidence (1-5)
                  </label>
                  <select
                    value={topicConfidence}
                    onChange={e => setTopicConfidence(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Moderate</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Mastered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Mastery Score ({topicMastery}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={topicMastery}
                  onChange={e => setTopicMastery(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Key Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts or textbook reference..."
                  value={topicDesc}
                  onChange={e => setTopicDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {editingTopicId ? 'Update Topic' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
