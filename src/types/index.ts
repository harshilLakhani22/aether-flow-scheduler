export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'focus' | 'admin' | 'meeting' | 'outreach' | 'deep_work' | 'personal' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  project: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM (24-hour)
  endTime?: string; // HH:MM (24-hour)
  duration?: number; // in minutes (calculated if startTime/endTime are present)
  estimatedDuration: number; // in minutes
  completed: boolean;
  color: string; // hex or Tailwind color class prefix (e.g. 'purple', 'emerald', etc.)
  type: TaskType;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'board' | 'timeline' | 'calendar' | 'list';

export interface TaskFilters {
  status: TaskStatus[];
  priority: TaskPriority[];
  tags: string[];
  project: string[];
  type: TaskType[];
  scheduled: 'all' | 'scheduled' | 'unscheduled';
}
