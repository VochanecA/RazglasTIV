import React, { ReactNode } from 'react';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

const TimetableLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get today's date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      {/* <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Tivat Airport - Live Timetable
            <span className="text-orange-500 ml-2 text-lg font-normal">({formattedDate})</span>
          </h1>
        </div>
      </div> */}

      {/* Main content - dodajte padding-bottom za dodatni prostor */}
      <div className="max-w-8xl mx-auto pb-8">
        {children}
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
};

export default TimetableLayout;