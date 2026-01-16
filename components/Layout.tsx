import React from 'react';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import { Footer } from './ui/Footer';

interface LayoutProps {
  children: React.ReactNode;
  userEmail: string;
  studioName?: string;
  onHome: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userEmail, studioName, onHome, onLogout }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
            <div className="w-10 h-10 rounded-[10px] shadow-sm transition-transform group-hover:scale-105">
              <Logo />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <span className="font-serif">Note</span><span className="text-indigo-600 dark:text-indigo-400">²</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
             
             <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{studioName || "Solo Teacher"}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{userEmail}</p>
               </div>
               
               <div className="relative group">
                 <button 
                  onClick={onLogout}
                  className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                  title="Log Out"
                 >
                    <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
                 </button>
               </div>
             </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};
