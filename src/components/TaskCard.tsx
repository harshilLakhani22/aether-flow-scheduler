'use client';

import React from 'react';
import { useSetAtom } from 'jotai';
import { 
  Clock, CheckSquare, Square, Folder,
  Target, Monitor, Users, Briefcase, Megaphone, Leaf, Flame,
  RotateCcw
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { selectedTaskAtom, isTaskModalOpenAtom } from '@/atoms';
import { formatTime12h } from '@/utils/time';
import { taskService } from '@/lib/taskService';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
}

const PRIORITY_BADGES: Record<TaskPriority, { label: string; text: string; bg: string; border: string }> = {
  low: { label: 'Low', text: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border/60' },
  medium: { label: 'Med', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/30' },
  high: { label: 'High', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-900/30' },
  urgent: { label: 'Urgent', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/30' },
};

const TASK_TYPE_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  deep_work: Monitor,
  meeting: Users,
  admin: Briefcase,
  outreach: Megaphone,
  personal: Leaf,
  urgent: Flame,
};

export default function TaskCard({ task }: TaskCardProps) {
  const setSelectedTask = useSetAtom(selectedTaskAtom);
  const setIsDrawerOpen = useSetAtom(isTaskModalOpenAtom);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await taskService.updateTask(task.id, {
      completed: !task.completed,
      status: !task.completed ? 'done' : 'not_started'
    });
  };

  const handleRestoreToToday = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    await taskService.updateTask(task.id, { date: todayStr });
  };

  const handleCardClick = () => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const element = e.currentTarget as HTMLElement;
    setTimeout(() => {
      element.classList.add('dragging-card');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging-card');
  };

  const priorityStyle = PRIORITY_BADGES[task.priority];
  const TypeIcon = TASK_TYPE_ICONS[task.type] || Target;
  const colorClass = `color-${task.color || 'indigo'}`;

  // Determine if task is from a past date and not completed
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isPast = task.date < todayStr;
  const showRestore = isPast && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={handleDragStart as any}
      onDragEnd={handleDragEnd as any}
      onClick={handleCardClick}
      className={`group relative glass-card flex flex-col p-3.5 rounded-xl cursor-grab active:cursor-grabbing border-l-[4px] border border-r-border/80 border-y-border/80 task-styled-block ${colorClass} ${
        task.priority === 'urgent' ? 'priority-urgent-glow' : ''
      } ${task.completed ? 'opacity-60 saturate-50' : 'shadow-sm hover:shadow-md'} overflow-hidden`}
    >
      {/* Header Row */}
      <div className="flex items-start gap-2.5 w-full relative z-10">
        <button
          type="button"
          onClick={handleToggleComplete}
          className="mt-0.5 opacity-70 hover:opacity-100 transition-all shrink-0 focus:outline-none"
        >
          {task.completed ? (
            <CheckSquare size={16} className="stroke-[2.5]" />
          ) : (
            <Square size={16} className="opacity-60 hover:opacity-100" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-extrabold tracking-tight leading-snug flex items-start gap-1.5 ${
              task.completed ? 'opacity-50 line-through' : 'text-current'
            }`}
          >
            <TypeIcon size={15} className="shrink-0 mt-[2px] opacity-80" />
            <span className="break-words line-clamp-2">{task.title}</span>
          </h4>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="opacity-75 text-xs line-clamp-2 leading-relaxed font-medium pl-[26px] mt-1 relative z-10">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-[26px] mt-2.5 relative z-10">
          {task.tags.map((tag, idx) => {
            if (idx > 2) return null;
            return (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded border border-current/20 bg-current/5 font-bold tracking-wider uppercase whitespace-nowrap opacity-90"
              >
                {tag}
              </span>
            );
          })}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-transparent bg-transparent opacity-70 font-bold whitespace-nowrap">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-2.5 mt-3 text-[11px] font-bold pl-[26px] opacity-90 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {task.project && (
            <span className="flex items-center gap-1 text-[10px] bg-current/10 px-2 py-0.5 border border-current/20 rounded truncate max-w-[100px]">
              <Folder size={11} className="shrink-0 opacity-80" />
              <span className="truncate">{task.project}</span>
            </span>
          )}
          
          {task.startTime && task.endTime ? (
            <span className="flex items-center gap-1 text-[10px] bg-current/5 px-2 py-0.5 border border-current/20 rounded whitespace-nowrap">
              <Clock size={11} className="shrink-0 opacity-80" />
              <span>{formatTime12h(task.startTime)}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] opacity-70 whitespace-nowrap">
              <Clock size={11} className="shrink-0" />
              <span>{task.estimatedDuration}m</span>
            </span>
          )}
        </div>

        <span
          className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap shrink-0 ${priorityStyle.text} ${priorityStyle.bg} ${priorityStyle.border}`}
        >
          {priorityStyle.label}
        </span>
      </div>

      {/* Restore to Today Button (Visible for Past Uncompleted Tasks) */}
      {showRestore && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pl-[26px] relative z-10"
        >
          <button
            onClick={handleRestoreToToday}
            className="w-full group/btn flex items-center justify-between gap-2 bg-current/10 hover:bg-current/20 border border-current/20 transition-all duration-300 py-2 px-3 rounded-lg text-xs font-bold"
          >
            <span className="flex items-center gap-1.5 opacity-90">
              <RotateCcw size={13} className="group-hover/btn:-rotate-45 transition-transform duration-300" />
              RESTORE TO TODAY
            </span>
            <span className="text-[9px] uppercase tracking-widest opacity-60 font-mono">
              from {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
