'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  selectedDateAtom, filteredTasksAtom, tasksAtom, 
  prefillTimeAtom, isTaskCreateModalOpenAtom, selectedTaskAtom, isTaskModalOpenAtom 
} from '@/atoms';
import { Task, TaskPriority } from '@/types';
import { 
  getPositionedTasks, getHoursArray, getHourLabel, 
  timeToMinutes, minutesToTime, formatTime12h 
} from '@/utils/time';
import { 
  Clock, Plus, Folder, AlertTriangle, 
  Inbox, Sparkles, CheckSquare, Square, ArrowUpRight
} from 'lucide-react';
import TimelineMinimap from './TimelineMinimap';
import { taskService } from '@/lib/taskService';

const HOUR_HEIGHT = 96; // 96px per hour for a spacious, readable scrolling timeline
const MINUTES_PER_SLOT = 30; // 30-minute drop zones

export default function TimelineView() {
  const [selectedDate] = useAtom(selectedDateAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  const [filteredTasks] = useAtom(filteredTasksAtom);
  
  const setPrefillTime = useSetAtom(prefillTimeAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);
  const setSelectedTask = useSetAtom(selectedTaskAtom);
  const setIsDrawerOpen = useSetAtom(isTaskModalOpenAtom);

  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // Resizing states for timeline blocks
  const [resizeHoveredId, setResizeHoveredId] = useState<string | null>(null);
  const [resizingTaskId, setResizingTaskId] = useState<string | null>(null);
  
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Update current time for the red line indicator
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

  // Scroll slightly to focus the active 8 AM day part
  useEffect(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = 8 * HOUR_HEIGHT - 40;
    }
  }, []);

  // Filter tasks for the selected date that are scheduled
  const scheduledTasks = filteredTasks.filter((t) => t.startTime && t.endTime);
  const unscheduledTasks = tasks.filter((t) => t.date === selectedDate && (!t.startTime || !t.endTime));

  // Position scheduled tasks using the calendar layout algorithm
  const positionedTasks = getPositionedTasks(scheduledTasks);

  // Merge overlapping task intervals to get the occupied intervals (for the Busy/Free occupancy rail)
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

  // Calculate free gaps in the active planning day (e.g. 7 AM to 10 PM)
  const freeGaps = (() => {
    const activeStart = 7 * 60; // 420 mins
    const activeEnd = 22 * 60;  // 1320 mins
    const gapsList: { startMin: number; endMin: number; duration: number }[] = [];
    
    let currentTracker = activeStart;
    
    for (const interval of occupiedIntervals) {
      if (interval.startMin > currentTracker) {
        const gapDuration = interval.startMin - currentTracker;
        if (gapDuration >= 15) {
          gapsList.push({
            startMin: currentTracker,
            endMin: interval.startMin,
            duration: gapDuration,
          });
        }
      }
      currentTracker = Math.max(currentTracker, interval.endMin);
    }
    
    if (activeEnd > currentTracker) {
      const remainingGap = activeEnd - currentTracker;
      if (remainingGap >= 15) {
        gapsList.push({
          startMin: currentTracker,
          endMin: activeEnd,
          duration: remainingGap,
        });
      }
    }
    return gapsList;
  })();

  // Slots helper array (48 half-hour slots per day)
  const slots = Array.from({ length: 48 }, (_, i) => i);

  // Toggle complete state handler
  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    await taskService.updateTask(task.id, {
      completed: !task.completed,
      status: !task.completed ? 'done' : 'in_progress',
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  // Drag and Drop Timeline slot assignments
  const handleSlotDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    setDragOverSlot(slotIdx);
  };

  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleSlotDrop = async (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const startMinutes = slotIdx * MINUTES_PER_SLOT;
    const startTimeStr = minutesToTime(startMinutes);

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    // Keep original duration or default to 60m
    const dur = taskToMove.duration || taskToMove.estimatedDuration || 60;
    const endMinutes = Math.min(1439, startMinutes + dur);
    const endTimeStr = minutesToTime(endMinutes);

    await taskService.updateTask(taskId, {
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: dur,
      estimatedDuration: dur,
    });
  };

  const handleSlotClick = (slotIdx: number) => {
    const startMinutes = slotIdx * MINUTES_PER_SLOT;
    setPrefillTime(minutesToTime(startMinutes));
    setIsCreateOpen(true);
  };

  // Bottom edge mouse resizing handlers
  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();

    const startY = e.clientY;
    const startMin = timeToMinutes(task.startTime!);
    const originalEndMin = timeToMinutes(task.endTime!);
    const originalDuration = originalEndMin - startMin;
    
    let finalData: { endTime: string; duration: number } | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      
      // Snapping duration adjustments to 15-minute intervals (15 mins = 24px height offset when HOUR_HEIGHT=96)
      const minutesDelta = Math.round(deltaY / 24) * 15;
      const newDuration = Math.max(15, originalDuration + minutesDelta);
      const newEndMinutes = startMin + newDuration;
      
      // Cap at end of day (23:59 -> 1439 mins)
      const cappedEndMinutes = Math.min(1439, newEndMinutes);
      const computedDuration = cappedEndMinutes - startMin;
      
      const newEndTime = minutesToTime(cappedEndMinutes);
      
      finalData = { endTime: newEndTime, duration: computedDuration };

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                endTime: newEndTime,
                duration: computedDuration,
                estimatedDuration: computedDuration,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    };

    const handleMouseUp = async () => {
      setResizingTaskId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (finalData) {
        await taskService.updateTask(task.id, {
          endTime: finalData.endTime,
          duration: finalData.duration,
          estimatedDuration: finalData.duration
        });
      }
    };

    setResizingTaskId(task.id);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Check if current date is "today"
  const isSelectedDayToday = () => {
    if (!currentTime) return false;
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === selectedDate;
  };

  // Calculate current time line top position
  const getCurrentTimeTop = () => {
    if (!currentTime) return 0;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes * (HOUR_HEIGHT / 60); // px per minute
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full select-none text-foreground bg-background">
      {/* 1. Left Section: Vertical scrollable timeline calendar */}
      <div className="flex-1 glass-panel border border-border rounded-xl flex flex-col h-[65vh] lg:h-[calc(100vh-210px)] overflow-hidden bg-card">
        <TimelineMinimap 
          onTaskClick={(task, startMin) => {
            if (timelineScrollRef.current) {
              timelineScrollRef.current.scrollTo({ 
                top: startMin * (HOUR_HEIGHT / 60) - 40, 
                behavior: 'smooth' 
              });
            }
          }}
        />

        {/* Outer Scroll Container */}
        <div
          ref={timelineScrollRef}
          className="flex-1 overflow-y-auto overflow-x-auto md:overflow-x-hidden relative"
        >
          {/* Time columns layout */}
          <div className="flex w-full min-w-[600px] relative" style={{ height: 24 * HOUR_HEIGHT }}>
            {/* Left hours labels column (width: 64px) */}
            <div className="w-16 border-r border-border bg-card/50 shrink-0 sticky left-0 z-20 flex flex-col pt-[2px] relative">
              {/* Dynamic Busy/Free Occupancy Rail */}
              <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-muted z-30 pointer-events-none">
                {/* Emerald/Green for free rail */}
                <div className="absolute inset-0 bg-emerald-500/15" />
                {/* Indigo overlays for occupied blocks */}
                {occupiedIntervals.map((interval, idx) => {
                  const topPos = interval.startMin * (HOUR_HEIGHT / 60);
                  const blockHeight = (interval.endMin - interval.startMin) * (HOUR_HEIGHT / 60);
                  return (
                    <div
                      key={idx}
                      style={{ top: topPos, height: blockHeight }}
                      className="absolute left-0 right-0 bg-primary shadow-sm transition-all duration-300 border-y border-border"
                    />
                  );
                })}
              </div>

              {getHoursArray().map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="flex flex-col items-center justify-start text-[10px] text-muted-foreground font-bold pr-2"
                >
                  <span className="mt-[-6px] bg-card px-1 py-0.5 rounded border border-border shadow-xs">
                    {getHourLabel(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Right scheduler area */}
            <div className="flex-1 relative h-full">
              {/* Vertical hours rows background lines */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {getHoursArray().map((hour) => (
                  <div
                    key={hour}
                    style={{ height: HOUR_HEIGHT, top: hour * HOUR_HEIGHT }}
                    className="absolute left-0 w-full timeline-hour-row"
                  >
                    {/* 30-min dashed line helper */}
                    <div
                      style={{ top: HOUR_HEIGHT / 2 }}
                      className="absolute left-0 w-full timeline-half-hour-line"
                    />
                  </div>
                ))}
              </div>

              {/* Interactive 30-minute drop zones (absolute stack in background) */}
              <div className="absolute inset-0 z-10">
                {slots.map((slotIdx) => {
                  const startMin = slotIdx * MINUTES_PER_SLOT;
                  const startStr = minutesToTime(startMin);
                  const isHovered = hoveredSlot === slotIdx;
                  const isDragTarget = dragOverSlot === slotIdx;

                  return (
                    <div
                      key={slotIdx}
                      style={{
                        top: slotIdx * (HOUR_HEIGHT / 2),
                        height: HOUR_HEIGHT / 2,
                      }}
                      onMouseEnter={() => setHoveredSlot(slotIdx)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onDragOver={(e) => handleSlotDragOver(e, slotIdx)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, slotIdx)}
                      onClick={() => handleSlotClick(slotIdx)}
                      className={`absolute left-0 w-full cursor-pointer transition-all flex items-center justify-end pr-4 text-[10px] select-none border-t border-transparent group ${
                        isDragTarget
                          ? 'border-primary/50 bg-primary/5 border-dashed border-2'
                          : isHovered
                          ? 'border-t border-dashed border-border bg-muted/20'
                          : ''
                      }`}
                    >
                      {(isHovered || isDragTarget) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary font-semibold transition-colors">
                          <Plus size={12} />
                          <span>Schedule {formatTime12h(startStr)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Free Workday Gaps (Rendered in the background) */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {freeGaps.map((gap, idx) => {
                  const top = gap.startMin * (HOUR_HEIGHT / 60);
                  const height = gap.duration * (HOUR_HEIGHT / 60);
                  const hours = Math.floor(gap.duration / 60);
                  const mins = gap.duration % 60;
                  const label = hours > 0 
                    ? `${hours}h${mins > 0 ? ` ${mins}m` : ''} Free Gap`
                    : `${mins}m Free Gap`;

                  return (
                    <div
                      key={`gap-${idx}`}
                      style={{
                        top: top + 4,
                        height: height - 8,
                        left: '2%',
                        width: '96%',
                      }}
                      className="absolute border border-dashed border-emerald-500/30 bg-emerald-500/[0.03] rounded-xl flex flex-col items-center justify-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold gap-1 transition-all"
                    >
                      <div className="flex items-center gap-1.5 bg-background/90 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm backdrop-blur-sm">
                        <Sparkles size={13} className="text-emerald-500 animate-pulse-subtle" />
                        <span>{label}</span>
                        {height >= 40 && (
                          <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium font-mono">
                            ({formatTime12h(minutesToTime(gap.startMin))} - {formatTime12h(minutesToTime(gap.endMin))})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Absolute scheduled task blocks (Rendered over drop zones) */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {positionedTasks.map(({ task, left, width, hasConflict }) => {
                  const startMin = timeToMinutes(task.startTime!);
                  const duration = task.duration || task.estimatedDuration || 60;
                  
                  const top = startMin * (HOUR_HEIGHT / 60);
                  const height = duration * (HOUR_HEIGHT / 60);

                  const colorClass = `color-${task.color || 'indigo'}`;
                  const isResizingThis = resizingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      draggable={resizeHoveredId !== task.id && !task.completed}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        
                        // Add dragging visual state
                        const element = e.currentTarget as HTMLElement;
                        setTimeout(() => {
                          element.classList.add('dragging-block');
                        }, 0);
                      }}
                      onDragEnd={(e) => {
                        const element = e.currentTarget as HTMLElement;
                        element.classList.remove('dragging-block');
                      }}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `${left}%`,
                        width: `calc(${width}% - 6px)`,
                        zIndex: isResizingThis ? 40 : 20,
                      }}
                      className={`absolute rounded-xl p-3 cursor-pointer pointer-events-auto transition-all shadow-md hover:shadow-lg group border-l-[4px] flex flex-col justify-between overflow-hidden bg-background task-styled-block color-${colorClass} ${
                        task.completed ? 'grayscale opacity-75' : ''
                      } ${isResizingThis ? 'ring-2 ring-current ring-offset-2 ring-offset-background z-50 shadow-xl scale-[1.01]' : 'border-border'}`}
                    >
                      <div className="min-w-0">
                        {/* Title block */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className={`text-[13px] font-extrabold text-current truncate leading-tight tracking-wide ${task.completed ? 'line-through opacity-80' : ''}`}>
                            {task.title}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleToggleComplete(e, task)}
                            className="text-current focus:outline-none shrink-0"
                          >
                            {task.completed ? (
                              <CheckSquare size={14} className="stroke-[2.5]" />
                            ) : (
                              <Square size={14} className="opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                        
                        {/* Small description for larger blocks */}
                        {height >= 70 && task.description && (
                          <p className="text-[11px] text-current/80 line-clamp-2 leading-snug font-medium mb-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Footer tags */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-current/80 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-background/50 border border-current/10 px-1.5 py-0.5 rounded shadow-sm">
                            {formatTime12h(task.startTime)} - {formatTime12h(task.endTime)}
                          </span>
                          {height >= 55 && task.project && (
                            <span className="flex items-center gap-1 bg-current/10 text-current px-2 py-0.5 border border-current/20 rounded font-extrabold truncate max-w-[110px] shadow-sm">
                              <Folder size={10} />
                              <span>{task.project}</span>
                            </span>
                          )}
                        </div>

                        {hasConflict && (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded shadow-sm" title="Time Conflict!">
                            <AlertTriangle size={10} />
                            <span>Overlap</span>
                          </div>
                        )}
                      </div>

                      {/* Resize Handle (ns-resize) on bottom edge */}
                      {!task.completed && (
                        <div
                          onMouseEnter={() => setResizeHoveredId(task.id)}
                          onMouseLeave={() => setResizeHoveredId(null)}
                          onMouseDown={(e) => handleResizeStart(e, task)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-foreground/10 flex items-center justify-center transition-colors pointer-events-auto z-30"
                          title="Drag to adjust duration"
                        >
                          <div className="w-8 h-[2px] bg-muted-foreground/20 rounded-full group-hover:bg-muted-foreground/75 transition-colors" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Today Current Time Indicator Line */}
              {isSelectedDayToday() && currentTime && (
                <div
                  style={{ top: getCurrentTimeTop() }}
                  className="absolute left-0 w-full h-[2px] bg-rose-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.4)] z-30 pointer-events-none flex items-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute left-0 translate-x-[-5px] shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  <span className="absolute left-3 bg-rose-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md">
                    {formatTime12h(`${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Unscheduled Tasks Inbox sidebar */}
      <div className="w-full lg:w-[280px] shrink-0 glass-panel border border-border rounded-xl flex flex-col h-[40vh] lg:h-[calc(100vh-210px)] overflow-hidden bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/40 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox size={15} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Unscheduled Inbox
            </h3>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold border border-border">
            {unscheduledTasks.length}
          </span>
        </div>

        {/* Unscheduled List container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
          {unscheduledTasks.length > 0 ? (
            unscheduledTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => handleTaskClick(task)}
                className={`group relative bg-background p-4 rounded-xl cursor-grab active:cursor-grabbing border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border-l-4 task-styled-block color-${
                  task.color || 'indigo'
                } flex flex-col gap-3 ${task.completed ? 'grayscale opacity-75' : ''}`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleComplete(e, task)}
                    className="text-current focus:outline-none shrink-0 mt-0.5"
                  >
                    {task.completed ? (
                      <CheckSquare size={14} className="stroke-[2.5]" />
                    ) : (
                      <Square size={14} className="opacity-60 hover:opacity-100" />
                    )}
                  </button>
                  <h4 className={`text-[13px] font-extrabold leading-snug truncate text-current ${task.completed ? 'line-through opacity-70' : ''}`}>
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-current/80 shrink-0">
                  <div className="flex items-center gap-1.5 truncate">
                    {task.project && (
                      <span className="bg-current/10 text-current px-2 py-0.5 border border-current/20 rounded-md font-extrabold max-w-[90px] truncate shadow-sm">
                        {task.project}
                      </span>
                    )}
                    <span className="bg-background/80 border border-current/10 px-2 py-0.5 rounded-md shadow-sm">{task.estimatedDuration}m est.</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-current opacity-0 group-hover:opacity-100 transition-opacity font-extrabold">
                    <span>Schedule</span>
                    <ArrowUpRight size={12} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl text-muted-foreground text-center select-none">
              <Sparkles size={24} className="stroke-[1.2] mb-3 text-muted-foreground animate-pulse-subtle" />
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-foreground">All Scheduled!</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[160px] mx-auto leading-relaxed">
                All inbox items have been assigned to time slots.
              </p>
            </div>
          )}
        </div>

        {/* Drag instructions footer */}
        <div className="p-3 border-t border-border bg-muted/20 text-[9px] text-muted-foreground text-center italic shrink-0">
          💡 Drag & drop tasks onto calendar slots on the left to schedule them instantly.
        </div>
      </div>
    </div>
  );
}
