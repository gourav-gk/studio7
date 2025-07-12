"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextType = {
  user: FirebaseUser | null;
  permissions: string[];
  isAuthLoaded: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  isAuthLoaded: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoaded(true);
      const storedPerms = localStorage.getItem("permissions");
      setPermissions(storedPerms ? storedPerms.split(",") : []);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
