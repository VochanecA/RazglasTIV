'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Retrieve stored theme from localStorage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme === 'dark' ? 'dark' : 'light');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    // Apply the theme class to the document element
    document.documentElement.classList.add(theme);

    // Cleanup function to remove the theme class
    return () => {
      document.documentElement.classList.remove(theme);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply the new theme class immediately
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <>
{/*       <button onClick={toggleTheme} className="absolute top-4 right-4">
        Toggle Theme
      </button> */}
      {children}
    </>
  );
}
