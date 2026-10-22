import {
  User, Subject, Topic, StudyTask, FocusSession,
  Quiz, QuizAttempt, FlashcardDeck, Flashcard, Note,
  Exam, Goal, DashboardSummary
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('nexora_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('nexora_token', token);
  }

  public removeToken(): void {
    localStorage.removeItem('nexora_token');
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

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw new Error(
        `Unable to reach backend API at ${API_BASE}. Please ensure the backend server is running and accessible.`
      );
    }

    if (res.status === 401) {
      this.removeToken();
      window.dispatchEvent(new Event('nexora_auth_expired'));
      throw new Error('Your session has expired. Please sign in again.');
    }

    const contentType = res.headers.get('content-type') || '';

    // Check if the server returned HTML (happens on Vercel/Netlify when API rewrites return index.html)
    if (contentType.includes('text/html')) {
      throw new Error(
        `Received HTML instead of JSON from API. If deployed on Vercel, configure VITE_API_BASE_URL to your deployed backend URL in Vercel Settings > Environment Variables.`
      );
    }

    if (!res.ok) {
      let errorMsg = `Server error (${res.status}): ${res.statusText || 'Request failed'}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Keep the descriptive errorMsg
      }
      throw new Error(errorMsg);
    }

    try {
      return await res.json();
    } catch (jsonErr: any) {
      throw new Error(`Failed to parse response as JSON: ${jsonErr.message}`);
    }
  }

  // --- Auth ---
  async register(data: any): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: any): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async googleAuth(data: { email: string; full_name?: string; avatar?: string; id_token?: string }): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
