import { atom } from 'jotai';
import { Task, TaskFilters, ViewType } from '@/types';
import { MOCK_TASKS } from '@/utils/mockData';

// Selected date string (YYYY-MM-DD)
export const selectedDateAtom = atom<string>('2026-05-25');

// Main tasks list atom (initialized with empty array for SSR safety, hydrated on client)
export const tasksAtom = atom<Task[]>([]);

// Syncing state helper (to check if tasks are loaded from localStorage)
export const isLoadedAtom = atom<boolean>(false);

// Active dashboard view
export const currentViewAtom = atom<ViewType>('timeline');

// Theme state ('light' | 'dark')
export const themeAtom = atom<'dark' | 'light'>('light');

// Sidebar expansion state
export const sidebarOpenAtom = atom<boolean>(true);

// Modal/Drawer details state
export const selectedTaskAtom = atom<Task | null>(null);
export const isTaskModalOpenAtom = atom<boolean>(false);
export const isTaskCreateModalOpenAtom = atom<boolean>(false);
export const prefillTimeAtom = atom<string | undefined>(undefined); // prefill startTime for quick timeline slots

// Search queries
export const searchQueryAtom = atom<string>('');

// Initial filters state
export const initialFilters: TaskFilters = {
  status: [],
  priority: [],
  tags: [],
  project: [],
  type: [],
  scheduled: 'all',
};

// Filters atom
export const filtersAtom = atom<TaskFilters>(initialFilters);

// Derived atom for filtered tasks
export const filteredTasksAtom = atom<Task[]>((get) => {
  const tasks = get(tasksAtom);
  const selectedDate = get(selectedDateAtom);
  const search = get(searchQueryAtom).toLowerCase().trim();
  const filters = get(filtersAtom);

  return tasks.filter((task) => {
    // 1. Date Filter (only filter tasks if they have a date - they all should)
    if (task.date !== selectedDate) return false;

    // 2. Search query filter
    if (search) {
      const matchTitle = task.title.toLowerCase().includes(search);
      const matchDesc = task.description.toLowerCase().includes(search);
      const matchProject = task.project.toLowerCase().includes(search);
      const matchTags = task.tags.some(t => t.toLowerCase().includes(search));
      if (!matchTitle && !matchDesc && !matchProject && !matchTags) {
        return false;
      }
    }

    // 3. Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }

    // 4. Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }

    // 5. Project filter
    if (filters.project.length > 0 && !filters.project.includes(task.project)) {
      return false;
    }

    // 6. Type filter
    if (filters.type.length > 0 && !filters.type.includes(task.type)) {
      return false;
    }

    // 7. Scheduled/Unscheduled filter
    if (filters.scheduled !== 'all') {
      const isScheduled = !!(task.startTime && task.endTime);
      if (filters.scheduled === 'scheduled' && !isScheduled) return false;
      if (filters.scheduled === 'unscheduled' && isScheduled) return false;
    }

    return true;
  });
});

// Derived atom to extract all unique tags from all tasks
export const allTagsAtom = atom<string[]>((get) => {
  const tasks = get(tasksAtom);
  const tagsSet = new Set<string>();
  tasks.forEach((t) => t.tags.forEach((tag) => tagsSet.add(tag)));
  return Array.from(tagsSet);
});

// Derived atom to extract all unique projects
export const allProjectsAtom = atom<string[]>((get) => {
  const tasks = get(tasksAtom);
  const projectsSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.project) projectsSet.add(t.project);
  });
  return Array.from(projectsSet);
});
