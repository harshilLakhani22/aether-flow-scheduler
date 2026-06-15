'use client';

import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Plus, HelpCircle, Flame, CheckCircle, Ban, Hourglass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filteredTasksAtom, tasksAtom, isTaskCreateModalOpenAtom } from '@/atoms';
import { TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import TimelineMinimap from './TimelineMinimap';
import { taskService } from '@/lib/taskService';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
  borderGlow: string;
}

export default function TaskBoard() {
  const [filteredTasks] = useAtom(filteredTasksAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  const setIsCreateOpen = useSetAtom(isTaskCreateModalOpenAtom);

  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

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

  // HTML5 Drop Event Handler (Column level - appends to end)
  const handleDropColumn = async (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDragOverTaskId(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    await taskService.updateTask(taskId, {
      status: columnId,
      completed: columnId === 'done',
    });
  };

  // HTML5 Drop Event Handler (Task level - inserts before target)
  const handleDropTask = (e: React.DragEvent, targetTaskId: string, columnId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation(); // prevent column drop
    setDragOverCol(null);
    setDragOverTaskId(null);
    
    const draggedTaskId = e.dataTransfer.getData('text/plain');
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    taskService.updateTask(draggedTaskId, {
      status: columnId,
      completed: columnId === 'done',
    });
  };

  const handleDragOverColumn = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(columnId);
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation(); // prevent column highlight
    setDragOverTaskId(taskId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
    setDragOverTaskId(null);
  };

  const getColTasks = (colId: TaskStatus) => {
    return filteredTasks.filter((t) => t.status === colId);
  };

  return (
    <div className="flex flex-col h-full gap-5 overflow-hidden">
      <div className="glass-panel border border-border rounded-xl overflow-hidden shrink-0">
        <TimelineMinimap className="border-b-0 bg-transparent" />
      </div>
      
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-x-auto pb-4 snap-x snap-mandatory px-4 md:px-0">
        {COLUMNS.map((column) => {
        const colTasks = getColTasks(column.id);
        const isTarget = dragOverCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOverColumn(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropColumn(e, column.id)}
            className={`flex flex-col h-[calc(100vh-250px)] md:h-full md:min-h-[500px] w-[85vw] md:w-auto shrink-0 snap-center rounded-xl border border-dashed p-4 transition-all duration-300 ${
              isTarget ? column.borderGlow : 'border-border bg-card/30'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 shrink-0 pointer-events-none">
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
                onClick={(e) => { e.stopPropagation(); setIsCreateOpen(true); }}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
                title="Add task to this state"
              >
                <Plus size={14} />
              </button>
            </div>
 
            {/* Draggable Cards Stack */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
              <AnimatePresence>
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onDragOver={(e) => handleDragOverTask(e, task.id)}
                      onDrop={(e) => handleDropTask(e, task.id, column.id)}
                      className={`transition-all duration-200 rounded-xl ${
                        dragOverTaskId === task.id ? 'mt-12 pt-2 border-t-2 border-primary/50' : ''
                      }`}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border/60 bg-background/30 rounded-xl text-muted-foreground text-center select-none h-40 pointer-events-none"
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
    </div>
  );
}
