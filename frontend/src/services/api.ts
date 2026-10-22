import {
  User, Subject, Topic, StudyTask, FocusSession,
  Quiz, QuizAttempt, FlashcardDeck, Flashcard, Note,
  Exam, Goal, DashboardSummary
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// ==============================================================================
// Strict Multi-User Local Storage Engine for Offline & Vercel Deployments
// Each user has strictly isolated subjects, notes, tasks, flashcards, exams.
// New users start with 100% clean, empty records (no default fake data).
// ==============================================================================
class LocalStorageEngine {
  constructor() {
    this.cleanLegacyDemoData();
  }

  // Purge any legacy demo mock data from earlier sessions so it never leaks into new accounts
  private cleanLegacyDemoData() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      if (localStorage.getItem('nexora_seeded')) {
        localStorage.removeItem('nexora_seeded');
      }

      // Purge old mock seeded subjects (e.g. user_id: 1 from static seeder)
      const subjects = this.getStore<any[]>('subjects', []);
      const legacySubjectNames = [
        'Data Structures & Algorithms',
        'Machine Learning & Deep Learning',
        'Operating Systems & Architecture',
        'Computer Science & Engineering',
        'Discrete Mathematics'
      ];
      const cleanedSubjects = subjects.filter(s => {
        if (!s.user_id || s.user_id === 1) {
          if (legacySubjectNames.includes(s.name)) return false;
        }
        return true;
      });
      if (cleanedSubjects.length !== subjects.length) {
        this.setStore('subjects', cleanedSubjects);
      }

      // Purge old mock notes
      const notes = this.getStore<any[]>('notes', []);
      const legacyNoteTitles = [
        'Algorithms & Asymptotic Complexity',
        'Supervised Learning Fundamentals',
        'Binary Search Trees and Balanced AVL Trees',
        'Self-Attention and the Transformer Architecture'
      ];
      const cleanedNotes = notes.filter(n => {
        if (!n.user_id || n.user_id === 1) {
          if (legacyNoteTitles.includes(n.title)) return false;
        }
        return true;
      });
      if (cleanedNotes.length !== notes.length) {
        this.setStore('notes', cleanedNotes);
      }
    } catch {
      // Ignore
    }
  }

  private getStore<T = any>(key: string, defaultVal: T = [] as any): T {
    try {
      const val = localStorage.getItem(`nexora_${key}`);
      return val ? JSON.parse(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStore(key: string, val: any) {
    try {
      localStorage.setItem(`nexora_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage limit or error:', e);
    }
  }

  private getCurrentUser(): User | null {
    try {
      const u = localStorage.getItem('nexora_current_user');
      if (u) {
        return JSON.parse(u);
      }
      const token = localStorage.getItem('nexora_token');
      if (token && token.startsWith('token_')) {
        const idStr = token.replace('token_', '');
        const users = this.getStore<any[]>('users', []);
        const found = users.find(usr => String(usr.id) === String(idStr));
        if (found) {
          localStorage.setItem('nexora_current_user', JSON.stringify(found));
          return found;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public handleRequest(endpoint: string, options: RequestInit = {}): any {
    const method = (options.method || 'GET').toUpperCase();
    let body: any = {};
    if (options.body && typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch {
        // ignore
      }
    }

    const currentUser = this.getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : null;

    // --- Auth Endpoints ---
    if (endpoint === '/auth/register' && method === 'POST') {
      const users = this.getStore<any[]>('users', []);
      const email = (body.email || '').toLowerCase().trim();
      const username = (body.username || email.split('@')[0]).trim();
      const password = body.password || '';

      const existing = users.find(
        u => (u.email && u.email.toLowerCase() === email) || (u.username && u.username.toLowerCase() === username.toLowerCase())
      );
      if (existing) {
        throw new Error('An account with this email or username already exists. Please sign in instead.');
      }

      const newUser: User = {
        id: Date.now(),
        email,
        username,
        full_name: body.full_name?.trim() || username,
        avatar: 'avatar-1',
        daily_goal_minutes: 120,
        pomodoro_focus_min: 25,
        pomodoro_break_min: 5,
        theme_preference: 'dark',
        created_at: new Date().toISOString()
      };

      // Store new user with credentials
      users.push({ ...newUser, password });
      this.setStore('users', users);
      localStorage.setItem('nexora_current_user', JSON.stringify(newUser));
      localStorage.setItem('nexora_token', `token_${newUser.id}`);

      return {
        access_token: `token_${newUser.id}`,
        token_type: 'bearer',
        user: newUser
      };
    }

    if (endpoint === '/auth/login' && method === 'POST') {
      const users = this.getStore<any[]>('users', []);
      const identifier = (body.email || '').toLowerCase().trim();
      const password = body.password || '';

      const userRecord = users.find(
        u => (u.email && u.email.toLowerCase() === identifier) || (u.username && u.username.toLowerCase() === identifier)
      );

      if (!userRecord) {
        throw new Error('No account found with this email or username. Please check your credentials or sign up.');
      }

      if (userRecord.password && password && userRecord.password !== password) {
        throw new Error('Invalid credentials. Incorrect password.');
      }

      const userOut: User = {
        id: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        full_name: userRecord.full_name,
        avatar: userRecord.avatar || 'avatar-1',
        daily_goal_minutes: userRecord.daily_goal_minutes || 120,
        pomodoro_focus_min: userRecord.pomodoro_focus_min || 25,
        pomodoro_break_min: userRecord.pomodoro_break_min || 5,
        theme_preference: userRecord.theme_preference || 'dark',
        created_at: userRecord.created_at || new Date().toISOString()
      };

      localStorage.setItem('nexora_current_user', JSON.stringify(userOut));
      localStorage.setItem('nexora_token', `token_${userOut.id}`);

      return {
        access_token: `token_${userOut.id}`,
        token_type: 'bearer',
        user: userOut
      };
    }

    if (endpoint === '/auth/me') {
      const active = this.getCurrentUser();
      if (active) {
        return active;
      }
      throw new Error('No user signed in');
    }

    if (endpoint === '/auth/profile' && method === 'PUT') {
      if (!currentUserId) throw new Error('Unauthorized');
      const users = this.getStore<any[]>('users', []);
      const idx = users.findIndex(u => String(u.id) === String(currentUserId));
      if (idx !== -1) {
        Object.assign(users[idx], body);
        this.setStore('users', users);
        localStorage.setItem('nexora_current_user', JSON.stringify(users[idx]));
        return users[idx];
      }
      return body;
    }

    // --- Subjects & Topics (Filtered strictly by user_id) ---
    if (endpoint === '/subjects' && method === 'GET') {
      if (!currentUserId) return [];
      const subjects = this.getStore<Subject[]>('subjects', []);
      return subjects.filter(s => String(s.user_id) === String(currentUserId));
    }
    if (endpoint === '/subjects' && method === 'POST') {
      if (!currentUserId) throw new Error('You must be logged in to create a subject.');
      const subjects = this.getStore<Subject[]>('subjects', []);
      const newSubject: Subject = {
        id: Date.now(),
        user_id: currentUserId,
        name: body.name || 'Untitled Subject',
        code: body.code || '',
        description: body.description || '',
        color: body.color || '#6366F1',
        icon: body.icon || 'BookOpen',
        target_hours: body.target_hours || 20,
        topic_count: 0,
        mastery_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      subjects.push(newSubject);
      this.setStore('subjects', subjects);
      return newSubject;
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'GET') {
      if (!currentUserId) throw new Error('Subject not found');
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore<Subject[]>('subjects', []).filter(s => String(s.user_id) === String(currentUserId));
      const subject = subjects.find(s => s.id === id);
      if (!subject) throw new Error('Subject not found');
      const topics = this.getStore<Topic[]>('topics', []).filter(t => t.subject_id === id);
      return { ...subject, topics };
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'PUT') {
      if (!currentUserId) throw new Error('Subject not found');
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore<Subject[]>('subjects', []);
      const idx = subjects.findIndex(s => s.id === id && String(s.user_id) === String(currentUserId));
      if (idx !== -1) {
        Object.assign(subjects[idx], body, { updated_at: new Date().toISOString() });
        this.setStore('subjects', subjects);
        return subjects[idx];
      }
      throw new Error('Subject not found');
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'DELETE') {
      if (!currentUserId) throw new Error('Subject not found');
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore<Subject[]>('subjects', []).filter(s => !(s.id === id && String(s.user_id) === String(currentUserId)));
      this.setStore('subjects', subjects);
      return { message: 'Subject deleted successfully' };
    }

    // --- Topics ---
    if (endpoint === '/subjects/topics' && method === 'POST') {
      const topics = this.getStore<Topic[]>('topics', []);
      const newTopic: Topic = {
        id: Date.now(),
        subject_id: body.subject_id,
        title: body.title || 'New Topic',
        description: body.description || '',
        priority: body.priority || 'medium',
        confidence_level: body.confidence_level || 2,
        mastery_score: body.mastery_score || 0,
        status: body.status || 'not_started',
        created_at: new Date().toISOString()
      };
      topics.push(newTopic);
      this.setStore('topics', topics);

      // Increment subject topic_count
      const subjects = this.getStore<Subject[]>('subjects', []);
      const s = subjects.find(sub => sub.id === body.subject_id && String(sub.user_id) === String(currentUserId));
      if (s) {
        s.topic_count = (s.topic_count || 0) + 1;
        this.setStore('subjects', subjects);
      }
      return newTopic;
    }
    if (endpoint.startsWith('/subjects/topics/') && method === 'PUT') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const topics = this.getStore<Topic[]>('topics', []);
      const idx = topics.findIndex(t => t.id === id);
      if (idx !== -1) {
        Object.assign(topics[idx], body);
        this.setStore('topics', topics);
        return topics[idx];
      }
      throw new Error('Topic not found');
    }
    if (endpoint.startsWith('/subjects/topics/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const topics = this.getStore<Topic[]>('topics', []).filter(t => t.id !== id);
      this.setStore('topics', topics);
      return { message: 'Topic deleted successfully' };
    }

    // --- Planner Tasks (Filtered strictly by user_id) ---
    if (endpoint.startsWith('/planner/tasks') && method === 'GET') {
      if (!currentUserId) return [];
      return this.getStore<StudyTask[]>('tasks', []).filter(t => String(t.user_id) === String(currentUserId));
    }
    if (endpoint === '/planner/tasks' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const tasks = this.getStore<StudyTask[]>('tasks', []);
      const newTask: StudyTask = {
        id: Date.now(),
        user_id: currentUserId,
        subject_id: body.subject_id || null,
        topic_id: body.topic_id || null,
        title: body.title || 'Untitled Task',
        priority: body.priority || 'medium',
        estimated_minutes: body.estimated_minutes || 30,
        status: body.status || 'pending',
        scheduled_date: body.scheduled_date || new Date().toISOString().split('T')[0],
        is_recommended: false,
        created_at: new Date().toISOString()
      };
      tasks.push(newTask);
      this.setStore('tasks', tasks);
      return newTask;
    }
    if (endpoint.startsWith('/planner/tasks/') && method === 'PUT') {
      if (!currentUserId) throw new Error('Task not found');
      const id = parseInt(endpoint.split('/').pop() || '0');
      const tasks = this.getStore<StudyTask[]>('tasks', []);
      const idx = tasks.findIndex(t => t.id === id && String(t.user_id) === String(currentUserId));
      if (idx !== -1) {
        Object.assign(tasks[idx], body);
        this.setStore('tasks', tasks);
        return tasks[idx];
      }
      throw new Error('Task not found');
    }
    if (endpoint.startsWith('/planner/tasks/') && method === 'DELETE') {
      if (!currentUserId) throw new Error('Task not found');
      const id = parseInt(endpoint.split('/').pop() || '0');
      const tasks = this.getStore<StudyTask[]>('tasks', []).filter(t => !(t.id === id && String(t.user_id) === String(currentUserId)));
      this.setStore('tasks', tasks);
      return { message: 'Task deleted' };
    }
    if (endpoint === '/planner/recommendations') {
      if (!currentUserId) return { recommended_tasks: [], conflicts: [], daily_load: {}, daily_capacity_minutes: 120 };
      const tasks = this.getStore<StudyTask[]>('tasks', []).filter(t => String(t.user_id) === String(currentUserId) && t.status !== 'completed');
      return {
        recommended_tasks: tasks.slice(0, 3).map(t => ({
          task: t,
          priority_score: 80,
          reasons: ['Scheduled task'],
          explanation: `Recommended focus for ${t.title}.`
        })),
        conflicts: [],
        daily_load: {},
        daily_capacity_minutes: 120
      };
    }

    // --- Focus Timer (Filtered strictly by user_id) ---
    if (endpoint === '/timer/sessions' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const sessions = this.getStore<any[]>('sessions', []);
      const newSession = {
        id: Date.now(),
        user_id: currentUserId,
        ...body,
        created_at: new Date().toISOString()
      };
      sessions.push(newSession);
      this.setStore('sessions', sessions);
      return newSession;
    }
    if (endpoint === '/timer/stats') {
      if (!currentUserId) {
        return {
          today_minutes: 0,
          weekly_minutes: 0,
          total_hours: 0,
          total_sessions: 0,
          recent_sessions: [],
          daily_goal_minutes: 120,
          pomodoro_focus_min: 25,
          pomodoro_break_min: 5
        };
      }
      const sessions = this.getStore<any[]>('sessions', []).filter(s => String(s.user_id) === String(currentUserId));
      const todayKey = new Date().toISOString().split('T')[0];
      const todaySec = sessions
        .filter(s => (s.created_at || '').startsWith(todayKey))
        .reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      const totalSec = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

      return {
        today_minutes: Math.round(todaySec / 60),
        weekly_minutes: Math.round(totalSec / 60),
        total_hours: +(totalSec / 3600).toFixed(1),
        total_sessions: sessions.length,
        recent_sessions: sessions.slice(-5),
        daily_goal_minutes: currentUser?.daily_goal_minutes || 120,
        pomodoro_focus_min: currentUser?.pomodoro_focus_min || 25,
        pomodoro_break_min: currentUser?.pomodoro_break_min || 5
      };
    }

    // --- Quizzes (Filtered strictly by user_id) ---
    if (endpoint === '/quizzes' && method === 'GET') {
      if (!currentUserId) return [];
      return this.getStore<Quiz[]>('quizzes', []).filter(q => String(q.user_id) === String(currentUserId));
    }
    if (endpoint === '/quizzes' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const quizzes = this.getStore<Quiz[]>('quizzes', []);
      const newQuiz: Quiz = {
        id: Date.now(),
        user_id: currentUserId,
        subject_id: body.subject_id || null,
        topic_id: body.topic_id || null,
        title: body.title || 'Untitled Quiz',
        description: body.description || '',
        time_limit_minutes: body.time_limit_minutes || 15,
        passing_score: body.passing_score || 70,
        question_count: body.questions?.length || 0,
        created_at: new Date().toISOString(),
        questions: body.questions || []
      };
      quizzes.push(newQuiz);
      this.setStore('quizzes', quizzes);
      return newQuiz;
    }
    if (endpoint.startsWith('/quizzes/') && !endpoint.includes('submit') && !endpoint.includes('attempts') && method === 'GET') {
      const id = parseInt(endpoint.split('/')[2]);
      const quizzes = this.getStore<Quiz[]>('quizzes', []).filter(q => String(q.user_id) === String(currentUserId));
      const quiz = quizzes.find(q => q.id === id);
      if (!quiz) throw new Error('Quiz not found');
      return quiz;
    }
    if (endpoint.includes('/submit') && method === 'POST') {
      const id = parseInt(endpoint.split('/')[2]);
      const quizzes = this.getStore<Quiz[]>('quizzes', []).filter(q => String(q.user_id) === String(currentUserId));
      const quiz = quizzes.find(q => q.id === id);
      const questions = quiz?.questions || [];
      const answers = body.answers || {};

      let score = 0;
      const details = questions.map((q, idx) => {
        const userAns = answers[q.id] || answers[idx] || '';
        const isCorrect = userAns.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
        if (isCorrect) score += 1;
        return {
          question_id: q.id,
          question_text: q.question_text,
          user_answer: userAns,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
          explanation: q.explanation || ''
        };
      });

      const total = questions.length || 1;
      const pct = Math.round((score / total) * 100);
      return {
        id: Date.now(),
        quiz_id: id,
        user_id: currentUserId,
        score,
        max_score: total,
        percentage: pct,
        passed: pct >= (quiz?.passing_score || 70),
        completed_at: new Date().toISOString(),
        results: details,
        weak_topics: []
      };
    }
    if (endpoint.includes('/attempts')) {
      return [];
    }

    // --- Flashcards (Filtered strictly by user_id) ---
    if (endpoint === '/flashcards/decks' && method === 'GET') {
      if (!currentUserId) return [];
      return this.getStore<FlashcardDeck[]>('decks', []).filter(d => String(d.user_id) === String(currentUserId));
    }
    if (endpoint === '/flashcards/decks' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const decks = this.getStore<FlashcardDeck[]>('decks', []);
      const newDeck: FlashcardDeck = {
        id: Date.now(),
        user_id: currentUserId,
        subject_id: body.subject_id || null,
        topic_id: body.topic_id || null,
        title: body.title || 'Untitled Deck',
        description: body.description || '',
        color: body.color || '#6366F1',
        total_cards: 0,
        due_cards: 0,
        new_cards: 0,
        created_at: new Date().toISOString()
      };
      decks.push(newDeck);
      this.setStore('decks', decks);
      return newDeck;
    }
    if (endpoint.startsWith('/flashcards/decks/') && endpoint.endsWith('/cards')) {
      const deckId = parseInt(endpoint.split('/')[3]);
      return this.getStore<Flashcard[]>('cards', []).filter(c => c.deck_id === deckId && String(c.user_id) === String(currentUserId));
    }
    if (endpoint.startsWith('/flashcards/decks/') && method === 'GET') {
      const deckId = parseInt(endpoint.split('/')[3]);
      const deck = this.getStore<FlashcardDeck[]>('decks', []).find(d => d.id === deckId && String(d.user_id) === String(currentUserId));
      if (!deck) throw new Error('Deck not found');
      return deck;
    }
    if (endpoint.startsWith('/flashcards/due')) {
      if (!currentUserId) return [];
      return this.getStore<Flashcard[]>('cards', []).filter(c => String(c.user_id) === String(currentUserId));
    }
    if (endpoint === '/flashcards/cards' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const cards = this.getStore<Flashcard[]>('cards', []);
      const newCard: Flashcard = {
        id: Date.now(),
        deck_id: body.deck_id,
        user_id: currentUserId,
        front: body.front || '',
        back: body.back || '',
        hint: body.hint || '',
        repetition: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      cards.push(newCard);
      this.setStore('cards', cards);

      // Increment deck total_cards
      const decks = this.getStore<FlashcardDeck[]>('decks', []);
      const d = decks.find(deck => deck.id === body.deck_id && String(deck.user_id) === String(currentUserId));
      if (d) {
        d.total_cards = (d.total_cards || 0) + 1;
        d.due_cards = (d.due_cards || 0) + 1;
        this.setStore('decks', decks);
      }
      return newCard;
    }
    if (endpoint.includes('/review') && method === 'POST') {
      const cardId = parseInt(endpoint.split('/')[3]);
      const cards = this.getStore<Flashcard[]>('cards', []);
      const card = cards.find(c => c.id === cardId && String(c.user_id) === String(currentUserId));
      if (card) {
        card.repetition = (card.repetition || 0) + 1;
        card.interval_days = Math.round((card.interval_days || 1) * (card.ease_factor || 2.5));
        this.setStore('cards', cards);
        return card;
      }
      return { message: 'Reviewed' };
    }

    // --- Notes & PDF Assistant (Filtered strictly by user_id) ---
    if (endpoint.startsWith('/notes') && method === 'GET') {
      if (!currentUserId) return [];
      const notes = this.getStore<Note[]>('notes', []).filter(n => String(n.user_id) === String(currentUserId));
      const subjects = this.getStore<Subject[]>('subjects', []).filter(s => String(s.user_id) === String(currentUserId));
      return notes.map(n => {
        const s = subjects.find(sub => sub.id === n.subject_id);
        return {
          ...n,
          subject_name: s ? s.name : 'General'
        };
      });
    }
    if (endpoint === '/notes' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const notes = this.getStore<Note[]>('notes', []);
      const newNote: Note = {
        id: Date.now(),
        user_id: currentUserId,
        subject_id: body.subject_id || null,
        title: body.title || 'Untitled Note',
        content: body.content || '',
        tags: body.tags || '',
        is_pinned: body.is_pinned || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      notes.push(newNote);
      this.setStore('notes', notes);
      return newNote;
    }
    if (endpoint.startsWith('/notes/') && !endpoint.includes('summarize') && !endpoint.includes('ask') && method === 'GET') {
      const id = parseInt(endpoint.split('/')[2]);
      const note = this.getStore<Note[]>('notes', []).find(n => n.id === id && String(n.user_id) === String(currentUserId));
      if (!note) throw new Error('Note not found');
      return note;
    }
    if (endpoint.startsWith('/notes/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/')[2]);
      const notes = this.getStore<Note[]>('notes', []).filter(n => !(n.id === id && String(n.user_id) === String(currentUserId)));
      this.setStore('notes', notes);
      return { message: 'Note deleted' };
    }
    if (endpoint.startsWith('/notes/') && endpoint.includes('/summarize') && method === 'POST') {
      return {
        summary: 'Extractive summary of your study note.',
        key_points: ['Summary extracted from note text.'],
        word_count: 40,
        estimated_read_minutes: 1
      };
    }
    if (endpoint.startsWith('/notes/') && endpoint.includes('/ask') && method === 'POST') {
      return {
        answer: 'Extracted response from your study document.',
        cited_snippets: ['Cited excerpt from note.'],
        confidence: 0.95
      };
    }

    // --- Exams & Goals (Filtered strictly by user_id) ---
    if (endpoint === '/exams' && method === 'GET') {
      if (!currentUserId) return [];
      return this.getStore<Exam[]>('exams', []).filter(e => String(e.user_id) === String(currentUserId));
    }
    if (endpoint === '/exams' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const exams = this.getStore<Exam[]>('exams', []);
      const newExam: Exam = {
        id: Date.now(),
        user_id: currentUserId,
        subject_id: body.subject_id || null,
        title: body.title || 'Untitled Exam',
        exam_date: body.exam_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        target_score: body.target_score || 85,
        weight_percentage: body.weight_percentage || 20,
        notes: body.notes || '',
        days_remaining: 7,
        created_at: new Date().toISOString()
      };
      exams.push(newExam);
      this.setStore('exams', exams);
      return newExam;
    }
    if (endpoint.startsWith('/exams/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const exams = this.getStore<Exam[]>('exams', []).filter(e => !(e.id === id && String(e.user_id) === String(currentUserId)));
      this.setStore('exams', exams);
      return { message: 'Exam deleted' };
    }

    if (endpoint === '/goals' && method === 'GET') {
      if (!currentUserId) return [];
      return this.getStore<Goal[]>('goals', []).filter(g => String(g.user_id) === String(currentUserId));
    }
    if (endpoint === '/goals' && method === 'POST') {
      if (!currentUserId) throw new Error('Unauthorized');
      const goals = this.getStore<Goal[]>('goals', []);
      const newGoal: Goal = {
        id: Date.now(),
        user_id: currentUserId,
        title: body.title || 'Untitled Goal',
        category: body.category || 'study_hours',
        target_value: body.target_value || 100,
        current_value: 0,
        unit: body.unit || 'minutes',
        deadline: body.deadline || null,
        is_completed: false,
        progress_percentage: 0
      };
      goals.push(newGoal);
      this.setStore('goals', goals);
      return newGoal;
    }
    if (endpoint.startsWith('/goals/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const goals = this.getStore<Goal[]>('goals', []).filter(g => !(g.id === id && String(g.user_id) === String(currentUserId)));
      this.setStore('goals', goals);
      return { message: 'Goal deleted' };
    }

    // --- Dashboard Telemetry (Strictly Per-User) ---
    if (endpoint === '/analytics/dashboard') {
      if (!currentUserId) {
        return {
          user_name: 'Learner',
          today_focus_minutes: 0,
          daily_goal_minutes: 120,
          active_streak_days: 0,
          total_study_hours: 0,
          pending_tasks_count: 0,
          due_flashcards_count: 0,
          upcoming_exams_count: 0,
          mastery_average: 0,
          weekly_focus: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, date: day, minutes: 0 })),
          subject_mastery: [],
          weak_topics: [],
          recommendations: [],
          has_activity: false
        };
      }

      const subjects = this.getStore<Subject[]>('subjects', []).filter(s => String(s.user_id) === String(currentUserId));
      const tasks = this.getStore<StudyTask[]>('tasks', []).filter(t => String(t.user_id) === String(currentUserId));
      const cards = this.getStore<Flashcard[]>('cards', []).filter(c => String(c.user_id) === String(currentUserId));
      const exams = this.getStore<Exam[]>('exams', []).filter(e => String(e.user_id) === String(currentUserId));
      const sessions = this.getStore<any[]>('sessions', []).filter(s => String(s.user_id) === String(currentUserId));

      const totalSec = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

      // Dynamically calculate past 7 days study minutes from real recorded sessions
      const now = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyFocus = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayStr = dayNames[d.getDay()];
        const dateKey = d.toISOString().split('T')[0];
        const daySec = sessions
          .filter(s => (s.created_at || '').startsWith(dateKey))
          .reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

        weeklyFocus.push({
          day: dayStr,
          date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          minutes: Math.round(daySec / 60)
        });
      }

      const todayDateKey = now.toISOString().split('T')[0];
      const todaySec = sessions
        .filter(s => (s.created_at || '').startsWith(todayDateKey))
        .reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

      const hasActivity = subjects.length > 0 || tasks.length > 0 || sessions.length > 0 || cards.length > 0 || exams.length > 0;

      return {
        user_name: currentUser?.full_name || currentUser?.username || 'Learner',
        today_focus_minutes: Math.round(todaySec / 60),
        daily_goal_minutes: currentUser?.daily_goal_minutes || 120,
        active_streak_days: sessions.length > 0 || tasks.some(t => t.status === 'completed') ? 1 : 0,
        total_study_hours: +(totalSec / 3600).toFixed(1),
        pending_tasks_count: tasks.filter(t => t.status !== 'completed').length,
        due_flashcards_count: cards.length,
        upcoming_exams_count: exams.length,
        mastery_average: subjects.length > 0 ? Math.round(subjects.reduce((a, s) => a + (s.mastery_percentage || 0), 0) / subjects.length) : 0,
        weekly_focus: weeklyFocus,
        subject_mastery: subjects.map(s => {
          const sSessions = sessions.filter(sess => sess.subject_id === s.id);
          const sSec = sSessions.reduce((acc, sess) => acc + (sess.duration_seconds || 0), 0);
          return {
            id: s.id,
            name: s.name,
            color: s.color,
            mastery_percentage: s.mastery_percentage || 0,
            topics_count: s.topic_count || 0,
            study_minutes: Math.round(sSec / 60)
          };
        }),
        weak_topics: [],
        recommendations: [],
        has_activity: hasActivity
      };
    }

    if (endpoint === '/analytics/deep') {
      return {
        accuracy_history: [],
        time_allocation: []
      };
    }

    return { message: 'Success' };
  }
}

export const localStore = new LocalStorageEngine();

// ==============================================================================
// Hybrid API Service: Uses FastAPI backend when available, falls back to
// local storage on Vercel or when offline.
// ==============================================================================
class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('nexora_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('nexora_token', token);
  }

  public removeToken(): void {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_current_user');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Attempt live backend API call first
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        this.removeToken();
        window.dispatchEvent(new Event('nexora_auth_expired'));
        throw new Error('Your session has expired. Please sign in again.');
      }

      const contentType = res.headers.get('content-type') || '';

      // If backend responded with 200/201 and valid JSON, return it
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }

      // If backend returned 404 Not Found (e.g. Vercel static deployment) or HTML rewrite
      if (res.status === 404 || contentType.includes('text/html')) {
        return localStore.handleRequest(endpoint, options);
      }

      // If server returned specific business error from backend with detail
      if (!res.ok) {
        let errorMsg = `Server error (${res.status})`;
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          }
        } catch {
          // Fall back to local store if backend had error
          return localStore.handleRequest(endpoint, options);
        }
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (networkErr: any) {
      // If network fails (e.g. FastAPI backend is not running on localhost or on Vercel):
      // Seamlessly fulfill the request via local storage engine
      if (networkErr.message?.includes('session has expired')) {
        throw networkErr;
      }
      return localStore.handleRequest(endpoint, options);
    }
  }

  // --- Auth ---
  async register(data: any): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async login(data: any): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Subjects & Topics ---
  async getSubjects(): Promise<Subject[]> {
    return this.request('/subjects');
  }

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubjectDetail(id: number): Promise<Subject & { topics: Topic[] }> {
    return this.request(`/subjects/${id}`);
  }

  async updateSubject(id: number, data: Partial<Subject>): Promise<Subject> {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: number): Promise<{ message: string }> {
    return this.request(`/subjects/${id}`, { method: 'DELETE' });
  }

  async createTopic(data: Partial<Topic>): Promise<Topic> {
    return this.request('/subjects/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTopic(id: number, data: Partial<Topic>): Promise<Topic> {
    return this.request(`/subjects/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTopic(id: number): Promise<{ message: string }> {
    return this.request(`/subjects/topics/${id}`, { method: 'DELETE' });
  }

  // --- Planner ---
  async getTasks(status?: string): Promise<StudyTask[]> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/planner/tasks${query}`);
  }

  async createTask(data: Partial<StudyTask>): Promise<StudyTask> {
    return this.request('/planner/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: Partial<StudyTask>): Promise<StudyTask> {
    return this.request(`/planner/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number): Promise<{ message: string }> {
    return this.request(`/planner/tasks/${id}`, { method: 'DELETE' });
  }

  async getRecommendations(): Promise<{
    recommended_tasks: Array<{ task: StudyTask; priority_score: number; reasons: string[]; explanation: string }>;
    conflicts: Array<{ date: string; allocated_minutes: number; capacity_minutes: number; overbooked_by: number; warning: string }>;
    daily_load: Record<string, number>;
    daily_capacity_minutes: number;
  }> {
    return this.request('/planner/recommendations');
  }

  async recalculateSchedule(): Promise<{ message: string }> {
    return this.request('/planner/recalculate', { method: 'POST' });
  }

  // --- Focus Timer ---
  async recordFocusSession(data: {
    duration_seconds: number;
    subject_id?: number | null;
    task_id?: number | null;
    focus_mode?: string;
    completed?: boolean;
    notes?: string;
  }): Promise<any> {
    return this.request('/timer/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTimerStats(): Promise<{
    today_minutes: number;
    weekly_minutes: number;
    total_hours: number;
    total_sessions: number;
    recent_sessions: FocusSession[];
    daily_goal_minutes: number;
    pomodoro_focus_min: number;
    pomodoro_break_min: number;
  }> {
    return this.request('/timer/stats');
  }

  // --- Quizzes ---
  async getQuizzes(): Promise<Quiz[]> {
    return this.request('/quizzes');
  }

  async createQuiz(data: any): Promise<Quiz> {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizDetail(id: number): Promise<Quiz> {
    return this.request(`/quizzes/${id}`);
  }

  async submitQuiz(id: number, answers: Record<string, string>): Promise<QuizAttempt> {
    return this.request(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getQuizAttempts(id: number): Promise<QuizAttempt[]> {
    return this.request(`/quizzes/${id}/attempts`);
  }

  async generateQuizFromNote(data: { note_id?: number; text?: string; title?: string; subject_id?: number; topic_id?: number }): Promise<Quiz> {
    return this.request('/quizzes/generate-from-note', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(id: number): Promise<{ message: string }> {
    return this.request(`/quizzes/${id}`, { method: 'DELETE' });
  }

  // --- Flashcards ---
  async getDecks(): Promise<FlashcardDeck[]> {
    return this.request('/flashcards/decks');
  }

  async createDeck(data: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
    return this.request('/flashcards/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeck(id: number): Promise<FlashcardDeck> {
    return this.request(`/flashcards/decks/${id}`);
  }

  async updateDeck(id: number, data: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
    return this.request(`/flashcards/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeck(id: number): Promise<{ message: string }> {
    return this.request(`/flashcards/decks/${id}`, { method: 'DELETE' });
  }

  async getDeckCards(deckId: number): Promise<Flashcard[]> {
    return this.request(`/flashcards/decks/${deckId}/cards`);
  }

  async createCard(data: Partial<Flashcard>): Promise<Flashcard> {
    return this.request('/flashcards/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCard(id: number, data: Partial<Flashcard>): Promise<Flashcard> {
    return this.request(`/flashcards/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCard(id: number): Promise<{ message: string }> {
    return this.request(`/flashcards/cards/${id}`, { method: 'DELETE' });
  }

  async getDueCards(deckId?: number): Promise<Flashcard[]> {
    const query = deckId ? `?deck_id=${deckId}` : '';
    return this.request(`/flashcards/due${query}`);
  }

  async reviewCard(cardId: number, rating: number): Promise<Flashcard> {
    return this.request(`/flashcards/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  async generateFlashcardsFromNote(data: { note_id: number; deck_id?: number }): Promise<Flashcard[]> {
    return this.request('/flashcards/generate-from-note', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Notes & PDF Assistant ---
  async getNotes(q?: string, subjectId?: number): Promise<Note[]> {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (subjectId) params.append('subject_id', subjectId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/notes${query}`);
  }

  async createNote(data: Partial<Note>): Promise<Note> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNote(id: number): Promise<Note> {
    return this.request(`/notes/${id}`);
  }

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number): Promise<{ message: string }> {
    return this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  async summarizeNote(id: number): Promise<{ summary: string; key_points: string[]; word_count: number; estimated_read_minutes: number }> {
    return this.request(`/notes/${id}/summarize`, { method: 'POST' });
  }

  async askDoc(noteId: number, query: string): Promise<{ answer: string; cited_snippets: string[]; confidence: number }> {
    return this.request(`/notes/${noteId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async uploadPdf(file: File, title?: string, subjectId?: number): Promise<Note> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (subjectId) formData.append('subject_id', subjectId.toString());

    return this.request('/notes/upload-pdf', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Exams & Goals ---
  async getExams(): Promise<Exam[]> {
    return this.request('/exams');
  }

  async createExam(data: Partial<Exam>): Promise<Exam> {
    return this.request('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExam(id: number, data: Partial<Exam>): Promise<Exam> {
    return this.request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id: number): Promise<{ message: string }> {
    return this.request(`/exams/${id}`, { method: 'DELETE' });
  }

  async getGoals(): Promise<Goal[]> {
    return this.request('/goals');
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: number, data: Partial<Goal>): Promise<Goal> {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: number): Promise<{ message: string }> {
    return this.request(`/goals/${id}`, { method: 'DELETE' });
  }

  // --- Analytics & Seed ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request('/analytics/dashboard');
  }

  async getDeepAnalytics(): Promise<any> {
    return this.request('/analytics/deep');
  }

  async seedDemoData(): Promise<{ message: string }> {
    return this.request('/seed', { method: 'POST' });
  }
}

export const api = new ApiService();
