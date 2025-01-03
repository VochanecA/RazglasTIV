'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowDownIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';

// Import menu data from the external file
import { menuData } from '@/components/ui/menuData';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setIsDarkMode(initialTheme === 'dark');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  if (!hasMounted) return null;

  return (
    <header className="border-gray-200 bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">TIV AeroVoice by Alen</span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Welcome Message */}
          {user && (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Welcome, {user.name || user.email.split('@')[0]}!
            </span>
          )}

          {/* User Profile Dropdown */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-grey hover:bg-gray-100 text-gray-900 dark:text-gray-100 dark:hover:text-gray-200 border border-gray-200 rounded-full text-sm px-4 py-2 inline-flex items-center">
                Menu
                <ArrowDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg">
              {/* Add Dashboard link */}
              {user && (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link href="/dashboard" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Render other menu items */}
              {menuData.map((menuItem) => {
                const IconComponent = menuItem.icon; // Get the icon component from menuData
                return (
                  <DropdownMenuItem key={menuItem.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link href={menuItem.path} className="flex items-center">
                      <IconComponent className="h-5 w-5 mr-2" /> {/* Render the icon */}
                      {menuItem.title}
                      {menuItem.newTab && <ExternalLinkIcon className="ml-2 h-4 w-4" />}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {/* Sign Out Button */}
              {user && (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              )}

              {/* Sign In Link - only show if user is not logged in */}
              {!user && (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link href="/sign-in" className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-gray-900 flex items-center"
          >
            {isDarkMode ? <Sun className="h5 w5 mr1" /> : <Moon className="h5 w5 mr1" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
