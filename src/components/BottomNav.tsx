'use client';

import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  currentViewAtom, 
  isTaskCreateModalOpenAtom 
} from '@/atoms';
import { ViewType } from '@/types';
import { 
  LayoutDashboard, Clock, Calendar, List, 
  Plus
} from 'lucide-react';

export default function BottomNav() {
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);

  const navItems = [
    { id: 'board', label: 'Board', icon: <LayoutDashboard size={20} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={20} /> },
    { id: 'add', label: 'Add', icon: <Plus size={24} strokeWidth={2.5} />, isAction: true },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'list', label: 'Database', icon: <List size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 py-2 mb-safe">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => setIsCreateOpen(true)}
                className="relative -top-5 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                title={item.label}
              >
                {item.icon}
              </button>
            );
          }

          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] py-1"
              title={item.label}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
