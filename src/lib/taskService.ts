import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '@/types';

// We use a single global collection for this personal task tracker
const TASKS_COLLECTION = 'tasks';

export const taskService = {
  /**
   * Subscribes to all tasks in the database and fires the callback whenever data changes.
   * Returns an unsubscribe function to clean up the listener.
   */
  subscribeToTasks: (callback: (tasks: Task[]) => void) => {
    const q = query(collection(db, TASKS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((doc) => {
        tasks.push(doc.data() as Task);
      });
      callback(tasks);
    });
  },

  /**
   * Adds a new task to the database.
   */
  addTask: async (task: Task) => {
    const docRef = doc(collection(db, TASKS_COLLECTION), task.id);
    await setDoc(docRef, {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Updates an existing task with partial data.
   */
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Deletes a task from the database.
   */
  deleteTask: async (taskId: string) => {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(docRef);
  },

  /**
   * Updates multiple tasks in a single batch (e.g., for drag-and-drop reordering).
   */
  updateMultipleTasks: async (tasks: Task[]) => {
    const batch = writeBatch(db);
    tasks.forEach(task => {
      const docRef = doc(db, TASKS_COLLECTION, task.id);
      batch.set(docRef, { ...task, updatedAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
  }
};
