'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowDownIcon, ExternalLinkIcon, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { menuData } from '@/components/ui/menuData';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
      setIsDarkMode(initialTheme === 'dark');
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
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
          {/* Desktop Announcements Link (New Tab) */}
          <a
            href="/templatesAnnouncements"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-gray-900"
          >
            <Megaphone className="h-5 w-5 mr-1" />
            <span>Announcements</span>
            <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </a>

          {/* Welcome Message - Hidden on mobile */}
          {user && (
            <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300">
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
              {/* Welcome message in mobile view */}
              {user && (
                <>
                  <DropdownMenuLabel className="px-4 py-2 md:hidden">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-green-500 bg-transparent">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Welcome, {user.name || user.email.split('@')[0]}!
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="md:hidden" />
                </>
              )}
              
              {/* Dashboard link */}
              {user && (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link href="/dashboard" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Menu items with new tab support */}
              {menuData.map((menuItem) => {
                const IconComponent = menuItem.icon;
                return (
                  <DropdownMenuItem key={menuItem.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    {menuItem.newTab ? (
                      <a href={menuItem.path} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <IconComponent className="h-5 w-5 mr-2" />
                        {menuItem.title}
                        <ExternalLinkIcon className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <Link href={menuItem.path} className="flex items-center">
                        <IconComponent className="h-5 w-5 mr-2" />
                        {menuItem.title}
                      </Link>
                    )}
                  </DropdownMenuItem>
                );
              })}

              {/* Theme Toggle (mobile only) */}
              <DropdownMenuItem 
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer md:hidden"
                onClick={toggleTheme}
              >
                <div className="flex items-center">
                  {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </DropdownMenuItem>

              {/* Sign Out/Sign In */}
              {user ? (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link href="/sign-in" className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle (desktop) */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-gray-900 items-center"
          >
            {isDarkMode ? <Sun className="h-5 w-5 mr-1" /> : <Moon className="h-5 w-5 mr-1" />}
            <span className="hidden lg:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;