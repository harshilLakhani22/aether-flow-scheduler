import { Task } from '@/types';

// Convert "HH:MM" (24-hour) to minutes since midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

// Convert minutes since midnight to "HH:MM" (24-hour)
export function minutesToTime(minutes: number): string {
  const normMin = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(normMin / 60);
  const mins = normMin % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Convert "HH:MM" to elegant "h:mm A" (e.g. 14:30 -> 2:30 PM)
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Calculate duration in minutes between two time strings
export function calculateDuration(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (endMin < startMin) {
    // Over midnight support, or invalid
    return 1440 - startMin + endMin;
  }
  return endMin - startMin;
}

// Check if two time slots overlap
export function isOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export interface PositionedTask {
  task: Task;
  left: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  hasConflict: boolean;
}

/**
 * Advanced Calendar Layout Algorithm
 * Distributes overlapping scheduled tasks across vertical columns
 */
export function getPositionedTasks(tasks: Task[]): PositionedTask[] {
  // 1. Filter out unscheduled tasks and sort by start time, then duration descending
  const scheduled = tasks
    .filter((t) => t.startTime && t.endTime)
    .sort((a, b) => {
      const aStart = timeToMinutes(a.startTime!);
      const bStart = timeToMinutes(b.startTime!);
      if (aStart !== bStart) return aStart - bStart;
      
      const aDur = calculateDuration(a.startTime!, a.endTime!);
      const bDur = calculateDuration(b.startTime!, b.endTime!);
      return bDur - aDur;
    });

  if (scheduled.length === 0) return [];

  // Helper to check if two scheduled tasks overlap
  const overlap = (t1: Task, t2: Task) => {
    return isOverlapping(t1.startTime!, t1.endTime!, t2.startTime!, t2.endTime!);
  };

  // Find conflicts (any task that overlaps with any other task)
  const conflictsMap = new Map<string, boolean>();
  for (let i = 0; i < scheduled.length; i++) {
    let hasConf = false;
    for (let j = 0; j < scheduled.length; j++) {
      if (i !== j && overlap(scheduled[i], scheduled[j])) {
        hasConf = true;
        break;
      }
    }
    conflictsMap.set(scheduled[i].id, hasConf);
  }

  // 2. Partition tasks into independent visual groups (where tasks overlap directly or transitively)
  const groups: Task[][] = [];
  let currentGroup: Task[] = [];
  let groupEndTime = 0;

  for (const task of scheduled) {
    const startMin = timeToMinutes(task.startTime!);
    const endMin = timeToMinutes(task.endTime!);

    if (currentGroup.length === 0) {
      currentGroup.push(task);
      groupEndTime = endMin;
    } else if (startMin < groupEndTime) {
      currentGroup.push(task);
      groupEndTime = Math.max(groupEndTime, endMin);
    } else {
      groups.push(currentGroup);
      currentGroup = [task];
      groupEndTime = endMin;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const results: PositionedTask[] = [];

  // 3. For each group, allocate tasks to vertical sub-columns
  for (const group of groups) {
    const columns: Task[][] = [];

    for (const task of group) {
      let colIdx = 0;
      // Find the first column where this task doesn't overlap with existing placed tasks
      while (colIdx < columns.length) {
        const hasOverlapInCol = columns[colIdx].some((placedTask) =>
          overlap(placedTask, task)
        );
        if (!hasOverlapInCol) {
          break;
        }
        colIdx++;
      }

      if (colIdx >= columns.length) {
        columns.push([]);
      }
      columns[colIdx].push(task);
    }

    const totalCols = columns.length;

    // Generate positioning information based on column assignments
    for (let colIdx = 0; colIdx < totalCols; colIdx++) {
      for (const task of columns[colIdx]) {
        results.push({
          task,
          left: (colIdx * 100) / totalCols,
          width: 100 / totalCols,
          hasConflict: conflictsMap.get(task.id) || false,
        });
      }
    }
  }

  return results;
}

// Generate an array of 24 hours, e.g., 0 to 23
export function getHoursArray(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

// Returns the display name of a hour (e.g. 0 -> 12 AM, 12 -> 12 PM, 13 -> 1 PM)
export function getHourLabel(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${ampm}`;
}
