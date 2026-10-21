import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Pin,
  Clock,
  BookOpen,
  X,
  FileUp
} from 'lucide-react';
import { Note, Subject } from '../../types';
import { api } from '../../services/api';

interface NotesViewProps {
  onNavigateToQuiz?: (noteId: number) => void;
  onNavigateToFlashcards?: (noteId: number) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  onNavigateToQuiz,
  onNavigateToFlashcards
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<number | ''>('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Summarize state
  const [summaryData, setSummaryData] = useState<{ summary: string; key_points: string[]; word_count: number; estimated_read_minutes: number } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Ask Document Assistant state
  const [docQuery, setDocQuery] = useState('');
  const [docAnswer, setDocAnswer] = useState<{ answer: string; cited_snippets: string[]; confidence: number } | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // PDF Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const [nData, sData] = await Promise.all([
        api.getNotes(searchQuery, selectedSubjectId ? Number(selectedSubjectId) : undefined),
        api.getSubjects(),
      ]);
      setNotes(nData);
      setSubjects(sData);

      if (nData.length > 0 && !selectedNote) {
        selectNote(nData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [searchQuery, selectedSubjectId]);

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags || '');
    setEditSubjectId(note.subject_id || '');
    setIsPinned(note.is_pinned);
    setSummaryData(note.summary ? {
      summary: note.summary,
      key_points: note.summary.split('. ').filter(Boolean),
      word_count: note.content.split(/\s+/).length,
      estimated_read_minutes: Math.ceil(note.content.split(/\s+/).length / 200)
    } : null);
    setDocAnswer(null);
    setDocQuery('');
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await api.createNote({
        title: 'Untitled Note',
        content: '# New Note\n\nWrite your concepts or lecture notes here...',
        subject_id: subjects.length > 0 ? subjects[0].id : null,
      });
      await loadNotes();
      selectNote(newNote);
    } catch (err: any) {
      alert(err.message || 'Failed to create note');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: editTitle.trim(),
        content: editContent,
        tags: editTags.trim(),
        subject_id: editSubjectId ? Number(editSubjectId) : null,
        is_pinned: isPinned,
      });
      setSelectedNote(updated);
      await loadNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      setSelectedNote(null);
      await loadNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const handleSummarize = async () => {
    if (!selectedNote) return;
    setIsSummarizing(true);
    try {
      const res = await api.summarizeNote(selectedNote.id);
      setSummaryData(res);
    } catch (err: any) {
      alert(err.message || 'Summarization failed');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !docQuery.trim()) return;
    setIsAsking(true);
    try {
      const res = await api.askDoc(selectedNote.id, docQuery.trim());
      setDocAnswer(res);
    } catch (err: any) {
      alert(err.message || 'Failed to search document');
    } finally {
      setIsAsking(false);
    }
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Support large textbooks and lecture slides up to 150MB
    const maxBytes = 150 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed upload size is 150MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const newNote = await api.uploadPdf(file, undefined, selectedSubjectId ? Number(selectedSubjectId) : undefined);
      await loadNotes();
      selectNote(newNote);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process PDF.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Notes & PDF Assistant</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Markdown lecture notes, PDF text extraction (up to 150MB), local extractive summarization, and cited document Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Hidden PDF file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Extracting PDF...' : 'Upload PDF'}</span>
          </button>

          <button
            onClick={handleCreateNewNote}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Split: Note List on Left / Editor & Assistant on Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Col: Note List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes & tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes list */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p>No notes found.</p>
              </div>
            ) : (
              notes.map(note => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/80 dark:bg-[#111827]/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.is_pinned && (
                          <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500 flex-shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {note.title}
                        </h4>
                      </div>

                      {note.source_filename && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">
                          PDF
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {note.summary || note.content.slice(0, 80) || 'Empty note...'}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{note.subject_name || 'General'}</span>
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Note Editor & Assistant (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedNote ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              {/* Note Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none flex-1"
                />

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    title={isPinned ? 'Unpin note' : 'Pin note'}
                    className={`p-1.5 rounded-lg border text-xs ${
                      isPinned
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
                  </button>

                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subject Tag Selector */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 font-semibold">Subject:</span>
                <select
                  value={editSubjectId}
                  onChange={e => setEditSubjectId(e.target.value ? Number(e.target.value) : '')}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">General</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Tags (e.g. Algorithms, Exam)..."
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="flex-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              {/* Extractive Summary Box (if generated) */}
              {summaryData && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Extractive Key Summary</span>
                    </span>
                    <span className="text-[11px] text-indigo-500 font-normal">
                      {summaryData.word_count} words • ~{summaryData.estimated_read_minutes} min read
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {summaryData.summary}
                  </p>
                </div>
              )}

              {/* Markdown Content Editor */}
              <div>
                <textarea
                  rows={14}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Write your study notes using standard Markdown..."
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Cited Document Q&A Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Ask Document Assistant (Cited Q&A)
                  </span>
                </div>

                <form onSubmit={handleAskDoc} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question about this document (e.g. 'What is the formula for attention?')..."
                    value={docQuery}
                    onChange={e => setDocQuery(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !docQuery.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAsking ? 'Searching...' : 'Ask'}</span>
                  </button>
                </form>

                {/* Answer and Quoted Source Citations */}
                {docAnswer && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs animate-in fade-in">
                    <div className="text-xs text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                      {docAnswer.answer}
                    </div>

                    {docAnswer.cited_snippets.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Cited Source Passages:
                        </span>
                        {docAnswer.cited_snippets.map((snip, sIdx) => (
                          <blockquote
                            key={sIdx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-500"
                          >
                            "{snip}"
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Select or create a note on the left to begin reading or editing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
