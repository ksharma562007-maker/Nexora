import {
  User, Subject, Topic, StudyTask, FocusSession,
  Quiz, QuizAttempt, FlashcardDeck, Flashcard, Note,
  Exam, Goal, DashboardSummary
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// ==============================================================================
// Local Database Engine for Offline & Vercel Static Deployments
// ==============================================================================
class LocalStorageEngine {
  private getStore(key: string, defaultVal: any = []) {
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

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    if (!localStorage.getItem('nexora_seeded')) {
      const defaultUser: User = {
        id: 1,
        email: 'mayank2007@gmail.com',
        username: 'mayank_0806',
        full_name: 'Mayank Jangra',
        avatar: 'avatar-1',
        daily_goal_minutes: 120,
        pomodoro_focus_min: 25,
        pomodoro_break_min: 5,
        theme_preference: 'dark',
        created_at: new Date().toISOString()
      };

      const defaultSubjects: Subject[] = [
        {
          id: 1,
          user_id: 1,
          name: 'Computer Science & Data Structures',
          code: 'CS101',
          description: 'Fundamental algorithms, asymptotic analysis, and data representations.',
          color: '#6366F1',
          icon: 'Code',
          target_hours: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          topic_count: 4,
          mastery_percentage: 68
        },
        {
          id: 2,
          user_id: 1,
          name: 'Discrete Mathematics & Logic',
          code: 'MATH201',
          description: 'Propositional logic, combinatorics, proof methods, and graph theory.',
          color: '#8B5CF6',
          icon: 'Calculator',
          target_hours: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          topic_count: 3,
          mastery_percentage: 54
        },
        {
          id: 3,
          user_id: 1,
          name: 'AI & Machine Learning Foundations',
          code: 'AI301',
          description: 'Linear regression, neural networks, loss functions, and optimization.',
          color: '#EC4899',
          icon: 'Brain',
          target_hours: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          topic_count: 3,
          mastery_percentage: 42
        }
      ];

      const defaultTopics: Topic[] = [
        { id: 1, subject_id: 1, title: 'Binary Search Trees & Balancing', description: 'AVL and Red-Black properties', priority: 'high', confidence_level: 4, mastery_score: 80, status: 'in_progress', created_at: new Date().toISOString() },
        { id: 2, subject_id: 1, title: 'Dynamic Programming Memoization', description: 'Optimal substructure and overlapping subproblems', priority: 'urgent', confidence_level: 2, mastery_score: 45, status: 'in_progress', created_at: new Date().toISOString() },
        { id: 3, subject_id: 2, title: 'Predicate Logic & Quantifiers', description: 'First-order logic formulations and proofs', priority: 'medium', confidence_level: 3, mastery_score: 60, status: 'in_progress', created_at: new Date().toISOString() },
        { id: 4, subject_id: 3, title: 'Gradient Descent & Cost Functions', description: 'Stochastic vs Batch optimization algorithms', priority: 'high', confidence_level: 3, mastery_score: 50, status: 'in_progress', created_at: new Date().toISOString() }
      ];

      const defaultTasks: StudyTask[] = [
        { id: 1, user_id: 1, subject_id: 1, topic_id: 2, title: 'Practice DP Knapsack Problems', priority: 'urgent', estimated_minutes: 45, status: 'pending', scheduled_date: new Date().toISOString().split('T')[0], is_recommended: true, reason_recommended: 'Upcoming midterms • Low mastery topic (45%)', created_at: new Date().toISOString() },
        { id: 2, user_id: 1, subject_id: 2, topic_id: 3, title: 'Complete Predicate Logic Proofs', priority: 'high', estimated_minutes: 30, status: 'pending', scheduled_date: new Date().toISOString().split('T')[0], is_recommended: true, reason_recommended: 'Exam in 5 days', created_at: new Date().toISOString() },
        { id: 3, user_id: 1, subject_id: 1, topic_id: 1, title: 'Review Tree Rotations Flashcards', priority: 'medium', estimated_minutes: 20, status: 'completed', scheduled_date: new Date().toISOString().split('T')[0], is_recommended: false, created_at: new Date().toISOString() }
      ];

      const defaultDecks: FlashcardDeck[] = [
        { id: 1, user_id: 1, subject_id: 1, title: 'Core Data Structures Master Deck', description: 'Time complexities, operations, and space guarantees.', color: '#6366F1', card_count: 5, due_count: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, user_id: 1, subject_id: 3, title: 'Machine Learning Key Formulas', description: 'Loss functions, gradients, and activation functions.', color: '#EC4899', card_count: 4, due_count: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];

      const defaultCards: Flashcard[] = [
        { id: 1, deck_id: 1, user_id: 1, front: 'What is the average and worst-case search complexity in an AVL Tree?', back: 'Average: O(log n)\nWorst-case: O(log n) because AVL trees guarantee strict height balancing with a factor ≤ 1.', hint: 'Both cases are logarithmic due to self-balancing.', repetition: 2, interval_days: 6, ease_factor: 2.5, next_review_date: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: 2, deck_id: 1, user_id: 1, front: 'What are the two key properties required for Dynamic Programming?', back: '1. Optimal Substructure (an optimal solution contains optimal sub-solutions)\n2. Overlapping Subproblems (subproblems recur frequently and can be cached).', hint: 'Substructure and caching.', repetition: 1, interval_days: 1, ease_factor: 2.5, next_review_date: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: 3, deck_id: 2, user_id: 1, front: 'What is the vanishing gradient problem in deep neural networks?', back: 'During backpropagation, gradients shrink exponentially as they propagate backward through many layers with saturating activations (like Sigmoid), preventing weights in early layers from updating.', hint: 'Sigmoid derivatives are < 0.25.', repetition: 1, interval_days: 1, ease_factor: 2.4, next_review_date: new Date().toISOString(), created_at: new Date().toISOString() }
      ];

      const defaultQuizzes: Quiz[] = [
        {
          id: 1,
          user_id: 1,
          subject_id: 1,
          title: 'Algorithms Midterm Assessment',
          description: 'Covers Big-O notations, tree traversals, and dynamic programming.',
          time_limit_minutes: 20,
          pass_percentage: 70,
          total_questions: 3,
          created_at: new Date().toISOString(),
          questions: [
            { id: 1, quiz_id: 1, question_text: 'Which sorting algorithm has a guaranteed O(n log n) worst-case time complexity?', question_type: 'multiple_choice', options: ['QuickSort', 'MergeSort', 'BubbleSort', 'SelectionSort'], correct_answer: 'MergeSort', explanation: 'MergeSort always divides the array evenly and merges in linear time, guaranteeing O(n log n).' },
            { id: 2, quiz_id: 1, question_text: 'Dynamic Programming requires overlapping subproblems and optimal substructure.', question_type: 'true_false', options: ['True', 'False'], correct_answer: 'True', explanation: 'Both properties are the mathematical foundation of dynamic programming.' },
            { id: 3, quiz_id: 1, question_text: 'What data structure is used to implement Breadth-First Search (BFS)?', question_type: 'multiple_choice', options: ['Stack', 'Queue', 'Heap', 'Tree'], correct_answer: 'Queue', explanation: 'BFS explores nodes level by level using a FIFO Queue.' }
          ]
        }
      ];

      const defaultNotes: Note[] = [
        {
          id: 1,
          user_id: 1,
          subject_id: 1,
          title: 'Lecture Note: Asymptotic Analysis & Recurrences',
          content: '# Asymptotic Analysis\n\nBig-O represents an upper bound on the growth rate of a function.\n\n### Master Theorem\nUsed to solve divide-and-conquer recurrences: T(n) = aT(n/b) + f(n).\n- If f(n) = O(n^(log_b a - epsilon)), then T(n) = Theta(n^log_b a).\n- If f(n) = Theta(n^log_b a), then T(n) = Theta(n^log_b a * log n).\n\n### Space vs Time Tradeoff\nHash tables trade extra space for O(1) expected lookup time.',
          tags: 'algorithms, master-theorem, big-o',
          is_pinned: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const defaultExams: Exam[] = [
        { id: 1, user_id: 1, subject_id: 1, title: 'Algorithms & Data Structures Midterm', exam_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], target_score: 90, weight_percentage: 30, notes: 'Focus on DP knapsack and graph BFS/DFS proofs', created_at: new Date().toISOString() },
        { id: 2, user_id: 1, subject_id: 2, title: 'Discrete Math Final Examination', exam_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], target_score: 85, weight_percentage: 40, notes: 'Predicate proofs and recurrence relations', created_at: new Date().toISOString() }
      ];

      const defaultGoals: Goal[] = [
        { id: 1, user_id: 1, title: 'Complete 10 Hours of Deep Study This Week', goal_type: 'study_hours', target_value: 600, current_value: 360, deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], is_completed: false, created_at: new Date().toISOString() },
        { id: 2, user_id: 1, title: 'Review 50 Spaced Repetition Cards', goal_type: 'cards_reviewed', target_value: 50, current_value: 35, is_completed: false, created_at: new Date().toISOString() }
      ];

      this.setStore('users', [defaultUser]);
      this.setStore('subjects', defaultSubjects);
      this.setStore('topics', defaultTopics);
      this.setStore('tasks', defaultTasks);
      this.setStore('decks', defaultDecks);
      this.setStore('cards', defaultCards);
      this.setStore('quizzes', defaultQuizzes);
      this.setStore('notes', defaultNotes);
      this.setStore('exams', defaultExams);
      this.setStore('goals', defaultGoals);
      this.setStore('sessions', []);
      localStorage.setItem('nexora_seeded', 'true');
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

    // --- Auth Endpoints ---
    if (endpoint === '/auth/register' && method === 'POST') {
      const users = this.getStore('users');
      const email = (body.email || '').toLowerCase().trim();
      const existing = users.find((u: User) => u.email === email);
      if (existing) {
        return { access_token: `token_${existing.id}`, token_type: 'bearer', user: existing };
      }
      const newUser: User = {
        id: users.length + 1,
        email,
        username: body.username || email.split('@')[0],
        full_name: body.full_name || 'Student Learner',
        avatar: 'avatar-1',
        daily_goal_minutes: 120,
        pomodoro_focus_min: 25,
        pomodoro_break_min: 5,
        theme_preference: 'dark',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      this.setStore('users', users);
      localStorage.setItem('nexora_current_user', JSON.stringify(newUser));
      return { access_token: `token_${newUser.id}`, token_type: 'bearer', user: newUser };
    }

    if (endpoint === '/auth/login' && method === 'POST') {
      const users = this.getStore('users');
      const identifier = (body.email || '').toLowerCase().trim();
      let user = users.find((u: User) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier);
      if (!user) {
        user = {
          id: users.length + 1,
          email: identifier.includes('@') ? identifier : `${identifier}@nexora.io`,
          username: identifier.replace(/[@.]/g, '_'),
          full_name: identifier.split('@')[0],
          avatar: 'avatar-1',
          daily_goal_minutes: 120,
          pomodoro_focus_min: 25,
          pomodoro_break_min: 5,
          theme_preference: 'dark',
          created_at: new Date().toISOString()
        };
        users.push(user);
        this.setStore('users', users);
      }
      localStorage.setItem('nexora_current_user', JSON.stringify(user));
      return { access_token: `token_${user.id}`, token_type: 'bearer', user };
    }

    if (endpoint === '/auth/me') {
      const current = localStorage.getItem('nexora_current_user');
      if (current) {
        return JSON.parse(current);
      }
      const users = this.getStore('users');
      return users[0] || {
        id: 1,
        email: 'student@nexora.io',
        username: 'student',
        full_name: 'Student Learner',
        avatar: 'avatar-1',
        daily_goal_minutes: 120,
        pomodoro_focus_min: 25,
        pomodoro_break_min: 5,
        theme_preference: 'dark',
        created_at: new Date().toISOString()
      };
    }

    if (endpoint === '/auth/profile' && method === 'PUT') {
      const users = this.getStore('users');
      if (users[0]) {
        Object.assign(users[0], body);
        this.setStore('users', users);
        localStorage.setItem('nexora_current_user', JSON.stringify(users[0]));
        return users[0];
      }
      return body;
    }

    // --- Subjects & Topics ---
    if (endpoint === '/subjects' && method === 'GET') {
      return this.getStore('subjects');
    }
    if (endpoint === '/subjects' && method === 'POST') {
      const items = this.getStore('subjects');
      const newItem = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString(), topic_count: 0, mastery_percentage: 0 };
      items.push(newItem);
      this.setStore('subjects', items);
      return newItem;
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'GET') {
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore('subjects');
      const subject = subjects.find((s: any) => s.id === id) || subjects[0];
      const topics = this.getStore('topics').filter((t: any) => t.subject_id === id);
      return { ...subject, topics };
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'PUT') {
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore('subjects');
      const index = subjects.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        Object.assign(subjects[index], body);
        this.setStore('subjects', subjects);
        return subjects[index];
      }
      return body;
    }
    if (endpoint.startsWith('/subjects/') && !endpoint.includes('topics') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/')[2]);
      const subjects = this.getStore('subjects').filter((s: any) => s.id !== id);
      this.setStore('subjects', subjects);
      return { message: 'Subject deleted successfully' };
    }

    if (endpoint === '/subjects/topics' && method === 'POST') {
      const topics = this.getStore('topics');
      const newTopic = { id: Date.now(), ...body, created_at: new Date().toISOString() };
      topics.push(newTopic);
      this.setStore('topics', topics);
      return newTopic;
    }
    if (endpoint.startsWith('/subjects/topics/') && method === 'PUT') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const topics = this.getStore('topics');
      const idx = topics.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        Object.assign(topics[idx], body);
        this.setStore('topics', topics);
        return topics[idx];
      }
      return body;
    }
    if (endpoint.startsWith('/subjects/topics/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const topics = this.getStore('topics').filter((t: any) => t.id !== id);
      this.setStore('topics', topics);
      return { message: 'Topic deleted' };
    }

    // --- Planner ---
    if (endpoint.startsWith('/planner/tasks') && method === 'GET') {
      return this.getStore('tasks');
    }
    if (endpoint === '/planner/tasks' && method === 'POST') {
      const tasks = this.getStore('tasks');
      const newTask = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString() };
      tasks.push(newTask);
      this.setStore('tasks', tasks);
      return newTask;
    }
    if (endpoint.startsWith('/planner/tasks/') && method === 'PUT') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const tasks = this.getStore('tasks');
      const idx = tasks.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        Object.assign(tasks[idx], body);
        this.setStore('tasks', tasks);
        return tasks[idx];
      }
      return body;
    }
    if (endpoint.startsWith('/planner/tasks/') && method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop() || '0');
      const tasks = this.getStore('tasks').filter((t: any) => t.id !== id);
      this.setStore('tasks', tasks);
      return { message: 'Task deleted' };
    }
    if (endpoint === '/planner/recommendations') {
      const tasks = this.getStore('tasks');
      return {
        recommended_tasks: tasks.slice(0, 3).map((t: StudyTask) => ({
          task: t,
          priority_score: 85,
          reasons: ['Approaching deadline', 'High curriculum importance'],
          explanation: `Recommended focus based on study schedule and high priority.`
        })),
        conflicts: [],
        daily_load: { [new Date().toISOString().split('T')[0]]: 65 },
        daily_capacity_minutes: 120
      };
    }

    // --- Focus Timer ---
    if (endpoint === '/timer/sessions' && method === 'POST') {
      const sessions = this.getStore('sessions');
      const newSession = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString() };
      sessions.push(newSession);
      this.setStore('sessions', sessions);
      return newSession;
    }
    if (endpoint === '/timer/stats') {
      const sessions = this.getStore('sessions');
      const totalSec = sessions.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 1800);
      return {
        today_minutes: Math.round(totalSec / 60),
        weekly_minutes: Math.round(totalSec / 60),
        total_hours: +(totalSec / 3600).toFixed(1),
        total_sessions: Math.max(sessions.length, 2),
        recent_sessions: sessions.slice(-5),
        daily_goal_minutes: 120,
        pomodoro_focus_min: 25,
        pomodoro_break_min: 5
      };
    }

    // --- Quizzes ---
    if (endpoint === '/quizzes' && method === 'GET') {
      return this.getStore('quizzes');
    }
    if (endpoint.startsWith('/quizzes/') && !endpoint.includes('submit') && !endpoint.includes('attempts') && method === 'GET') {
      const id = parseInt(endpoint.split('/')[2]);
      const quizzes = this.getStore('quizzes');
      return quizzes.find((q: any) => q.id === id) || quizzes[0];
    }
    if (endpoint.includes('/submit') && method === 'POST') {
      return {
        id: Date.now(),
        quiz_id: 1,
        user_id: 1,
        score: 3,
        total_questions: 3,
        percentage: 100,
        passed: true,
        completed_at: new Date().toISOString(),
        details: [
          { question_id: 1, user_answer: 'MergeSort', correct_answer: 'MergeSort', is_correct: true, explanation: 'MergeSort guarantees O(n log n).' },
          { question_id: 2, user_answer: 'True', correct_answer: 'True', is_correct: true, explanation: 'Correct.' },
          { question_id: 3, user_answer: 'Queue', correct_answer: 'Queue', is_correct: true, explanation: 'BFS uses a FIFO queue.' }
        ]
      };
    }
    if (endpoint.includes('/attempts')) {
      return [];
    }

    // --- Flashcards ---
    if (endpoint === '/flashcards/decks' && method === 'GET') {
      return this.getStore('decks');
    }
    if (endpoint.startsWith('/flashcards/decks/') && endpoint.endsWith('/cards')) {
      return this.getStore('cards');
    }
    if (endpoint.startsWith('/flashcards/decks/') && method === 'GET') {
      const id = parseInt(endpoint.split('/')[3]);
      const decks = this.getStore('decks');
      return decks.find((d: any) => d.id === id) || decks[0];
    }
    if (endpoint.startsWith('/flashcards/due')) {
      return this.getStore('cards');
    }
    if (endpoint.includes('/review') && method === 'POST') {
      const cards = this.getStore('cards');
      const cardId = parseInt(endpoint.split('/')[3]);
      const card = cards.find((c: any) => c.id === cardId) || cards[0];
      if (card) {
        card.repetition = (card.repetition || 0) + 1;
        card.interval_days = Math.round((card.interval_days || 1) * (card.ease_factor || 2.5));
        this.setStore('cards', cards);
        return card;
      }
      return { message: 'Reviewed' };
    }

    // --- Notes & PDF ---
    if (endpoint.startsWith('/notes') && method === 'GET') {
      return this.getStore('notes');
    }
    if (endpoint === '/notes' && method === 'POST') {
      const notes = this.getStore('notes');
      const newNote = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      notes.push(newNote);
      this.setStore('notes', notes);
      return newNote;
    }
    if (endpoint.startsWith('/notes/') && endpoint.includes('/summarize') && method === 'POST') {
      return {
        summary: 'Big-O represents the upper bound on growth rate. Master Theorem solves divide-and-conquer recurrences. Hash tables trade space for constant-time lookups.',
        key_points: [
          'Big-O formalizes worst-case algorithmic runtime.',
          'Master Theorem provides a closed-form formula for recurrences.',
          'Space-time tradeoff allows caching to optimize execution speed.'
        ],
        word_count: 85,
        estimated_read_minutes: 1
      };
    }
    if (endpoint.startsWith('/notes/') && endpoint.includes('/ask') && method === 'POST') {
      return {
        answer: 'According to your notes, the Master Theorem is used to solve divide-and-conquer recurrences of the form T(n) = aT(n/b) + f(n).',
        cited_snippets: ['Master Theorem: Used to solve divide-and-conquer recurrences: T(n) = aT(n/b) + f(n).'],
        confidence: 0.94
      };
    }

    // --- Exams & Goals ---
    if (endpoint === '/exams' && method === 'GET') {
      return this.getStore('exams');
    }
    if (endpoint === '/exams' && method === 'POST') {
      const items = this.getStore('exams');
      const newItem = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString() };
      items.push(newItem);
      this.setStore('exams', items);
      return newItem;
    }
    if (endpoint === '/goals' && method === 'GET') {
      return this.getStore('goals');
    }
    if (endpoint === '/goals' && method === 'POST') {
      const items = this.getStore('goals');
      const newItem = { id: Date.now(), user_id: 1, ...body, created_at: new Date().toISOString() };
      items.push(newItem);
      this.setStore('goals', items);
      return newItem;
    }

    // --- Analytics Dashboard ---
    if (endpoint === '/analytics/dashboard') {
      const subjects = this.getStore('subjects');
      const cards = this.getStore('cards');
      const exams = this.getStore('exams');
      return {
        user: this.handleRequest('/auth/me'),
        stats: {
          streak_days: 4,
          due_flashcards: cards.length,
          upcoming_exams: exams.length,
          weekly_study_minutes: 180,
          overall_mastery_percentage: 65,
          active_subjects_count: subjects.length
        },
        weekly_study_trend: [
          { day: 'Mon', minutes: 35 },
          { day: 'Tue', minutes: 50 },
          { day: 'Wed', minutes: 40 },
          { day: 'Thu', minutes: 55 },
          { day: 'Fri', minutes: 30 },
          { day: 'Sat', minutes: 60 },
          { day: 'Sun', minutes: 45 }
        ],
        weak_topics: [
          { id: 2, title: 'Dynamic Programming Memoization', subject_name: 'Computer Science', mastery: 45 }
        ]
      };
    }

    if (endpoint === '/analytics/deep') {
      return {
        accuracy_history: [
          { quiz: 'Quiz 1', accuracy: 75 },
          { quiz: 'Quiz 2', accuracy: 88 },
          { quiz: 'Quiz 3', accuracy: 92 }
        ],
        time_allocation: [
          { subject: 'Computer Science', hours: 6.5 },
          { subject: 'Discrete Math', hours: 4.2 },
          { subject: 'Machine Learning', hours: 3.8 }
        ]
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
