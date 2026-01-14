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
  X,
  Settings,
  User,
  LogIn,
  Rocket,
  Zap,
  Shield,
  Bell,
  BarChart3,
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

// Memoized navigation items
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
                  className="flex items-center w-full px-4 py-3.5 text-sm rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-lg group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mr-3 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{menuItem.title}</span>
                  </div>
                  <ExternalLinkIcon className="ml-2 h-3.5 w-3.5 text-blue-400" />
                </a>
              ) : (
                <Link 
                  href={menuItem.path} 
                  className="flex items-center w-full px-4 py-3.5 text-sm rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-lg group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mr-3 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{menuItem.title}</span>
                  </div>
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
            "group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300",
            "text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white",
            "bg-gradient-to-r from-white/0 to-white/0 hover:from-blue-500/20 hover:to-purple-600/20",
            "hover:shadow-lg border border-transparent hover:border-white/20",
            "dark:hover:from-blue-500/30 dark:hover:to-purple-600/30"
          )}
        >
          <div className="flex items-center">
            {menuItem.newTab && (
              <ExternalLinkIcon className="mr-2 h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            )}
            <span>{menuItem.title}</span>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-4/5 transition-all duration-300 rounded-full"></div>
        </Link>
      ))}
    </>
  );
});

NavigationItems.displayName = 'NavigationItems';

// Skeleton loader
const NavbarSkeleton = () => (
  <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-700/10 dark:from-gray-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 backdrop-blur-xl border-b border-white/20 shadow-2xl py-3">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
        <div className="ml-3 h-6 w-32 bg-gray-200/30 dark:bg-gray-700/30 animate-pulse rounded-lg"></div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 bg-gray-200/30 dark:bg-gray-700/30 animate-pulse rounded-xl"></div>
          ))}
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
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
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme management
  useEffect(() => {
    setHasMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setIsDarkMode(initialTheme === 'dark');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

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

  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  }, [isDarkMode]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!hasMounted) {
    return <NavbarSkeleton />;
  }

  const userInitial = user?.name?.[0] || user?.email?.[0] || 'U';

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl shadow-2xl border-b",
      isScrolled 
        ? "bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-700/20 dark:from-gray-900/40 dark:via-purple-900/40 dark:to-indigo-900/40 border-white/20"
        : "bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-700/10 dark:from-gray-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-white/10"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center h-16">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center group transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="AeroVoice Pro Home"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <div className="ml-3">
            <span className="text-2xl font-bold text-white whitespace-nowrap bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AeroVoice
            </span>
            <span className="block text-xs font-semibold text-teal-300 mt-0.5">PRO</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2" aria-label="Main navigation">
          <NavigationItems />
          
          {/* User Welcome */}
          {user && (
            <div className="ml-4 px-4 py-1.5 text-sm text-white/80 border-l border-white/20">
              Welcome, <span className="font-bold text-white">{user.name || user.email.split('@')[0]}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2 text-white hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-xl border border-white/20"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="relative">
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </div>
          </Button>

          {/* User Actions */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="ml-2 rounded-xl px-5 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
                  aria-label="User menu"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="h-7 w-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold backdrop-blur-sm">
                      {userInitial.toUpperCase()}
                    </div>
                    <span>Dashboard</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-3"
              >
                <DropdownMenuLabel className="flex items-center px-3 py-3 text-sm text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <UserCircle className="mr-2.5 h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  {user.name || user.email}
                </DropdownMenuLabel>
                
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300">
                      <Link href="/dashboard">
                        <Home className="h-3.5 w-3.5 mr-1.5" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300">
                      <Link href="/profile">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        Profile
                      </Link>
                    </Button>
                  </div>

                  <DropdownMenuGroup>
                    {[
                      { icon: Bell, label: 'Notifications', href: '/notifications' },
                      { icon: BarChart3, label: 'Analytics', href: '/analytics' },
                      { icon: Settings, label: 'Settings', href: '/settings' },
                    ].map((item) => (
                      <DropdownMenuItem key={item.label} asChild>
                        <Link 
                          href={item.href} 
                          className="flex items-center w-full px-3 py-2.5 text-sm rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-lg group"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mr-3 group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="my-3" />

                  <form action={handleSignOut} className="w-full">
                    <button 
                      type="submit" 
                      className="flex w-full items-center justify-center px-3 py-2.5 text-sm rounded-xl transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl font-semibold group"
                    >
                      <LogOut className="mr-2.5 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              asChild 
              className="ml-2 rounded-xl px-5 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Link href="/sign-in" className="flex items-center space-x-2.5">
                <LogIn className="h-4.5 w-4.5" />
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
                  "text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-xl border border-white/20",
                  isMobileMenuOpen && "bg-white/10"
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
              className="w-80 max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-4"
            >
              {/* User Info */}
              {user && (
                <>
                  <div className="flex items-center p-4 mb-3 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-2xl">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold mr-3 shadow-lg">
                      {userInitial.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                        Welcome back to AeroVoice Pro!
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-3" />
                </>
              )}

              {/* Navigation Items */}
              <div className="space-y-1 mb-4">
                <NavigationItems isMobile onItemClick={() => setIsMobileMenuOpen(false)} />
              </div>

              <DropdownMenuSeparator className="my-3" />

              {/* Theme Toggle */}
              <DropdownMenuItem
                onClick={toggleTheme}
                className="flex items-center w-full px-4 py-3.5 text-sm rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-lg group"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mr-3 group-hover:scale-110 transition-transform duration-300">
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                  </p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-3" />

              {/* Auth Actions */}
              {user ? (
                <form action={handleSignOut} className="w-full">
                  <button 
                    type="submit" 
                    className="flex w-full items-center justify-center px-4 py-3.5 text-sm rounded-xl transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl font-semibold group mb-2"
                  >
                    <LogOut className="mr-2.5 h-4.5 w-4.5 group-hover:rotate-12 transition-transform" />
                    <span>Sign Out</span>
                  </button>
                </form>
              ) : (
                <Button 
                  asChild 
                  className="w-full rounded-xl px-4 py-3.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold mb-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/sign-in" className="flex items-center justify-center">
                    <LogIn className="mr-2.5 h-4.5 w-4.5" />
                    <span>Sign In to Dashboard</span>
                  </Link>
                </Button>
              )}

              {/* Mobile Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Rocket, label: '99.9%', sublabel: 'Uptime' },
                    { icon: Zap, label: '50ms', sublabel: 'Response' },
                    { icon: Shield, label: '24/7', sublabel: 'Support' },
                    { icon: Bell, label: '1000+', sublabel: 'Users' },
                  ].map((stat) => (
                    <div 
                      key={stat.sublabel}
                      className="text-center p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/50"
                    >
                      <stat.icon className="h-4 w-4 text-blue-500 dark:text-blue-400 mx-auto mb-1.5" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{stat.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{stat.sublabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default memo(Navbar);