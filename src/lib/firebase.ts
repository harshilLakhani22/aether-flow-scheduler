import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA5UgOLHDmhtwxY7_u35DRamxD8-dg16Jg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "taskpad-4944a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "taskpad-4944a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "taskpad-4944a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "744929744591",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:744929744591:web:88785457bbb4be5a8609ba",
  measurementId: "G-H7YRKBHJDM",
};

// Initialize Firebase only if config is provided to avoid crashing before setup
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Attempt to enable offline persistence (optional, fails gracefully in some browsers/incognito)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
} catch (e) {
  // Ignore
}

export { app, db };
