'use client';

import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Tag, Folder, Trash2, 
  Copy, Check, AlertTriangle, AlertCircle, 
  Sparkles, Square,
  Target, Monitor, Users, Briefcase, Megaphone, Leaf, Flame
} from 'lucide-react';
import { selectedTaskAtom, isTaskModalOpenAtom, tasksAtom } from '@/atoms';
import { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { calculateDuration, timeToMinutes } from '@/utils/time';

const PRIORITIES: { value: TaskPriority; label: string; color: string; bg: string }[] = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border/60' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' },
  { value: 'high', label: 'High', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30' },
];

const STATUSES: { value: TaskStatus; label: string; bg: string }[] = [
  { value: 'not_started', label: 'Not Started', bg: 'bg-muted border-border text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', bg: 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400' },

  { value: 'done', label: 'Done', bg: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' },
];

const TYPES: { value: TaskType; label: string; icon: React.ElementType }[] = [
  { value: 'focus', label: 'Focused Work', icon: Target },
  { value: 'deep_work', label: 'Deep Work', icon: Monitor },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'admin', label: 'Admin Work', icon: Briefcase },
  { value: 'outreach', label: 'Outreach', icon: Megaphone },
  { value: 'personal', label: 'Personal', icon: Leaf },
  { value: 'urgent', label: 'Urgent Fix', icon: Flame },
];

const COLORS = [
  { name: 'indigo', hex: '#6366f1' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'rose', hex: '#f43f5e' },
  { name: 'sky', hex: '#0ea5e9' },
  { name: 'violet', hex: '#8b5cf6' },
];

export default function TaskDrawer() {
  const [selectedTask, setSelectedTask] = useAtom(selectedTaskAtom);
  const [isOpen, setIsOpen] = useAtom(isTaskModalOpenAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('focus');
  const [color, setColor] = useState('indigo');
  const [project, setProject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [tagsInput, setTagsInput] = useState('');
  const [completed, setCompleted] = useState(false);
  
  const [hasConflict, setHasConflict] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (selectedTask) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTitle(selectedTask.title);
      setDescription(selectedTask.description);
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setType(selectedTask.type);
      setColor(selectedTask.color || 'indigo');
      setProject(selectedTask.project);
      setDate(selectedTask.date);
      setStartTime(selectedTask.startTime || '');
      setEndTime(selectedTask.endTime || '');
      setEstimatedDuration(selectedTask.estimatedDuration || 60);
      setTagsInput(selectedTask.tags.join(', '));
      setCompleted(selectedTask.completed);
      setTimeError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [selectedTask]);

  useEffect(() => {
    if (!startTime || !endTime) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setHasConflict(false);
      setTimeError('');
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      setTimeError('End time must be after start time');
      setHasConflict(false);
      return;
    }

    setTimeError('');

    if (selectedTask) {
      const otherTasks = tasks.filter(
        (t) => t.id !== selectedTask.id && t.date === date && t.startTime && t.endTime
      );
      
      const conflict = otherTasks.some((t) => {
        const tStart = timeToMinutes(t.startTime!);
        const tEnd = timeToMinutes(t.endTime!);
        return startMin < tEnd && endMin > tStart;
      });
      setHasConflict(conflict);
    }
  }, [startTime, endTime, date, tasks, selectedTask]);

  if (!selectedTask) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    let finalStart = startTime || undefined;
    let finalEnd = endTime || undefined;
    let computedDuration = undefined;

    if (startTime && endTime && !timeError) {
      finalStart = startTime;
      finalEnd = endTime;
      computedDuration = calculateDuration(startTime, endTime);
    } else {
      finalStart = undefined;
      finalEnd = undefined;
    }

    const updatedTask: Task = {
      ...selectedTask,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      type,
      color,
      project: project.trim() || 'General',
      date,
      startTime: finalStart,
      endTime: finalEnd,
      duration: computedDuration,
      estimatedDuration: computedDuration || estimatedDuration,
      completed,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      updatedAt: new Date().toISOString(),
    };

    setTasks(tasks.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter((t) => t.id !== selectedTask.id));
      setIsOpen(false);
      setSelectedTask(null);
    }
  };

  const handleDuplicate = () => {
    const duplicatedTask: Task = {
      ...selectedTask,
      id: `task-dup-${Date.now()}`,
      title: `${title} (Copy)`,
      completed: false,
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, duplicatedTask]);
    setIsOpen(false);
    setSelectedTask(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 backdrop-blur-sm transition-all"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-popover/95 backdrop-blur-xl border-l border-border z-50 shadow-2xl flex flex-col text-foreground"
          >
            {/* Header controls */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-l from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCompleted(!completed)}
                  className={`p-2 rounded-xl border transition-all duration-300 ${
                    completed
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                      : 'bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title={completed ? 'Mark Incomplete' : 'Mark Complete'}
                >
                  {completed ? <Check size={18} strokeWidth={3} /> : <Square size={18} />}
                </button>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {completed ? 'Completed' : 'Active Task'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDuplicate}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                  title="Duplicate Task"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
                <div className="h-5 w-px bg-border/80 mx-1.5" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable details form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
              {hasConflict && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400 text-sm shadow-inner">
                  <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold">Schedule Conflict:</span> This task overlaps with another scheduled event on this day.
                  </div>
                </motion.div>
              )}

              {timeError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex gap-3 text-rose-600 dark:text-rose-400 text-sm shadow-inner">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold">Time Validation:</span> {timeError}
                  </div>
                </motion.div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full bg-transparent border-0 text-2xl font-extrabold text-foreground placeholder-muted-foreground/40 focus:ring-0 focus:outline-none py-1 border-b-2 border-transparent hover:border-border/50 focus:border-primary transition-colors tracking-tight"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, links, or instructions..."
                  rows={4}
                  className="w-full bg-background/50 border border-border/80 rounded-xl p-4 text-sm text-foreground placeholder-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 resize-none shadow-sm"
                />
              </div>

              {/* Status and Priority Grids */}
              <div className="grid grid-cols-2 gap-5 border-y border-border/50 py-5">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 block">Status</label>
                  <div className="flex flex-col gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStatus(s.value)}
                        className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border ${
                          status === s.value
                            ? `${s.bg} border-current shadow-sm scale-[1.02]`
                            : 'bg-muted/30 border-transparent hover:border-border text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 block">Priority</label>
                  <div className="flex flex-col gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`text-left px-4 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border ${
                          priority === p.value
                            ? `${p.bg} ${p.color} border-current shadow-sm scale-[1.02]`
                            : 'bg-muted/30 border-transparent hover:border-border text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Type Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 block">Task Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                        type === t.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                          : 'bg-background border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <t.icon size={14} className={type === t.value ? 'opacity-100' : 'opacity-70'} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduling Details */}
              <div className="bg-gradient-to-br from-muted/40 to-muted/10 border border-border/60 rounded-2xl p-5 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock size={16} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Time Blocking & Planning</span>
                  </div>
                  {startTime && endTime && (
                    <span className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold">
                      Block: {calculateDuration(startTime, endTime)}m
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      <Calendar size={11} /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      <Sparkles size={11} /> Est. Duration (Min)
                    </label>
                    <input
                      type="number"
                      value={estimatedDuration}
                      min="5"
                      step="5"
                      onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50"
                      disabled={!!(startTime && endTime)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {startTime || endTime ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime('');
                      setEndTime('');
                    }}
                    className="w-full py-2 border border-dashed border-border/80 hover:border-rose-500/50 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 mt-2"
                  >
                    Clear Time (Move to Inbox)
                  </button>
                ) : (
                  <div className="text-[11px] text-muted-foreground/80 font-medium italic text-center bg-background/40 p-3 rounded-xl mt-2 border border-border/30">
                    Task is in the Unscheduled Inbox. Add times to place on timeline.
                  </div>
                )}
              </div>

              {/* Project and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <Folder size={12} /> Project
                  </label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g. Floris App"
                    className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <Tag size={12} /> Tags
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Design, Dev, Admin"
                    className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-1">Visual Color Identity</label>
                <div className="flex items-center gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center border-2 border-background shadow-md ${
                        color === c.name 
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover scale-110 shadow-lg' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {color === c.name && <Check size={14} className="text-white dark:text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-5 border-t border-border/50 bg-muted/20 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 bg-transparent border border-border/80 hover:bg-muted rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!!timeError}
                className="py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
