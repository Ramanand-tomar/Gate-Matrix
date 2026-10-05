'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase/client';
import { UserProfile, UserRole } from '@/lib/rbac';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  setUserRole: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
          } else {
            // Create default profile with LEARNER role
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'LEARNER',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, using fallback profile:', err);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'LEARNER',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Auth Sign In Error:', error);
      alert('Google Sign-in encountered an issue or was closed by user.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const setUserRole = async (newRole: UserRole) => {
    if (userProfile) {
      const updated = { ...userProfile, role: newRole };
      setUserProfile(updated);
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { role: newRole });
        } catch (e) {
          console.warn('Local role updated (Firestore doc write skipped or restricted):', e);
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
