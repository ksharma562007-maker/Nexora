import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Navbar } from './Navbar';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { DashboardView } from '../dashboard/DashboardView';
import { SubjectsView } from '../subjects/SubjectsView';
import { PlannerView } from '../planner/PlannerView';
import { TimerView } from '../timer/TimerView';
import { QuizzesView } from '../quizzes/QuizzesView';
import { FlashcardsView } from '../flashcards/FlashcardsView';
import { NotesView } from '../notes/NotesView';
import { ExamsView } from '../exams/ExamsView';
import { AnalyticsView } from '../analytics/AnalyticsView';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Focus timer telemetry link across tabs
  const [runningTimerSec, setRunningTimerSec] = useState<number | null>(null);
  const [timerInitialTaskId, setTimerInitialTaskId] = useState<number | undefined>(undefined);
  const [timerInitialSubjectId, setTimerInitialSubjectId] = useState<number | undefined>(undefined);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Force reload active view
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample curriculum');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleNavigateToTimerWithTask = (taskId?: number, subjectId?: number) => {
    setTimerInitialTaskId(taskId);
    setTimerInitialSubjectId(subjectId);
    setCurrentTab('timer');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          runningTimerSeconds={runningTimerSec}
          onJumpToTimer={() => setCurrentTab('timer')}
        />

        {/* Content View */}
        <main className="flex-1 pb-16">
          <div key={currentTab} className="animate-fade-in-up">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentTab}
                onSeedData={handleSeedData}
                isSeeding={isSeeding}
              />
            )}

            {currentTab === 'subjects' && <SubjectsView />}

            {currentTab === 'planner' && (
              <PlannerView onNavigateToTimer={handleNavigateToTimerWithTask} />
            )}

            {currentTab === 'timer' && (
              <TimerView
                initialTaskId={timerInitialTaskId}
                initialSubjectId={timerInitialSubjectId}
                onTimerTick={setRunningTimerSec}
              />
            )}

            {currentTab === 'quizzes' && <QuizzesView />}

            {currentTab === 'flashcards' && <FlashcardsView />}

            {currentTab === 'notes' && (
              <NotesView
                onNavigateToQuiz={() => setCurrentTab('quizzes')}
                onNavigateToFlashcards={() => setCurrentTab('flashcards')}
              />
            )}

            {currentTab === 'exams' && <ExamsView />}

            {currentTab === 'analytics' && <AnalyticsView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
