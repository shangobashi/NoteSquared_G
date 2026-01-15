import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanTier } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, studioName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user
    const savedUser = localStorage.getItem('nbn_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data");
        localStorage.removeItem('nbn_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, studioName: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create mock user session
    const newUser: User = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      full_name: email.split('@')[0], // derived for demo
      email,
      studio_name: studioName || "Solo Teacher",
      plan_tier: PlanTier.SOLO
    };

    setUser(newUser);
    localStorage.setItem('nbn_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nbn_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};