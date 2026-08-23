'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, CheckCircle, Target, Loader2 } from 'lucide-react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setError(
        'Firebase configuration is missing. Please add NEXT_PUBLIC_FIREBASE_* environment variables in Vercel Settings -> Environment Variables.'
      );
      return;
    }
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Error signing in with Google:', err);

      if (err.code === 'auth/popup-blocked') {
        // Automatically attempt redirect flow when popups are blocked by the browser
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          setError(
            'Pop-up was blocked by your browser. Please click the pop-up icon in your address bar to allow pop-ups for this site, or try again.'
          );
        }
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setError(
          `Domain "${currentDomain}" is not authorized. Please add it to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please click "Continue with Google" to log in.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-rose-500/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 w-full max-w-md"
      >
        <div className="glass-panel border border-border/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/20 flex flex-col items-center text-center backdrop-blur-xl bg-card/60">
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6"
          >
            <CheckCircle className="text-white" size={32} strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">TaskPad</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-10 max-w-[280px]">
            Organize your life, manage your time, and accomplish more everyday.
          </p>

          <div className="w-full space-y-4 mb-10">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <Calendar className="text-indigo-400" size={18} />
              <span>Smart scheduling & timeline</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <Target className="text-rose-400" size={18} />
              <span>Prioritize what matters</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <Sparkles className="text-emerald-400" size={18} />
              <span>Cloud synced across all devices</span>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-6 text-left"
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="relative w-full group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center gap-3 bg-slate-950 px-6 py-3.5 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
              {isLoading ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-semibold text-white tracking-wide group-hover:text-white transition-colors duration-300">
                    Continue with Google
                  </span>
                </>
              )}
            </div>
          </button>
          
          <p className="text-[10px] text-muted-foreground mt-6 max-w-[240px]">
            By continuing, you agree to secure your private tasks with your Google account.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
