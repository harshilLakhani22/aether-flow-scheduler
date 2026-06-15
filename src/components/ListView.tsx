'use client';

import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { filteredTasksAtom, tasksAtom, selectedTaskAtom, isTaskModalOpenAtom } from '@/atoms';
import { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { taskService } from '@/lib/taskService';
import { 
  ArrowUpDown, Clock, Folder, Trash2, Copy, 
  HelpCircle, CheckSquare, Square, Eye, Sparkles 
} from 'lucide-react';
import { formatTime12h } from '@/utils/time';

type SortKey = 'title' | 'project' | 'status' | 'priority' | 'duration' | 'type';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

const TYPE_LABELS: Record<TaskType, string> = {
  focus: '🎯 Focused Work',
  deep_work: '💻 Deep Work',
  meeting: '🤝 Meeting',
  admin: '📁 Admin Work',
  outreach: '📣 Outreach',
  personal: '🌿 Personal',
  urgent: '🚨 Urgent Fix',
};

export default function ListView() {
  const [filteredTasks] = useAtom(filteredTasksAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  const setSelectedTask = useSetAtom(selectedTaskAtom);
  const setIsDrawerOpen = useSetAtom(isTaskModalOpenAtom);

  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    await taskService.updateTask(task.id, {
      completed: !task.completed,
      status: !task.completed ? 'done' : 'not_started'
    });
  };

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      await taskService.deleteTask(taskId);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const duplicated: Task = {
      ...task,
      id: `task-dup-${Date.now()}`,
      title: `${task.title} (Copy)`,
      completed: false,
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await taskService.addTask(duplicated);
  };

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    if (sortKey === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortKey === 'project') {
      comparison = a.project.localeCompare(b.project);
    } else if (sortKey === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortKey === 'type') {
      comparison = a.type.localeCompare(b.type);
    } else if (sortKey === 'duration') {
      const aDur = a.duration || a.estimatedDuration || 0;
      const bDur = b.duration || b.estimatedDuration || 0;
      comparison = aDur - bDur;
    } else if (sortKey === 'priority') {
      const priorityWeights: Record<TaskPriority, number> = {
        low: 1,
        medium: 2,
        high: 3,
        urgent: 4,
      };
      comparison = priorityWeights[a.priority] - priorityWeights[b.priority];
    }

    return sortAsc ? comparison : -comparison;
  });

  const getPriorityBadgeColor = (p: TaskPriority) => {
    switch (p) {
      case 'low': return 'text-muted-foreground bg-muted border-border';
      case 'medium': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
      case 'high': return 'text-indigo-755 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30';
      case 'urgent': return 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 priority-urgent-glow';
    }
  };

  const getStatusBadgeColor = (s: TaskStatus) => {
    switch (s) {
      case 'not_started': return 'text-muted-foreground bg-muted border-border';
      case 'in_progress': return 'text-indigo-755 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30';
      case 'blocked': return 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30';
      case 'done': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30';
    }
  };

  return (
    <div className="glass-panel border border-border rounded-xl flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-210px)] overflow-hidden bg-card text-foreground">
      {/* Sub-header info */}
      <div className="p-3.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span>Active Tasks Database ({sortedTasks.length} items matched)</span>
        </div>
      </div>

      {/* Table grid wrapper */}
      <div className="flex-1 overflow-auto">
        {sortedTasks.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs select-none min-w-[800px]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-popover z-10 border-b border-border shadow-xs uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th className="py-3.5 px-3 cursor-pointer hover:bg-muted transition-colors" onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-1.5">
                    <span>Task Title</span>
                    <ArrowUpDown size={11} className="text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3.5 px-3 cursor-pointer hover:bg-muted transition-colors w-[150px]" onClick={() => toggleSort('project')}>
                  <div className="flex items-center gap-1.5">
                    <span>Project</span>
                    <ArrowUpDown size={11} className="text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3.5 px-3 cursor-pointer hover:bg-muted transition-colors w-[130px]" onClick={() => toggleSort('type')}>
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    <ArrowUpDown size={11} className="text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3.5 px-3 cursor-pointer hover:bg-muted transition-colors w-[100px]" onClick={() => toggleSort('priority')}>
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown size={11} className="text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3.5 px-3 cursor-pointer hover:bg-muted transition-colors w-[120px]" onClick={() => toggleSort('duration')}>
                  <div className="flex items-center gap-1.5">
                    <span>Planned Time</span>
                    <ArrowUpDown size={11} className="text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-28 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border bg-transparent">
              {sortedTasks.map((task) => {
                const isScheduled = !!(task.startTime && task.endTime);
                const duration = task.duration || task.estimatedDuration || 60;

                return (
                  <tr
                    key={task.id}
                    onClick={() => handleRowClick(task)}
                    className="hover:bg-muted/40 group cursor-pointer border-border transition-colors"
                  >
                    {/* 1. Completeness Check */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleComplete(e, task)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none inline-flex items-center justify-center"
                      >
                        {task.completed ? (
                          <CheckSquare size={15} className="text-emerald-500 stroke-[2.5]" />
                        ) : (
                          <Square size={15} className="text-muted-foreground/60 hover:text-foreground" />
                        )}
                      </button>
                    </td>

                    {/* 2. Task Title */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold text-foreground tracking-wide text-xs leading-normal truncate group-hover:text-primary transition-colors ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 max-w-[400px]">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Project */}
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-[10px] text-primary bg-muted px-2 py-0.5 border border-border rounded font-medium max-w-[130px] truncate w-fit">
                        <Folder size={10} />
                        <span>{task.project}</span>
                      </span>
                    </td>

                    {/* 4. Type */}
                    <td className="py-3 px-3">
                      <span className="text-foreground font-semibold truncate max-w-[120px] block">
                        {TYPE_LABELS[task.type] || task.type}
                      </span>
                    </td>

                    {/* 5. Priority */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeColor(task.priority)}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>

                    {/* 6. Planned Time */}
                    <td className="py-3 px-3">
                      {isScheduled ? (
                        <div className="flex flex-col text-[10px] text-muted-foreground gap-0.5">
                          <span className="font-semibold">{formatTime12h(task.startTime)} - {formatTime12h(task.endTime)}</span>
                          <span className="text-[9px] text-muted-foreground/80 font-medium">Block ({duration}m)</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium">
                          <Clock size={10} />
                          <span>{duration}m estimated</span>
                        </span>
                      )}
                    </td>

                    {/* 7. Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRowClick(task)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(e, task)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, task.id)}
                          className="p-1 hover:bg-rose-500/10 rounded text-rose-500 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-border rounded-xl text-muted-foreground text-center select-none">
            <HelpCircle size={32} className="stroke-[1.2] mb-3 text-muted-foreground animate-pulse-subtle" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-foreground">No database records found</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
              No tasks match your selected query or active filters. Try adjusting them!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
