import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '@/types';

import { auth } from './firebase';

const getUserId = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User must be authenticated to access tasks");
  return uid;
};

const getTasksCollectionPath = () => `users/${getUserId()}/tasks`;

export const taskService = {
  /**
   * Subscribes to all tasks for the logged-in user and fires the callback whenever data changes.
   */
  subscribeToTasks: (userId: string, callback: (tasks: Task[]) => void) => {
    // using explicit userId from AppShell to ensure it's available during mount
    const q = query(collection(db, `users/${userId}/tasks`));
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
    const docRef = doc(collection(db, getTasksCollectionPath()), task.id);
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
    const docRef = doc(db, getTasksCollectionPath(), taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Deletes a task from the database.
   */
  deleteTask: async (taskId: string) => {
    const docRef = doc(db, getTasksCollectionPath(), taskId);
    await deleteDoc(docRef);
  },

  /**
   * Updates multiple tasks in a single batch.
   */
  updateMultipleTasks: async (tasks: Task[]) => {
    const batch = writeBatch(db);
    const path = getTasksCollectionPath();
    tasks.forEach(task => {
      const docRef = doc(db, path, task.id);
      batch.set(docRef, { ...task, updatedAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
  }
};
