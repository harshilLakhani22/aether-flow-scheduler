'use client';

import React, { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { 
  isTaskCreateModalOpenAtom, tasksAtom, selectedDateAtom, 
  prefillTimeAtom 
} from '@/atoms';
import { Task, TaskPriority, TaskType } from '@/types';
import { timeToMinutes, minutesToTime } from '@/utils/time';
import { 
  X, Clock, Folder, Tag, AlertCircle, 
  Sparkles, Calendar, Target, Monitor, 
  Users, Briefcase, Megaphone, Leaf, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITIES: { value: TaskPriority; label: string; color: string; bg: string }[] = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
  { value: 'medium', label: 'Medium', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30' },
  { value: 'high', label: 'High', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30' },
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
  { name: 'fuchsia', hex: '#d946ef' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'lime', hex: '#84cc16' },
  { name: 'pink', hex: '#ec4899' },
];

export default function TaskCreateModal() {
  const [isOpen, setIsOpen] = useAtom(isTaskCreateModalOpenAtom);
  const [selectedDate] = useAtom(selectedDateAtom);
  const [prefillTime, setPrefillTime] = useAtom(prefillTimeAtom);
  const setTasks = useSetAtom(tasksAtom);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  const [type, setType] = useState<TaskType>('focus');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [color, setColor] = useState('indigo');
  
  // Date and Time fields
  const [date, setDate] = useState('2026-05-25');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);

  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTitle('');
      setDescription('');
      setProject('');
      setTagsInput('');
      setType('focus');
      setPriority('medium');
      setColor('indigo');
      setDate(selectedDate || '2026-05-25');
      
      if (prefillTime) {
        setStartTime(prefillTime);
        const startMin = timeToMinutes(prefillTime);
        const endMin = Math.min(1439, startMin + 60);
        setEndTime(minutesToTime(endMin));
        setEstimatedDuration(60);
      } else {
        setStartTime('');
        setEndTime('');
        setEstimatedDuration(60);
      }
      setTimeError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, selectedDate, prefillTime]);

  const handleClose = () => {
    setIsOpen(false);
    setPrefillTime(undefined);
  };



  const handleTypeChange = (newType: TaskType) => {
    setType(newType);
    if (newType === 'focus' || newType === 'deep_work') setColor('indigo');
    else if (newType === 'meeting') setColor('violet');
    else if (newType === 'admin') setColor('sky');
    else if (newType === 'outreach') setColor('amber');
    else if (newType === 'personal') setColor('emerald');
    else if (newType === 'urgent') setColor('rose');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeError) return;

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const calculatedDur = startTime && endTime 
      ? timeToMinutes(endTime) - timeToMinutes(startTime) 
      : estimatedDuration;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      project: project.trim() || 'General',
      type,
      priority,
      status: 'not_started',
      completed: false,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      duration: calculatedDur,
      estimatedDuration: calculatedDur,
      color,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => {
      const updated = [...prev, newTask];
      localStorage.setItem('task-tracker-tasks', JSON.stringify(updated));
      return updated;
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-all duration-300"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-foreground"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-muted/30 to-transparent">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2 tracking-tight">
              <Sparkles size={18} className="text-primary animate-pulse-subtle" />
              <span>Create New Task</span>
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6 max-h-[calc(100vh-140px)] custom-scrollbar">
            {timeError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex gap-3 text-rose-600 dark:text-rose-400 text-xs shadow-inner">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{timeError}</span>
              </motion.div>
            )}

            {/* Core Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are we planning to achieve?"
                  className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-3 text-base text-foreground font-medium shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Description & Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Checklists, links, or context..."
                  rows={2}
                  className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {/* Type & Priority Grids */}
            <div className="space-y-5 border-y border-border/50 py-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Task Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleTypeChange(t.value as TaskType)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 border ${
                        type === t.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                          : 'bg-muted/30 border-transparent hover:border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <t.icon size={14} className={type === t.value ? 'opacity-100' : 'opacity-70'} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Priority Level</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value as TaskPriority)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border ${
                        priority === p.value
                          ? `${p.bg} ${p.color} border-current shadow-sm scale-[1.02]`
                          : 'bg-muted/30 border-transparent hover:border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Blocking Container */}
            <div className="bg-gradient-to-br from-muted/40 to-muted/10 border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary pb-2 border-b border-border/40">
                <Clock size={16} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Schedule Time Blocking</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1">
                    <Calendar size={11} /> Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1">
                    <Sparkles size={11} /> Est. Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={estimatedDuration}
                    min="5"
                    step="5"
                    onChange={(e) => {
                      const mins = Number(e.target.value);
                      setEstimatedDuration(mins);
                      if (startTime) {
                        const startMin = timeToMinutes(startTime);
                        const endMin = Math.min(1439, startMin + mins);
                        setEndTime(minutesToTime(endMin));
                        setTimeError(null);
                      }
                    }}
                    className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Start Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setStartTime(newStart);
                        if (newStart && estimatedDuration) {
                          const startMin = timeToMinutes(newStart);
                          const endMin = Math.min(1439, startMin + estimatedDuration);
                          setEndTime(minutesToTime(endMin));
                          setTimeError(null);
                        }
                      }}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">End Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        setEndTime(newEnd);
                        if (startTime && newEnd) {
                          const startMin = timeToMinutes(startTime);
                          const endMin = timeToMinutes(newEnd);
                          if (endMin > startMin) {
                            setEstimatedDuration(endMin - startMin);
                            setTimeError(null);
                          } else {
                            setTimeError('End time must occur after start time.');
                          }
                        } else {
                          setTimeError(null);
                        }
                      }}
                      className="w-full bg-background/80 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              {(!startTime || !endTime) && (
                <div className="text-[10px] text-muted-foreground/80 font-medium text-center italic mt-2">
                  Leave times empty to place task in the Unscheduled inbox.
                </div>
              )}
            </div>

            {/* Project & Tags */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                  <Folder size={12} /> Project <span className="opacity-60 normal-case font-medium ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Floris App"
                  className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                  <Tag size={12} /> Tags <span className="opacity-60 normal-case font-medium ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Design, Dev, Admin"
                  className="w-full bg-background/50 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Visual Color Picker */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-1">Visual Color Identity</label>
              <div className="flex items-center gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center shadow-md border-2 border-background ${
                      color === c.name 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg' 
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {color === c.name && <span className="text-white dark:text-black font-extrabold drop-shadow-sm">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 mt-2 flex items-center justify-end gap-3 bg-transparent">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-5 border border-border/80 hover:bg-muted/80 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!timeError}
                className="py-2.5 px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Task
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
