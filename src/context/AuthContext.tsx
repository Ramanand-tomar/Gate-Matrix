'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase/client';
import { UserProfile, UserRole } from '@/lib/rbac';
import { Laptop, ShieldAlert, X, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  activeSessionId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  activeSessionId: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Single-device session conflict modal state
  const [sessionConflictOpen, setSessionConflictOpen] = useState(false);

  // Keep a ref to the current local session ID for synchronous comparison
  const localSessionIdRef = useRef<string | null>(null);

  // Helper to generate a new device session ID
  const generateNewSessionId = () => {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Trigger logout when concurrent login on another device is detected
  const handleConcurrentLogout = useCallback(async () => {
    try {
      localStorage.removeItem('gate_device_session_id');
      localSessionIdRef.current = null;
      setActiveSessionId(null);
      await signOut(auth);
    } catch (err) {
      console.error('Error during concurrent session signout:', err);
    }
    setUser(null);
    setUserProfile(null);
    setSessionConflictOpen(true);
  }, []);

  // Broadcast and register this device's active session ID
  const broadcastDeviceSession = useCallback(async (uid: string, sessionId: string) => {
    try {
      // 1. Sync to server in-memory database
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, sessionId }),
      }).catch(() => {});

      // 2. Sync session to Firestore document
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        activeSessionId: sessionId,
        lastLoginAt: new Date().toISOString(),
      }).catch(async () => {
        // Document will be populated with full profile in onAuthStateChanged
      });
    } catch (err) {
      console.warn('Could not broadcast session registration:', err);
    }
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Clean up previous Firestore listener if user changed
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        // Ensure local session ID exists for this browser/device
        let currentLocalId = localStorage.getItem('gate_device_session_id');
        if (!currentLocalId) {
          currentLocalId = generateNewSessionId();
          localStorage.setItem('gate_device_session_id', currentLocalId);
        }

        localSessionIdRef.current = currentLocalId;
        setActiveSessionId(currentLocalId);

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);

          let existingData: Partial<UserProfile> = {};
          if (snap.exists()) {
            existingData = snap.data() as UserProfile;
          }

          // Check if there are pre-provisioned passes under their email doc to merge
          let effectivePasses = existingData.activePasses || [];
          if (effectivePasses.length === 0 && currentUser.email) {
            try {
              const cleanUid = `user_${currentUser.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
              const preSnap = await getDoc(doc(db, 'users', cleanUid));
              if (preSnap.exists() && Array.isArray(preSnap.data().activePasses) && preSnap.data().activePasses.length > 0) {
                effectivePasses = preSnap.data().activePasses;
              }
            } catch (e) {}
          }

          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@gatematrix.com')
            .split(',')
            .map((e) => e.trim().toLowerCase());

          let userRole: UserRole = (existingData.role as UserRole) || 'LEARNER';
          if (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
            userRole = 'ADMIN';
          }

          // Always construct full user profile with email, displayName, role, uid
          const fullProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || existingData.email || null,
            displayName:
              currentUser.displayName ||
              existingData.displayName ||
              (currentUser.email ? currentUser.email.split('@')[0] : 'Learner'),
            photoURL: currentUser.photoURL || existingData.photoURL || null,
            role: userRole,
            activePasses: effectivePasses,
            activeSessionId: currentLocalId,
            createdAt: existingData.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          // Always write and merge full profile into Firestore so admin sees real email & name
          await setDoc(userRef, fullProfile, { merge: true });
          setUserProfile(fullProfile);

          // Broadcast session registration to server API
          fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUser.uid, sessionId: currentLocalId }),
          }).catch(() => {});

          // -------------------------------------------------------------
          // Real-time Firestore listener for single-device enforcement
          // -------------------------------------------------------------
          unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
            if (!docSnap.exists()) return;
            const updatedData = docSnap.data() as UserProfile;
            setUserProfile(updatedData);

            const serverSession = updatedData.activeSessionId;
            const mySession = localSessionIdRef.current || localStorage.getItem('gate_device_session_id');

            // If another device logged in and registered a different session ID:
            if (serverSession && mySession && serverSession !== mySession) {
              console.warn('Concurrent login detected on another device. Logging out this device.');
              handleConcurrentLogout();
            }
          });
        } catch (err) {
          console.warn('Firestore user fetch failed, using fallback profile:', err);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'LEARNER',
            activeSessionId: currentLocalId,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
        localSessionIdRef.current = null;
        setActiveSessionId(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [broadcastDeviceSession, handleConcurrentLogout]);

  // Periodic fallback heartbeat check (every 10 seconds and on tab visibility)
  useEffect(() => {
    if (!user) return;

    const checkActiveSessionHeartbeat = async () => {
      const mySession = localSessionIdRef.current || localStorage.getItem('gate_device_session_id');
      if (!mySession || !user) return;

      try {
        const res = await fetch(`/api/session?uid=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.activeSessionId && data.activeSessionId !== mySession) {
            console.warn('Heartbeat: Another device login detected.');
            handleConcurrentLogout();
          }
        }
      } catch (err) {
        // Network offline or transient error
      }
    };

    const intervalId = setInterval(checkActiveSessionHeartbeat, 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActiveSessionHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, handleConcurrentLogout]);

  // Sign In with Google: assigns this device a fresh session ID
  const signInWithGoogle = async () => {
    try {
      setSessionConflictOpen(false);

      // Generate a brand new device session ID specifically for this login
      const newSessionId = generateNewSessionId();
      localStorage.setItem('gate_device_session_id', newSessionId);
      localSessionIdRef.current = newSessionId;
      setActiveSessionId(newSessionId);

      const credential = await signInWithPopup(auth, googleProvider);
      if (credential?.user) {
        const u = credential.user;
        const userRef = doc(db, 'users', u.uid);
        const existingSnap = await getDoc(userRef).catch(() => null);
        const existing = existingSnap?.exists() ? existingSnap.data() : {};
        const profileToSave = {
          uid: u.uid,
          email: u.email || existing.email || null,
          displayName: u.displayName || existing.displayName || (u.email ? u.email.split('@')[0] : 'Learner'),
          photoURL: u.photoURL || existing.photoURL || null,
          role:
            existing.role ||
            (u.email &&
            (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@gatematrix.com')
              .split(',')
              .map((e) => e.trim().toLowerCase())
              .includes(u.email.toLowerCase())
              ? 'ADMIN'
              : 'LEARNER'),
          activeSessionId: newSessionId,
          lastLoginAt: new Date().toISOString(),
          createdAt: existing.createdAt || new Date().toISOString(),
          activePasses: existing.activePasses || [],
        };
        await setDoc(userRef, profileToSave, { merge: true }).catch(() => {});
      }
    } catch (error) {
      console.error('Google Auth Sign In Error:', error);
      alert('Google Sign-in encountered an issue or was closed by user.');
    }
  };

  // Explicit User Logout: clears local device session token
  const logout = async () => {
    try {
      localStorage.removeItem('gate_device_session_id');
      localSessionIdRef.current = null;
      setActiveSessionId(null);
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
        activeSessionId,
      }}
    >
      {children}

      {/* =========================================================
          SINGLE-DEVICE CONCURRENT SESSION LOGOUT MODAL
         ========================================================= */}
      {sessionConflictOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#0d1322] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-800 dark:text-slate-100 space-y-5 animate-scale-up">
            {/* Background Glow Accent */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                Single Device Access Restriction
              </span>
              <button
                onClick={() => setSessionConflictOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3 pt-1">
              <div className="w-16 h-16 bg-amber-500/15 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Laptop className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Logged Out on This Device
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your GATE Matrix account was just logged in from <strong>another device or browser</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To protect candidate subscriptions and prevent unauthorized sharing, active access is restricted to <strong>one device at a time</strong>. Your previous session has been safely closed.
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="emerald"
                size="lg"
                className="w-full font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/20"
                onClick={signInWithGoogle}
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Re-Login on This Device
              </Button>

              <Button
                variant="secondary"
                size="md"
                className="w-full font-bold text-xs"
                onClick={() => setSessionConflictOpen(false)}
              >
                Close & Stay Logged Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
