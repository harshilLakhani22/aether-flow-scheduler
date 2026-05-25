'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { filtersAtom, allTagsAtom, allProjectsAtom, initialFilters } from '@/atoms';
import { 
  SlidersHorizontal, X, Check, ChevronDown 
} from 'lucide-react';
import { TaskPriority, TaskStatus } from '@/types';

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-600 dark:text-rose-450' },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Completed' },
];

export default function FiltersPanel() {
  const [filters, setFilters] = useAtom(filtersAtom);
  const [allTags] = useAtom(allTagsAtom);
  const [allProjects] = useAtom(allProjectsAtom);

  const [isOpen, setIsOpen] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.tags.length > 0 ||
    filters.project.length > 0 ||
    filters.type.length > 0 ||
    filters.scheduled !== 'all';

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const toggleStatusFilter = (status: TaskStatus) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const toggleProjectFilter = (project: string) => {
    setFilters((prev) => ({
      ...prev,
      project: prev.project.includes(project)
        ? prev.project.filter((p) => p !== project)
        : [...prev.project, project],
    }));
  };

  const toggleTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const setScheduledFilter = (type: 'all' | 'scheduled' | 'unscheduled') => {
    setFilters((prev) => ({
      ...prev,
      scheduled: type,
    }));
  };

  return (
    <div className="space-y-3 shrink-0 select-none text-foreground">
      {/* 1. Header trigger button & Active filters display */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors ${
              isOpen || hasActiveFilters
                ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick toggle for Schedule type */}
          <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
            <button
              onClick={() => setScheduledFilter('all')}
              className={`py-1 px-2.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                filters.scheduled === 'all'
                  ? 'bg-muted text-primary border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setScheduledFilter('scheduled')}
              className={`py-1 px-2.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                filters.scheduled === 'scheduled'
                  ? 'bg-muted text-primary border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Time-Blocked
            </button>
            <button
              onClick={() => setScheduledFilter('unscheduled')}
              className={`py-1 px-2.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                filters.scheduled === 'unscheduled'
                  ? 'bg-muted text-primary border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inbox Items
            </button>
          </div>

          {/* Visual Indicators of active filter count */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-950/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              <X size={10} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Expanded filter dashboard */}
      {isOpen && (
        <div className="p-4 rounded-xl border border-border bg-card/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse-subtle/5">
          {/* Status filters */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Filter by Status
            </span>
            <div className="flex flex-col gap-1.5">
              {STATUSES.map((s) => {
                const isActive = filters.status.includes(s.value);
                return (
                  <button
                    key={s.value}
                    onClick={() => toggleStatusFilter(s.value)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isActive && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority filters */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Filter by Priority
            </span>
            <div className="flex flex-col gap-1.5">
              {PRIORITIES.map((p) => {
                const isActive = filters.priority.includes(p.value);
                return (
                  <button
                    key={p.value}
                    onClick={() => togglePriorityFilter(p.value)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={p.color}>{p.label} Priority</span>
                    {isActive && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project filters */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Filter by Project
            </span>
            <div className="flex flex-col gap-1.5 max-h-[145px] overflow-y-auto pr-1">
              {allProjects.length > 0 ? (
                allProjects.map((p) => {
                  const isActive = filters.project.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => toggleProjectFilter(p)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{p}</span>
                      {isActive && <Check size={11} />}
                    </button>
                  );
                })
              ) : (
                <span className="text-[10px] text-muted-foreground/60 italic">No active projects</span>
              )}
            </div>
          </div>

          {/* Tags filters */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Filter by Tag
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[145px] overflow-y-auto pr-1">
              {allTags.length > 0 ? (
                allTags.map((t) => {
                  const isActive = filters.tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTagFilter(t)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all ${
                        isActive
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })
              ) : (
                <span className="text-[10px] text-muted-foreground/60 italic">No tags loaded</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
