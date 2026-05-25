'use client';

import React from 'react';
import { useAtom } from 'jotai';
import { tasksAtom, selectedDateAtom } from '@/atoms';
import { Clock, CheckCircle2, TrendingUp, Compass } from 'lucide-react';

export default function StatsCards() {
  const [tasks] = useAtom(tasksAtom);
  const [selectedDate] = useAtom(selectedDateAtom);

  // Filter tasks for the selected date
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const scheduled = dayTasks.filter((t) => t.startTime && t.endTime);
  const completed = dayTasks.filter((t) => t.completed);

  // 1. Calculate Planned Hours
  const totalMinutesScheduled = scheduled.reduce((acc, t) => {
    const start = t.startTime ? t.startTime.split(':').map(Number) : [0, 0];
    const end = t.endTime ? t.endTime.split(':').map(Number) : [0, 0];
    const diff = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
    return acc + (diff > 0 ? diff : t.estimatedDuration || 0);
  }, 0);
  const plannedHours = (totalMinutesScheduled / 60).toFixed(1);

  // 2. Calculate Completed stats
  const completedCount = completed.length;
  const totalCount = dayTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 3. Focus Score calculation (custom weighted algorithm)
  const calculateFocusScore = () => {
    if (dayTasks.length === 0) return 0;
    
    let totalPossibleWeight = 0;
    let earnedWeight = 0;

    dayTasks.forEach((t) => {
      let weight = 1;
      if (t.priority === 'urgent') weight += 4;
      else if (t.priority === 'high') weight += 2.5;
      else if (t.priority === 'medium') weight += 1.5;

      if (t.type === 'deep_work' || t.type === 'focus') weight *= 1.5;
      else if (t.type === 'meeting') weight *= 1.1;

      totalPossibleWeight += weight;
      if (t.completed) {
        earnedWeight += weight;
      }
    });

    return Math.round((earnedWeight / totalPossibleWeight) * 100);
  };
  const focusScore = calculateFocusScore();

  // 4. Free Time Remaining (Based on standard 9 AM to 6 PM day = 9 hours = 540 mins)
  const workdayMinutes = 9 * 60; 
  const freeMinutes = Math.max(0, workdayMinutes - totalMinutesScheduled);
  const freeHours = (freeMinutes / 60).toFixed(1);

  const CARDS = [
    {
      title: 'Planned Hours',
      value: `${plannedHours} hrs`,
      desc: `${scheduled.length} blocked slots`,
      icon: <Clock className="text-indigo-600 dark:text-indigo-400" size={18} />,
      gradient: 'shadow-[0_0_20px_-10px_rgba(99,102,241,0.2)] border-indigo-200/50 dark:border-indigo-950/40 bg-indigo-500/5 dark:bg-indigo-950/20',
      valueColor: 'text-indigo-650 dark:text-indigo-400',
    },
    {
      title: 'Task Progress',
      value: `${completedCount} / ${totalCount}`,
      desc: `${completionPercentage}% completed`,
      icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={18} />,
      gradient: 'shadow-[0_0_20px_-10px_rgba(16,185,129,0.2)] border-emerald-200/50 dark:border-emerald-950/40 bg-emerald-500/5 dark:bg-emerald-950/20',
      valueColor: 'text-emerald-650 dark:text-emerald-400',
    },
    {
      title: 'Focus Score',
      value: `${focusScore}%`,
      desc: focusScore > 80 ? 'Exceptional flow state!' : focusScore > 50 ? 'Steady velocity' : 'Starting alignment',
      icon: <TrendingUp className="text-violet-600 dark:text-violet-400" size={18} />,
      gradient: 'shadow-[0_0_20px_-10px_rgba(139,92,246,0.2)] border-violet-200/50 dark:border-violet-950/40 bg-violet-500/5 dark:bg-violet-950/20',
      valueColor: 'text-violet-650 dark:text-violet-400',
    },
    {
      title: 'Free Buffer Time',
      value: `${freeHours} hrs`,
      desc: 'Based on 9h workday',
      icon: <Compass className="text-amber-600 dark:text-amber-400" size={18} />,
      gradient: 'shadow-[0_0_20px_-10px_rgba(245,158,11,0.2)] border-amber-200/50 dark:border-amber-950/40 bg-amber-500/5 dark:bg-amber-950/20',
      valueColor: 'text-amber-650 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none shrink-0 text-foreground">
      {CARDS.map((c, idx) => (
        <div
          key={idx}
          className={`glass-panel border p-4.5 rounded-xl flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${c.gradient}`}
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              {c.title}
            </span>
            <h3 className={`text-xl font-extrabold tracking-tight ${c.valueColor}`}>
              {c.value}
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground/85 block truncate">
              {c.desc}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border shadow-inner shrink-0">
            {c.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
