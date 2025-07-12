'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Airplay, Activity, Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Theme Management Logic:
  // Initialize currentTheme with a default, and then update it in useEffect.
  // This prevents localStorage access during server-side rendering/hydration.
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light'); // Explicitly type for clarity

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // Fallback to system preference if no theme is saved
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme === 'dark' || (savedTheme === null && systemPrefersDark) ? 'dark' : 'light';
      setCurrentTheme(initialTheme);
      // Ensure the documentElement class is set based on the initial theme
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []); // Run once on mount

  // Listen for changes in localStorage from other parts of the app (e.g., your Navbar)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setCurrentTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Run once to set up listener

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
    { href: '/timetable', icon: Airplay, label: 'PA Announcements' },
    { href: '/templatesAnnouncements', icon: Settings, label: 'Templates for PA' },
  ];

  // Render a loading state or nothing if not mounted yet, to avoid hydration issues
  if (!hasMounted) {
    return (
      <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden animate-pulse">
        {/* Placeholder for Mobile Header */}
        <div className="lg:hidden flex items-center justify-between border-b px-4 py-3 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        {/* Placeholder for Sidebar and Main Content */}
        <div className="flex flex-1 overflow-hidden h-full">
          <aside className="w-64 border-r p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hidden lg:block">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </aside>
          <main className="flex-1 p-4">
            <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      {/* Mobile header */}
      <div
        className={`lg:hidden flex items-center justify-between border-b px-4 py-3 shadow-sm ${
          currentTheme === 'dark'
            ? 'bg-gray-800 text-white border-gray-700'
            : 'bg-white text-gray-900 border-gray-200'
        }`}
      >
        <div className="flex items-center">
          <span className="font-semibold text-lg">Dashboard</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 border-r transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:relative absolute inset-y-0 left-0 z-40
          bg-white text-gray-900 border-gray-200
          dark:bg-gray-800 dark:text-white dark:border-gray-700`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                passHref
                legacyBehavior
              >
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={`my-1 w-full justify-start text-left px-4 py-2 rounded-lg transition-colors duration-200
                    ${
                      pathname === item.href
                        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-teal-600 dark:text-white dark:hover:bg-teal-700'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay (backdrop) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}