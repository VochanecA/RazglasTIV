'use client';

import { useEffect, useState } from 'react';
import { Login } from '../login';

export default function SignInPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Retrieve theme from localStorage on mount
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme === 'dark' ? 'dark' : 'light');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    // Apply the theme class to the body
    document.body.classList.add(theme);

    // Clean up the theme class on unmount
    return () => {
      document.body.classList.remove(theme);
    };
  }, [theme]);

  useEffect(() => {
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      // Example: Retrieve a value from localStorage
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        console.log('Retrieved username from localStorage:', savedUsername);
        // You can use the retrieved value as needed, e.g., pre-fill a form field
      }
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Login mode="signin" />
    </div>
  );
}
