'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ExternalLinkIcon,
  Megaphone,
  Home,
  LogOut,
  Sun,
  Moon,
  Menu, // Hamburger icon for mobile menu trigger
  UserCircle, // Generic user icon for dropdown label/welcome
  Info, // Example icon for "About Us"
  Mail, // Example icon for "Contact"
  CalendarDays, // Example icon for Timetable
  ClipboardList, // Example icon for Templates/Announcements
  LogIn, // Icon for Sign In
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup, // Useful for grouping related items
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/lib/auth'; // Assuming this hook provides user state
import { signOut } from '@/app/(login)/actions'; // Assuming this is your sign-out action
import { useRouter } from 'next/navigation';

// --- IMPORTANT ---
// Ensure your menuData.ts maps Lucide icons correctly.
// Example menuData.ts structure:
// export const menuData = [
//   { id: 1, title: 'Timetable', path: '/timetable', icon: CalendarDays, newTab: false },
//   { id: 2, title: 'Announcements', path: '/templatesAnnouncements', icon: ClipboardList, newTab: true },
//   { id: 3, title: 'About Us', path: '/about', icon: Info, newTab: false },
//   { id: 4, title: 'Contact', path: '/contact', icon: Mail, newTab: false },
// ];
// Ensure 'ClipboardList' is used for the Announcements link that opens in a new tab.
import { menuData } from '@/components/ui/menuData';

function Navbar() {
  const { user } = useUser();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // --- Theme Management Logic (Your existing logic) ---
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
  // --- End Theme Management Logic ---

  const handleSignOut = async () => {
    await signOut();
    router.push('/'); // Redirect after sign out
  };

  // Render a skeleton or null on the server side to prevent hydration issues
  // The actual navbar will render once the component mounts on the client.
  if (!hasMounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-800/80 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div> {/* Placeholder for logo icon */}
            <div className="ml-2 h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div> {/* Placeholder for logo text */}
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div> {/* Placeholder for menu button */}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          {/* Using Megaphone icon for the logo, aligning with "AeroVoice" */}
          <Megaphone className="h-7 w-7 text-blue-600 group-hover:text-blue-700 dark:text-teal-400 dark:group-hover:text-teal-300 transition-colors" />
          <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            AeroVoice
          </span>
        </Link>

        {/* Desktop Navigation Links & User Info */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Main Navigation Links */}
          {/* Announcements link (specifically) moved into menuData for consistency */}
          {menuData.map((menuItem) => (
            <Link
              key={menuItem.id}
              href={menuItem.path}
              target={menuItem.newTab ? '_blank' : '_self'}
              rel={menuItem.newTab ? 'noopener noreferrer' : ''}
              className="text-sm font-medium text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-teal-300 transition-colors flex items-center"
            >
              <span className="mr-1">{menuItem.title}</span>
              {menuItem.newTab && <ExternalLinkIcon className="ml-0.5 h-3 w-3 text-gray-500" />}
            </Link>
          ))}

          {/* User Welcome (for desktop, less prominent than mobile dropdown) */}
          {user && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
              Hello, {user.name || user.email.split('@')[0]}!
            </span>
          )}

          {/* Theme Toggle (Desktop) */}
          <Button
            variant="ghost" // Use ghost variant for a clean look
            size="icon" // Make it a square button with just the icon
            onClick={toggleTheme}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Dropdown (for desktop users to access dashboard/sign out) */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors"
                  aria-label="User menu"
                >
                  Dashboard
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-1">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action={handleSignOut} className="w-full">
                      <button type="submit" className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="rounded-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Trigger (Hamburger Icon) */}
        <div className="md:hidden flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-1">
              {user && (
                <>
                  <DropdownMenuLabel className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-700 mb-1">
                    <UserCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-teal-400" />
                    Welcome, {user.name || user.email.split('@')[0]}!
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Dashboard Link in Mobile Menu */}
              {user && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Main Menu Items (Mobile) */}
              {menuData.map((menuItem) => {
                const IconComponent = menuItem.icon;
                return (
                  <DropdownMenuItem key={menuItem.id} asChild>
                    {menuItem.newTab ? (
                      <a href={menuItem.path} target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                        <IconComponent className="h-4 w-4 mr-2" />
                        <span>{menuItem.title}</span>
                        <ExternalLinkIcon className="ml-auto h-3 w-3 text-gray-500" /> {/* Arrow to signify new tab */}
                      </a>
                    ) : (
                      <Link href={menuItem.path} className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                        <IconComponent className="h-4 w-4 mr-2" />
                        <span>{menuItem.title}</span>
                      </Link>
                    )}
                  </DropdownMenuItem>
                );
              })}

              {/* Theme Toggle (Mobile) */}
              <DropdownMenuItem
                onClick={toggleTheme}
                className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50"
              >
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Sign Out/Sign In (Mobile) */}
              {user ? (
                <DropdownMenuItem asChild>
                  <form action={handleSignOut} className="w-full">
                    <button type="submit" className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/sign-in" className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-50">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Navbar;