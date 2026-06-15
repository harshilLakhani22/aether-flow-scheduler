'use client';

import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  selectedDateAtom, currentViewAtom, searchQueryAtom, 
  isTaskCreateModalOpenAtom, sidebarOpenAtom,
  themeAtom
} from '@/atoms';
import { ViewType } from '@/types';
import { 
  ChevronLeft, ChevronRight, Search, Plus, 
  Menu, X, Calendar, LayoutDashboard, Clock, List,
  Sun, Moon
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';

export default function Topbar() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);

  // Navigate Date forwards/backwards safely
  const handlePrevDay = () => {
    const parsed = parseISO(selectedDate);
    const prev = subDays(parsed, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const parsed = parseISO(selectedDate);
    const next = addDays(parsed, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleSetToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Format date elegantly, e.g. "Monday, May 25, 2026"
  const getFormattedDate = () => {
    try {
      const parsed = parseISO(selectedDate);
      if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
        return `Today, ${format(parsed, 'MMM d')}`;
      }
      return format(parsed, 'EEEE, MMM d');
    } catch {
      return selectedDate;
    }
  };

  const VIEW_TABS = [
    { id: 'board', label: 'Board', icon: <LayoutDashboard size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={14} /> },
    { id: 'list', label: 'List', icon: <List size={14} /> },
  ];

  return (
    <div className="h-16 border-b border-border bg-card/85 backdrop-blur-md flex items-center justify-between px-6 select-none shrink-0 relative z-25 text-foreground">
      {/* 1. Left: Mobile menu triggers and Date Navigator */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg"
          title="Toggle Navigation Menu"
        >
          <Menu size={16} />
        </button>
 
        {/* Date navigators strip */}
        <div className="flex items-center gap-1.5 bg-muted border border-border p-1 rounded-lg">
          <button
            onClick={handlePrevDay}
            className="p-1 hover:bg-card text-muted-foreground hover:text-foreground rounded transition-colors"
            title="Previous Day"
          >
            <ChevronLeft size={15} />
          </button>
          
          <button
            onClick={handleSetToday}
            className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider hover:bg-card text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
          >
            Today
          </button>
 
          <button
            onClick={handleNextDay}
            className="p-1 hover:bg-card text-muted-foreground hover:text-foreground rounded transition-colors"
            title="Next Day"
          >
            <ChevronRight size={15} />
          </button>
        </div>
 
        {/* Title displays */}
        <h2 className="text-sm font-bold text-foreground tracking-wide hidden md:block">
          {getFormattedDate()}
        </h2>
      </div>
 
      {/* 2. Middle: Search bar */}
      <div className="hidden sm:flex items-center max-w-xs w-full relative">
        <span className="absolute left-3 text-muted-foreground/80">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items, tags..."
          className="w-full bg-muted border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
          >
            <X size={10} />
          </button>
        )}
      </div>
 
      {/* 3. Right: View switcher and Add task button */}
      <div className="flex items-center gap-3">
        {/* View Switcher tab bar */}
        <div className="hidden lg:flex items-center bg-muted border border-border p-0.5 rounded-lg">
          {VIEW_TABS.map((tab) => {
            const isSelected = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as ViewType)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all border ${
                  isSelected
                    ? 'bg-card text-foreground border-border shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
 
        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center justify-center cursor-pointer active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode (Eye-Friendly)' : 'Switch to Space Black Mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
 
        {/* Quick Add button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="hidden md:flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold transition-all focus:outline-none active:scale-95 shadow-sm"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
}
