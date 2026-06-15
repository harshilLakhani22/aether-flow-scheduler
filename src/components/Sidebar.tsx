'use client';

import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  currentViewAtom, sidebarOpenAtom, 
  tasksAtom
} from '@/atoms';
import { ViewType } from '@/types';
import { 
  LayoutDashboard, Clock, Calendar, List, 
  ChevronLeft, ChevronRight, RefreshCw, Sparkles 
} from 'lucide-react';
import { taskService } from '@/lib/taskService';

export default function Sidebar() {
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const [tasks] = useAtom(tasksAtom);

  const navItems = [
    { id: 'board', label: 'Kanban Board', icon: <LayoutDashboard size={15} /> },
    { id: 'timeline', label: 'Time Blocking', icon: <Clock size={15} /> },
    { id: 'calendar', label: 'Monthly Planner', icon: <Calendar size={15} /> },
    { id: 'list', label: 'Tasks Database', icon: <List size={15} /> },
  ];

  const handleResetData = async () => {
    if (confirm('Are you sure you want to completely clear all tasks? This cannot be undone.')) {
      await Promise.all(tasks.map(t => taskService.deleteTask(t.id)));
      alert('Dashboard cleared successfully!');
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-16 h-screen border-r border-border bg-card flex flex-col items-center py-6 gap-6 shrink-0 transition-all select-none">
        {/* Compact Logo */}
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-primary-foreground text-xs shadow-md">
          T
        </div>

        <div className="h-px w-8 bg-border" />

        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`p-2.5 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-primary/10 text-primary border border-border shadow-inner'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-muted/40"
          title="Expand Sidebar"
        >
          <ChevronRight size={14} className="translate-x-[0.5px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen border-r border-border bg-card flex flex-col shrink-0 transition-all select-none relative z-30 text-foreground">
      {/* 1. Header with custom brand logo */}
      <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-primary-foreground shrink-0 shadow-sm">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black tracking-widest text-foreground uppercase">
              TASKPAD
            </span>
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase leading-none mt-0.5">
              {'// PLANNER'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded border border-border bg-transparent transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={13} />
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* View Switcher Navigation */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 block mb-1">
            Workspace Views
          </span>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
                currentView === item.id
                  ? 'bg-muted border-border text-foreground font-bold shadow-sm'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span className={currentView === item.id ? 'text-primary' : 'text-muted-foreground'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bottom controls footer */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">
        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 py-1.5 hover:bg-muted border border-border rounded-md text-[10px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
          title="Completely clear all tasks"
        >
          <RefreshCw size={10} />
          <span>Clear Dashboard</span>
        </button>

        <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider px-1">
          <span>TaskPad v1.0</span>
          <span className="text-muted-foreground flex items-center gap-0.5">
            <Sparkles size={8} /> Active
          </span>
        </div>
      </div>
    </div>
  );
}
