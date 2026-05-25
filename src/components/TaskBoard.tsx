'use client';

import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Plus, HelpCircle, Flame, CheckCircle, Ban, Hourglass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filteredTasksAtom, tasksAtom, isTaskCreateModalOpenAtom } from '@/atoms';
import { TaskStatus } from '@/types';
import TaskCard from './TaskCard';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
  borderGlow: string;
}

export default function TaskBoard() {
  const [filteredTasks] = useAtom(filteredTasksAtom);
  const [, setTasks] = useAtom(tasksAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);

  // Keep track of which column is currently a drag-over target
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const COLUMNS: Column[] = [
    {
      id: 'not_started',
      title: 'Not Started',
      color: 'text-zinc-600 dark:text-zinc-400 border-border bg-muted/10',
      icon: <Hourglass size={14} className="text-zinc-500" />,
      borderGlow: 'border-zinc-500 dark:border-zinc-700 bg-muted/20',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30 bg-indigo-500/5 dark:bg-indigo-950/5',
      icon: <Flame size={14} className="text-indigo-500" />,
      borderGlow: 'border-indigo-500 dark:border-indigo-850 bg-indigo-500/10 dark:bg-indigo-950/20',
    },

    {
      id: 'done',
      title: 'Done',
      color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-500/5 dark:bg-emerald-950/5',
      icon: <CheckCircle size={14} className="text-emerald-500" />,
      borderGlow: 'border-emerald-500 dark:border-emerald-850 bg-emerald-500/10 dark:bg-emerald-950/20',
    },
  ];

  // HTML5 Drop Event Handler
  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Find and update the task's status
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          // If task is completed and moved to "done", set completed: true.
          // If moved away from "done", set completed: false.
          const isDone = columnId === 'done';
          return {
            ...t,
            status: columnId,
            completed: isDone,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(columnId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const getColTasks = (colId: TaskStatus) => {
    return filteredTasks.filter((t) => t.status === colId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-full overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const colTasks = getColTasks(column.id);
        const isTarget = dragOverCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col h-full min-h-[500px] rounded-xl border border-dashed p-4 transition-all duration-300 ${
              isTarget ? column.borderGlow : 'border-border bg-card/30'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-muted border border-border">
                  {column.icon}
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {column.title}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold border border-border">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Add task to this state"
              >
                <Plus size={14} />
              </button>
            </div>
 
            {/* Draggable Cards Stack */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
              <AnimatePresence>
                {colTasks.length > 0 ? (
                  colTasks.map((task) => <TaskCard key={task.id} task={task} />)
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border/60 bg-background/30 rounded-xl text-muted-foreground text-center select-none h-40"
                  >
                    <HelpCircle size={20} className="stroke-[1.5] mb-2 opacity-40" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Empty State</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Drag here to update</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
