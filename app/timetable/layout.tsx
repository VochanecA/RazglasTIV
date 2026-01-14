import React, { ReactNode } from 'react';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

const TimetableLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-700/10 dark:from-gray-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Tivat Airport
                </span>
                <span className="ml-3 text-gray-700 dark:text-gray-300">Live Timetable</span>
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {formattedDate}
                  </span>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Live Updates</span>
                </div>
              </div>
            </div>
            
            {/* Live Stats */}
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Operations</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">50+</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Daily Flights</div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <span className="text-sm font-bold">TIV</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
};

export default TimetableLayout;