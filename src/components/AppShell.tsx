'use client';

import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  currentViewAtom, tasksAtom, isLoadedAtom, 
  isTaskCreateModalOpenAtom, isTaskModalOpenAtom,
  themeAtom
} from '@/atoms';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatsCards from './StatsCards';
import FiltersPanel from './FiltersPanel';
import TaskBoard from './TaskBoard';
import TimelineView from './TimelineView';
import CalendarView from './CalendarView';
import ListView from './ListView';
import TaskDrawer from './TaskDrawer';
import TaskCreateModal from './TaskCreateModal';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppShell() {
  const [theme] = useAtom(themeAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);
  const setIsDrawerOpen = useSetAtom(isTaskModalOpenAtom);

  // 1. Client-Side Hydration on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('task-tracker-tasks');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed);
          }
        } catch (e) {
          console.error('Failed to parse localStorage tasks:', e);
        }
      }
      setIsLoaded(true);
    }
  }, [setTasks, setIsLoaded]);

  // 2. Sync State changes to LocalStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('task-tracker-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts inside input/textarea fields
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // 'c' or 'n' key opens create task modal
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsCreateOpen(true);
      }

      // 'Escape' closes any open modals
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCreateOpen, setIsDrawerOpen]);

  // 4. Sync Theme with HTML Root
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // View Router mapping
  const renderActiveView = () => {
    switch (currentView) {
      case 'board':
        return <TaskBoard />;
      case 'timeline':
        return <TimelineView />;
      case 'calendar':
        return <CalendarView />;
      case 'list':
        return <ListView />;
      default:
        return <TaskBoard />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ 
              rotate: [0, 180, 360],
              borderRadius: ["20%", "50%", "20%"]
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="w-12 h-12 bg-primary/20 border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
          >
            Initializing Session...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Panel Left */}
      <Sidebar />

      {/* Main Container Right */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Topbar */}
        <Topbar />

        {/* Dynamic Inner Layout Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
          {/* Core Panel Content views */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full h-full"
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Drawer and Creator Dialogs */}
      <TaskDrawer />
      <TaskCreateModal />
    </div>
  );
}
