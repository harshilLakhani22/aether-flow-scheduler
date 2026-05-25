'use client';

import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { selectedDateAtom, currentViewAtom, tasksAtom } from '@/atoms';
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon, Info } from 'lucide-react';
import { minutesToTime } from '@/utils/time';

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const setCurrentView = useSetAtom(currentViewAtom);
  const [tasks] = useAtom(tasksAtom);

  // State to track the currently displayed month/year
  const [currentMonthDate, setCurrentMonthDate] = React.useState<Date>(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const year = currentMonthDate.getFullYear();
  const monthIdx = currentMonthDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = `${monthNames[monthIdx]} ${year}`;

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, monthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, monthIdx + 1, 1));
  };

  // First day of the month
  const firstDay = new Date(year, monthIdx, 1);
  const leadingSpaces = firstDay.getDay(); // Sun=0, Mon=1, etc.

  // Total days in month
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const calendarDays: (number | null)[] = [
    ...Array(leadingSpaces).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Helper to format date as YYYY-MM-DD
  const formatDateString = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(monthIdx + 1).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  // Helper to get stats for a day
  const getDayStats = (day: number) => {
    const dateStr = formatDateString(day);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const scheduled = dayTasks.filter((t) => t.startTime && t.endTime);
    const completed = dayTasks.filter((t) => t.completed);
    
    // Sum duration in minutes
    const totalMinutes = scheduled.reduce((acc, t) => {
      const start = t.startTime ? t.startTime.split(':').map(Number) : [0,0];
      const end = t.endTime ? t.endTime.split(':').map(Number) : [0,0];
      const dur = (end[0]*60 + end[1]) - (start[0]*60 + start[1]);
      return acc + (dur > 0 ? dur : t.estimatedDuration || 0);
    }, 0);

    const totalHours = Number((totalMinutes / 60).toFixed(1));

    return {
      tasksCount: dayTasks.length,
      scheduledCount: scheduled.length,
      completedCount: completed.length,
      totalHours,
      // Status color matching:
      // Fully loaded (> 5 hours): red/violet glow
      // Moderately loaded (2-5 hours): indigo/sky
      // Lightly loaded (0.1-2 hours): emerald
      // Free (0 hours)
      loadLevel: totalHours > 5 ? 'heavy' : totalHours > 2 ? 'medium' : totalHours > 0 ? 'light' : 'empty',
    };
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateString(day);
    setSelectedDate(dateStr);
    setCurrentView('timeline'); // Switch to timeline so they can schedule!
  };

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-panel border border-border rounded-xl p-6 flex flex-col h-[calc(100vh-210px)] overflow-hidden">
      {/* Calendar Header info */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-indigo-400" />
          <h2 className="text-base font-bold text-slate-200">{monthName}</h2>
          <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-850 rounded-full font-medium text-slate-500 flex items-center gap-1">
            <Info size={10} /> Click a date to open its vertical daily planner
          </span>
        </div>
        
        {/* Navigation - fully functional now! */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground border border-border active:scale-95 transition-all"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground border border-border active:scale-95 transition-all"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
 
      {/* Weekday Labels Grid */}
      <div className="grid grid-cols-7 gap-3 mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
 
      {/* Days Grid Scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <div className="grid grid-cols-7 gap-3 pb-4">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-video sm:aspect-square bg-muted/20 border border-border/50 rounded-xl animate-pulse-subtle"
                />
              );
            }
 
            const dateStr = formatDateString(day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === '2026-05-25'; // Match our mock context current "Today" date
            const stats = getDayStats(day);
 
            // Determine load colors
            let loadBg = 'bg-card hover:bg-muted/50 border-border';
            let loadBadgeColor = 'text-muted-foreground bg-muted';
            
            if (stats.loadLevel === 'heavy') {
              loadBg = 'bg-rose-500/5 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/20 hover:bg-rose-500/10 dark:hover:bg-rose-950/20';
              loadBadgeColor = 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30';
            } else if (stats.loadLevel === 'medium') {
              loadBg = 'bg-indigo-500/5 dark:bg-indigo-950/10 border-indigo-200/50 dark:border-indigo-900/20 hover:bg-indigo-500/10 dark:hover:bg-indigo-950/20';
              loadBadgeColor = 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30';
            } else if (stats.loadLevel === 'light') {
              loadBg = 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/20 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20';
              loadBadgeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30';
            }
 
            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-video sm:aspect-square border rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all ${loadBg} ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
                    : isToday
                    ? 'ring-1 ring-muted-foreground'
                    : ''
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-primary'
                        : isToday
                        ? 'text-foreground px-1.5 py-0.5 rounded-full bg-accent border border-border'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {day}
                  </span>

                  {stats.tasksCount > 0 && (
                    <span className="text-[9px] px-1.5 bg-muted text-muted-foreground font-bold border border-border rounded">
                      {stats.tasksCount} Tasks
                    </span>
                  )}
                </div>

                {/* Day load details */}
                {stats.tasksCount > 0 ? (
                  <div className="flex flex-col gap-1 items-start mt-auto">
                    {stats.totalHours > 0 && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold tracking-wide uppercase ${loadBadgeColor}`}>
                        {stats.totalHours} hrs planned
                      </span>
                    )}
                    {stats.completedCount > 0 && (
                      <span className="text-[8px] text-emerald-500/80 font-medium">
                        ✓ {stats.completedCount} completed
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[8px] text-slate-700 mt-auto select-none">
                    No tasks
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Calendar Legend */}
      <div className="shrink-0 pt-3 border-t border-border mt-3 flex items-center justify-center gap-6 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-900" />
          <span>No Scheduled Focus</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" />
          <span>Light Load (0.1 - 2.0 hrs)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-indigo-500/10 border border-indigo-500/30" />
          <span>Medium Load (2.1 - 5.0 hrs)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30" />
          <span>Heavy Load (5.0+ hrs)</span>
        </span>
      </div>
    </div>
  );
}
