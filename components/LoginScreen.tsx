import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ArrowRight } from 'lucide-react';
import { Logo } from './ui/Logo';

export const LoginScreen = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [studioName, setStudioName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email, studioName);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 gsap-fade-in">
        <div className="text-center flex flex-col items-center">
          <div className="w-32 h-32 mb-6 hover:scale-105 transition-transform duration-500 shadow-xl shadow-indigo-200 dark:shadow-none rounded-[2rem]">
            <Logo />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center">
            <span className="font-serif">Note</span><span className="text-indigo-600 dark:text-indigo-400">²</span>
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Automated documentation for modern music teachers.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="studio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Studio Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="studio"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="e.g. Rivera Music"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2" 
              isLoading={isLoading}
              size="lg"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};