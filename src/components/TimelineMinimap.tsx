'use client';

import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { filteredTasksAtom, selectedDateAtom } from '@/atoms';
import { timeToMinutes, formatTime12h, minutesToTime } from '@/utils/time';
import { Clock } from 'lucide-react';
import { Task } from '@/types';

interface TimelineMinimapProps {
  onTaskClick?: (task: Task, startMin: number) => void;
  className?: string;
}

export default function TimelineMinimap({ onTaskClick, className = '' }: TimelineMinimapProps) {
  const [selectedDate] = useAtom(selectedDateAtom);
  const [filteredTasks] = useAtom(filteredTasksAtom);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(new Date()), 0);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const isSelectedDayToday = () => {
    if (!currentTime) return false;
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === selectedDate;
  };

  const scheduledTasks = filteredTasks.filter((t) => t.startTime && t.endTime);

  // Calculate free gaps in the day to generate hover tooltips for empty time
  const occupiedIntervals = (() => {
    const intervals: { startMin: number; endMin: number }[] = [];
    const sortedScheduled = [...scheduledTasks].sort(
      (a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!)
    );
    for (const task of sortedScheduled) {
      const start = timeToMinutes(task.startTime!);
      const end = timeToMinutes(task.endTime!);
      if (intervals.length === 0) {
        intervals.push({ startMin: start, endMin: end });
      } else {
        const last = intervals[intervals.length - 1];
        if (start <= last.endMin) {
          last.endMin = Math.max(last.endMin, end);
        } else {
          intervals.push({ startMin: start, endMin: end });
        }
      }
    }
    return intervals;
  })();

  const fullDayGaps = (() => {
    const gapsList: { startMin: number; endMin: number; duration: number }[] = [];
    let currentTracker = 0;
    
    for (const interval of occupiedIntervals) {
      if (interval.startMin > currentTracker) {
        const gapDuration = interval.startMin - currentTracker;
        gapsList.push({
          startMin: currentTracker,
          endMin: interval.startMin,
          duration: gapDuration,
        });
      }
      currentTracker = Math.max(currentTracker, interval.endMin);
    }
    
    if (1440 > currentTracker) {
      const remainingGap = 1440 - currentTracker;
      gapsList.push({
        startMin: currentTracker,
        endMin: 1440,
        duration: remainingGap,
      });
    }
    return gapsList;
  })();

  return (
    <div className={`px-5 py-4 border-b border-border bg-muted/10 flex flex-col gap-4 shrink-0 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          <span className="uppercase tracking-widest text-[11px] font-extrabold text-foreground">Timeline Overview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/80 shadow-sm" />
            <span>{scheduledTasks.length} Planned Blocks</span>
          </span>
        </div>
      </div>
      
      {/* Horizontal Full-Day Minimap */}
      <div className="space-y-1.5">
        <div className="h-4 w-full bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full border border-emerald-500/20 overflow-hidden relative select-none shadow-inner flex items-center group">
          
          {/* Render Free Gaps Tooltips (invisible blocks to catch hover) */}
          {fullDayGaps.map((gap, idx) => {
            const startPercent = (gap.startMin / 1440) * 100;
            const widthPercent = (gap.duration / 1440) * 100;
            return (
              <div 
                key={`gap-${idx}`}
                style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                className="absolute h-full z-10 cursor-help"
                title={`Empty Time: ${formatTime12h(minutesToTime(gap.startMin))} - ${formatTime12h(minutesToTime(gap.endMin))}`}
              />
            );
          })}

          {/* Render actual scheduled tasks on the minimap */}
          {scheduledTasks.map((task) => {
            const startMin = timeToMinutes(task.startTime!);
            const duration = task.duration || task.estimatedDuration || 60;
            const endMin = Math.min(1440, startMin + duration);
            
            const startPercent = (startMin / 1440) * 100;
            const widthPercent = ((endMin - startMin) / 1440) * 100;
            
            return (
              <div 
                key={`mini-${task.id}`}
                style={{ 
                  left: `${startPercent}%`, 
                  width: `${widthPercent}%`,
                  backgroundColor: 'var(--task-text)'
                }}
                className={`absolute h-full opacity-90 border-x border-background/20 color-${task.color || 'indigo'} hover:opacity-100 hover:scale-y-110 transition-all cursor-pointer z-20`}
                title={`${task.title} (${formatTime12h(task.startTime!)} - ${formatTime12h(task.endTime!)})`}
                onClick={() => onTaskClick?.(task, startMin)}
              />
            );
          })}
          
          {/* Current Time Indicator on minimap */}
          {isSelectedDayToday() && currentTime && (
            <div 
              style={{ left: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100}%` }}
              className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-30 shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all pointer-events-none"
            />
          )}
        </div>
        
        {/* Minimap Labels */}
        <div className="flex justify-between text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11:59 PM</span>
        </div>
      </div>
    </div>
  );
}
