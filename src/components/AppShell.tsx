'use client';

import React, { useEffect, useState } from 'react';
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
import BottomNav from './BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import { taskService } from '@/lib/taskService';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import LoginScreen from './LoginScreen';

export default function AppShell() {
  const [theme] = useAtom(themeAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);
  const setIsDrawerOpen = useSetAtom(isTaskModalOpenAtom);

  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // 1. Auth State Management with Safety Timeout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isFirebaseConfigured) {
        console.warn('Firebase is not configured with environment variables.');
        setAuthLoaded(true);
        setIsLoaded(true);
        return;
      }

      // Safety fallback: ensure UI is never stuck on "Initializing..." indefinitely
      const safetyTimer = setTimeout(() => {
        setAuthLoaded(true);
        setIsLoaded(true);
      }, 3500);

      const unsubscribeAuth = onAuthStateChanged(
        auth,
        (currentUser) => {
          clearTimeout(safetyTimer);
          setUser(currentUser);
          setAuthLoaded(true);
          if (!currentUser) {
            setIsLoaded(true); // Don't block loading if logged out
          }
        },
        (error) => {
          clearTimeout(safetyTimer);
          console.error('Auth state error:', error);
          setAuthLoaded(true);
          setIsLoaded(true);
        }
      );
      return () => {
        clearTimeout(safetyTimer);
        unsubscribeAuth();
      };
    }
  }, [setIsLoaded]);

  // 2. Client-Side Hydration & Real-time Sync from Firebase
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const unsubscribe = taskService.subscribeToTasks(
        user.uid,
        (fetchedTasks) => {
          setTasks(fetchedTasks);
          setIsLoaded(true);
        },
        (err) => {
          console.error('Tasks sync error:', err);
          setIsLoaded(true);
        }
      );
      return () => unsubscribe();
    }
  }, [setTasks, setIsLoaded, user]);

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

  if (authLoaded && !user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Panel Left */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Container Right */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Topbar */}
        <Topbar />

        {/* Dynamic Inner Layout Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 flex flex-col min-h-0">
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

      {/* Bottom Navigation (Visible only on Mobile) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
