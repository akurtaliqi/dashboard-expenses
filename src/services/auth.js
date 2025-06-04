import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAuth,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      const loginTimestamp = localStorage.getItem('loginTimestamp');
      const now = Date.now();
      const expiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (firebaseUser && loginTimestamp && now - parseInt(loginTimestamp, 10) > expiration) {
        await firebaseSignOut(auth);
        localStorage.removeItem('loginTimestamp');
        setUser(null);
        setRole(null);
        setSessionExpired(true);
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser(firebaseUser);
        setRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem('loginTimestamp', Date.now().toString());
    setSessionExpired(false);
    return result;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('loginTimestamp');
    setUser(null);
    setRole(null);
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
