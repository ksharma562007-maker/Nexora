import React, { useEffect, useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FlashcardDeck, Flashcard, Note, Subject } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/audio';

export const FlashcardsView: React.FC = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active study mode
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Deck Management Modal
  const [selectedDeckForManage, setSelectedDeckForManage] = useState<FlashcardDeck | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');

  // Create Deck Modal
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckSubjectId, setDeckSubjectId] = useState<number | ''>('');
  const [deckColor, setDeckColor] = useState('#8B5CF6');

  // Generate Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateNoteId, setGenerateNoteId] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [decksData, subjectsData, notesData] = await Promise.all([
        api.getDecks(),
        api.getSubjects(),
        api.getNotes(),
      ]);
      setDecks(decksData);
      setSubjects(subjectsData);
      setNotes(notesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartStudy = async (deck: FlashcardDeck) => {
    try {
      const cards = await api.getDueCards(deck.id);
      if (cards.length === 0) {
        // If no due cards, ask if user wants to review all cards
        const allCards = await api.getDeckCards(deck.id);
        if (allCards.length === 0) {
          alert('This deck has no cards yet. Click "Manage Cards" to add some.');
          return;
        }
        setStudyCards(allCards);
      } else {
        setStudyCards(cards);
      }
      setActiveDeck(deck);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      setIsSessionComplete(false);
    } catch (err: any) {
      alert(err.message || 'Failed to start revision');
    }
  };

  const handleFlip = () => {
    sound.playClick();
    setIsFlipped(prev => !prev);
  };

  const handleRateRecall = async (rating: number) => {
    sound.playClick();
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    try {
      await api.reviewCard(currentCard.id, rating);
    } catch (err) {
      console.error(err);
    }

    if (currentCardIndex + 1 < studyCards.length) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setIsSessionComplete(true);
      sound.playSuccess();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      loadData();
    }
  };

  const handleOpenManageCards = async (deck: FlashcardDeck) => {
    setSelectedDeckForManage(deck);
    try {
      const cards = await api.getDeckCards(deck.id);
      setDeckCards(cards);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckForManage || !newFront.trim() || !newBack.trim()) return;

    try {
      const card = await api.createCard({
        deck_id: selectedDeckForManage.id,
        front: newFront.trim(),
        back: newBack.trim(),
        hint: newHint.trim(),
      });
      setDeckCards(prev => [...prev, card]);
      setNewFront('');
      setNewBack('');
      setNewHint('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add card');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await api.deleteCard(cardId);
      setDeckCards(prev => prev.filter(c => c.id !== cardId));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete card');
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDeck({
        title: deckTitle.trim(),
        description: deckDesc.trim(),
        subject_id: deckSubjectId ? Number(deckSubjectId) : null,
        color: deckColor,
      });
      setIsCreateDeckOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create deck');
    }
  };

  const handleDeleteDeck = async (deckId: number) => {
    if (!window.confirm('Delete this flashcard deck and all its cards?')) return;
    try {
      await api.deleteDeck(deckId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete deck');
    }
  };

  const handleGenerateFromNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateNoteId) return;
    setIsGenerating(true);
    try {
      await api.generateFlashcardsFromNote({ note_id: Number(generateNoteId) });
      setIsGenerateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Active Study Mode ---
  if (activeDeck && !isSessionComplete) {
    const currentCard = studyCards[currentCardIndex];
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              SM-2 Spaced Repetition Session
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeDeck.title}
            </h3>
          </div>

          <button
            onClick={() => setActiveDeck(null)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Exit Deck
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-semibold">
            <span>Card {currentCardIndex + 1} of {studyCards.length}</span>
            <span>Interval: {currentCard?.interval_days || 1}d (Ease: {currentCard?.ease_factor || 2.5})</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 3D Interactive Flip Card */}
        {currentCard && (
          <div
            onClick={handleFlip}
            className="w-full min-h-[300px] sm:min-h-[340px] rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 shadow-xl cursor-pointer flex flex-col justify-between transition-all hover:shadow-2xl relative select-none"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                {isFlipped ? 'Answer Back' : 'Question Prompt'}
              </span>
              <span className="text-[11px] flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click to flip</span>
              </span>
            </div>

            <div className="py-6 text-center space-y-3">
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {!isFlipped && currentCard.hint && showHint && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs inline-flex items-center gap-1.5 animate-in fade-in">
                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{currentCard.hint}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              {!isFlipped && currentCard.hint ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                </button>
              ) : <div />}

              <span className="text-[11px] text-slate-400 font-mono">
                Repetition #{currentCard.repetition}
              </span>
            </div>
          </div>
        )}

        {/* Recall Rating Controls (SuperMemo SM-2) */}
        {isFlipped ? (
          <div className="space-y-2 animate-in fade-in duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center">
              Rate Your Recall Difficulty
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleRateRecall(1)}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 text-center transition-all"
              >
                <div className="font-bold text-xs sm:text-sm">Again</div>
                <div className="text-[10px] text-rose-500 mt-0.5">Reset (1d)</div>
              </button>

              <button
                onClick={() => handleRateRecall(2)}
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 text-center transition-all"
              >
                <div className="font-bold text-xs sm:text-sm">Hard</div>
                <div className="text-[10px] text-amber-500 mt-0.5">Difficult</div>
              </button>

              <button
                onClick={() => handleRateRecall(3)}
                className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 text-center transition-all"
              >
                <div className="font-bold text-xs sm:text-sm">Good</div>
                <div className="text-[10px] text-indigo-500 mt-0.5">Standard</div>
              </button>

              <button
                onClick={() => handleRateRecall(4)}
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 text-center transition-all"
              >
                <div className="font-bold text-xs sm:text-sm">Easy</div>
                <div className="text-[10px] text-emerald-500 mt-0.5">Bonus (+3d)</div>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleFlip}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Reveal Answer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // --- Session Completed Mode ---
  if (activeDeck && isSessionComplete) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            Deck Review Completed!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Great job! You reviewed all {studyCards.length} cards in "{activeDeck.title}". The SM-2 algorithm has updated future revision intervals.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => handleStartStudy(activeDeck)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            Review Again
          </button>
          <button
            onClick={() => setActiveDeck(null)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  // --- Catalog Mode ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Spaced Repetition Decks</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            SuperMemo SM-2 algorithm calculates memory decay curves to schedule flashcards right when you're about to forget them.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-violet-200 dark:border-violet-800/80 bg-violet-50/60 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate from Notes</span>
          </button>

          <button
            onClick={() => setIsCreateDeckOpen(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Deck</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-3">
          <BookOpenCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No flashcard decks yet.</p>
          <p>Create custom study decks or automatically extract concept flashcards from your notes.</p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
            >
              Auto-Generate from Notes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: deck.color || '#8B5CF6' }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Deck
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="Delete Deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {deck.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {deck.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{deck.total_cards} cards</span>
                  {deck.due_cards > 0 ? (
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {deck.due_cards} due today
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Up to date
                    </span>
                  )}
                  <span>{deck.new_cards} new</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStartStudy(deck)}
                    className="py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Study Now</span>
                  </button>

                  <button
                    onClick={() => handleOpenManageCards(deck)}
                    className="py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Manage Cards
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Cards Drawer / Modal */}
      {selectedDeckForManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manage Cards: {selectedDeckForManage.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {deckCards.length} cards in this deck
                </p>
              </div>

              <button
                onClick={() => setSelectedDeckForManage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Card Form */}
            <form onSubmit={handleAddCard} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Add New Card
              </span>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Front prompt / question..."
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                <input
                  type="text"
                  placeholder="Back answer / definition..."
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Optional hint..."
                  value={newHint}
                  onChange={e => setNewHint(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs"
                >
                  Add Card
                </button>
              </div>
            </form>

            {/* Cards List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {deckCards.map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {c.front}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 truncate">
                      {c.back}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.interval_days}d interval
                    </span>
                    <button
                      onClick={() => handleDeleteCard(c.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Deck Modal */}
      {isCreateDeckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Flashcard Deck
              </h3>
              <button
                onClick={() => setIsCreateDeckOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning Key Formulas"
                  value={deckTitle}
                  onChange={e => setDeckTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={deckSubjectId}
                  onChange={e => setDeckSubjectId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">General</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {['#8B5CF6', '#6366F1', '#EC4899', '#10B981', '#F59E0B'].map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setDeckColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        deckColor === c ? 'scale-125 ring-2 ring-offset-2 ring-violet-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
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
                  placeholder="What concepts does this deck reinforce?"
                  value={deckDesc}
                  onChange={e => setDeckDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeckOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Save Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Generate from Note Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>Auto-Generate Flashcards</span>
              </h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
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
                  value={generateNoteId}
                  onChange={e => setGenerateNoteId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Choose a note...</option>
                  {notes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Extracts term-definition pairs and key sentences into review cards.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !generateNoteId}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {isGenerating ? 'Extracting Cards...' : 'Generate Flashcard Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
