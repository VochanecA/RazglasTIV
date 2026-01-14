'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  Shield, 
  Airplay, 
  Activity, 
  Menu, 
  X, 
  Megaphone,
  FileText,
  Bell,
  BarChart3,
  Globe,
  Rocket
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme === 'dark' || (savedTheme === null && systemPrefersDark) ? 'dark' : 'light';
      setCurrentTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

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
  }, []);

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team', description: 'Manage team members' },
    { href: '/dashboard/general', icon: Settings, label: 'General', description: 'System settings' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity', description: 'Audit logs & events' },
    { href: '/dashboard/security', icon: Shield, label: 'Security', description: 'Security settings' },
    { href: '/timetable', icon: Bell, label: 'Live PA', description: 'Real-time announcements' },
    { href: '/templatesAnnouncements', icon: FileText, label: 'Templates', description: 'Announcement templates' },
    { href: '/flightsBoard', icon: Airplay, label: 'Flights', description: 'Flight board status' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Performance metrics' },
  ];

  if (!hasMounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="grid lg:grid-cols-4 gap-6 mt-8">
              <div className="lg:col-span-1">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-14 bg-white/50 dark:bg-gray-800/50 rounded-xl"></div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-[600px] bg-white/50 dark:bg-gray-800/50 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Mobile header */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">AeroVoice Pro</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Announcement Templates</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-700 dark:text-gray-300 hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/50 backdrop-blur-sm"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className={`
            lg:col-span-1 lg:relative lg:translate-x-0 lg:block
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            transition-all duration-300 ease-in-out
            fixed inset-y-0 left-0 z-40 w-full max-w-xs lg:max-w-none lg:inset-auto
          `}>
            <div className="h-full lg:h-auto rounded-2xl bg-gradient-to-b from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-900/70 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-2xl p-4 lg:p-6">
              {/* Sidebar header */}
              <div className="flex items-center space-x-3 mb-8 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-600/10">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">AeroVoice Pro</h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Dashboard</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                      <div className={`
                        group relative p-4 rounded-xl transition-all duration-300 cursor-pointer
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]' 
                          : 'hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md'
                        }
                      `}>
                        <div className="flex items-center space-x-3">
                          <div className={`
                            h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300
                            ${isActive 
                              ? 'bg-white/20' 
                              : 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 group-hover:from-blue-500/20 group-hover:to-purple-600/20'
                            }
                          `}>
                            <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-white/80"></div>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${isActive ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-white/30 rounded-full"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Stats sidebar footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Rocket, value: '99.9%', label: 'Uptime' },
                    { icon: Globe, value: '50ms', label: 'Response' },
                  ].map((stat) => (
                    <div 
                      key={stat.label}
                      className="text-center p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/50"
                    >
                      <stat.icon className="h-4 w-4 text-blue-500 dark:text-blue-400 mx-auto mb-1.5" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3">
            {/* Desktop header */}
            <div className="hidden lg:flex items-center justify-between mb-6 p-6 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Announcement Templates
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage and customize airport announcement templates in multiple languages
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl">
                  <FileText className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </div>

            {children}
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}