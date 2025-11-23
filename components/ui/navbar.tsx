'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react';
import {
  ExternalLinkIcon,
  Megaphone,
  Home,
  LogOut,
  Sun,
  Moon,
  Menu,
  UserCircle,
  Info,
  Mail,
  CalendarDays,
  ClipboardList,
  LogIn,
  X,
  Settings,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { menuData } from '@/components/ui/menuData';
import { cn } from '@/lib/utils';

// Memoized navigation items to prevent unnecessary re-renders
const NavigationItems = memo(({ 
  isMobile = false, 
  onItemClick 
}: { 
  isMobile?: boolean;
  onItemClick?: () => void;
}) => {
  if (isMobile) {
    return (
      <>
        {menuData.map((menuItem) => {
          const IconComponent = menuItem.icon;
          return (
            <DropdownMenuItem key={menuItem.id} asChild onClick={onItemClick}>
              {menuItem.newTab ? (
                <a 
                  href={menuItem.path} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                >
                  <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="flex-1">{menuItem.title}</span>
                  <ExternalLinkIcon className="ml-2 h-3 w-3 text-blue-400 flex-shrink-0" />
                </a>
              ) : (
                <Link 
                  href={menuItem.path} 
                  className="flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                >
                  <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="flex-1">{menuItem.title}</span>
                </Link>
              )}
            </DropdownMenuItem>
          );
        })}
      </>
    );
  }

  return (
    <>
      {menuData.map((menuItem) => (
        <Link
          key={menuItem.id}
          href={menuItem.path}
          target={menuItem.newTab ? '_blank' : '_self'}
          rel={menuItem.newTab ? 'noopener noreferrer' : ''}
          className={cn(
            "group relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300",
            "hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
          )}
        >
          <span className="flex items-center">
            {menuItem.title}
            {menuItem.newTab && (
              <ExternalLinkIcon className="ml-1.5 h-3 w-3 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            )}
          </span>
        </Link>
      ))}
    </>
  );
});

NavigationItems.displayName = 'NavigationItems';

// Skeleton loader for initial load
const NavbarSkeleton = () => (
  <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-sm py-3">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <div className="flex items-center">
        <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div className="ml-2 h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          ))}
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
    </div>
  </header>
);

function Navbar() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Optimized theme management
  useEffect(() => {
    setHasMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setIsDarkMode(initialTheme === 'dark');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Memoized theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  }, [isDarkMode]);

  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Render skeleton on server side to prevent hydration issues
  if (!hasMounted) {
    return <NavbarSkeleton />;
  }

  const userInitial = user?.name?.[0] || user?.email?.[0] || 'U';

  return (
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-sm supports-backdrop-blur:bg-white/60 dark:supports-backdrop-blur:bg-gray-900/60">      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center group transition-transform hover:scale-105 active:scale-95"
          aria-label="AeroVoice Home"
        >
          <div className="relative">
            <Megaphone className="h-7 w-7 text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300 transition-colors" />
            <div className="absolute -inset-1 bg-blue-100 dark:bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
          </div>
          <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            AeroVoice
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
          <NavigationItems />
          
          {/* User Welcome */}
          {user && (
            <div className="ml-4 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
              Welcome, <span className="font-semibold text-gray-800 dark:text-gray-200">{user.name || user.email.split('@')[0]}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Actions */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="ml-2 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  aria-label="User menu"
                >
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                      {userInitial.toUpperCase()}
                    </div>
                    <span>Dashboard</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2"
              >
                <DropdownMenuLabel className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 font-normal">
                  <UserCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Signed in as {user.name || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/profile" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/settings" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <form action={handleSignOut} className="w-full">
                    <button 
                      type="submit" 
                      className="flex w-full items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              asChild 
              className="ml-2 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Link href="/sign-in" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg",
                  isMobileMenuOpen && "bg-blue-50 dark:bg-blue-900/20"
                )}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-72 max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-3"
            >
              {/* User Info */}
              {user && (
                <>
                  <DropdownMenuLabel className="flex items-center px-3 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 mb-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                      {userInitial.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{user.name || user.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate">
                        Welcome back!
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                </>
              )}

              {/* User Quick Actions */}
              {user && (
                <div className="grid grid-cols-2 gap-2 mb-3 px-1">
                  <Button asChild variant="outline" size="sm" className="h-9 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Link href="/dashboard">
                      <Home className="h-3 w-3 mr-1" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-9 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Link href="/profile">
                      <User className="h-3 w-3 mr-1" />
                      Profile
                    </Link>
                  </Button>
                </div>
              )}

              {/* Navigation Items */}
              <NavigationItems isMobile onItemClick={() => setIsMobileMenuOpen(false)} />

              <DropdownMenuSeparator className="my-2" />

              {/* Theme Toggle */}
              <DropdownMenuItem
                onClick={toggleTheme}
                className="flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              >
                {isDarkMode ? (
                  <Sun className="mr-3 h-4 w-4" />
                ) : (
                  <Moon className="mr-3 h-4 w-4" />
                )}
                <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              {/* Auth Actions */}
              {user ? (
                <DropdownMenuItem asChild>
                  <form action={handleSignOut} className="w-full">
                    <button 
                      type="submit" 
                      className="flex w-full items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-red-600 dark:text-red-400 font-medium"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link 
                    href="/sign-in" 
                    className="flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="mr-3 h-4 w-4" />
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

export default memo(Navbar);